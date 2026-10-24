import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { DataSource, In, Repository } from 'typeorm';
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

  async listar() {
    const lista = await this.usuarios.find({
      relations: { features: true, empresas: true },
      select: { empresas: { id: true, razonSocial: true } },
      order: { nombres: 'ASC' },
    });
    return lista.map((u) => this.dto(u));
  }

  async obtener(id: number) {
    const u = await this.usuarios.findOne({
      where: { id },
      relations: { features: true, empresas: true },
      select: { empresas: { id: true, razonSocial: true } },
    });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return this.dto(u);
  }

  async crear(dto: CrearUsuarioDto, adminId: number) {
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
        adminId,
      );
      return u.id;
    });
    return this.obtener(id);
  }

  async actualizar(id: number, dto: ActualizarUsuarioDto, adminId: number) {
    if (!(await this.usuarios.existsBy({ id })))
      throw new NotFoundException('Usuario no encontrado');
    if (id === adminId && dto.activo === false)
      throw new BadRequestException('No puedes desactivar tu propio usuario');
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
        adminId,
      );
    });
    return this.obtener(id);
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

  private dto(u: Usuario) {
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
      empresas: u.empresas.map((e) => ({
        id: e.id,
        razonSocial: e.razonSocial,
      })),
      featureCodigos: u.features.map((uf) => uf.feature.codigo),
    };
  }
}
