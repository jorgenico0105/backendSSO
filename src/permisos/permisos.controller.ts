import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  RequiereFeature,
  UsuarioActual,
  type UsuarioSesion,
} from '../common/decorators';
import { FeatureCodigo } from '../common/enums';
import { ActualizarPermisoDto, CrearPermisoDto } from './dto/permiso.dto';
import { PermisosService } from './permisos.service';

@RequiereFeature(FeatureCodigo.PERMISOS)
@Controller()
export class PermisosController {
  constructor(private readonly svc: PermisosService) {}

  @Get('empresas/:empresaId/permisos')
  listar(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.svc.listar(u, empresaId);
  }

  @Post('empresas/:empresaId/permisos')
  crear(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CrearPermisoDto,
  ) {
    return this.svc.crear(u, empresaId, dto);
  }

  @Get('permisos/:id')
  obtener(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.obtener(u, id);
  }

  @Patch('permisos/:id')
  actualizar(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPermisoDto,
  ) {
    return this.svc.actualizar(u, id, dto);
  }

  @Post('permisos/:id/autorizar')
  @HttpCode(200)
  autorizar(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.autorizar(u, id);
  }

  @Post('permisos/:id/cerrar')
  @HttpCode(200)
  cerrar(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.cerrar(u, id);
  }
}
