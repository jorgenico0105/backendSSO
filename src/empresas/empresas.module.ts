import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalisisImagen } from '../analisis/entities/analisis-imagen.entity';
import { AnalisisVideo } from '../analisis/entities/analisis-video.entity';
import { MatrizRiesgo } from '../analisis/entities/matriz-riesgo.entity';
import { Area } from './area.entity';
import { Empresa } from './empresa.entity';
import { EmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';
import { Puesto } from './puesto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Empresa,
      Area,
      Puesto,
      AnalisisImagen,
      AnalisisVideo,
      MatrizRiesgo,
    ]),
  ],
  controllers: [EmpresasController],
  providers: [EmpresasService],
  exports: [EmpresasService],
})
export class EmpresasModule {}
