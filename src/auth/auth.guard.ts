import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
  esAdmin,
  esGestor,
  FEATURES,
  GESTION,
  PUBLICO,
  SOLO_ADMIN,
  UsuarioSesion,
} from '../common/decorators';
import { AuthService } from './auth.service';

/** Guard global: valida el JWT, carga la sesión y aplica @SoloAdmin / @Gestion / @RequiereFeature. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLICO, targets))
      return true;

    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: UsuarioSesion }>();
    const [tipo, token] = req.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token)
      throw new UnauthorizedException('Sesión requerida');

    let sub: number;
    try {
      ({ sub } = await this.jwt.verifyAsync<{ sub: number }>(token));
    } catch {
      throw new UnauthorizedException('Sesión expirada o inválida');
    }
    const sesion = await this.auth.sesion(sub);
    if (!sesion) throw new UnauthorizedException('Usuario inactivo');
    req.user = sesion;

    if (esAdmin(sesion)) return true;
    if (this.reflector.getAllAndOverride<boolean>(SOLO_ADMIN, targets)) {
      throw new ForbiddenException(
        'Solo el administrador puede realizar esta acción',
      );
    }
    if (
      this.reflector.getAllAndOverride<boolean>(GESTION, targets) &&
      !esGestor(sesion)
    ) {
      throw new ForbiddenException(
        'Solo un administrador puede realizar esta acción',
      );
    }
    const requeridas = this.reflector.getAllAndOverride<string[]>(
      FEATURES,
      targets,
    );
    if (
      requeridas?.length &&
      !requeridas.some((f) => sesion.features.includes(f))
    ) {
      throw new ForbiddenException('No tienes acceso a esta funcionalidad');
    }
    return true;
  }
}
