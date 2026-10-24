import { Column, Entity } from 'typeorm';
import { EstadoMatriz } from '../../common/enums';
import type {
  AccionPlan,
  CabeceraMatriz,
  Faltante,
  PeligroMatriz,
} from '../matriz/matriz';
import { AnalisisBase } from './analisis-base';

/**
 * Matriz de identificación y estimación cualitativa de riesgos (F-PSSO-IMEC-02) de un área y
 * puesto, generada por dictado de voz y completada a mano por el auditor.
 */
@Entity('matrices_riesgo')
export class MatrizRiesgo extends AnalisisBase {
  @Column({ type: 'enum', enum: EstadoMatriz, default: EstadoMatriz.BORRADOR })
  estado: EstadoMatriz;

  @Column({ type: 'varchar', length: 500, nullable: true })
  audioUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  audioPublicId: string | null;

  @Column({ type: 'text' })
  transcripcion: string;

  /** Transcripción segmentada con resaltados [{texto, resaltado}]. */
  @Column({ type: 'json' })
  segmentos: unknown;

  @Column({ type: 'json' })
  cabecera: CabeceraMatriz;

  /** Solo los peligros identificados del catálogo, con su estimación. */
  @Column({ type: 'json' })
  peligros: PeligroMatriz[];

  @Column({ type: 'json' })
  planAccion: AccionPlan[];

  /** Lo que el dictado no cubrió y queda por llenar a mano (vacío = matriz completa). */
  @Column({ type: 'json' })
  faltantes: Faltante[];

  @Column({ type: 'text', nullable: true })
  resumen: string | null;
}
