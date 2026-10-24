import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { EntidadBase } from '../common/entidad-base';
import { NivelRiesgo } from '../common/enums';
import { Usuario } from '../usuarios/usuario.entity';
import { Area } from './area.entity';
import { Puesto } from './puesto.entity';

@Entity('empresas')
export class Empresa extends EntidadBase {
  // --- Identificación tributaria ---
  @Column({ length: 200 })
  razonSocial: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nombreComercial: string | null;

  @Column({ length: 13, unique: true })
  ruc: string;

  /** Sociedad, persona natural, RIMPE, sector público... */
  @Column({ type: 'varchar', length: 60, nullable: true })
  tipoContribuyente: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actividadEconomica: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  codigoCiiu: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sector: string | null;

  @Column({ type: 'date', nullable: true })
  fechaConstitucion: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  numeroPatronalIess: string | null;

  // --- Representante legal ---
  @Column({ length: 150 })
  representanteLegalNombre: string;

  @Column({ length: 13 })
  representanteLegalCedula: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  representanteLegalCargo: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  representanteLegalEmail: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  representanteLegalTelefono: string | null;

  // --- Responsable de Seguridad y Salud en el Trabajo ---
  @Column({ type: 'varchar', length: 150, nullable: true })
  responsableSstNombre: string | null;

  @Column({ type: 'varchar', length: 13, nullable: true })
  responsableSstCedula: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  responsableSstEmail: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  responsableSstTelefono: string | null;

  // --- Identidad corporativa ---
  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logoPublicId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slogan: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  colorMarca: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'text', nullable: true })
  mision: string | null;

  @Column({ type: 'text', nullable: true })
  vision: string | null;

  // --- Ubicación y contacto ---
  @Column({ length: 80, default: 'Ecuador' })
  pais: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  provincia: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ciudad: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  celular: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  sitioWeb: string | null;

  // --- Datos operativos SST ---
  @Column({ type: 'int', default: 0 })
  numeroEmpleados: number;

  @Column({ type: 'enum', enum: NivelRiesgo, default: NivelRiesgo.MEDIO })
  nivelRiesgo: NivelRiesgo;

  /** Ej. "Turno Matutino" */
  @Column({ type: 'varchar', length: 60, nullable: true })
  turno: string | null;

  /** Ej. "07:00 - 15:00" */
  @Column({ type: 'varchar', length: 30, nullable: true })
  horarioLaboral: string | null;

  /** Base del contador "días sin accidentes". */
  @Column({ type: 'date', nullable: true })
  fechaUltimoAccidente: string | null;

  @Column({ type: 'int', default: 365 })
  metaDiasSinAccidentes: number;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  creadoPor: Usuario | null;

  @OneToMany(() => Area, (a) => a.empresa)
  areas: Area[];

  @OneToMany(() => Puesto, (p) => p.empresa)
  puestos: Puesto[];
}
