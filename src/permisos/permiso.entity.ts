import { Column, Entity, ManyToOne } from 'typeorm';
import { EntidadBase } from '../common/entidad-base';
import { EstadoPermiso } from '../common/enums';
import { Area } from '../empresas/area.entity';
import { Empresa } from '../empresas/empresa.entity';
import { Usuario } from '../usuarios/usuario.entity';

/**
 * Permiso general de trabajo seguro (RSE-16-00-01) con su Análisis de Riesgo de Tarea
 * (RSE-16-00-02). Las secciones del formato viajan como JSON en `datos` y `art`; la app define
 * su forma (mobile/src/domain/permits.ts).
 */
@Entity('permisos_trabajo')
export class PermisoTrabajo extends EntidadBase {
  /** PT-AAAA-NNNN */
  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  codigo: string | null;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  empresa: Empresa;

  @ManyToOne(() => Area, { nullable: true, onDelete: 'SET NULL' })
  area: Area | null;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  creadoPor: Usuario;

  @Column({
    type: 'enum',
    enum: EstadoPermiso,
    default: EstadoPermiso.PENDIENTE,
  })
  estado: EstadoPermiso;

  /** 1. Descripción del trabajo. */
  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'datetime' })
  fechaInicio: Date;

  @Column({ type: 'datetime' })
  fechaFin: Date;

  /** 4. Permisos especiales marcados (altura, caliente, energia, confinado, frio, otros). */
  @Column({ type: 'json' })
  especiales: string[];

  /** Secciones 1 a 10 del formato. */
  @Column({ type: 'json' })
  datos: Record<string, unknown>;

  /** Análisis de Riesgo de Tarea; null si el procedimiento no tiene ART. */
  @Column({ type: 'json', nullable: true })
  art: Record<string, unknown> | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  autorizadoPor: Usuario | null;

  @Column({ type: 'datetime', nullable: true })
  autorizadoEn: Date | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  cerradoPor: Usuario | null;

  @Column({ type: 'datetime', nullable: true })
  cerradoEn: Date | null;
}
