import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresasModule } from '../empresas/empresas.module';
import { PermisoTrabajo } from './permiso.entity';
import { PermisosController } from './permisos.controller';
import { PermisosService } from './permisos.service';

@Module({
  imports: [TypeOrmModule.forFeature([PermisoTrabajo]), EmpresasModule],
  controllers: [PermisosController],
  providers: [PermisosService],
})
export class PermisosModule {}
