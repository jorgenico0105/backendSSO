import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  type RawBodyRequest,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import {
  Publico,
  RequiereFeature,
  UsuarioActual,
  type UsuarioSesion,
} from '../common/decorators';
import { exigirConsentimientoIa } from '../common/consentimiento';
import { FeatureCodigo } from '../common/enums';
import {
  ActualizarMatrizDto,
  AnalizarErgoDto,
  AnalizarImagenDto,
  ContextoAnalisisDto,
  RegistrarReporteDto,
} from './dto/analisis.dto';
import { ErgoService } from './ergo.service';
import { ReportesService } from './reportes.service';
import { VozService } from './voz.service';

const MB = 1024 * 1024;

@Controller()
export class AnalisisController {
  constructor(
    private readonly reportes: ReportesService,
    private readonly ergo: ErgoService,
    private readonly voz: VozService,
  ) {}

  // ------------------- Actos y condiciones (imagen) -------------------

  /** Sube la foto a Cloudinary y la analiza con el agente (aún sin registrar). */
  @RequiereFeature(FeatureCodigo.ACTOS)
  @Post('empresas/:empresaId/reportes/analizar')
  @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: 15 * MB } }))
  analizarImagen(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @UploadedFile() imagen: Express.Multer.File,
    @Body() dto: AnalizarImagenDto,
  ) {
    exigirConsentimientoIa(u);
    return this.reportes.analizar(u, empresaId, imagen, dto);
  }

  @RequiereFeature(FeatureCodigo.ACTOS)
  @Patch('reportes/:id/registrar')
  registrar(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarReporteDto,
  ) {
    return this.reportes.registrar(u, id, dto);
  }

  @RequiereFeature(FeatureCodigo.HUB, FeatureCodigo.ACTOS)
  @Get('empresas/:empresaId/reportes')
  listarReportes(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query('limite', new DefaultValuePipe(50), ParseIntPipe) limite: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.reportes.listar(u, empresaId, limite, desde, hasta);
  }

  @Get('reportes/:id')
  obtenerReporte(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reportes.obtener(u, id);
  }

  // ---------------- Ergonomía (servicio de análisis postural) ----------------

  /**
   * Imagen: responde la evaluación terminada. Video: responde el registro en PROCESANDO;
   * la app consulta GET /ergo/:id hasta que pase a ANALIZADO o ERROR.
   */
  @RequiereFeature(FeatureCodigo.ERGO)
  @Post('empresas/:empresaId/ergo')
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { fileSize: 200 * MB } }),
  )
  analizarErgo(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @UploadedFile() archivo: Express.Multer.File,
    @Body() dto: AnalizarErgoDto,
  ) {
    return this.ergo.analizar(u, empresaId, archivo, dto);
  }

  /** Lo llama el servicio postural al terminar un video (firmado con ERGO_WEBHOOK_SECRET). */
  @Publico()
  @Post('ergo/webhook')
  @HttpCode(200)
  webhookErgo(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-webhook-timestamp') timestamp?: string,
    @Headers('x-webhook-firma') firma?: string,
  ) {
    return this.ergo.webhook(req.rawBody, timestamp, firma);
  }

  @RequiereFeature(FeatureCodigo.ERGO)
  @Get('empresas/:empresaId/ergo')
  listarErgo(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.ergo.listar(u, empresaId);
  }

  @RequiereFeature(FeatureCodigo.ERGO)
  @Get('ergo/:id')
  obtenerErgo(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ergo.obtener(u, id);
  }

  // ------------- Voz (matriz de riesgos F-PSSO-IMEC-02) -------------

  /** Dictado corto (descripción de un reporte). No se guarda. */
  @RequiereFeature(FeatureCodigo.ACTOS, FeatureCodigo.VOZ)
  @Post('voz/transcribir')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 25 * MB } }))
  async transcribir(
    @UsuarioActual() u: UsuarioSesion,
    @UploadedFile() audio: Express.Multer.File,
  ) {
    exigirConsentimientoIa(u);
    return { texto: await this.voz.transcribir(audio) };
  }

  /** Catálogo de factores y peligros para agregar peligros a mano. */
  @RequiereFeature(FeatureCodigo.VOZ)
  @Get('voz/catalogo')
  catalogoVoz() {
    return this.voz.catalogo();
  }

  /** Dictado → matriz del área/puesto; lo que no se dijo queda en `faltantes`. */
  @RequiereFeature(FeatureCodigo.VOZ)
  @Post('empresas/:empresaId/voz/evaluar')
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 25 * MB } }))
  evaluarVoz(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @UploadedFile() audio: Express.Multer.File,
    @Body() dto: ContextoAnalisisDto,
  ) {
    exigirConsentimientoIa(u);
    return this.voz.evaluar(u, empresaId, audio, dto);
  }

  @RequiereFeature(FeatureCodigo.VOZ)
  @Get('empresas/:empresaId/voz')
  listarVoz(
    @UsuarioActual() u: UsuarioSesion,
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query('areaId', new ParseIntPipe({ optional: true })) areaId?: number,
  ) {
    return this.voz.listar(u, empresaId, areaId);
  }

  @RequiereFeature(FeatureCodigo.VOZ)
  @Get('voz/:id')
  obtenerMatriz(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.voz.obtener(u, id);
  }

  @RequiereFeature(FeatureCodigo.VOZ)
  @Patch('voz/:id')
  actualizarMatriz(
    @UsuarioActual() u: UsuarioSesion,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarMatrizDto,
  ) {
    return this.voz.actualizar(u, id, dto);
  }
}
