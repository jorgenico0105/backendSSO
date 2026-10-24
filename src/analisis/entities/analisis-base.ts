import { Column, ManyToOne } from 'typeorm';
import { EntidadBase } from '../../common/entidad-base';
import { Area } from '../../empresas/area.entity';
import { Empresa } from '../../empresas/empresa.entity';
import { Puesto } from '../../empresas/puesto.entity';
import { Usuario } from '../../usuarios/usuario.entity';

/** Columnas comunes a todo resultado estructurado del agente IA. */
export abstract class AnalisisBase extends EntidadBase {
  /** Código legible: INC-2026-0001, ERG-..., VOZ-... */
  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  codigo: string | null;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  empresa: Empresa;

  @ManyToOne(() => Area, { nullable: true, onDelete: 'SET NULL' })
  area: Area | null;

  @ManyToOne(() => Puesto, { nullable: true, onDelete: 'SET NULL' })
  puesto: Puesto | null;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  creadoPor: Usuario;

  /** Respuesta estructurada completa del agente (JSON validado con zod). */
  @Column({ type: 'json', nullable: true })
  iaRespuesta: unknown;

  @Column({ type: 'varchar', length: 60, nullable: true })
  iaModelo: string | null;

  @Column({ type: 'int', nullable: true })
  iaDuracionMs: number | null;
}
