import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UsuarioSesion } from '../common/decorators';
import { ClasificacionesService } from '../clasificaciones/clasificaciones.service';
import { EstadoAnalisis, NivelRiesgo, TipoReporte } from '../common/enums';
import { EmpresasService } from '../empresas/empresas.service';
import {
  contextoEmpresa,
  INSTRUCCIONES_IMAGEN,
  mensajeImagen,
} from '../ia/agente-sst.prompts';
import { imagen, OpenAiService, texto } from '../ia/openai.service';
import { AnalisisImagenIA } from '../ia/schemas';
import { AnalizarImagenDto, RegistrarReporteDto } from './dto/analisis.dto';
import { AnalisisImagen } from './entities/analisis-imagen.entity';

const RELACIONES = { empresa: true, area: true, creadoPor: true } as const;

/** Reportes de actos / condiciones subestándar con análisis de imagen. */
@Injectable()
export class ReportesService {
  constructor(
    private readonly empresas: EmpresasService,
    private readonly cloudinary: CloudinaryService,
    private readonly ia: OpenAiService,
    private readonly clasificaciones: ClasificacionesService,
    @InjectRepository(AnalisisImagen)
    private readonly repo: Repository<AnalisisImagen>,
  ) {}

  /**
   * Sube la foto a Cloudinary y la envía al agente. Si el agente falla, el registro queda
   * en estado ERROR (con la imagen) para que el auditor pueda registrarlo manualmente.
   */
  async analizar(
    u: UsuarioSesion,
    empresaId: number,
    archivo: Express.Multer.File,
    dto: AnalizarImagenDto,
  ) {
    this.empresas.asegurarAcceso(u, empresaId);
    if (!archivo?.mimetype.startsWith('image/'))
      throw new BadRequestException('Adjunta una imagen en el campo "imagen"');
    const { empresa, area } = await this.empresas.contexto(
      empresaId,
      dto.areaId,
    );
    // Sin área indicada, el agente elige una de las de la empresa.
    const areas = area ? [] : await this.empresas.areasActivas(empresaId);
    const catalogo = await this.clasificaciones.nombresPorTipo();

    const subida = await this.cloudinary.subir(
      archivo.buffer,
      `empresas/${empresaId}/actos`,
      'image',
    );
    const registro = await this.repo.save(
      this.repo.create({
        empresa,
        area,
        creadoPor: { id: u.id },
        imagenUrl: subida.secure_url,
        imagenPublicId: subida.public_id,
        imagenAncho: subida.width,
        imagenAlto: subida.height,
        descripcion: dto.descripcion ?? null,
      }),
    );

    try {
      const { datos, duracionMs } = await this.ia.estructurado(
        AnalisisImagenIA,
        'analisis_actos_condiciones',
        `${INSTRUCCIONES_IMAGEN}\n\n${contextoEmpresa(empresa, area)}`,
        [
          texto(
            mensajeImagen(
              catalogo,
              dto.descripcion ?? null,
              areas.map((a) => a.nombre),
            ),
          ),
          imagen(this.cloudinary.urlImagen(subida.public_id)),
        ],
      );
      const permitidas = catalogo[datos.tipoPrincipal as TipoReporte];
      const sugerida = datos.areaSugerida.trim().toLowerCase();
      Object.assign(registro, {
        area:
          registro.area ??
          areas.find((a) => a.nombre.toLowerCase() === sugerida) ??
          null,
        estado: EstadoAnalisis.ANALIZADO,
        iaRespuesta: datos,
        iaModelo: this.ia.modelo,
        iaDuracionMs: duracionMs,
        iaTipo: datos.tipoPrincipal as TipoReporte,
        iaSeveridad: datos.severidad as NivelRiesgo,
        iaClasificaciones: datos.clasificaciones.filter((c) =>
          permitidas.includes(c),
        ),
        iaResumen: datos.resumen,
        iaMedidas: datos.medidasInmediatas,
        iaConfianza: Math.min(1, Math.max(0, datos.confianza)),
      });
    } catch (e) {
      registro.estado = EstadoAnalisis.ERROR;
      registro.errorMensaje = e instanceof Error ? e.message : String(e);
    }
    await this.repo.save(registro);
    return this.obtener(u, registro.id);
  }

  /** Confirma el reporte con los datos finales del auditor y le asigna código. */
  async registrar(u: UsuarioSesion, id: number, dto: RegistrarReporteDto) {
    const r = await this.repo.findOne({
      where: { id },
      relations: { empresa: true },
    });
    if (!r) throw new NotFoundException('Reporte no encontrado');
    this.empresas.asegurarAcceso(u, r.empresa.id);
    if (r.estado === EstadoAnalisis.REGISTRADO)
      throw new BadRequestException('El reporte ya fue registrado');
    const { area } = await this.empresas.contexto(r.empresa.id, dto.areaId);

    const ahora = new Date();
    await this.repo.update(id, {
      tipo: dto.tipo,
      area,
      clasificaciones: dto.clasificaciones,
      severidad: dto.severidad,
      descripcion: dto.descripcion.trim(),
      accionCorrectiva: dto.accionCorrectiva?.trim() || null,
      estado: EstadoAnalisis.REGISTRADO,
      registradoEn: ahora,
      codigo: `INC-${ahora.getFullYear()}-${String(id).padStart(4, '0')}`,
    });
    return this.obtener(u, id);
  }

  /** Reportes registrados; `desde`/`hasta` (YYYY-MM-DD, inclusivos) para el consolidado PDF. */
  async listar(
    u: UsuarioSesion,
    empresaId: number,
    limite = 50,
    desde?: string,
    hasta?: string,
  ) {
    this.empresas.asegurarAcceso(u, empresaId);
    const fecha = (v: string | undefined, fin: boolean) => {
      if (!v) return undefined;
      const d = new Date(
        `${v.slice(0, 10)}T${fin ? '23:59:59.999' : '00:00:00'}`,
      );
      if (Number.isNaN(d.getTime()))
        throw new BadRequestException(`Fecha inválida: ${v}`);
      return d;
    };
    const a = fecha(desde, false);
    const b = fecha(hasta, true);
    return this.repo.find({
      where: {
        empresa: { id: empresaId },
        estado: EstadoAnalisis.REGISTRADO,
        ...((a || b) && {
          registradoEn:
            a && b
              ? Between(a, b)
              : a
                ? MoreThanOrEqual(a)
                : LessThanOrEqual(b!),
        }),
      },
      relations: RELACIONES,
      order: { registradoEn: 'DESC' },
      take: Math.min(limite, 500),
    });
  }

  async obtener(u: UsuarioSesion, id: number) {
    const r = await this.repo.findOne({ where: { id }, relations: RELACIONES });
    if (!r) throw new NotFoundException('Reporte no encontrado');
    this.empresas.asegurarAcceso(u, r.empresa.id);
    return r;
  }
}
