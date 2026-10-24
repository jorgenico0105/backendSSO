import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: el webhook del servicio postural se verifica con la firma del cuerpo crudo.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  // El resultado de un video llega por webhook con las miniaturas de los fotogramas.
  app.useBodyParser('json', { limit: '25mb' });
  // Las páginas legales (/terminos, /privacidad, /soporte, /eliminar-cuenta) van sin prefijo.
  app.setGlobalPrefix('api', {
    exclude: [
      'terminos',
      'privacidad',
      'soporte',
      'eliminar-cuenta',
      'api/legal',
    ],
  });
  // La app móvil (Expo nativo y web) consume la API desde otros orígenes.
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT ?? 3000;
  // 0.0.0.0 para que un teléfono en la misma red Wi-Fi pueda conectarse.
  await app.listen(port, '0.0.0.0');
  console.log(`API SST Prevención en http://localhost:${port}/api`);
}
void bootstrap();
