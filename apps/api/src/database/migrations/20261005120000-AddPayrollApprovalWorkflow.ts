import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayrollApprovalWorkflow20261005120000
  implements MigrationInterface
{
  name = 'AddPayrollApprovalWorkflow20261005120000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payroll_runs"
        ADD COLUMN "created_by_user_id" uuid,
        ADD COLUMN "approved_by_user_id" uuid,
        ADD COLUMN "approved_at" TIMESTAMPTZ,
        ADD COLUMN "finalized_by_user_id" uuid,
        ADD COLUMN "finalized_at" TIMESTAMPTZ
    `);

    await queryRunner.query(`
      ALTER TABLE "payroll_runs"
        ADD CONSTRAINT "FK_payroll_runs_created_by"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        ADD CONSTRAINT "FK_payroll_runs_approved_by"
          FOREIGN KEY ("approved_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        ADD CONSTRAINT "FK_payroll_runs_finalized_by"
          FOREIGN KEY ("finalized_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_payroll_runs_employee_period"
      ON "payroll_runs" ("employee_id", "pay_period")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "UQ_payroll_runs_employee_period"',
    );
    await queryRunner.query(`
      ALTER TABLE "payroll_runs"
        DROP CONSTRAINT "FK_payroll_runs_created_by",
        DROP CONSTRAINT "FK_payroll_runs_approved_by",
        DROP CONSTRAINT "FK_payroll_runs_finalized_by",
        DROP COLUMN "created_by_user_id",
        DROP COLUMN "approved_by_user_id",
        DROP COLUMN "approved_at",
        DROP COLUMN "finalized_by_user_id",
        DROP COLUMN "finalized_at"
    `);
  }
}
