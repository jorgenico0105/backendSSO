import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UsuarioSesion } from '../common/decorators';
import { EstadoMatriz } from '../common/enums';
import { Empresa } from '../empresas/empresa.entity';
import { EmpresasService } from '../empresas/empresas.service';
import {
  contextoEmpresa,
  INSTRUCCIONES_MATRIZ,
  mensajeDictado,
} from '../ia/agente-sst.prompts';
import { OpenAiService, texto } from '../ia/openai.service';
import { Usuario } from '../usuarios/usuario.entity';
import { MatrizVozIA } from '../ia/schemas';
import { ActualizarMatrizDto, ContextoAnalisisDto } from './dto/analisis.dto';
import { MatrizRiesgo } from './entities/matriz-riesgo.entity';
import { CATALOGO_PELIGROS, FACTORES } from './matriz/catalogo';
import { aplicarValoresDictados } from './matriz/dictado';
import {
  CabeceraMatriz,
  calcularFaltantes,
  CampoMatriz,
  hoy,
  normalizarCabecera,
  normalizarPeligros,
  sincronizarPlan,
} from './matriz/matriz';

/** Formatos que acepta la transcripción (la extensión del nombre decide cómo se lee). */
const EXT_AUDIO = new Set([
  'm4a',
  'mp4',
  'mp3',
  'mpeg',
  'mpga',
  'wav',
  'ogg',
  'oga',
  'opus',
  'webm',
  'flac',
]);

const extension = (nombre?: string) =>
  /\.([a-z0-9]{2,5})$/i.exec(nombre ?? '')?.[1].toLowerCase() ?? '';

/** Las notas de voz de WhatsApp (.opus/.oga) son Ogg: se envían como .ogg para que se lean. */
function nombreParaTranscribir(nombre?: string) {
  const ext = extension(nombre);
  if (!ext) return 'audio.m4a';
  return ext === 'opus' || ext === 'oga'
    ? nombre!.replace(/\.[a-z0-9]+$/i, '.ogg')
    : nombre!;
}

const RELACIONES = {
  empresa: true,
  area: true,
  puesto: true,
  creadoPor: true,
} as const;

/** Matriz de identificación y estimación de riesgos (F-PSSO-IMEC-02) por dictado de voz. */
@Injectable()
export class VozService {
  private readonly log = new Logger(VozService.name);

  constructor(
    private readonly empresas: EmpresasService,
    private readonly cloudinary: CloudinaryService,
    private readonly ia: OpenAiService,
    @InjectRepository(MatrizRiesgo)
    private readonly repo: Repository<MatrizRiesgo>,
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
  ) {}

  catalogo() {
    return { factores: FACTORES, peligros: CATALOGO_PELIGROS };
  }

  /** Valida y transcribe un audio; `prompt` orienta el vocabulario (por defecto, el de la matriz). */
  transcribir(archivo: Express.Multer.File, prompt?: string) {
    this.validarAudio(archivo);
    return this.ia.transcribir(
      archivo.buffer,
      nombreParaTranscribir(archivo.originalname),
      archivo.mimetype,
      prompt,
    );
  }

