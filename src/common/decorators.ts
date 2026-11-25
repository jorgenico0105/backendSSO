import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { FeatureCodigo, Perfil } from './enums';

export const PUBLICO = 'publico';
export const SOLO_ADMIN = 'soloAdmin';
export const GESTION = 'gestion';
export const FEATURES = 'features';

/** Sesión que el JwtAuthGuard adjunta a cada request autenticado. */
export interface UsuarioSesion {
  id: number;
  email: string;
  perfil: Perfil;
  features: string[];
  empresaIds: number[];
  /** Si aceptó enviar fotos y audio al proveedor de IA. */
  consentimientoIa: boolean;
}

export const esAdmin = (u: UsuarioSesion) => u.perfil === Perfil.ADMINISTRADOR;

/** Administrador general o de empresa (este último, limitado a sus empresas). */
export const esGestor = (u: UsuarioSesion) =>
  u.perfil === Perfil.ADMINISTRADOR || u.perfil === Perfil.ADMIN_EMPRESA;

/** El perfil USUARIO solo ve los registros que creó; los administradores, todo lo de sus empresas. */
export const soloPropios = (u: UsuarioSesion) => !esGestor(u);

/** Ruta sin autenticación. */
export const Publico = () => SetMetadata(PUBLICO, true);

/** Solo perfil ADMINISTRADOR. */
export const SoloAdmin = () => SetMetadata(SOLO_ADMIN, true);

/** ADMINISTRADOR o ADMIN_EMPRESA; el servicio debe limitar al segundo a sus empresas. */
export const Gestion = () => SetMetadata(GESTION, true);

/** Requiere al menos una de estas features (el administrador siempre pasa). */
export const RequiereFeature = (...codigos: FeatureCodigo[]) =>
  SetMetadata(FEATURES, codigos);

export const UsuarioActual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioSesion =>
    ctx.switchToHttp().getRequest<{ user: UsuarioSesion }>().user,
);
