import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clasificacion } from './clasificacion.entity';
import { ClasificacionesController } from './clasificaciones.controller';
import { ClasificacionesService } from './clasificaciones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Clasificacion])],
  controllers: [ClasificacionesController],
  providers: [ClasificacionesService],
  exports: [ClasificacionesService],
})
export class ClasificacionesModule {}
