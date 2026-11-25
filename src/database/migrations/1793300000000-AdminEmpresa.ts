import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminEmpresa1793300000000 implements MigrationInterface {
  name = 'AdminEmpresa1793300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` MODIFY \`perfil\` enum ('ADMINISTRADOR', 'ADMIN_EMPRESA', 'USUARIO') NOT NULL DEFAULT 'USUARIO'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`usuarios\` SET \`perfil\` = 'USUARIO' WHERE \`perfil\` = 'ADMIN_EMPRESA'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` MODIFY \`perfil\` enum ('ADMINISTRADOR', 'USUARIO') NOT NULL DEFAULT 'USUARIO'`,
    );
  }
}
