import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { Not, Repository } from 'typeorm';
import { UsuarioSesion } from '../common/decorators';
import { Perfil } from '../common/enums';
import { Feature } from '../features/feature.entity';
import { UsuarioFeature } from '../features/usuario-feature.entity';
import { VERSION_LEGAL } from '../legal/legal.textos';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Feature) private readonly features: Repository<Feature>,
    @InjectRepository(UsuarioFeature)
    private readonly usuarioFeatures: Repository<UsuarioFeature>,
  ) {}

  async login(email: string, password: string) {
    const usuario = await this.usuarios
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
    if (
      !usuario ||
      !usuario.activo ||
      !(await compare(password, usuario.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    await this.usuarios.update(usuario.id, { ultimoAcceso: new Date() });
    const token = await this.jwt.signAsync({ sub: usuario.id });
    return { token, usuario: await this.perfil(usuario.id) };
  }

  /** Features efectivas: el ADMINISTRADOR tiene todas las activas. */
  private async featuresDe(usuario: Usuario): Promise<Feature[]> {
    if (usuario.perfil === Perfil.ADMINISTRADOR) {
      return this.features.find({
        where: { activo: true },
        order: { orden: 'ASC' },
      });
    }
    return usuario.features
      .map((uf) => uf.feature)
      .filter((f) => f.activo)
      .sort((a, b) => a.orden - b.orden);
  }

  private cargar(id: number) {
    return this.usuarios.findOne({
      where: { id },
      relations: { features: true, empresas: true },
      select: { empresas: { id: true } },
    });
  }

  /** Usado por el guard en cada request. */
  async sesion(id: number): Promise<UsuarioSesion | null> {
    const u = await this.cargar(id);
    if (!u || !u.activo) return null;
    return {
      id: u.id,
      email: u.email,
      perfil: u.perfil,
      features: (await this.featuresDe(u)).map((f) => f.codigo),
      empresaIds: u.empresas.map((e) => e.id),
      consentimientoIa: u.consentimientoIa,
    };
  }

  async perfil(id: number) {
    const u = await this.cargar(id);
    if (!u) throw new UnauthorizedException();
    const features = await this.featuresDe(u);
    return {
      id: u.id,
      nombres: u.nombres,
      apellidos: u.apellidos,
      email: u.email,
      cedula: u.cedula,
      cargo: u.cargo,
      licencia: u.licencia,
      perfil: u.perfil,
      // La app pide aceptar términos y privacidad cuando cambia la versión vigente.
      legal: {
        version: VERSION_LEGAL,
        aceptada: u.terminosVersion === VERSION_LEGAL,
        aceptadaEn: u.terminosAceptadosEn,
      },
      consentimientoIa: u.consentimientoIa,
      consentimientoIaEn: u.consentimientoIaEn,
      features: features.map(
        ({ codigo, nombre, icono, ruta, enMenu, orden }) => ({
          codigo,
          nombre,
          icono,
          ruta,
          enMenu,
          orden,
        }),
      ),
    };
  }

  /** Registra la aceptación de términos y/o el consentimiento (o su retiro) para la IA. */
  async consentimientos(id: number, dto: { terminos?: boolean; ia?: boolean }) {
    const ahora = new Date();
    await this.usuarios.update(id, {
      ...(dto.terminos && {
        terminosVersion: VERSION_LEGAL,
        terminosAceptadosEn: ahora,
      }),
      ...(dto.ia !== undefined && {
        consentimientoIa: dto.ia,
        consentimientoIaEn: ahora,
      }),
    });
    return this.perfil(id);
  }

  /**
   * Eliminación de cuenta pedida por el propio usuario (exigida por App Store y Google Play).
   * Los reportes que creó son de la empresa y se conservan; la cuenta se anonimiza y desactiva.
   */
  async eliminarCuenta(id: number, password: string) {
    const u = await this.usuarios
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .leftJoinAndSelect('u.empresas', 'e')
      .where('u.id = :id', { id })
      .getOne();
    if (!u || !(await compare(password, u.passwordHash)))
      throw new UnauthorizedException('La contraseña no es correcta');
    if (u.perfil === Perfil.ADMINISTRADOR) {
      const otros = await this.usuarios.count({
        where: { perfil: Perfil.ADMINISTRADOR, activo: true, id: Not(id) },
      });
      if (!otros)
        throw new BadRequestException(
          'Eres el único administrador activo. Crea otro administrador antes de eliminar tu cuenta.',
        );
    }
    await this.usuarioFeatures.delete({ usuario: { id } });
    u.empresas = [];
    await this.usuarios.save(u);
    await this.usuarios.update(id, {
      nombres: 'Usuario',
      apellidos: 'eliminado',
      email: `eliminado-${id}-${Date.now()}@cuenta-eliminada.invalid`,
      cedula: null,
      telefono: null,
      cargo: null,
      licencia: null,
      activo: false,
      passwordHash: await hash(randomBytes(32).toString('hex'), 10),
      consentimientoIa: false,
      consentimientoIaEn: null,
    });
    return { ok: true };
  }
}
