import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { EntidadBase } from '../common/entidad-base';
import { Perfil } from '../common/enums';
import { Empresa } from '../empresas/empresa.entity';
import { UsuarioFeature } from '../features/usuario-feature.entity';

@Entity('usuarios')
export class Usuario extends EntidadBase {
  @Column({ length: 100 })
  nombres: string;

  @Column({ length: 100, default: '' })
  apellidos: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 100, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 13, nullable: true })
  cedula: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  /** Cargo visible en la app, ej. "Auditor SST". */
  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo: string | null;

  /** Registro profesional / licencia SST. */
  @Column({ type: 'varchar', length: 60, nullable: true })
  licencia: string | null;

  @Column({ type: 'enum', enum: Perfil, default: Perfil.USUARIO })
  perfil: Perfil;

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'datetime', nullable: true })
  ultimoAcceso: Date | null;

  /** Versión de términos y política de privacidad aceptada (ver legal/legal.textos.ts). */
  @Column({ type: 'varchar', length: 20, nullable: true })
  terminosVersion: string | null;

  @Column({ type: 'datetime', nullable: true })
  terminosAceptadosEn: Date | null;

  /** Permiso explícito para enviar fotos y audio al proveedor de IA (OpenAI). */
  @Column({ default: false })
  consentimientoIa: boolean;

  @Column({ type: 'datetime', nullable: true })
  consentimientoIaEn: Date | null;

  /** Empresas que el usuario puede auditar (el administrador ve todas). */
  @ManyToMany(() => Empresa)
  @JoinTable({ name: 'usuario_empresas' })
  empresas: Empresa[];

  @OneToMany(() => UsuarioFeature, (uf) => uf.usuario)
  features: UsuarioFeature[];
}
