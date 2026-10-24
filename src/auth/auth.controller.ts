import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Publico,
  UsuarioActual,
  type UsuarioSesion,
} from '../common/decorators';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail({}, { message: 'Correo electrónico no válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}

class ConsentimientosDto {
  /** true = acepta los términos y la política de privacidad vigentes. */
  @IsOptional() @IsBoolean() terminos?: boolean;
  /** true = autoriza enviar fotos y audio al proveedor de IA; false = lo retira. */
  @IsOptional() @IsBoolean() ia?: boolean;
}

class EliminarCuentaDto {
  @IsString()
  @IsNotEmpty({ message: 'Confirma con tu contraseña' })
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  me(@UsuarioActual() u: UsuarioSesion) {
    return this.auth.perfil(u.id);
  }

  @Post('consentimientos')
  @HttpCode(200)
  consentimientos(
    @UsuarioActual() u: UsuarioSesion,
    @Body() dto: ConsentimientosDto,
  ) {
    return this.auth.consentimientos(u.id, dto);
  }

  @Post('eliminar-cuenta')
  @HttpCode(200)
  eliminarCuenta(
    @UsuarioActual() u: UsuarioSesion,
    @Body() dto: EliminarCuentaDto,
  ) {
    return this.auth.eliminarCuenta(u.id, dto.password);
  }
}
