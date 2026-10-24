import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  esAdmin,
  SoloAdmin,
  UsuarioActual,
  type UsuarioSesion,
} from '../common/decorators';
import {
  ActualizarClasificacionDto,
  CrearClasificacionDto,
} from './clasificacion.dto';
import { ClasificacionesService } from './clasificaciones.service';

@Controller('clasificaciones')
export class ClasificacionesController {
  constructor(private readonly svc: ClasificacionesService) {}

  /** Catálogo activo para la app. `?inactivas=true` solo para el administrador. */
  @Get()
  listar(
    @UsuarioActual() u: UsuarioSesion,
    @Query('inactivas', new ParseBoolPipe({ optional: true }))
    inactivas?: boolean,
  ) {
    return this.svc.listar(!!inactivas && esAdmin(u));
  }

  @SoloAdmin()
  @Post()
  crear(@Body() dto: CrearClasificacionDto) {
    return this.svc.crear(dto);
  }

  @SoloAdmin()
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarClasificacionDto,
  ) {
    return this.svc.actualizar(id, dto);
  }

  @SoloAdmin()
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.svc.eliminar(id);
  }
}
