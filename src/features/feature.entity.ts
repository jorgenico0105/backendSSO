import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../common/entidad-base';

/** Funcionalidad de la app = una entrada del menú inferior. */
@Entity('features')
export class Feature extends EntidadBase {
  @Column({ length: 40, unique: true })
  codigo: string;

  @Column({ length: 80 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  /** Nombre del ícono MaterialIcons que usa la app. */
  @Column({ length: 60 })
  icono: string;

  /** Ruta de Expo Router, ej. "/actos". */
  @Column({ length: 80 })
  ruta: string;

  /** Si aparece como pestaña en el menú inferior. */
  @Column({ default: true })
  enMenu: boolean;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ default: true })
  activo: boolean;
}
