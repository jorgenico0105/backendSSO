import { Column, Entity } from 'typeorm';
import { EstadoAnalisis, NivelRiesgo, TipoReporte } from '../../common/enums';
import { AnalisisBase } from './analisis-base';

/** Reporte de acto / condición subestándar con su análisis de imagen por IA. */
@Entity('analisis_imagenes')
export class AnalisisImagen extends AnalisisBase {
  @Column({
    type: 'enum',
    enum: EstadoAnalisis,
    default: EstadoAnalisis.ANALIZADO,
  })
  estado: EstadoAnalisis;

  // --- Imagen en Cloudinary ---
  @Column({ length: 500 })
  imagenUrl: string;

  @Column({ length: 255 })
  imagenPublicId: string;

  @Column({ type: 'int', nullable: true })
  imagenAncho: number | null;

  @Column({ type: 'int', nullable: true })
  imagenAlto: number | null;

  // --- Resultado del agente ---
  @Column({ type: 'enum', enum: TipoReporte, nullable: true })
  iaTipo: TipoReporte | null;

  @Column({ type: 'enum', enum: NivelRiesgo, nullable: true })
  iaSeveridad: NivelRiesgo | null;

  @Column({ type: 'json', nullable: true })
  iaClasificaciones: string[] | null;

  @Column({ type: 'text', nullable: true })
  iaResumen: string | null;

  @Column({ type: 'json', nullable: true })
  iaMedidas: string[] | null;

  @Column({ type: 'float', nullable: true })
  iaConfianza: number | null;

  // --- Datos confirmados por el usuario al registrar ---
  @Column({ type: 'enum', enum: TipoReporte, nullable: true })
  tipo: TipoReporte | null;

  @Column({ type: 'json', nullable: true })
  clasificaciones: string[] | null;

  @Column({ type: 'enum', enum: NivelRiesgo, nullable: true })
  severidad: NivelRiesgo | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  /** Acción correctiva propuesta por el agente y revisada por el auditor. */
  @Column({ type: 'text', nullable: true })
  accionCorrectiva: string | null;

  @Column({ type: 'datetime', nullable: true })
  registradoEn: Date | null;

  @Column({ type: 'text', nullable: true })
  errorMensaje: string | null;
}
