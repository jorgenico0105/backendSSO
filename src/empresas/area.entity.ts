import { Column, Entity, ManyToOne, OneToMany, Unique } from 'typeorm';
import { EntidadBase } from '../common/entidad-base';
import { NivelRiesgo } from '../common/enums';
import { Empresa } from './empresa.entity';
import { Puesto } from './puesto.entity';

@Entity('areas')
@Unique(['empresa', 'nombre'])
export class Area extends EntidadBase {
  @Column({ length: 120 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  /** Ej. "Planta Norte, Nave B" */
  @Column({ type: 'varchar', length: 200, nullable: true })
  ubicacion: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  responsable: string | null;

  @Column({ type: 'enum', enum: NivelRiesgo, nullable: true })
  nivelRiesgo: NivelRiesgo | null;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Empresa, (e) => e.areas, { onDelete: 'CASCADE' })
  empresa: Empresa;

  @OneToMany(() => Puesto, (p) => p.area)
  puestos: Puesto[];
}
