import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { DataSource, In, Repository } from 'typeorm';
import { esAdmin, type UsuarioSesion } from '../common/decorators';
import { Perfil } from '../common/enums';
import { Empresa } from '../empresas/empresa.entity';
import { Feature } from '../features/feature.entity';
import { UsuarioFeature } from '../features/usuario-feature.entity';
import { ActualizarUsuarioDto, CrearUsuarioDto } from './usuario.dto';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  /**
   * Empresas que el gestor administra: `null` = todas (administrador general). El ADMIN_EMPRESA
   * solo ve usuarios que comparten alguna de sus empresas, y de ellos solo esas empresas.
   */
  private alcance(g: UsuarioSesion): number[] | null {
    return esAdmin(g) ? null : g.empresaIds;
  }

  async listar(g: UsuarioSesion) {
    const alcance = this.alcance(g);
    if (alcance && !alcance.length) return [];
    const lista = await this.usuarios.find({
      relations: { features: true, empresas: true },
      select: { empresas: { id: true, razonSocial: true } },
      order: { nombres: 'ASC' },
    });
    return lista
      .filter((u) => this.visible(u, alcance))
      .map((u) => this.dto(u, alcance));
  }

  async obtener(g: UsuarioSesion, id: number) {
    const alcance = this.alcance(g);
    return this.dto(await this.cargarVisible(id, alcance), alcance);
  }

  private async cargarVisible(id: number, alcance: number[] | null) {
    const u = await this.usuarios.findOne({
      where: { id },
      relations: { features: true, empresas: true },
      select: { empresas: { id: true, razonSocial: true } },
    });
    // Un usuario de otras empresas responde igual que uno inexistente.
    if (!u || !this.visible(u, alcance))
      throw new NotFoundException('Usuario no encontrado');
    return u;
  }

  private visible(u: Usuario, alcance: number[] | null) {
    if (!alcance) return true;
    return (
      u.perfil !== Perfil.ADMINISTRADOR &&
      u.empresas.some((e) => alcance.includes(e.id))
    );
  }

  /** Reglas del ADMIN_EMPRESA al asignar perfil, empresas y features. */
  private validarGestor(
    g: UsuarioSesion,
    dto: Partial<CrearUsuarioDto>,
    alcance: number[],
  ) {
    if (dto.perfil === Perfil.ADMINISTRADOR)
      throw new ForbiddenException(
        'Solo el administrador general puede crear administradores generales',
      );
    if (dto.empresaIds?.some((id) => !alcance.includes(id)))
      throw new ForbiddenException('Solo puedes asignar tus propias empresas');
    if (dto.featureCodigos?.some((c) => !g.features.includes(c)))
      throw new ForbiddenException(
        'Solo puedes otorgar los módulos que tú tienes habilitados',
      );
  }

  async crear(g: UsuarioSesion, dto: CrearUsuarioDto) {
    const alcance = this.alcance(g);
    if (alcance) {
      this.validarGestor(g, dto, alcance);
      if (!dto.empresaIds?.length)
        throw new BadRequestException('Asigna al menos una de tus empresas');
    }
    const email = dto.email.trim().toLowerCase();
    if (await this.usuarios.existsBy({ email }))
      throw new ConflictException('Ya existe un usuario con ese correo');
    const id = await this.ds.transaction(async (m) => {
      const { password, empresaIds, featureCodigos, ...datos } = dto;
      const u = await m.save(
        m.create(Usuario, {
          ...datos,
          email,
          passwordHash: await hash(password, 10),
        }),
      );
      await this.asignar(
        m.getRepository(Usuario),
        u.id,
        empresaIds,
        featureCodigos,
        g.id,
      );
      return u.id;
    });
    return this.obtener(g, id);
  }

  async actualizar(g: UsuarioSesion, id: number, dto: ActualizarUsuarioDto) {
    const alcance = this.alcance(g);
    const actual = await this.cargarVisible(id, alcance);
    if (id === g.id && dto.activo === false)
      throw new BadRequestException('No puedes desactivar tu propio usuario');
    if (id === g.id && dto.perfil && dto.perfil !== actual.perfil)
      throw new BadRequestException('No puedes cambiar tu propio perfil');
    if (alcance) {
      this.validarGestor(g, dto, alcance);
      // Quien también trabaja con otras empresas es compartido: su cuenta (datos, clave,
      // módulos, estado) la gestiona el administrador general; aquí solo el acceso a las tuyas.
      const compartido = actual.empresas.some((e) => !alcance.includes(e.id));
      const { empresaIds, ...resto } = dto;
      if (compartido && Object.values(resto).some((v) => v !== undefined))
        throw new ForbiddenException(
          'Este usuario también trabaja con otras empresas: solo puedes cambiar su acceso a las tuyas',
        );
      // Las empresas fuera de tu alcance se conservan; los módulos que tú no tienes, también.
      if (empresaIds)
        dto.empresaIds = [
          ...actual.empresas
            .map((e) => e.id)
            .filter((e) => !alcance.includes(e)),
          ...empresaIds,
        ];
      if (dto.featureCodigos)
        dto.featureCodigos = [
          ...actual.features
            .map((uf) => uf.feature.codigo)
            .filter((c) => !g.features.includes(c)),
          ...dto.featureCodigos,
        ];
    }
    await this.ds.transaction(async (m) => {
      const { password, empresaIds, featureCodigos, email, ...datos } = dto;
      const cambios: Partial<Usuario> = { ...datos };
      if (email) {
        const nuevo = email.trim().toLowerCase();
        const otro = await m.findOneBy(Usuario, { email: nuevo });
        if (otro && otro.id !== id)
          throw new ConflictException('Ya existe un usuario con ese correo');
        cambios.email = nuevo;
      }
      if (password) cambios.passwordHash = await hash(password, 10);
      if (Object.keys(cambios).length) await m.update(Usuario, id, cambios);
      await this.asignar(
        m.getRepository(Usuario),
        id,
        empresaIds,
        featureCodigos,
        g.id,
      );
    });
    // Si el gestor le quitó todas sus empresas, el usuario sale de su alcance: responde null.
    try {
      return await this.obtener(g, id);
    } catch (e) {
      if (alcance && e instanceof NotFoundException) return null;
      throw e;
    }
  }

  /** Reemplaza empresas y/o features asignadas (solo si vienen en el DTO). */
  private async asignar(
    repo: Repository<Usuario>,
    id: number,
    empresaIds: number[] | undefined,
    featureCodigos: string[] | undefined,
    adminId: number,
  ) {
    const m = repo.manager;
    if (empresaIds) {
      const u = await repo.findOneOrFail({
        where: { id },
        relations: { empresas: true },
      });
      u.empresas = empresaIds.length
        ? await m.findBy(Empresa, { id: In(empresaIds) })
        : [];
      await repo.save(u);
    }
    if (featureCodigos) {
      await m.delete(UsuarioFeature, { usuario: { id } });
      const features = featureCodigos.length
        ? await m.findBy(Feature, { codigo: In(featureCodigos) })
        : [];
      await m.save(
        features.map((feature) =>
          m.create(UsuarioFeature, {
            usuario: { id },
            feature,
            otorgadoPor: { id: adminId },
          }),
        ),
      );
    }
  }

  private dto(u: Usuario, alcance: number[] | null) {
    return {
      id: u.id,
      nombres: u.nombres,
      apellidos: u.apellidos,
      email: u.email,
      cedula: u.cedula,
      telefono: u.telefono,
      cargo: u.cargo,
      licencia: u.licencia,
      perfil: u.perfil,
      activo: u.activo,
      ultimoAcceso: u.ultimoAcceso,
      empresas: u.empresas
        .filter((e) => !alcance || alcance.includes(e.id))
        .map((e) => ({
          id: e.id,
          razonSocial: e.razonSocial,
        })),
      featureCodigos: u.features.map((uf) => uf.feature.codigo),
      /** Trabaja también con empresas que el gestor no administra. */
      compartido: !!alcance && u.empresas.some((e) => !alcance.includes(e.id)),
    };
  }
}
