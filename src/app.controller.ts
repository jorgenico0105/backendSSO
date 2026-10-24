import { Controller, Get } from '@nestjs/common';
import { Publico } from './common/decorators';

@Controller()
export class AppController {
  @Publico()
  @Get('salud')
  salud() {
    return {
      ok: true,
      servicio: 'sst-prevencion-api',
      fecha: new Date().toISOString(),
    };
  }
}
