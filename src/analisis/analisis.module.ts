import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasificacionesModule } from '../clasificaciones/clasificaciones.module';
import { EmpresasModule } from '../empresas/empresas.module';
import { Usuario } from '../usuarios/usuario.entity';
import { AccidentesController } from './accidentes.controller';
import { AccidentesService } from './accidentes.service';
import { AnalisisController } from './analisis.controller';
import { AnalisisImagen } from './entities/analisis-imagen.entity';
import { AnalisisVideo } from './entities/analisis-video.entity';
import { InformeAccidente } from './entities/informe-accidente.entity';
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
      InformeAccidente,
      Usuario,
    ]),
    EmpresasModule,
    ClasificacionesModule,
  ],
  controllers: [AnalisisController, AccidentesController],
  providers: [
    ReportesService,
    ErgoService,
    VozService,
    AccidentesService,
    PosturalApiService,
  ],
})
export class AnalisisModule {}
