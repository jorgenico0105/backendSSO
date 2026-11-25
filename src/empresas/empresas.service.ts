import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AnalisisImagen } from '../analisis/entities/analisis-imagen.entity';
import { AnalisisVideo } from '../analisis/entities/analisis-video.entity';
import { MatrizRiesgo } from '../analisis/entities/matriz-riesgo.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { esAdmin, soloPropios, UsuarioSesion } from '../common/decorators';
import { EstadoAnalisis } from '../common/enums';
import { Area } from './area.entity';
import {
  ActualizarAreaDto,
  ActualizarEmpresaDto,
  ActualizarPuestoDto,
  CrearAreaDto,
  CrearEmpresaDto,
  CrearPuestoDto,
} from './dto/empresa.dto';
import { Empresa } from './empresa.entity';
import { Puesto } from './puesto.entity';

export interface ResumenEmpresa {
  reportesHoy: number;
  reportesAyer: number;
  hallazgosPendientes: number;
  ultimaActividad: string | null;
}

@Injectable()
export class EmpresasService {
  constructor(
    private readonly cloudinary: CloudinaryService,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Area) private readonly areas: Repository<Area>,
    @InjectRepository(Puesto) private readonly puestos: Repository<Puesto>,
    @InjectRepository(AnalisisImagen)
    private readonly reportes: Repository<AnalisisImagen>,
    @InjectRepository(AnalisisVideo)
    private readonly videos: Repository<AnalisisVideo>,
    @InjectRepository(MatrizRiesgo)
    private readonly voces: Repository<MatrizRiesgo>,
  ) {}

  /** Lanza 403 si el usuario no tiene asignada la empresa (el administrador accede a todas). */
  asegurarAcceso(u: UsuarioSesion, empresaId: number) {
    if (!esAdmin(u) && !u.empresaIds.includes(empresaId)) {
      throw new ForbiddenException('No tienes acceso a esta empresa');
    }
  }

  /** Filtro `where` por autor: el perfil USUARIO solo ve lo que él creó. */
  autoria(u: UsuarioSesion) {
    return soloPropios(u) ? { creadoPor: { id: u.id } } : {};
  }

  /**
   * Acceso a un registro ya cargado (con `empresa` y `creadoPor`). Uno ajeno responde 404,
   * igual que uno inexistente, para no revelar que existe.
   */
  asegurarRegistro(
    u: UsuarioSesion,
    r: { empresa: { id: number }; creadoPor?: { id: number } | null },
    noEncontrado: string,
  ) {
    this.asegurarAcceso(u, r.empresa.id);
    if (soloPropios(u) && r.creadoPor?.id !== u.id)
      throw new NotFoundException(noEncontrado);
  }

  /** Empresas visibles para el usuario, con áreas, puestos y resumen de actividad. */
  async listar(u: UsuarioSesion, incluirInactivas = false) {
    if (!esAdmin(u) && !u.empresaIds.length) return [];
    const empresas = await this.empresas.find({
      where: {
        ...(esAdmin(u) ? {} : { id: In(u.empresaIds) }),
        ...(incluirInactivas && esAdmin(u) ? {} : { activo: true }),
      },
      relations: { areas: true, puestos: { area: true } },
      order: {
        razonSocial: 'ASC',
        areas: { nombre: 'ASC' },
        puestos: { nombre: 'ASC' },
      },
    });
    // El resumen del Hub también cuenta solo lo propio para el perfil USUARIO.
    const resumen = await this.resumen(
      empresas.map((e) => e.id),
      soloPropios(u) ? u.id : undefined,
    );
    return empresas.map((e) => ({
      ...e,
      areas: e.areas.filter((a) => a.activo),
      puestos: e.puestos.filter((p) => p.activo),
      resumen: resumen.get(e.id) ?? {
        reportesHoy: 0,
        reportesAyer: 0,
        hallazgosPendientes: 0,
        ultimaActividad: null,
      },
    }));
  }

  async obtener(u: UsuarioSesion, id: number) {
    this.asegurarAcceso(u, id);
    const e = await this.empresas.findOne({
      where: { id },
      relations: { areas: true, puestos: { area: true } },
      order: { areas: { nombre: 'ASC' }, puestos: { nombre: 'ASC' } },
    });
    if (!e) throw new NotFoundException('Empresa no encontrada');
    return e;
  }

  private async resumen(
    ids: number[],
    autorId?: number,
  ): Promise<Map<number, ResumenEmpresa>> {
    const mapa = new Map<number, ResumenEmpresa>();
    if (!ids.length) return mapa;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const ayer = new Date(hoy.getTime() - 86_400_000);
    const hace30 = new Date(hoy.getTime() - 30 * 86_400_000);

    const filas = await this.reportes
      .createQueryBuilder('r')
      .select('r.empresa_id', 'empresaId')
      .addSelect('SUM(r.registrado_en >= :hoy)', 'hoy')
      .addSelect(
        'SUM(r.registrado_en >= :ayer AND r.registrado_en < :hoy)',
        'ayer',
      )
      .addSelect(
        "SUM(r.registrado_en >= :hace30 AND r.severidad IN ('alto','critico'))",
        'pendientes',
      )
      .where('r.empresa_id IN (:...ids)', { ids })
      .andWhere('r.estado = :estado', { estado: EstadoAnalisis.REGISTRADO })
      .andWhere(autorId ? 'r.creado_por_id = :autorId' : '1=1', { autorId })
      .setParameters({ hoy, ayer, hace30 })
      .groupBy('r.empresa_id')
      .getRawMany<{
        empresaId: number;
        hoy: string;
        ayer: string;
        pendientes: string;
      }>();

    const ultimas = await Promise.all(
      [this.reportes, this.videos, this.voces].map((repo) =>
        (repo as Repository<AnalisisImagen>)
          .createQueryBuilder('a')
          .select('a.empresa_id', 'empresaId')
          .addSelect('MAX(a.created_at)', 'ultima')
          .where('a.empresa_id IN (:...ids)', { ids })
          .andWhere(autorId ? 'a.creado_por_id = :autorId' : '1=1', {
            autorId,
          })
          .groupBy('a.empresa_id')
          .getRawMany<{ empresaId: number; ultima: Date | string }>(),
      ),
    );

    for (const id of ids)
      mapa.set(id, {
        reportesHoy: 0,
        reportesAyer: 0,
        hallazgosPendientes: 0,
        ultimaActividad: null,
      });
    for (const f of filas) {
      Object.assign(mapa.get(Number(f.empresaId))!, {
        reportesHoy: Number(f.hoy ?? 0),
        reportesAyer: Number(f.ayer ?? 0),
        hallazgosPendientes: Number(f.pendientes ?? 0),
      });
    }
    for (const f of ultimas.flat()) {
      const r = mapa.get(Number(f.empresaId))!;
      const iso = new Date(f.ultima).toISOString();
      if (!r.ultimaActividad || iso > r.ultimaActividad)
        r.ultimaActividad = iso;
    }
    return mapa;
  }

  // ------------------------------- Empresas -------------------------------

  async crear(dto: CrearEmpresaDto, adminId: number) {
    if (await this.empresas.existsBy({ ruc: dto.ruc }))
      throw new ConflictException('Ya existe una empresa con ese RUC');
    const e = await this.empresas.save(
      this.empresas.create({ ...dto, creadoPor: { id: adminId } }),
    );
    return this.empresas.findOneOrFail({
      where: { id: e.id },
      relations: { areas: true, puestos: true },
    });
  }

  async actualizar(id: number, dto: ActualizarEmpresaDto) {
    const e = await this.empresas.findOneBy({ id });
    if (!e) throw new NotFoundException('Empresa no encontrada');
    if (
      dto.ruc &&
      dto.ruc !== e.ruc &&
      (await this.empresas.existsBy({ ruc: dto.ruc }))
    ) {
      throw new ConflictException('Ya existe una empresa con ese RUC');
    }
    await this.empresas.update(id, dto);
    return this.empresas.findOneOrFail({
      where: { id },
      relations: { areas: true, puestos: { area: true } },
    });
  }

  async subirLogo(id: number, archivo: Express.Multer.File) {
    const e = await this.empresas.findOneBy({ id });
    if (!e) throw new NotFoundException('Empresa no encontrada');
    if (!archivo?.mimetype.startsWith('image/'))
      throw new BadRequestException('Adjunta una imagen en el campo "logo"');
    const subida = await this.cloudinary.subir(
      archivo.buffer,
      `empresas/${id}/logo`,
      'image',
    );
    if (e.logoPublicId) await this.cloudinary.eliminar(e.logoPublicId);
    await this.empresas.update(id, {
      logoUrl: subida.secure_url,
      logoPublicId: subida.public_id,
    });
    return { logoUrl: subida.secure_url };
  }

  // -------------------------------- Áreas ---------------------------------

  async crearArea(empresaId: number, dto: CrearAreaDto) {
    await this.existeEmpresa(empresaId);
    if (
      await this.areas.existsBy({
        empresa: { id: empresaId },
        nombre: dto.nombre,
      })
    ) {
      throw new ConflictException('Ya existe un área con ese nombre');
    }
    return this.areas.save(
      this.areas.create({ ...dto, empresa: { id: empresaId } }),
    );
  }

  async actualizarArea(empresaId: number, id: number, dto: ActualizarAreaDto) {
    const a = await this.areas.findOneBy({ id, empresa: { id: empresaId } });
    if (!a) throw new NotFoundException('Área no encontrada');
    await this.areas.update(id, dto);
    return this.areas.findOneByOrFail({ id });
  }

  async eliminarArea(empresaId: number, id: number) {
    const r = await this.areas.delete({ id, empresa: { id: empresaId } });
    if (!r.affected) throw new NotFoundException('Área no encontrada');
    return { ok: true };
  }

  // ------------------------------- Puestos --------------------------------

  async crearPuesto(empresaId: number, dto: CrearPuestoDto) {
    await this.existeEmpresa(empresaId);
    if (
      await this.puestos.existsBy({
        empresa: { id: empresaId },
        nombre: dto.nombre,
      })
    ) {
      throw new ConflictException('Ya existe un puesto con ese nombre');
    }
    const { areaId, ...datos } = dto;
    const p = await this.puestos.save(
      this.puestos.create({
        ...datos,
        empresa: { id: empresaId },
        area: await this.areaDe(empresaId, areaId),
      }),
    );
    return this.puestos.findOneOrFail({
      where: { id: p.id },
      relations: { area: true },
    });
  }

  async actualizarPuesto(
    empresaId: number,
    id: number,
    dto: ActualizarPuestoDto,
  ) {
    const p = await this.puestos.findOneBy({ id, empresa: { id: empresaId } });
    if (!p) throw new NotFoundException('Puesto no encontrado');
    const { areaId, ...datos } = dto;
    Object.assign(p, datos);
    if (areaId !== undefined) p.area = await this.areaDe(empresaId, areaId);
    await this.puestos.save(p);
    return this.puestos.findOneOrFail({
      where: { id },
      relations: { area: true },
    });
  }

  async eliminarPuesto(empresaId: number, id: number) {
    const r = await this.puestos.delete({ id, empresa: { id: empresaId } });
    if (!r.affected) throw new NotFoundException('Puesto no encontrado');
    return { ok: true };
  }

  // ------------------------- Ayudas para análisis -------------------------

  /** Áreas activas de la empresa (el agente sugiere una cuando el auditor no la indica). */
  areasActivas(empresaId: number) {
    return this.areas.find({
      where: { empresa: { id: empresaId }, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async contexto(
    empresaId: number,
    areaId?: number | null,
    puestoId?: number | null,
  ) {
    const empresa = await this.empresas.findOneBy({
      id: empresaId,
      activo: true,
    });
    if (!empresa)
      throw new NotFoundException('Empresa no encontrada o inactiva');
    const area = areaId
      ? await this.areas.findOneBy({ id: areaId, empresa: { id: empresaId } })
      : null;
    if (areaId && !area)
      throw new BadRequestException('El área no pertenece a la empresa');
    const puesto = puestoId
      ? await this.puestos.findOneBy({
          id: puestoId,
          empresa: { id: empresaId },
        })
      : null;
    if (puestoId && !puesto)
      throw new BadRequestException('El puesto no pertenece a la empresa');
    return { empresa, area, puesto };
  }

  private async existeEmpresa(id: number) {
    if (!(await this.empresas.existsBy({ id })))
      throw new NotFoundException('Empresa no encontrada');
  }

  private async areaDe(empresaId: number, areaId: number | null | undefined) {
    if (!areaId) return null;
    const a = await this.areas.findOneBy({
      id: areaId,
      empresa: { id: empresaId },
    });
    if (!a) throw new BadRequestException('El área no pertenece a la empresa');
    return a;
  }
}
