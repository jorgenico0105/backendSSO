import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feature } from './feature.entity';
import { FeaturesController } from './features.controller';
import { UsuarioFeature } from './usuario-feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Feature, UsuarioFeature])],
  controllers: [FeaturesController],
})
export class FeaturesModule {}
