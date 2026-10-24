import { Column, Entity } from 'typeorm';
import { EstadoAnalisis, MedioAnalisis, NivelRiesgo } from '../../common/enums';
import { AnalisisBase } from './analisis-base';

export interface PuntoPose {
  nombre: string;
  x: number; // 0..1 sobre el ancho del frame
  y: number; // 0..1 sobre el alto del frame
  visible: boolean;
}

export interface FramePose {
  indice: number;
  segundo: number;
  /** URL de Cloudinary, o data URI JPEG si Cloudinary no está configurado. */
  imagenUrl: string;
  puntos: PuntoPose[];
  angulos: Record<string, number>;
  rula: number | null;
  reba: number | null;
  owas: number | null;
  critico: boolean;
}

/**
 * Evaluación ergonómica (RULA / REBA / OWAS) de un video de ciclo laboral o de una imagen.
 * La medición la hace el servicio de análisis postural (Python); aquí solo se guarda.
 * `iaRespuesta` guarda su resultado completo (sin las miniaturas) e `iaModelo` el motor usado.
 */
@Entity('analisis_videos')
export class AnalisisVideo extends AnalisisBase {
  @Column({
    type: 'enum',
    enum: MedioAnalisis,
    default: MedioAnalisis.VIDEO,
  })
  medio: MedioAnalisis;

  @Column({
    type: 'enum',
    enum: EstadoAnalisis,
    default: EstadoAnalisis.ANALIZADO,
  })
  estado: EstadoAnalisis;

  /** Job del servicio postural (solo videos). */
  @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
  jobId: string | null;

  /** 0-100 mientras el video se procesa. */
  @Column({ type: 'int', default: 0 })
  progreso: number;

  @Column({ type: 'text', nullable: true })
  errorMensaje: string | null;

  // --- Archivo ---
  /** Video anotado con el esqueleto (Cloudinary); null en imágenes o si la subida falló. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl: string | null;

  /** Ya no se usa: el original no se guarda en Cloudinary. Se conserva por los registros antiguos. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  videoPublicId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombreArchivo: string | null;

  @Column({ type: 'float', nullable: true })
  duracionSeg: number | null;

  @Column({ type: 'int', nullable: true })
  ancho: number | null;

  @Column({ type: 'int', nullable: true })
  alto: number | null;

  @Column({ type: 'float', nullable: true })
  fps: number | null;

  @Column({ type: 'int', nullable: true })
  tamanoBytes: number | null;

  // --- Resultado (null mientras se procesa) ---
  @Column({ type: 'int', nullable: true })
  framesAnalizados: number | null;

  /** Puntaje máximo de cada método en el archivo. */
  @Column({ type: 'int', nullable: true })
  puntajeRula: number | null;

  @Column({ type: 'int', nullable: true })
  puntajeReba: number | null;

  @Column({ type: 'int', nullable: true })
  puntajeOwas: number | null;

  @Column({ type: 'enum', enum: NivelRiesgo, nullable: true })
  nivelRiesgo: NivelRiesgo | null;

  @Column({ type: 'text', nullable: true })
  diagnostico: string | null;

  /** Ángulos críticos resumidos [{label, valorGrados, estado}]. */
  @Column({ type: 'json', nullable: true })
  angulos: unknown;

  /** Posturas críticas con segundo, imagen y penalizaciones. */
  @Column({ type: 'json', nullable: true })
  keyframes: unknown;

  @Column({ type: 'json', nullable: true })
  hallazgos: unknown;

  @Column({ type: 'json', nullable: true })
  recomendaciones: string[] | null;

  @Column({ type: 'json', nullable: true })
  advertencias: string[] | null;

  /** Puntos del esqueleto de los fotogramas clave. */
  @Column({ type: 'json', nullable: true })
  puntos: FramePose[] | null;

  /** Visibilidad media de las articulaciones clave (0..1). */
  @Column({ type: 'float', nullable: true })
  confianza: number | null;
}
