import { MigrationInterface, QueryRunner } from 'typeorm';

export class InformesAccidente1793333422773 implements MigrationInterface {
  name = 'InformesAccidente1793333422773';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`informes_accidente\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`codigo\` varchar(30) NULL, \`ia_respuesta\` json NULL, \`ia_modelo\` varchar(60) NULL, \`ia_duracion_ms\` int NULL, \`estado\` enum ('BORRADOR', 'COMPLETA') NOT NULL DEFAULT 'BORRADOR', \`audio_url\` varchar(500) NULL, \`audio_public_id\` varchar(255) NULL, \`transcripcion\` text NOT NULL, \`datos\` json NOT NULL, \`faltantes\` json NOT NULL, \`resumen\` text NULL, \`empresa_id\` int NULL, \`area_id\` int NULL, \`puesto_id\` int NULL, \`creado_por_id\` int NULL, UNIQUE INDEX \`IDX_6538d4bde467ba864da4aeef06\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`informes_accidente\` ADD CONSTRAINT \`FK_fe1d632514726648b0e2dcf6706\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`informes_accidente\` ADD CONSTRAINT \`FK_86c4ca975fe329938f764807a3f\` FOREIGN KEY (\`area_id\`) REFERENCES \`areas\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`informes_accidente\` ADD CONSTRAINT \`FK_db1905097e11f5fd32dd3fe3381\` FOREIGN KEY (\`puesto_id\`) REFERENCES \`puestos\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`informes_accidente\` ADD CONSTRAINT \`FK_6e9c214d754395a144bba36a543\` FOREIGN KEY (\`creado_por_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`informes_accidente\` DROP FOREIGN KEY \`FK_6e9c214d754395a144bba36a543\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`informes_accidente\` DROP FOREIGN KEY \`FK_db1905097e11f5fd32dd3fe3381\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`informes_accidente\` DROP FOREIGN KEY \`FK_86c4ca975fe329938f764807a3f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`informes_accidente\` DROP FOREIGN KEY \`FK_fe1d632514726648b0e2dcf6706\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_6538d4bde467ba864da4aeef06\` ON \`informes_accidente\``,
    );
    await queryRunner.query(`DROP TABLE \`informes_accidente\``);
  }
}
