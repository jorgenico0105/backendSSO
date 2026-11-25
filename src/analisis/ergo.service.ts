import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UsuarioSesion } from '../common/decorators';
import { EstadoAnalisis, MedioAnalisis } from '../common/enums';
import { EmpresasService } from '../empresas/empresas.service';
import { AnalizarErgoDto } from './dto/analisis.dto';
import { AnalisisVideo, FramePose } from './entities/analisis-video.entity';
import {
  FotogramaPostural,
  JobPostural,
  OpcionesPostural,
  PosturalApiService,
  ResultadoPostural,
} from './postural-api.service';

const RELACIONES = {
  empresa: true,
  area: true,
  puesto: true,
  creadoPor: true,
} as const;
const MOTOR = 'mediapipe-pose';

/**
 * Evaluación ergonómica de una imagen o un video. No usa el agente IA: la pose y los puntajes
 * RULA/REBA/OWAS los mide el servicio de análisis postural (Python), y aquí se guardan.
 * - Imagen: se analiza en el momento y se responde el resultado.
 * - Video: se crea un job y se responde el registro en PROCESANDO. Se completa cuando llega el
 *   webhook del servicio o, si no llega, cuando alguien consulta el registro (GET /ergo/:id).
 */
@Injectable()
export class ErgoService {
  private readonly log = new Logger(ErgoService.name);
  /** Registros que se están completando (webhook y consulta pueden llegar a la vez). */
  private readonly completando = new Set<number>();

  constructor(
    private readonly empresas: EmpresasService,
    private readonly cloudinary: CloudinaryService,
    private readonly postural: PosturalApiService,
    @InjectRepository(AnalisisVideo)
    private readonly repo: Repository<AnalisisVideo>,
  ) {}

  async analizar(
    u: UsuarioSesion,
    empresaId: number,
    archivo: Express.Multer.File,
    dto: AnalizarErgoDto,
  ) {
    this.empresas.asegurarAcceso(u, empresaId);
    const medio = archivo?.mimetype.startsWith('image/')
      ? MedioAnalisis.IMAGEN
      : archivo?.mimetype.startsWith('video/')
        ? MedioAnalisis.VIDEO
        : null;
    if (!medio)
      throw new BadRequestException(
        'Adjunta una imagen o un video en el campo "archivo"',
      );
    const { empresa, area, puesto } = await this.empresas.contexto(
      empresaId,
      dto.areaId,
      dto.puestoId,
    );
    const opciones: OpcionesPostural = {
      metodos: ['rula', 'reba', 'owas'],
      lado: dto.lado ?? 'ambos',
      factores: dto.factores
        ? (JSON.parse(dto.factores) as Record<string, unknown>)
        : undefined,
    };
    const nuevo = () =>
      this.repo.create({
        empresa,
        area,
        puesto,
        creadoPor: { id: u.id },
        medio,
        estado: EstadoAnalisis.PROCESANDO,
        nombreArchivo: dto.nombreArchivo ?? archivo.originalname ?? null,
        tamanoBytes: archivo.size,
        iaModelo: MOTOR,
      });

    if (medio === MedioAnalisis.IMAGEN) {
      const inicio = Date.now();
      // Si el servicio falla, no queda ningún registro.
      const resultado = await this.postural.evaluarImagen(archivo, opciones);
      const registro = await this.guardarConCodigo(nuevo());
      await this.completar(registro, resultado, Date.now() - inicio);
      return this.obtener(u, registro.id);
    }

    const registro = await this.guardarConCodigo(nuevo());
    try {
      const job = await this.postural.crearJob(archivo, {
        ...opciones,
        callback_url: this.postural.callbackUrl,
        referencia_externa: String(registro.id),
      });
      await this.repo.update(registro.id, { jobId: job.job_id });
    } catch (e) {
      await this.repo.delete(registro.id);
      throw e;
    }
    return this.obtener(u, registro.id);
  }

