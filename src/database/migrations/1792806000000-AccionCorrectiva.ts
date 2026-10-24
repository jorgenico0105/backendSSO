import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccionCorrectiva1792806000000 implements MigrationInterface {
  name = 'AccionCorrectiva1792806000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`analisis_imagenes\` ADD \`accion_correctiva\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`analisis_imagenes\` DROP COLUMN \`accion_correctiva\``,
    );
  }
}
