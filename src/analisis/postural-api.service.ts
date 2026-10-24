import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { NivelRiesgo } from '../common/enums';
import { PuntoPose } from './entities/analisis-video.entity';

// Contrato del servicio de análisis postural (../ergonomic-poses, GET /openapi.json).
// Solo se tipan los campos que usa el backend.

type Metodo = 'rula' | 'reba' | 'owas';

export interface OpcionesPostural {
  metodos: Metodo[];
  lado: 'izquierdo' | 'derecho' | 'ambos';
  factores?: Record<string, unknown>;
}

interface ResumenMetodo {
  puntaje_maximo: number;
  nivel_maximo: number;
}

export interface FotogramaPostural {
  t: number;
  imagen: string | null;
  puntos: PuntoPose[];
  angulos: Record<string, number>;
  rula: number | null;
  reba: number | null;
  owas: number | null;
  critico: boolean;
}

export interface InformePostural {
  nivel_riesgo: NivelRiesgo;
  diagnostico: string;
  angulos_criticos: {
    label: string;
    valor_grados: number;
    estado: 'CRÍTICO' | 'ALERTA' | 'MODERADO';
  }[];
  momentos_criticos: {
    t: number;
    titulo: string;
    descripcion: string;
    segmento: string;
    angulo: string;
    penalizacion: string;
  }[];
  hallazgos: { texto: string; valor: string; critico: boolean }[];
  recomendaciones: string[];
}

export interface ResultadoPostural {
  medio: 'video' | 'imagen';
  duracion_s: number;
  fps_origen: number;
  frames_analizados: number;
  ancho: number;
  alto: number;
  confianza: number;
  video_url: string | null;
  advertencias: string[];
  resumen: Partial<Record<Metodo, ResumenMetodo | null>>;
  fotogramas: FotogramaPostural[];
  informe: InformePostural | null;
}

export interface JobPostural {
  job_id: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  progreso: number;
  referencia_externa: string | null;
  creado_en: string;
  actualizado_en: string;
  resultado: ResultadoPostural | null;
  error: string | null;
}

/** Margen aceptado entre el timestamp del webhook y el reloj local. */
const VENTANA_WEBHOOK_S = 300;

/** Cliente HTTP del servicio de análisis postural (FastAPI + MediaPipe). */
@Injectable()
export class PosturalApiService {
  private readonly log = new Logger(PosturalApiService.name);
  private readonly url: string;
  private readonly apiKey: string | undefined;
  private readonly secretoWebhook: string | undefined;
  /** URL de este backend que recibe el webhook al terminar un video. */
  readonly callbackUrl: string;

  constructor(config: ConfigService) {
    this.url = config
      .get<string>('ERGO_API_URL', 'http://localhost:8000')
      .replace(/\/$/, '');
    this.apiKey = config.get<string>('ERGO_API_KEY') || undefined;
    this.secretoWebhook =
      config.get<string>('ERGO_WEBHOOK_SECRET') || undefined;
    this.callbackUrl = config.get<string>(
      'ERGO_CALLBACK_URL',
      `http://localhost:${config.get('PORT', 3000)}/api/ergo/webhook`,
    );
  }

  /** Evalúa una imagen y devuelve el resultado (síncrono, unos segundos). */
  evaluarImagen(archivo: Express.Multer.File, opciones: OpcionesPostural) {
    return this.enviar<ResultadoPostural>(
      '/api/evaluacion-riesgo/imagen',
      this.formulario('imagen', archivo, opciones),
      120_000,
    );
  }

  /** Crea el job de un video; el resultado llega por webhook o con obtenerJob(). */
  crearJob(
    archivo: Express.Multer.File,
    opciones: OpcionesPostural & {
      callback_url: string;
      referencia_externa: string;
    },
  ) {
    return this.enviar<JobPostural>(
      '/api/evaluacion-riesgo/jobs/upload',
      this.formulario('video', archivo, opciones),
      300_000,
    );
  }

  /** null si el servicio ya no conoce el job (se reinició o expiró). */
  async obtenerJob(jobId: string): Promise<JobPostural | null> {
    try {
      return await this.enviar<JobPostural>(
        `/api/evaluacion-riesgo/jobs/${encodeURIComponent(jobId)}`,
        undefined,
        15_000,
      );
    } catch (e) {
      if (e instanceof HttpException && e.getStatus() === 404) return null;
      throw e;
    }
  }

  /** Verifica la firma HMAC-SHA256 de "{timestamp}.{cuerpo}" que envía el servicio. */
  firmaValida(cuerpo: Buffer, timestamp?: string, firma?: string): boolean {
    if (!this.secretoWebhook) return true;
    if (!timestamp || !firma) return false;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > VENTANA_WEBHOOK_S)
      return false;
    const esperada = Buffer.from(
      'sha256=' +
        createHmac('sha256', this.secretoWebhook)
          .update(Buffer.concat([Buffer.from(`${timestamp}.`), cuerpo]))
          .digest('hex'),
    );
    const recibida = Buffer.from(firma);
    return (
      recibida.length === esperada.length && timingSafeEqual(recibida, esperada)
    );
  }

  private formulario(
    campo: string,
    archivo: Express.Multer.File,
    opciones: object,
  ) {
    const form = new FormData();
    form.append(
      campo,
      new Blob([new Uint8Array(archivo.buffer)], { type: archivo.mimetype }),
      archivo.originalname || campo,
    );
    form.append('opciones', JSON.stringify(opciones));
    return form;
  }

  private async enviar<T>(
    ruta: string,
    form: FormData | undefined,
    timeoutMs: number,
  ): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.url}${ruta}`, {
        method: form ? 'POST' : 'GET',
        body: form,
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      this.log.error(`${ruta}: ${String(e)}`);
      throw new ServiceUnavailableException(
        `El servicio de análisis postural no responde en ${this.url}. ¿Está iniciado?`,
      );
    }
    const cuerpo = (await res.json().catch(() => null)) as
      (T & { error?: string }) | null;
    if (res.ok && cuerpo) return cuerpo;

    const mensaje = cuerpo?.error ?? `HTTP ${res.status}`;
    if (res.status === 404) throw new HttpException(mensaje, 404);
    if (res.status === 401)
      throw new BadGatewayException(
        'El servicio de análisis postural rechazó la API key (revisa ERGO_API_KEY)',
      );
    if (res.status === 413 || res.status === 422 || res.status === 400)
      throw new UnprocessableEntityException(mensaje);
    throw new BadGatewayException(`Análisis postural: ${mensaje}`);
  }
}
