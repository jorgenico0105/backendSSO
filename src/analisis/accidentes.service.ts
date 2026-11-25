import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClasificacionesService } from '../clasificaciones/clasificaciones.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UsuarioSesion } from '../common/decorators';
import { EstadoMatriz } from '../common/enums';
import { EmpresasService } from '../empresas/empresas.service';
import {
  contextoEmpresa,
  INSTRUCCIONES_ACCIDENTE,
  mensajeDictado,
  PROMPT_TRANSCRIPCION_ACCIDENTE,
} from '../ia/agente-sst.prompts';
import { OpenAiService, texto } from '../ia/openai.service';
import { InformeAccidenteIA } from '../ia/schemas';
import { Usuario } from '../usuarios/usuario.entity';
import {
  calcularFaltantesInforme,
  CampoInforme,
  DatosInforme,
  informeVacio,
  normalizarInforme,
} from './accidentes/informe';
import { ActualizarInformeDto, ContextoAnalisisDto } from './dto/analisis.dto';
import { InformeAccidente } from './entities/informe-accidente.entity';
import { VozService } from './voz.service';

const RELACIONES = {
  empresa: true,
  area: true,
  puesto: true,
  creadoPor: true,
} as const;

/** Informe ampliatorio de investigación de accidentes e incidentes (RSE-04-00-02) por dictado. */
@Injectable()
export class AccidentesService {
  private readonly log = new Logger(AccidentesService.name);

  constructor(
    private readonly empresas: EmpresasService,
    private readonly cloudinary: CloudinaryService,
    private readonly clasificaciones: ClasificacionesService,
    private readonly ia: OpenAiService,
    private readonly voz: VozService,
    @InjectRepository(InformeAccidente)
    private readonly repo: Repository<InformeAccidente>,
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
  ) {}