  async evaluar(
    u: UsuarioSesion,
    empresaId: number,
    archivo: Express.Multer.File,
    dto: ContextoAnalisisDto,
  ) {
    this.empresas.asegurarAcceso(u, empresaId);
    this.validarAudio(archivo);
    const { empresa, area, puesto } = await this.empresas.contexto(
      empresaId,
      dto.areaId,
      dto.puestoId,
    );

    // El audio se guarda en Cloudinary como respaldo; si falla, la evaluación continúa.
    const [transcripcion, subida, anterior, autor] = await Promise.all([
      this.transcribir(archivo),
      this.cloudinary
        .subir(archivo.buffer, `empresas/${empresaId}/voz`, 'video')
        .catch((e: unknown) => {
          this.log.warn(`Audio no subido a Cloudinary: ${String(e)}`);
          return null;
        }),
      // Una matriz por área y puesto: la anterior convierte esta evaluación en periódica.
      this.repo.findOne({
        where: {
          empresa: { id: empresaId },
          area: area ? { id: area.id } : IsNull(),
          puesto: puesto ? { id: puesto.id } : IsNull(),
        },
        order: { createdAt: 'DESC' },
      }),
      this.usuarios
        .findOneBy({ id: u.id })
        .then((x) => (x ? `${x.nombres} ${x.apellidos}`.trim() : '')),
    ]);
    if (!transcripcion)
      throw new BadRequestException('No se detectó voz en el audio');

    const base: CabeceraMatriz = {
      departamento: area?.nombre ?? '',
      puesto: puesto?.nombre ?? '',
      provincia: empresa.provincia ?? '',
      canton: empresa.ciudad ?? '',
      tiempoExposicionHoras: puesto?.jornadaHoras ?? null,
      trabajadores: { hombres: null, mujeres: null, discapacitados: null },
      responsableDirecto: area?.responsable ?? '',
      responsableSso: empresa.responsableSstNombre ?? '',
      actividadesRutinarias: '',
      actividadesNoRutinarias: '',
      herramientas: '',
      poblacionVulnerable: {
        maternidad: false,
        discapacidad: false,
        edadesExtremas: false,
        detalle: '',
      },
      tipoEvaluacion: anterior ? 'periodica' : 'inicial',
      fechaEvaluacion: hoy(),
      fechaUltimaEvaluacion: anterior?.cabecera.fechaEvaluacion ?? null,
      elaboradoPor: autor,
    };

    const { datos, duracionMs } = await this.ia.estructurado(
      MatrizVozIA,
      'matriz_riesgos',
      `${INSTRUCCIONES_MATRIZ}\n\n${contextoEmpresa(empresa, area, puesto)}`,
      [
        texto(
          mensajeDictado(transcripcion, {
            'Departamento / área': base.departamento,
            'Puesto de trabajo': base.puesto,
            Provincia: base.provincia,
            Cantón: base.canton,
            'Tiempo de exposición (h/día)': base.tiempoExposicionHoras
              ? String(base.tiempoExposicionHoras)
              : '',
            'Responsable directo': base.responsableDirecto,
            'Responsable de SSO': base.responsableSso,
          }),
        ),
      ],
    );

    const n = (v: number) => (v >= 0 ? v : null);
    const cabecera = normalizarCabecera(
      {
        puesto: base.puesto || datos.puesto,
        tiempoExposicionHoras:
          base.tiempoExposicionHoras ||
          (datos.tiempoExposicionHoras > 0
            ? datos.tiempoExposicionHoras
            : null),
        trabajadores: {
          hombres: n(datos.hombres),
          mujeres: n(datos.mujeres),
          discapacitados: n(datos.discapacitados),
        },
        responsableDirecto: base.responsableDirecto || datos.responsableDirecto,
        actividadesRutinarias: datos.actividadesRutinarias,
        actividadesNoRutinarias: datos.actividadesNoRutinarias,
        herramientas: datos.herramientas,
        poblacionVulnerable: {
          maternidad: datos.maternidad,
          discapacidad: datos.discapacidad,
          edadesExtremas: datos.edadesExtremas,
          detalle: datos.detalleVulnerable,
        },
      },
      base,
    );
    // Lo dictado (baja/media/alta, dañino…) manda sobre la valoración del modelo.
    const peligros = normalizarPeligros(
      aplicarValoresDictados(datos.peligros, transcripcion),
    );
    const planAccion = sincronizarPlan(
      peligros,
      [],
      this.responsablePlan(empresa),
    );
    const mensajes: Partial<Record<CampoMatriz, string>> = {};
    for (const f of datos.faltantes) mensajes[f.campo] ??= f.mensaje;
    const faltantes = calcularFaltantes(
      cabecera,
      peligros,
      planAccion,
      mensajes,
    );

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
        segmentos: datos.segmentos,
        cabecera,
        peligros,
        planAccion,
        faltantes,
        resumen: datos.resumen,
        iaRespuesta: datos,
        iaModelo: this.ia.modelo,
        iaDuracionMs: duracionMs,
      }),
    );
    await this.repo.update(registro.id, {
      codigo: `MR-${new Date().getFullYear()}-${String(registro.id).padStart(4, '0')}`,
    });
    return this.obtener(u, registro.id);
  }

  /**
   * Guarda lo que el auditor completó o corrigió. Recalcula estimaciones, plan y faltantes;
   * los mensajes de la IA se conservan para los campos que siguen vacíos.
   */
  async actualizar(u: UsuarioSesion, id: number, dto: ActualizarMatrizDto) {
    const m = await this.obtener(u, id);
    const cabecera = normalizarCabecera(dto.cabecera, m.cabecera);
    const peligros = dto.peligros
      ? normalizarPeligros(dto.peligros)
      : m.peligros;
    const planAccion = sincronizarPlan(
      peligros,
      dto.planAccion ?? m.planAccion,
      this.responsablePlan(m.empresa),
    );
    const mensajes: Partial<Record<CampoMatriz, string>> = {};
    for (const f of m.faltantes) mensajes[f.campo] = f.mensaje;
    const faltantes = calcularFaltantes(
      cabecera,
      peligros,
      planAccion,
      mensajes,
    );
    await this.repo.update(id, {
      cabecera,
      peligros,
      planAccion,
      faltantes,
      estado: faltantes.length ? EstadoMatriz.BORRADOR : EstadoMatriz.COMPLETA,
    });
    return this.obtener(u, id);
  }

  async listar(u: UsuarioSesion, empresaId: number, areaId?: number) {
    this.empresas.asegurarAcceso(u, empresaId);
    return this.repo.find({
      where: {
        empresa: { id: empresaId },
        ...this.empresas.autoria(u),
        ...(areaId && { area: { id: areaId } }),
      },
      relations: RELACIONES,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async obtener(u: UsuarioSesion, id: number) {
    const r = await this.repo.findOne({ where: { id }, relations: RELACIONES });
    if (!r) throw new NotFoundException('Matriz no encontrada');
    this.empresas.asegurarRegistro(u, r, 'Matriz no encontrada');
    return r;
  }

  /** Como en la plantilla, el plan queda a cargo del representante legal salvo que se edite. */
  private responsablePlan(empresa: Empresa) {
    return (
      empresa.representanteLegalCargo || 'Representante legal'
    ).toUpperCase();
  }

  private validarAudio(archivo?: Express.Multer.File) {
    const ok =
      archivo &&
      (archivo.mimetype.startsWith('audio/') ||
        archivo.mimetype === 'video/mp4' ||
        archivo.mimetype === 'video/webm' ||
        // Algunos selectores de archivos no informan el tipo: se juzga por la extensión.
        EXT_AUDIO.has(extension(archivo.originalname)));
    if (!ok)
      throw new BadRequestException('Adjunta un audio en el campo "audio"');
    const ext = extension(archivo.originalname);
    if (ext && !EXT_AUDIO.has(ext))
      throw new BadRequestException(
        `El formato .${ext} no se puede transcribir. Usa m4a, mp3, wav, ogg/opus (WhatsApp), webm o flac.`,
      );
  }
}