  /**
   * Historial liviano: de los fotogramas solo viaja la portada (el primero crítico) para la
   * miniatura con el esqueleto, y no se envía `iaRespuesta`. El detalle completo es GET /ergo/:id.
   */
  async listar(u: UsuarioSesion, empresaId: number) {
    this.empresas.asegurarAcceso(u, empresaId);
    const lista = await this.repo.find({
      where: { empresa: { id: empresaId }, ...this.empresas.autoria(u) },
      relations: RELACIONES,
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return lista.map((r) => {
      const portada = r.puntos?.find((p) => p.critico) ?? r.puntos?.[0];
      return { ...r, puntos: portada ? [portada] : [], iaRespuesta: null };
    });
  }

  /** Devuelve el registro; si el video sigue en proceso, antes consulta su job. */
  async obtener(u: UsuarioSesion, id: number) {
    const r = await this.repo.findOne({ where: { id }, relations: RELACIONES });
    if (!r) throw new NotFoundException('Evaluación no encontrada');
    this.empresas.asegurarRegistro(u, r, 'Evaluación no encontrada');
    if (r.estado !== EstadoAnalisis.PROCESANDO || !r.jobId) return r;

    try {
      const job = await this.postural.obtenerJob(r.jobId);
      await this.aplicarJob(r, job);
    } catch (e) {
      // El servicio caído no debe impedir ver el registro; se reintenta en la próxima consulta.
      this.log.warn(`No se pudo consultar el job ${r.jobId}: ${String(e)}`);
      return r;
    }
    return this.repo.findOneOrFail({ where: { id }, relations: RELACIONES });
  }

  /** POST /ergo/webhook: el servicio postural avisa que un job terminó. */
  async webhook(
    cuerpo: Buffer | undefined,
    timestamp?: string,
    firma?: string,
  ) {
    if (!cuerpo || !this.postural.firmaValida(cuerpo, timestamp, firma))
      throw new UnauthorizedException('Firma del webhook inválida');
    const job = JSON.parse(cuerpo.toString('utf8')) as JobPostural;
    const r = await this.repo.findOne({
      where: { jobId: job.job_id },
      relations: { empresa: true },
    });
    if (r?.estado === EstadoAnalisis.PROCESANDO) await this.aplicarJob(r, job);
    return { ok: true };
  }

  private async guardarConCodigo(registro: AnalisisVideo) {
    const guardado = await this.repo.save(registro);
    guardado.codigo = `ERG-${new Date().getFullYear()}-${String(guardado.id).padStart(4, '0')}`;
    await this.repo.update(guardado.id, { codigo: guardado.codigo });
    return guardado;
  }

  private async aplicarJob(r: AnalisisVideo, job: JobPostural | null) {
    if (!job)
      return this.repo.update(r.id, {
        estado: EstadoAnalisis.ERROR,
        errorMensaje:
          'El servicio de análisis postural se reinició y perdió el video. Vuelve a subirlo.',
      });
    if (job.estado === 'error')
      return this.repo.update(r.id, {
        estado: EstadoAnalisis.ERROR,
        errorMensaje: job.error ?? 'Error en el análisis postural',
      });
    if (job.estado === 'completado' && job.resultado)
      return this.completar(
        r,
        job.resultado,
        Date.parse(job.actualizado_en) - Date.parse(job.creado_en),
      );
    if (job.progreso !== r.progreso)
      return this.repo.update(r.id, { progreso: job.progreso });
  }

  private async completar(
    r: AnalisisVideo,
    resultado: ResultadoPostural,
    duracionMs: number,
  ) {
    if (this.completando.has(r.id)) return;
    this.completando.add(r.id);
    try {
      const imagenes = await this.guardarFotogramas(r, resultado.fotogramas);
      const informe = resultado.informe;
      const puntos: FramePose[] = resultado.fotogramas.map((f, i) => ({
        indice: i,
        segundo: f.t,
        imagenUrl: imagenes[i],
        puntos: f.puntos,
        angulos: f.angulos,
        rula: f.rula,
        reba: f.reba,
        owas: f.owas,
        critico: f.critico,
      }));
      const fotogramaEn = (t: number) =>
        puntos.reduce((a, b) =>
          Math.abs(b.segundo - t) < Math.abs(a.segundo - t) ? b : a,
        );

      await this.repo.update(
        { id: r.id, estado: EstadoAnalisis.PROCESANDO },
        {
          estado: EstadoAnalisis.ANALIZADO,
          progreso: 100,
          errorMensaje: null,
          videoUrl: resultado.video_url,
          duracionSeg: resultado.duracion_s || null,
          ancho: resultado.ancho,
          alto: resultado.alto,
          fps: resultado.fps_origen || null,
          framesAnalizados: resultado.frames_analizados,
          puntajeRula: resultado.resumen.rula?.puntaje_maximo ?? null,
          puntajeReba: resultado.resumen.reba?.puntaje_maximo ?? null,
          puntajeOwas: resultado.resumen.owas?.puntaje_maximo ?? null,
          nivelRiesgo: informe?.nivel_riesgo ?? null,
          diagnostico: informe?.diagnostico ?? null,
          angulos: (informe?.angulos_criticos ?? []).map((a) => ({
            label: a.label,
            valorGrados: a.valor_grados,
            estado: a.estado,
          })),
          keyframes: (informe?.momentos_criticos ?? []).map((m) => {
            const f = puntos.length ? fotogramaEn(m.t) : null;
            return {
              indiceFrame: f?.indice ?? 0,
              segundo: m.t,
              // Solo URLs: las data URI ya están en `puntos` y no se duplican.
              imagenUrl: f?.imagenUrl.startsWith('http') ? f.imagenUrl : null,
              titulo: m.titulo,
              descripcion: m.descripcion,
              etiquetaSegmento: m.segmento,
              etiquetaAngulo: `Ángulo: ${m.angulo}`,
              penalizacion: m.penalizacion,
            };
          }),
          hallazgos: informe?.hallazgos ?? [],
          recomendaciones: informe?.recomendaciones ?? [],
          advertencias: resultado.advertencias,
          puntos,
          confianza: resultado.confianza,
          iaRespuesta: {
            ...resultado,
            fotogramas: resultado.fotogramas.map((f) => ({
              ...f,
              imagen: null,
            })),
          },
          iaModelo: MOTOR,
          iaDuracionMs: Math.max(0, Math.round(duracionMs)) || null,
        },
      );
    } finally {
      this.completando.delete(r.id);
    }
  }

  /**
   * Sube las miniaturas de los fotogramas a Cloudinary. Sin Cloudinary configurado (o si una
   * subida falla) se guarda la data URI tal cual, para poder probar en local.
   */
  private guardarFotogramas(r: AnalisisVideo, fotogramas: FotogramaPostural[]) {
    return Promise.all(
      fotogramas.map(async (f, i) => {
        const dataUri = f.imagen ?? '';
        if (!this.cloudinary.disponible || !dataUri.startsWith('data:'))
          return dataUri;
        try {
          const subida = await this.cloudinary.subir(
            Buffer.from(dataUri.slice(dataUri.indexOf(',') + 1), 'base64'),
            `empresas/${r.empresa.id}/ergo/${r.codigo ?? r.id}`,
            'image',
            { public_id: `fotograma_${i}` },
          );
          return subida.secure_url;
        } catch (e) {
          this.log.warn(`No se pudo subir el fotograma ${i}: ${String(e)}`);
          return dataUri;
        }
      }),
    );
  }
}
