import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalisisImagen } from '../analisis/entities/analisis-imagen.entity';
import { AnalisisVideo } from '../analisis/entities/analisis-video.entity';
import { InformeAccidente } from '../analisis/entities/informe-accidente.entity';
import { MatrizRiesgo } from '../analisis/entities/matriz-riesgo.entity';
import { EmpresasModule } from '../empresas/empresas.module';
import { PermisoTrabajo } from '../permisos/permiso.entity';
import { ArchivoController } from './archivo.controller';
import { ArchivoService } from './archivo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MatrizRiesgo,
      AnalisisImagen,
      AnalisisVideo,
      PermisoTrabajo,
      InformeAccidente,
    ]),
    EmpresasModule,
  ],
  controllers: [ArchivoController],
  providers: [ArchivoService],
})
export class ArchivoModule {}
