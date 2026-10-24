import { Controller, Get, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Publico } from '../common/decorators';
import {
  DatosTitular,
  eliminarCuenta,
  privacidad,
  soporte,
  terminos,
  VERSION_LEGAL,
} from './legal.textos';

/**
 * Páginas públicas que piden App Store y Google Play (privacidad, soporte, eliminación de cuenta)
 * y los términos que la app hace aceptar. Se sirven fuera del prefijo /api (ver main.ts).
 */
@Publico()
@Controller()
export class LegalController {
  constructor(private readonly config: ConfigService) {}

  private get datos(): DatosTitular {
    return {
      titular: this.config.get('LEGAL_TITULAR') || 'SST Prevención',
      identificacion: this.config.get('LEGAL_IDENTIFICACION') || '',
      email: this.config.get('LEGAL_EMAIL') || '',
      ciudad: this.config.get('LEGAL_CIUDAD') || 'Ecuador',
    };
  }

  @Get('terminos')
  @Header('Content-Type', 'text/html; charset=utf-8')
  terminos() {
    return terminos(this.datos);
  }

  @Get('privacidad')
  @Header('Content-Type', 'text/html; charset=utf-8')
  privacidad() {
    return privacidad(this.datos);
  }

  @Get('soporte')
  @Header('Content-Type', 'text/html; charset=utf-8')
  soporte() {
    return soporte(this.datos);
  }

  @Get('eliminar-cuenta')
  @Header('Content-Type', 'text/html; charset=utf-8')
  eliminarCuenta() {
    return eliminarCuenta(this.datos);
  }

  /** Versión vigente y enlaces, para la app (bajo /api). */
  @Get('api/legal')
  info() {
    return {
      version: VERSION_LEGAL,
      contacto: this.datos.email || null,
      rutas: ['/terminos', '/privacidad', '/soporte', '/eliminar-cuenta'],
    };
  }
}
