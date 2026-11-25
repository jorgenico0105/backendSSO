import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  Gestion,
  UsuarioActual,
  type UsuarioSesion,
} from '../common/decorators';
import { ActualizarUsuarioDto, CrearUsuarioDto } from './usuario.dto';
import { UsuariosService } from './usuarios.service';

/** El ADMIN_EMPRESA solo ve y gestiona usuarios de sus empresas (ver UsuariosService). */
@Gestion()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly svc: UsuariosService) {}

  @Get()
  listar(@UsuarioActual() u: UsuarioSesion) {
    return this.svc.listar(u);
  }

  @Get(':id')
  obtener(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.obtener(u, id);
  }

  @Post()
  crear(@Body() dto: CrearUsuarioDto, @UsuarioActual() u: UsuarioSesion) {
    return this.svc.crear(u, dto);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.svc.actualizar(u, id, dto);
  }

  /** Baja lógica: el usuario queda inactivo y no puede iniciar sesión. */
  @Delete(':id')
  desactivar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.svc.actualizar(u, id, { activo: false });
  }
}
