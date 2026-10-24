import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasificacionesModule } from '../clasificaciones/clasificaciones.module';
import { EmpresasModule } from '../empresas/empresas.module';
import { Usuario } from '../usuarios/usuario.entity';
import { AnalisisController } from './analisis.controller';
import { AnalisisImagen } from './entities/analisis-imagen.entity';
import { AnalisisVideo } from './entities/analisis-video.entity';
import { MatrizRiesgo } from './entities/matriz-riesgo.entity';
import { ErgoService } from './ergo.service';
import { PosturalApiService } from './postural-api.service';
import { ReportesService } from './reportes.service';
import { VozService } from './voz.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalisisImagen,
      AnalisisVideo,
      MatrizRiesgo,
      Usuario,
    ]),
    EmpresasModule,
    ClasificacionesModule,
  ],
  controllers: [AnalisisController],
  providers: [ReportesService, ErgoService, VozService, PosturalApiService],
})
export class AnalisisModule {}
