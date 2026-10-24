import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsentimientosLegales1792719364754 implements MigrationInterface {
  name = 'ConsentimientosLegales1792719364754';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`terminos_version\` varchar(20) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`terminos_aceptados_en\` datetime NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`consentimiento_ia\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`consentimiento_ia_en\` datetime NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP COLUMN \`consentimiento_ia_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP COLUMN \`consentimiento_ia\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP COLUMN \`terminos_aceptados_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP COLUMN \`terminos_version\``,
    );
  }
}
