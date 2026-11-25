import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioSesion } from '../common/decorators';
import { EstadoPermiso } from '../common/enums';
import { EmpresasService } from '../empresas/empresas.service';
import { ActualizarPermisoDto, CrearPermisoDto } from './dto/permiso.dto';
import { PermisoTrabajo } from './permiso.entity';

const RELACIONES = {
  empresa: true,
  area: true,
  creadoPor: true,
  autorizadoPor: true,
  cerradoPor: true,
} as const;

/** Tamaño máximo del JSON de un permiso (secciones + ART). */
const MAX_JSON = 200_000;

type Firmas = {
  jefe?: string;
  administrador?: string;
  responsableSso?: string;
};

const lleno = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

@Injectable()
export class PermisosService {
  constructor(
    private readonly empresas: EmpresasService,
    @InjectRepository(PermisoTrabajo)
    private readonly repo: Repository<PermisoTrabajo>,
  ) {}

  async listar(u: UsuarioSesion, empresaId: number) {
    this.empresas.asegurarAcceso(u, empresaId);
    return this.repo.find({
      where: { empresa: { id: empresaId }, ...this.empresas.autoria(u) },
      relations: RELACIONES,
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async obtener(u: UsuarioSesion, id: number) {
    const p = await this.repo.findOne({ where: { id }, relations: RELACIONES });
    if (!p) throw new NotFoundException('Permiso no encontrado');
    this.empresas.asegurarRegistro(u, p, 'Permiso no encontrado');
    return p;
  }

  async crear(u: UsuarioSesion, empresaId: number, dto: CrearPermisoDto) {
    this.empresas.asegurarAcceso(u, empresaId);
    const { empresa, area } = await this.empresas.contexto(
      empresaId,
      dto.areaId,
    );
    this.validarFechas(dto.fechaInicio, dto.fechaFin);
    this.validarTamano(dto.datos, dto.art);
    const p = await this.repo.save(
      this.repo.create({
        empresa,
        area,
        creadoPor: { id: u.id },
        descripcion: dto.descripcion.trim(),
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        especiales: dto.especiales,
        datos: dto.datos,
        art: dto.art ?? null,
      }),
    );
    await this.repo.update(p.id, {
      codigo: `PT-${new Date().getFullYear()}-${String(p.id).padStart(4, '0')}`,
    });
    return this.obtener(u, p.id);
  }

  async actualizar(u: UsuarioSesion, id: number, dto: ActualizarPermisoDto) {
    const p = await this.obtener(u, id);
    if (p.estado === EstadoPermiso.CERRADO)
      throw new BadRequestException('El permiso está cerrado');
    const { area } =
      dto.areaId !== undefined
        ? await this.empresas.contexto(p.empresa.id, dto.areaId)
        : { area: p.area };
    const inicio = dto.fechaInicio ?? p.fechaInicio.toISOString();
    const fin = dto.fechaFin ?? p.fechaFin.toISOString();
    this.validarFechas(inicio, fin);
    this.validarTamano(dto.datos ?? p.datos, dto.art ?? p.art);
    await this.repo.save({
      ...p,
      area,
      ...(dto.descripcion !== undefined && {
        descripcion: dto.descripcion.trim(),
      }),
      fechaInicio: new Date(inicio),
      fechaFin: new Date(fin),
      ...(dto.especiales && { especiales: dto.especiales }),
      ...(dto.datos && { datos: dto.datos }),
      ...(dto.art !== undefined && { art: dto.art }),
    });
    return this.obtener(u, id);
  }

  /** Sección 8: el permiso se autoriza cuando los responsables lo aprueban. */
  async autorizar(u: UsuarioSesion, id: number) {
    const p = await this.obtener(u, id);
    if (p.estado !== EstadoPermiso.PENDIENTE)
      throw new BadRequestException('Solo se autoriza un permiso pendiente');
    const d = p.datos as {
      personal?: { nombre?: string }[];
      aprobacion?: Firmas;
    };
    const faltan: string[] = [];
    if (!d.personal?.some((x) => lleno(x.nombre)))
      faltan.push('al menos una persona en "Personal involucrado"');
    if (!lleno(d.aprobacion?.jefe))
      faltan.push('el jefe o encargado del trabajo (sección 8)');
    if (!lleno(d.aprobacion?.responsableSso))
      faltan.push('el responsable de Seguridad y Salud (sección 8)');
    if (faltan.length)
      throw new BadRequestException(
        `Para autorizar completa: ${faltan.join('; ')}.`,
      );
    await this.repo.update(id, {
      estado: EstadoPermiso.AUTORIZADO,
      autorizadoPor: { id: u.id },
      autorizadoEn: new Date(),
    });
    return this.obtener(u, id);
  }

  /** Secciones 9 y 10: informe de la jornada y cierre con el área limpia. */
  async cerrar(u: UsuarioSesion, id: number) {
    const p = await this.obtener(u, id);
    if (p.estado !== EstadoPermiso.AUTORIZADO)
      throw new BadRequestException('Solo se cierra un permiso autorizado');
    const d = p.datos as {
      informe?: string;
      cierre?: Firmas & { areaLimpia?: boolean | null };
    };
    const faltan: string[] = [];
    if (!lleno(d.informe))
      faltan.push('el informe de trabajos realizados (sección 9)');
    if (!lleno(d.cierre?.jefe))
      faltan.push('el jefe o encargado que cierra (sección 10)');
    if (!lleno(d.cierre?.responsableSso))
      faltan.push(
        'el responsable de Seguridad y Salud que cierra (sección 10)',
      );
    if (typeof d.cierre?.areaLimpia !== 'boolean')
      faltan.push('si el área quedó limpia y ordenada (sección 10)');
    if (faltan.length)
      throw new BadRequestException(
        `Para cerrar completa: ${faltan.join('; ')}.`,
      );
    await this.repo.update(id, {
      estado: EstadoPermiso.CERRADO,
      cerradoPor: { id: u.id },
      cerradoEn: new Date(),
    });
    return this.obtener(u, id);
  }

  private validarFechas(inicio: string, fin: string) {
    const a = new Date(inicio).getTime();
    const b = new Date(fin).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a)
      throw new BadRequestException(
        'La fecha/hora de término debe ser posterior a la de inicio',
      );
  }

  private validarTamano(...partes: unknown[]) {
    if (JSON.stringify(partes).length > MAX_JSON)
      throw new BadRequestException('El permiso tiene demasiados datos');
  }
}
