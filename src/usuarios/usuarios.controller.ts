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
  SoloAdmin,
  UsuarioActual,
  type UsuarioSesion,
} from '../common/decorators';
import { ActualizarUsuarioDto, CrearUsuarioDto } from './usuario.dto';
import { UsuariosService } from './usuarios.service';

@SoloAdmin()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly svc: UsuariosService) {}

  @Get()
  listar() {
    return this.svc.listar();
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.svc.obtener(id);
  }

  @Post()
  crear(@Body() dto: CrearUsuarioDto, @UsuarioActual() u: UsuarioSesion) {
    return this.svc.crear(dto, u.id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.svc.actualizar(id, dto, u.id);
  }

  /** Baja lógica: el usuario queda inactivo y no puede iniciar sesión. */
  @Delete(':id')
  desactivar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.svc.actualizar(id, { activo: false }, u.id);
  }
}
