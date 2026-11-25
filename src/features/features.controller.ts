import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gestion } from '../common/decorators';
import { Feature } from './feature.entity';

@Gestion()
@Controller('features')
export class FeaturesController {
  constructor(
    @InjectRepository(Feature) private readonly features: Repository<Feature>,
  ) {}

  /** Catálogo para asignar accesos desde el panel de administración. */
  @Get()
  listar() {
    return this.features.find({ order: { orden: 'ASC' } });
  }
}
