import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  RequiereFeature,
  UsuarioActual,
  type UsuarioSesion,
} from '../common/decorators';
import { exigirConsentimientoIa } from '../common/consentimiento';
import { FeatureCodigo } from '../common/enums';
import { AccidentesService } from './accidentes.service';
import { ActualizarInformeDto, ContextoAnalisisDto } from './dto/analisis.dto';

/** Investigación de accidentes e incidentes (RSE-04-00-02) por dictado de voz. */
@RequiereFeature(FeatureCodigo.ACCIDENTES)
@Controller()
export class AccidentesController {
  constructor(private readonly svc: AccidentesService) {}

  /** Dictado → informe; lo que no se dijo queda en `faltantes`. */
  @Post('empresas/:empresaId/accidentes/evaluar')
  @UseInterceptors(
    FileInterceptor('audio', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  evaluar(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @UploadedFile() audio: Express.Multer.File,
    @Body() dto: ContextoAnalisisDto,
  ) {
    exigirConsentimientoIa(u);
    return this.svc.evaluar(u, empresaId, audio, dto);
  }

  @Get('empresas/:empresaId/accidentes')
  listar(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.svc.listar(u, empresaId);
  }

  @Get('accidentes/:id')
  obtener(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.obtener(u, id);
  }

  @Patch('accidentes/:id')
  actualizar(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarInformeDto,
  ) {
    return this.svc.actualizar(u, id, dto);
  }
}
