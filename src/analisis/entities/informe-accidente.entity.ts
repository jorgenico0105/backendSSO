import { Column, Entity } from 'typeorm';
import { EstadoMatriz } from '../../common/enums';
import type { DatosInforme, FaltanteInforme } from '../accidentes/informe';
import { AnalisisBase } from './analisis-base';

/**
 * Informe ampliatorio de investigación de accidentes e incidentes (RSE-04-00-02), generado por
 * dictado de voz. `area` es el lugar del suceso y `puesto` el del trabajador, si se eligieron.
 */
@Entity('informes_accidente')
export class InformeAccidente extends AnalisisBase {
  /** BORRADOR mientras falten datos obligatorios; COMPLETA cuando no queda ninguno. */
  @Column({ type: 'enum', enum: EstadoMatriz, default: EstadoMatriz.BORRADOR })
  estado: EstadoMatriz;

  @Column({ type: 'varchar', length: 500, nullable: true })
  audioUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  audioPublicId: string | null;

  @Column({ type: 'text' })
  transcripcion: string;

  @Column({ type: 'json' })
  datos: DatosInforme;

  @Column({ type: 'json' })
  faltantes: FaltanteInforme[];

  @Column({ type: 'text', nullable: true })
  resumen: string | null;
}
