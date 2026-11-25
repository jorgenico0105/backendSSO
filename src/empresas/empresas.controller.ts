import {
  Body,
  Controller,
  ForbiddenException,
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
  esAdmin,
  Gestion,
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

  /** El ADMIN_EMPRESA edita los datos de sus empresas, pero no las activa ni desactiva. */
  @Gestion()
  @Patch(':id')
  actualizar(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEmpresaDto,
  ) {
    this.svc.asegurarAcceso(u, id);
    if (!esAdmin(u) && dto.activo !== undefined)
      throw new ForbiddenException(
        'Solo el administrador general activa o desactiva empresas',
      );
    return this.svc.actualizar(id, dto);
  }

  /** Baja lógica. */
  @SoloAdmin()
  @Delete(':id')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.svc.actualizar(id, { activo: false });
  }

  @Gestion()
  @Post(':id/logo')
  @UseInterceptors(
    FileInterceptor('logo', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  subirLogo(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    this.svc.asegurarAcceso(u, id);
    return this.svc.subirLogo(id, logo);
  }

  // --- Áreas (y puestos): el ADMIN_EMPRESA, solo en sus empresas ---

  @Gestion()
  @Post(':id/areas')
  crearArea(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearAreaDto,
  ) {
    this.svc.asegurarAcceso(u, id);
    return this.svc.crearArea(id, dto);
  }

  @Gestion()
  @Patch(':id/areas/:areaId')
  actualizarArea(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Param('areaId', ParseIntPipe) areaId: number,
    @Body() dto: ActualizarAreaDto,
  ) {
    this.svc.asegurarAcceso(u, id);
    return this.svc.actualizarArea(id, areaId, dto);
  }

  @Gestion()
  @Delete(':id/areas/:areaId')
  eliminarArea(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Param('areaId', ParseIntPipe) areaId: number,
  ) {
    this.svc.asegurarAcceso(u, id);
    return this.svc.eliminarArea(id, areaId);
  }

  // --- Puestos ---

  @Gestion()
  @Post(':id/puestos')
  crearPuesto(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearPuestoDto,
  ) {
    this.svc.asegurarAcceso(u, id);
    return this.svc.crearPuesto(id, dto);
  }

  @Gestion()
  @Patch(':id/puestos/:puestoId')
  actualizarPuesto(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Param('puestoId', ParseIntPipe) puestoId: number,
    @Body() dto: ActualizarPuestoDto,
  ) {
    this.svc.asegurarAcceso(u, id);
    return this.svc.actualizarPuesto(id, puestoId, dto);
  }

  @Gestion()
  @Delete(':id/puestos/:puestoId')
  eliminarPuesto(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Param('puestoId', ParseIntPipe) puestoId: number,
  ) {
    this.svc.asegurarAcceso(u, id);
    return this.svc.eliminarPuesto(id, puestoId);
  }
}
