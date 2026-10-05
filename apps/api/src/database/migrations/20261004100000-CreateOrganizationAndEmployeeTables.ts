import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationAndEmployeeTables20261004100000 implements MigrationInterface {
  name = 'CreateOrganizationAndEmployeeTables20261004100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('super_admin', 'org_admin', 'branch_manager', 'payroll_officer', 'employee', 'auditor')`,
    );

    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "name" varchar(255) NOT NULL,
        "countryCode" char(2) NOT NULL,
        "currencyCode" char(3) NOT NULL,
        "locale" varchar(20) NOT NULL DEFAULT 'en',
        "isActive" boolean NOT NULL DEFAULT true,
        "customFields" jsonb,
        CONSTRAINT "PK_organizations" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_organizations_countryCode" ON "organizations" ("countryCode")',
    );

    await queryRunner.query(`
      CREATE TABLE "branches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "name" varchar(255) NOT NULL,
        "address" varchar(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "PK_branches" PRIMARY KEY ("id"),
        CONSTRAINT "FK_branches_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organizations" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_branches_organization_id" ON "branches" ("organization_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "name" varchar(255) NOT NULL,
        "organization_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        CONSTRAINT "PK_departments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_departments_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organizations" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_departments_branch" FOREIGN KEY ("branch_id")
          REFERENCES "branches" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_departments_organization_id" ON "departments" ("organization_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_departments_branch_id" ON "departments" ("branch_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "email" varchar(255) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'employee',
        "isActive" boolean NOT NULL DEFAULT true,
        "mfaEnabled" boolean NOT NULL DEFAULT false,
        "mfaSecret" varchar(255),
        "failedLoginAttempts" integer NOT NULL DEFAULT 0,
        "lockedUntil" TIMESTAMPTZ,
        "lastLoginAt" TIMESTAMPTZ,
        "organization_id" uuid,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organizations" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX "UQ_users_email" ON "users" ("email")');
    await queryRunner.query('CREATE INDEX "IDX_users_organization_id" ON "users" ("organization_id")');

    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "first_name" varchar NOT NULL,
        "father_name" varchar NOT NULL,
        "grand_father_name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "tin_number" varchar NOT NULL,
        "basic_salary" numeric(12,2) NOT NULL DEFAULT 0,
        "transport_allowance" numeric(12,2) NOT NULL DEFAULT 0,
        "other_allowances" numeric(12,2) NOT NULL DEFAULT 0,
        "region" varchar NOT NULL DEFAULT 'Addis Ababa',
        "subCity" varchar,
        "woreda" varchar,
        "kebele" varchar,
        "bank_name" varchar NOT NULL DEFAULT 'Commercial Bank of Ethiopia',
        "bank_account_number" varchar NOT NULL,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "PK_employees" PRIMARY KEY ("id"),
        CONSTRAINT "FK_employees_organization" FOREIGN KEY ("organization_id")
          REFERENCES "organizations" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_employees_organization_email" ON "employees" ("organization_id", "email")',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_employees_organization_tin" ON "employees" ("organization_id", "tin_number")',
    );

    await queryRunner.query(`
      CREATE TABLE "payroll_runs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "pay_period" varchar NOT NULL,
        "basic_salary" numeric(12,2) NOT NULL,
        "gross_taxable_income" numeric(12,2) NOT NULL,
        "employment_income_tax" numeric(12,2) NOT NULL,
        "employee_pension" numeric(12,2) NOT NULL,
        "employer_pension" numeric(12,2) NOT NULL,
        "net_pay" numeric(12,2) NOT NULL,
        "status" varchar NOT NULL DEFAULT 'Draft',
        "employee_id" uuid NOT NULL,
        CONSTRAINT "PK_payroll_runs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payroll_runs_employee" FOREIGN KEY ("employee_id")
          REFERENCES "employees" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payroll_line_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "organization_id" uuid NOT NULL,
        "payroll_run_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "basicSalary" numeric(18,2) NOT NULL,
        "allowances" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "otherDeductions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "overtimePay" numeric(18,2) NOT NULL DEFAULT 0,
        "bonus" numeric(18,2) NOT NULL DEFAULT 0,
        "grossTaxableIncome" numeric(18,2) NOT NULL,
        "incomeTax" numeric(18,2) NOT NULL,
        "employeePension" numeric(18,2) NOT NULL,
        "employerPension" numeric(18,2) NOT NULL,
        "otherStatutoryDeductions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "netPay" numeric(18,2) NOT NULL,
        "currencyCode" varchar(3) NOT NULL,
        "appliedRulesSnapshot" jsonb,
        CONSTRAINT "PK_payroll_line_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payroll_line_items_payroll_run" FOREIGN KEY ("payroll_run_id")
          REFERENCES "payroll_runs" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payroll_line_items_employee" FOREIGN KEY ("employee_id")
          REFERENCES "employees" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_payroll_line_items_organization_id" ON "payroll_line_items" ("organization_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_payroll_line_items_payroll_run_id" ON "payroll_line_items" ("payroll_run_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_payroll_line_items_employee_id" ON "payroll_line_items" ("employee_id")',
    );

    await queryRunner.query(`
      CREATE TABLE "tax_rule_sets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "countryCode" char(2) NOT NULL,
        "name" varchar(255) NOT NULL,
        "brackets" jsonb NOT NULL,
        "effectiveDate" date NOT NULL,
        "expiryDate" date,
        "sourceReference" text,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_tax_rule_sets" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_tax_rule_sets_country_code" ON "tax_rule_sets" ("countryCode")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_tax_rule_sets_effective_date" ON "tax_rule_sets" ("effectiveDate")',
    );

    await queryRunner.query(`
      CREATE TABLE "statutory_deduction_rule_sets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "countryCode" char(2) NOT NULL,
        "name" varchar(255) NOT NULL,
        "rules" jsonb NOT NULL,
        "effectiveDate" date NOT NULL,
        "expiryDate" date,
        "sourceReference" text,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_statutory_deduction_rule_sets" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_statutory_rules_country_code" ON "statutory_deduction_rule_sets" ("countryCode")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_statutory_rules_effective_date" ON "statutory_deduction_rule_sets" ("effectiveDate")',
    );

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "organizationId" uuid NOT NULL,
        "actorId" uuid,
        "actorRole" varchar(100) NOT NULL,
        "entityType" varchar(100) NOT NULL,
        "entityId" uuid,
        "action" varchar(100) NOT NULL,
        "before" jsonb,
        "after" jsonb,
        "ipAddress" varchar(45),
        "userAgent" text,
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_organization_id" ON "audit_logs" ("organizationId")');
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_actor_id" ON "audit_logs" ("actorId")');
    await queryRunner.query('CREATE INDEX "IDX_audit_logs_entity_id" ON "audit_logs" ("entityId")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "audit_logs"');
    await queryRunner.query('DROP TABLE "statutory_deduction_rule_sets"');
    await queryRunner.query('DROP TABLE "tax_rule_sets"');
    await queryRunner.query('DROP TABLE "payroll_line_items"');
    await queryRunner.query('DROP TABLE "payroll_runs"');
    await queryRunner.query('DROP TABLE "employees"');
    await queryRunner.query('DROP TABLE "users"');
    await queryRunner.query('DROP TABLE "departments"');
    await queryRunner.query('DROP TABLE "branches"');
    await queryRunner.query('DROP TABLE "organizations"');
    await queryRunner.query('DROP TYPE "users_role_enum"');
  }
}
