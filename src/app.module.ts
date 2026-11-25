import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalisisModule } from './analisis/analisis.module';
import { AppController } from './app.controller';
import { ArchivoModule } from './archivo/archivo.module';
import { AuthModule } from './auth/auth.module';
import { ClasificacionesModule } from './clasificaciones/clasificaciones.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ensureDatabase, typeOrmOptions } from './database/typeorm.config';
import { SeedService } from './database/seed.service';
import { EmpresasModule } from './empresas/empresas.module';
import { Feature } from './features/feature.entity';
import { FeaturesModule } from './features/features.module';
import { UsuarioFeature } from './features/usuario-feature.entity';
import { IaModule } from './ia/ia.module';
import { LegalModule } from './legal/legal.module';
import { PermisosModule } from './permisos/permisos.module';
import { Usuario } from './usuarios/usuario.entity';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const env = process.env;
        const sync = config.get('DB_SYNC') === 'true';
        if (sync) await ensureDatabase(env);
        // Producción (DB_SYNC=false): el esquema se crea y actualiza con las migraciones al arrancar.
        return {
          ...typeOrmOptions(env),
          autoLoadEntities: true,
          migrations: [`${__dirname}/database/migrations/*.js`],
          migrationsRun: !sync,
        };
      },
    }),
    TypeOrmModule.forFeature([Feature, Usuario, UsuarioFeature]),
    CloudinaryModule,
    IaModule,
    AuthModule,
    UsuariosModule,
    FeaturesModule,
    EmpresasModule,
    ClasificacionesModule,
    AnalisisModule,
    PermisosModule,
    ArchivoModule,
    LegalModule,
  ],
  controllers: [AppController],
  providers: [SeedService],
})
export class AppModule {}
