import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemporaryPasswordChangeFlag20261005130000
  implements MigrationInterface
{
  name = 'AddTemporaryPasswordChangeFlag20261005130000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "must_change_password" boolean NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "must_change_password"
    `);
  }
}
