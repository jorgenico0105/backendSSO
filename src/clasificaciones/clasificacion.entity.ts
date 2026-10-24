import { Column, Entity, Index } from 'typeorm';
import { EntidadBase } from '../common/entidad-base';
import { TipoReporte } from '../common/enums';

/** Clasificación inmediata de un acto o condición subestándar (editable por el administrador). */
@Entity('clasificaciones')
@Index(['tipo', 'nombre'], { unique: true })
export class Clasificacion extends EntidadBase {
  @Column({ type: 'enum', enum: TipoReporte })
  tipo: TipoReporte;

  @Column({ length: 80 })
  nombre: string;

  /** Medida inmediata que el bot propone cuando el auditor marca esta clasificación. */
  @Column({ type: 'text', nullable: true })
  medida: string | null;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ default: true })
  activo: boolean;
}
