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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  SoloAdmin,
  UsuarioActual,
  type UsuarioSesion,
} from '../common/decorators';
import {
  ActualizarAreaDto,
  ActualizarEmpresaDto,
  ActualizarPuestoDto,
  CrearAreaDto,
  CrearEmpresaDto,
  CrearPuestoDto,
} from './dto/empresa.dto';
import { EmpresasService } from './empresas.service';

@Controller('empresas')
export class EmpresasController {
  constructor(private readonly svc: EmpresasService) {}

  /** Empresas asignadas al usuario (todas si es administrador). `?inactivas=true` solo para admin. */
  @Get()
  listar(
    @UsuarioActual() u: UsuarioSesion,
    @Query('inactivas', new ParseBoolPipe({ optional: true }))
    inactivas?: boolean,
  ) {
    return this.svc.listar(u, inactivas);
  }

  @Get(':id')
  obtener(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.obtener(u, id);
  }

  @SoloAdmin()
  @Post()
  crear(@Body() dto: CrearEmpresaDto, @UsuarioActual() u: UsuarioSesion) {
    return this.svc.crear(dto, u.id);
  }

  @SoloAdmin()
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEmpresaDto,
  ) {
    return this.svc.actualizar(id, dto);
  }

  /** Baja lógica. */
  @SoloAdmin()
  @Delete(':id')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.svc.actualizar(id, { activo: false });
  }

  @SoloAdmin()
  @Post(':id/logo')
  @UseInterceptors(
    FileInterceptor('logo', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  subirLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    console.log('HereQ');
    return this.svc.subirLogo(id, logo);
  }

  // --- Áreas ---

  @SoloAdmin()
  @Post(':id/areas')
  crearArea(@Param('id', ParseIntPipe) id: number, @Body() dto: CrearAreaDto) {
    return this.svc.crearArea(id, dto);
  }

  @SoloAdmin()
  @Patch(':id/areas/:areaId')
  actualizarArea(
    @Param('id', ParseIntPipe) id: number,
    @Param('areaId', ParseIntPipe) areaId: number,
    @Body() dto: ActualizarAreaDto,
  ) {
    return this.svc.actualizarArea(id, areaId, dto);
  }

  @SoloAdmin()
  @Delete(':id/areas/:areaId')
  eliminarArea(
    @Param('id', ParseIntPipe) id: number,
    @Param('areaId', ParseIntPipe) areaId: number,
  ) {
    return this.svc.eliminarArea(id, areaId);
  }

  // --- Puestos ---

  @SoloAdmin()
  @Post(':id/puestos')
  crearPuesto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearPuestoDto,
  ) {
    return this.svc.crearPuesto(id, dto);
  }

  @SoloAdmin()
  @Patch(':id/puestos/:puestoId')
  actualizarPuesto(
    @Param('id', ParseIntPipe) id: number,
    @Param('puestoId', ParseIntPipe) puestoId: number,
    @Body() dto: ActualizarPuestoDto,
  ) {
    return this.svc.actualizarPuesto(id, puestoId, dto);
  }

  @SoloAdmin()
  @Delete(':id/puestos/:puestoId')
  eliminarPuesto(
    @Param('id', ParseIntPipe) id: number,
    @Param('puestoId', ParseIntPipe) puestoId: number,
  ) {
    return this.svc.eliminarPuesto(id, puestoId);
  }
}