  async evaluar(
    u: UsuarioSesion,
    empresaId: number,
    archivo: Express.Multer.File,
    dto: ContextoAnalisisDto,
  ) {
    this.empresas.asegurarAcceso(u, empresaId);
    const { empresa, area, puesto } = await this.empresas.contexto(
      empresaId,
      dto.areaId,
      dto.puestoId,
    );

    // El audio se guarda en Cloudinary como respaldo; si falla, el informe continúa.
    const [transcripcion, subida, autor, catalogo] = await Promise.all([
      this.voz.transcribir(archivo, PROMPT_TRANSCRIPCION_ACCIDENTE),
      this.cloudinary
        .subir(archivo.buffer, `empresas/${empresaId}/accidentes`, 'video')
        .catch((e: unknown) => {
          this.log.warn(`Audio no subido a Cloudinary: ${String(e)}`);
          return null;
        }),
      this.usuarios.findOneBy({ id: u.id }),
      this.clasificaciones.nombresPorTipo(),
    ]);
    if (!transcripcion)
      throw new BadRequestException('No se detectó voz en el audio');

    // Lo que ya se sabe: el investigador es quien dicta y firma, salvo que dicte otra cosa.
    const nombreAutor = autor
      ? `${autor.nombres} ${autor.apellidos}`.trim()
      : '';
    const base: DatosInforme = {
      ...informeVacio(),
      investigador: {
        nombre: nombreAutor,
        cedula: autor?.cedula ?? '',
        competencia: '',
      },
      lugar: area?.nombre ?? '',
      firma: { nombre: nombreAutor, cargo: autor?.cargo ?? '' },
    };

    const { datos, duracionMs } = await this.ia.estructurado(
      InformeAccidenteIA,
      'informe_accidente',
      `${INSTRUCCIONES_ACCIDENTE}\n\n${contextoEmpresa(empresa, area, puesto)}\n\nCATÁLOGO DE ACTOS SUBESTÁNDAR:\n${catalogo.acto.map((n) => `- ${n}`).join('\n')}\n\nCATÁLOGO DE CONDICIONES SUBESTÁNDAR:\n${catalogo.condicion.map((n) => `- ${n}`).join('\n')}`,
      [
        texto(
          mensajeDictado(transcripcion, {
            'Fecha actual': base.fechaInvestigacion,
            'Técnico que investiga': base.investigador.nombre,
            'Cédula del investigador': base.investigador.cedula,
            'Lugar del suceso (área elegida)': base.lugar,
            'Ocupación del trabajador (puesto elegido)': puesto?.nombre ?? '',
            'Firma (cargo)': base.firma.cargo,
          }),
        ),
      ],
    );

    const informe = normalizarInforme(
      {
        tipoEvento: datos.tipoEvento,
        investigador: {
          nombre: datos.investigadorNombre || base.investigador.nombre,
          cedula: datos.investigadorCedula || base.investigador.cedula,
          competencia: datos.investigadorCompetencia,
        },
        fechaInvestigacion: datos.fechaInvestigacion || base.fechaInvestigacion,
        entrevistados: datos.entrevistados,
        tecnicas: datos.tecnicas,
        trabajadores: datos.trabajadores.map((t) => ({
          ...t,
          ocupacion: t.ocupacion || puesto?.nombre || '',
        })),
        introduccion: datos.introduccion,
        lugar: datos.lugar || base.lugar,
        fecha: datos.fecha,
        hora: datos.hora,
        consecuencia: datos.consecuencia,
        descripcion: datos.descripcion,
        actos: datos.actos,
        condiciones: datos.condiciones,
        factoresTrabajador: datos.factoresTrabajador,
        factoresTrabajo: datos.factoresTrabajo,
        causasBasicas: datos.causasBasicas,
        acciones: datos.acciones,
        firma: base.firma,
      },
      base,
    );
    const mensajes: Partial<Record<CampoInforme, string>> = {};
    for (const f of datos.faltantes) mensajes[f.campo] ??= f.mensaje;
    const faltantes = calcularFaltantesInforme(informe, mensajes);

    const registro = await this.repo.save(
      this.repo.create({
        empresa,
        area,
        puesto,
        creadoPor: { id: u.id },
        estado: faltantes.length
          ? EstadoMatriz.BORRADOR
          : EstadoMatriz.COMPLETA,
        audioUrl: subida?.secure_url ?? null,
        audioPublicId: subida?.public_id ?? null,
        transcripcion,
        datos: informe,
        faltantes,
        resumen: datos.resumen,
        iaRespuesta: datos,
        iaModelo: this.ia.modelo,
        iaDuracionMs: duracionMs,
      }),
    );
    await this.repo.update(registro.id, {
      codigo: `INV-${new Date().getFullYear()}-${String(registro.id).padStart(4, '0')}`,
    });
    return this.obtener(u, registro.id);
  }

  /** Guarda lo completado o corregido a mano y recalcula los faltantes. */
  async actualizar(u: UsuarioSesion, id: number, dto: ActualizarInformeDto) {
    const r = await this.obtener(u, id);
    const datos = normalizarInforme(dto.datos, r.datos);
    // Los mensajes de la IA se conservan para los campos que siguen vacíos.
    const mensajes: Partial<Record<CampoInforme, string>> = {};
    for (const f of r.faltantes) mensajes[f.campo] = f.mensaje;
    const faltantes = calcularFaltantesInforme(datos, mensajes);
    await this.repo.update(id, {
      datos,
      faltantes,
      estado: faltantes.length ? EstadoMatriz.BORRADOR : EstadoMatriz.COMPLETA,
    });
    return this.obtener(u, id);
  }

  async listar(u: UsuarioSesion, empresaId: number) {
    this.empresas.asegurarAcceso(u, empresaId);
    return this.repo.find({
      where: { empresa: { id: empresaId }, ...this.empresas.autoria(u) },
      relations: RELACIONES,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async obtener(u: UsuarioSesion, id: number) {
    const r = await this.repo.findOne({ where: { id }, relations: RELACIONES });
    if (!r) throw new NotFoundException('Informe no encontrado');
    this.empresas.asegurarRegistro(u, r, 'Informe no encontrado');
    return r;
  }
}
