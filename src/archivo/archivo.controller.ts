import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UsuarioActual, type UsuarioSesion } from '../common/decorators';
import { ArchivoService } from './archivo.service';

@Controller()
export class ArchivoController {
  constructor(private readonly archivo: ArchivoService) {}

  /** Todo lo registrado de la empresa (según los módulos del usuario), lo más reciente primero. */
  @Get('empresas/:empresaId/archivo')
  listar(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.archivo.listar(u, empresaId);
  }
}
