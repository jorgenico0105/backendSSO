import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Feature } from './feature.entity';

/** Acceso de un usuario a una feature. */
@Entity('usuario_features')
@Unique(['usuario', 'feature'])
export class UsuarioFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, (u) => u.features, { onDelete: 'CASCADE' })
  usuario: Usuario;

  @ManyToOne(() => Feature, { onDelete: 'CASCADE', eager: true })
  feature: Feature;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  otorgadoPor: Usuario | null;

  @CreateDateColumn()
  createdAt: Date;
}
