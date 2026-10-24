import { MigrationInterface, QueryRunner } from 'typeorm';

export class Inicial1792711165197 implements MigrationInterface {
  name = 'Inicial1792711165197';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`clasificaciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`tipo\` enum ('acto', 'condicion') NOT NULL, \`nombre\` varchar(80) NOT NULL, \`medida\` text NULL, \`orden\` int NOT NULL DEFAULT '0', \`activo\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_cb616247f50b1a32468263c254\` (\`tipo\`, \`nombre\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`features\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`codigo\` varchar(40) NOT NULL, \`nombre\` varchar(80) NOT NULL, \`descripcion\` varchar(255) NULL, \`icono\` varchar(60) NOT NULL, \`ruta\` varchar(80) NOT NULL, \`en_menu\` tinyint NOT NULL DEFAULT 1, \`orden\` int NOT NULL DEFAULT '0', \`activo\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_71f6e74ba326549ac3dc6f6bfb\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuario_features\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`usuario_id\` int NULL, \`feature_id\` int NULL, \`otorgado_por_id\` int NULL, UNIQUE INDEX \`IDX_217b4ad2f9f59eb5614d5c937d\` (\`usuario_id\`, \`feature_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuarios\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`nombres\` varchar(100) NOT NULL, \`apellidos\` varchar(100) NOT NULL DEFAULT '', \`email\` varchar(150) NOT NULL, \`password_hash\` varchar(100) NOT NULL, \`cedula\` varchar(13) NULL, \`telefono\` varchar(20) NULL, \`cargo\` varchar(100) NULL, \`licencia\` varchar(60) NULL, \`perfil\` enum ('ADMINISTRADOR', 'USUARIO') NOT NULL DEFAULT 'USUARIO', \`activo\` tinyint NOT NULL DEFAULT 1, \`ultimo_acceso\` datetime NULL, UNIQUE INDEX \`IDX_446adfc18b35418aac32ae0b7b\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`puestos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`nombre\` varchar(120) NOT NULL, \`descripcion\` text NULL, \`funciones\` text NULL, \`ciclo_trabajo\` varchar(60) NULL, \`jornada_horas\` float NULL, \`numero_trabajadores\` int NOT NULL DEFAULT '0', \`nivel_riesgo\` enum ('bajo', 'medio', 'alto', 'critico') NULL, \`epp_requerido\` json NULL, \`activo\` tinyint NOT NULL DEFAULT 1, \`empresa_id\` int NULL, \`area_id\` int NULL, UNIQUE INDEX \`IDX_a3ba1461e9f049300dd2f5be16\` (\`empresa_id\`, \`nombre\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`empresas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`razon_social\` varchar(200) NOT NULL, \`nombre_comercial\` varchar(200) NULL, \`ruc\` varchar(13) NOT NULL, \`tipo_contribuyente\` varchar(60) NULL, \`actividad_economica\` varchar(255) NULL, \`codigo_ciiu\` varchar(20) NULL, \`sector\` varchar(100) NULL, \`fecha_constitucion\` date NULL, \`numero_patronal_iess\` varchar(30) NULL, \`representante_legal_nombre\` varchar(150) NOT NULL, \`representante_legal_cedula\` varchar(13) NOT NULL, \`representante_legal_cargo\` varchar(100) NULL, \`representante_legal_email\` varchar(150) NULL, \`representante_legal_telefono\` varchar(20) NULL, \`responsable_sst_nombre\` varchar(150) NULL, \`responsable_sst_cedula\` varchar(13) NULL, \`responsable_sst_email\` varchar(150) NULL, \`responsable_sst_telefono\` varchar(20) NULL, \`logo_url\` varchar(500) NULL, \`logo_public_id\` varchar(255) NULL, \`slogan\` varchar(255) NULL, \`color_marca\` varchar(9) NULL, \`descripcion\` text NULL, \`mision\` text NULL, \`vision\` text NULL, \`pais\` varchar(80) NOT NULL DEFAULT 'Ecuador', \`provincia\` varchar(80) NULL, \`ciudad\` varchar(80) NULL, \`direccion\` varchar(255) NULL, \`telefono\` varchar(20) NULL, \`celular\` varchar(20) NULL, \`email\` varchar(150) NULL, \`sitio_web\` varchar(200) NULL, \`numero_empleados\` int NOT NULL DEFAULT '0', \`nivel_riesgo\` enum ('bajo', 'medio', 'alto', 'critico') NOT NULL DEFAULT 'medio', \`turno\` varchar(60) NULL, \`horario_laboral\` varchar(30) NULL, \`fecha_ultimo_accidente\` date NULL, \`meta_dias_sin_accidentes\` int NOT NULL DEFAULT '365', \`activo\` tinyint NOT NULL DEFAULT 1, \`creado_por_id\` int NULL, UNIQUE INDEX \`IDX_febfecf7816478e76da58585a5\` (\`ruc\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`areas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`nombre\` varchar(120) NOT NULL, \`descripcion\` text NULL, \`ubicacion\` varchar(200) NULL, \`responsable\` varchar(150) NULL, \`nivel_riesgo\` enum ('bajo', 'medio', 'alto', 'critico') NULL, \`activo\` tinyint NOT NULL DEFAULT 1, \`empresa_id\` int NULL, UNIQUE INDEX \`IDX_a5ec545cae294ff7d1c0769561\` (\`empresa_id\`, \`nombre\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`permisos_trabajo\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`codigo\` varchar(30) NULL, \`estado\` enum ('PENDIENTE', 'AUTORIZADO', 'CERRADO') NOT NULL DEFAULT 'PENDIENTE', \`descripcion\` text NOT NULL, \`fecha_inicio\` datetime NOT NULL, \`fecha_fin\` datetime NOT NULL, \`especiales\` json NOT NULL, \`datos\` json NOT NULL, \`art\` json NULL, \`autorizado_en\` datetime NULL, \`cerrado_en\` datetime NULL, \`empresa_id\` int NULL, \`area_id\` int NULL, \`creado_por_id\` int NULL, \`autorizado_por_id\` int NULL, \`cerrado_por_id\` int NULL, UNIQUE INDEX \`IDX_ee493cb546a854d286e2df8954\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`analisis_imagenes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`codigo\` varchar(30) NULL, \`ia_respuesta\` json NULL, \`ia_modelo\` varchar(60) NULL, \`ia_duracion_ms\` int NULL, \`estado\` enum ('PROCESANDO', 'ANALIZADO', 'REGISTRADO', 'ERROR') NOT NULL DEFAULT 'ANALIZADO', \`imagen_url\` varchar(500) NOT NULL, \`imagen_public_id\` varchar(255) NOT NULL, \`imagen_ancho\` int NULL, \`imagen_alto\` int NULL, \`ia_tipo\` enum ('acto', 'condicion') NULL, \`ia_severidad\` enum ('bajo', 'medio', 'alto', 'critico') NULL, \`ia_clasificaciones\` json NULL, \`ia_resumen\` text NULL, \`ia_medidas\` json NULL, \`ia_confianza\` float NULL, \`tipo\` enum ('acto', 'condicion') NULL, \`clasificaciones\` json NULL, \`severidad\` enum ('bajo', 'medio', 'alto', 'critico') NULL, \`descripcion\` text NULL, \`registrado_en\` datetime NULL, \`error_mensaje\` text NULL, \`empresa_id\` int NULL, \`area_id\` int NULL, \`puesto_id\` int NULL, \`creado_por_id\` int NULL, UNIQUE INDEX \`IDX_f056de49d164a67c194ebd6727\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`analisis_videos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`codigo\` varchar(30) NULL, \`ia_respuesta\` json NULL, \`ia_modelo\` varchar(60) NULL, \`ia_duracion_ms\` int NULL, \`medio\` enum ('video', 'imagen') NOT NULL DEFAULT 'video', \`estado\` enum ('PROCESANDO', 'ANALIZADO', 'REGISTRADO', 'ERROR') NOT NULL DEFAULT 'ANALIZADO', \`job_id\` varchar(64) NULL, \`progreso\` int NOT NULL DEFAULT '0', \`error_mensaje\` text NULL, \`video_url\` varchar(500) NULL, \`video_public_id\` varchar(255) NULL, \`nombre_archivo\` varchar(255) NULL, \`duracion_seg\` float NULL, \`ancho\` int NULL, \`alto\` int NULL, \`fps\` float NULL, \`tamano_bytes\` int NULL, \`frames_analizados\` int NULL, \`puntaje_rula\` int NULL, \`puntaje_reba\` int NULL, \`puntaje_owas\` int NULL, \`nivel_riesgo\` enum ('bajo', 'medio', 'alto', 'critico') NULL, \`diagnostico\` text NULL, \`angulos\` json NULL, \`keyframes\` json NULL, \`hallazgos\` json NULL, \`recomendaciones\` json NULL, \`advertencias\` json NULL, \`puntos\` json NULL, \`confianza\` float NULL, \`empresa_id\` int NULL, \`area_id\` int NULL, \`puesto_id\` int NULL, \`creado_por_id\` int NULL, UNIQUE INDEX \`IDX_e54d728a8316b097f36900c208\` (\`codigo\`), UNIQUE INDEX \`IDX_214976b5776ec821406c56d54c\` (\`job_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`matrices_riesgo\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`codigo\` varchar(30) NULL, \`ia_respuesta\` json NULL, \`ia_modelo\` varchar(60) NULL, \`ia_duracion_ms\` int NULL, \`estado\` enum ('BORRADOR', 'COMPLETA') NOT NULL DEFAULT 'BORRADOR', \`audio_url\` varchar(500) NULL, \`audio_public_id\` varchar(255) NULL, \`transcripcion\` text NOT NULL, \`segmentos\` json NOT NULL, \`cabecera\` json NOT NULL, \`peligros\` json NOT NULL, \`plan_accion\` json NOT NULL, \`faltantes\` json NOT NULL, \`resumen\` text NULL, \`empresa_id\` int NULL, \`area_id\` int NULL, \`puesto_id\` int NULL, \`creado_por_id\` int NULL, UNIQUE INDEX \`IDX_459d40fffc025541e292136145\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuario_empresas\` (\`usuarios_id\` int NOT NULL, \`empresas_id\` int NOT NULL, INDEX \`IDX_5642f570a640ae0de4e0e11a11\` (\`usuarios_id\`), INDEX \`IDX_9eaa23742778b2f07ba7575996\` (\`empresas_id\`), PRIMARY KEY (\`usuarios_id\`, \`empresas_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_features\` ADD CONSTRAINT \`FK_7b386bd447789d09804ed059668\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_features\` ADD CONSTRAINT \`FK_45809942e3aa1f4c2a0658e9079\` FOREIGN KEY (\`feature_id\`) REFERENCES \`features\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_features\` ADD CONSTRAINT \`FK_5560f19917396c7aef6025b0dc2\` FOREIGN KEY (\`otorgado_por_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`puestos\` ADD CONSTRAINT \`FK_e33e1b2eda95db205543b536b05\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`puestos\` ADD CONSTRAINT \`FK_cf5149fbec8304fe32e3e117aff\` FOREIGN KEY (\`area_id\`) REFERENCES \`areas\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` ADD CONSTRAINT \`FK_b55cd48c580f7e83206c164f0ac\` FOREIGN KEY (\`creado_por_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`areas\` ADD CONSTRAINT \`FK_21435cdf2041a582293a5ec7168\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`permisos_trabajo\` ADD CONSTRAINT \`FK_f8726ecf4bcd246c540c3d586c3\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`permisos_trabajo\` ADD CONSTRAINT \`FK_cc2f52dc9a06245c01105d6e580\` FOREIGN KEY (\`area_id\`) REFERENCES \`areas\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`permisos_trabajo\` ADD CONSTRAINT \`FK_cbeafc83133615fc4962fddb1b3\` FOREIGN KEY (\`creado_por_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`permisos_trabajo\` ADD CONSTRAINT \`FK_df85764d0ac43005569cd7253f0\` FOREIGN KEY (\`autorizado_por_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`permisos_trabajo\` ADD CONSTRAINT \`FK_d3e11ca1ae3ebc9ff8b85e596b5\` FOREIGN KEY (\`cerrado_por_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_imagenes\` ADD CONSTRAINT \`FK_1c89f7378965a1d36602d3a1f6e\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_imagenes\` ADD CONSTRAINT \`FK_3ea5554b0e54e014bccfae2b741\` FOREIGN KEY (\`area_id\`) REFERENCES \`areas\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_imagenes\` ADD CONSTRAINT \`FK_0c2f22021bd2520aa596d019147\` FOREIGN KEY (\`puesto_id\`) REFERENCES \`puestos\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_imagenes\` ADD CONSTRAINT \`FK_d1b7bcca5509f8c652084a9e826\` FOREIGN KEY (\`creado_por_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_videos\` ADD CONSTRAINT \`FK_1afb440e2c31f7e37b49a5cf40d\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_videos\` ADD CONSTRAINT \`FK_b35d68453497c9851086370ee08\` FOREIGN KEY (\`area_id\`) REFERENCES \`areas\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_videos\` ADD CONSTRAINT \`FK_63d153703973baaf68ab3232f86\` FOREIGN KEY (\`puesto_id\`) REFERENCES \`puestos\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_videos\` ADD CONSTRAINT \`FK_a424816dcc00119ffb020f002e2\` FOREIGN KEY (\`creado_por_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`matrices_riesgo\` ADD CONSTRAINT \`FK_547831bb9449776d9ecdb37b229\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`matrices_riesgo\` ADD CONSTRAINT \`FK_4bdb1b904405602aa5945ec2f11\` FOREIGN KEY (\`area_id\`) REFERENCES \`areas\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`matrices_riesgo\` ADD CONSTRAINT \`FK_9a730ee0dd7ea0bc41203ed247e\` FOREIGN KEY (\`puesto_id\`) REFERENCES \`puestos\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`matrices_riesgo\` ADD CONSTRAINT \`FK_86c76d3c533e01f2c1451f984b4\` FOREIGN KEY (\`creado_por_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_empresas\` ADD CONSTRAINT \`FK_5642f570a640ae0de4e0e11a11c\` FOREIGN KEY (\`usuarios_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_empresas\` ADD CONSTRAINT \`FK_9eaa23742778b2f07ba75759968\` FOREIGN KEY (\`empresas_id\`) REFERENCES \`empresas\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuario_empresas\` DROP FOREIGN KEY \`FK_9eaa23742778b2f07ba75759968\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_empresas\` DROP FOREIGN KEY \`FK_5642f570a640ae0de4e0e11a11c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`matrices_riesgo\` DROP FOREIGN KEY \`FK_86c76d3c533e01f2c1451f984b4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`matrices_riesgo\` DROP FOREIGN KEY \`FK_9a730ee0dd7ea0bc41203ed247e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`matrices_riesgo\` DROP FOREIGN KEY \`FK_4bdb1b904405602aa5945ec2f11\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`matrices_riesgo\` DROP FOREIGN KEY \`FK_547831bb9449776d9ecdb37b229\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_videos\` DROP FOREIGN KEY \`FK_a424816dcc00119ffb020f002e2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_videos\` DROP FOREIGN KEY \`FK_63d153703973baaf68ab3232f86\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_videos\` DROP FOREIGN KEY \`FK_b35d68453497c9851086370ee08\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_videos\` DROP FOREIGN KEY \`FK_1afb440e2c31f7e37b49a5cf40d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_imagenes\` DROP FOREIGN KEY \`FK_d1b7bcca5509f8c652084a9e826\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_imagenes\` DROP FOREIGN KEY \`FK_0c2f22021bd2520aa596d019147\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_imagenes\` DROP FOREIGN KEY \`FK_3ea5554b0e54e014bccfae2b741\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`analisis_imagenes\` DROP FOREIGN KEY \`FK_1c89f7378965a1d36602d3a1f6e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`permisos_trabajo\` DROP FOREIGN KEY \`FK_d3e11ca1ae3ebc9ff8b85e596b5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`permisos_trabajo\` DROP FOREIGN KEY \`FK_df85764d0ac43005569cd7253f0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`permisos_trabajo\` DROP FOREIGN KEY \`FK_cbeafc83133615fc4962fddb1b3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`permisos_trabajo\` DROP FOREIGN KEY \`FK_cc2f52dc9a06245c01105d6e580\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`permisos_trabajo\` DROP FOREIGN KEY \`FK_f8726ecf4bcd246c540c3d586c3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`areas\` DROP FOREIGN KEY \`FK_21435cdf2041a582293a5ec7168\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`empresas\` DROP FOREIGN KEY \`FK_b55cd48c580f7e83206c164f0ac\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`puestos\` DROP FOREIGN KEY \`FK_cf5149fbec8304fe32e3e117aff\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`puestos\` DROP FOREIGN KEY \`FK_e33e1b2eda95db205543b536b05\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_features\` DROP FOREIGN KEY \`FK_5560f19917396c7aef6025b0dc2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_features\` DROP FOREIGN KEY \`FK_45809942e3aa1f4c2a0658e9079\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario_features\` DROP FOREIGN KEY \`FK_7b386bd447789d09804ed059668\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9eaa23742778b2f07ba7575996\` ON \`usuario_empresas\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_5642f570a640ae0de4e0e11a11\` ON \`usuario_empresas\``,
    );
    await queryRunner.query(`DROP TABLE \`usuario_empresas\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_459d40fffc025541e292136145\` ON \`matrices_riesgo\``,
    );
    await queryRunner.query(`DROP TABLE \`matrices_riesgo\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_214976b5776ec821406c56d54c\` ON \`analisis_videos\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e54d728a8316b097f36900c208\` ON \`analisis_videos\``,
    );
    await queryRunner.query(`DROP TABLE \`analisis_videos\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_f056de49d164a67c194ebd6727\` ON \`analisis_imagenes\``,
    );
    await queryRunner.query(`DROP TABLE \`analisis_imagenes\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ee493cb546a854d286e2df8954\` ON \`permisos_trabajo\``,
    );
    await queryRunner.query(`DROP TABLE \`permisos_trabajo\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a5ec545cae294ff7d1c0769561\` ON \`areas\``,
    );
    await queryRunner.query(`DROP TABLE \`areas\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_febfecf7816478e76da58585a5\` ON \`empresas\``,
    );
    await queryRunner.query(`DROP TABLE \`empresas\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a3ba1461e9f049300dd2f5be16\` ON \`puestos\``,
    );
    await queryRunner.query(`DROP TABLE \`puestos\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_446adfc18b35418aac32ae0b7b\` ON \`usuarios\``,
    );
    await queryRunner.query(`DROP TABLE \`usuarios\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_217b4ad2f9f59eb5614d5c937d\` ON \`usuario_features\``,
    );
    await queryRunner.query(`DROP TABLE \`usuario_features\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_71f6e74ba326549ac3dc6f6bfb\` ON \`features\``,
    );
    await queryRunner.query(`DROP TABLE \`features\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_cb616247f50b1a32468263c254\` ON \`clasificaciones\``,
    );
    await queryRunner.query(`DROP TABLE \`clasificaciones\``);
  }
}
