import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { PayrollRun } from './payroll-run.entity';
import { Employee } from '@modules/employees/entities/employee.entity';

@Entity('payroll_line_items')
export class PayrollLineItem extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  organizationId: string;

  @Index()
  @Column({ type: 'uuid' })
  payrollRunId: string;

  @ManyToOne(() => PayrollRun, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payroll_run_id' })
  payrollRun: PayrollRun;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  // ─── Salary components ──────────────────────────────────────
  @Column({ type: 'numeric', precision: 18, scale: 2 })
  basicSalary: number;

  @Column({ type: 'jsonb', default: '[]' })
  allowances: Array<{ name: string; amount: number; taxable: boolean }>;

  @Column({ type: 'jsonb', default: '[]' })
  otherDeductions: Array<{ name: string; amount: number }>;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  overtimePay: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  bonus: number;

  // ─── Computed totals (set by rules engine) ──────────────────
  @Column({ type: 'numeric', precision: 18, scale: 2 })
  grossTaxableIncome: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  incomeTax: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  employeePension: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  employerPension: number;

  @Column({ type: 'jsonb', default: '[]' })
  otherStatutoryDeductions: Array<{ name: string; employeeAmount: number; employerAmount: number }>;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  netPay: number;

  @Column({ type: 'varchar', length: 3 })
  currencyCode: string;

  // ─── Snapshot of rules applied ──────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  appliedRulesSnapshot: Record<string, unknown> | null;
}
