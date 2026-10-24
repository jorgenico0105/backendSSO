import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { EntidadBase } from '../common/entidad-base';
import { NivelRiesgo } from '../common/enums';
import { Area } from './area.entity';
import { Empresa } from './empresa.entity';

/** Puesto de trabajo propio de cada empresa (psicólogo, soldador, operario de paletizado...). */
@Entity('puestos')
@Unique(['empresa', 'nombre'])
export class Puesto extends EntidadBase {
  @Column({ length: 120 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  /** Tareas principales; se envían al agente como contexto. */
  @Column({ type: 'text', nullable: true })
  funciones: string | null;

  /** Ej. "38 seg / caja" */
  @Column({ type: 'varchar', length: 60, nullable: true })
  cicloTrabajo: string | null;

  @Column({ type: 'float', nullable: true })
  jornadaHoras: number | null;

  @Column({ type: 'int', default: 0 })
  numeroTrabajadores: number;

  @Column({ type: 'enum', enum: NivelRiesgo, nullable: true })
  nivelRiesgo: NivelRiesgo | null;

  @Column({ type: 'json', nullable: true })
  eppRequerido: string[] | null;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Empresa, (e) => e.puestos, { onDelete: 'CASCADE' })
  empresa: Empresa;

  @ManyToOne(() => Area, (a) => a.puestos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  area: Area | null;
}
