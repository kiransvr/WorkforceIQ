import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { PayrollStatus } from '../enums/payroll-status.enum';

@Entity('payroll_runs')
export class PayrollRun extends BaseEntity {
  @Column({ name: 'pay_period' }) // e.g., "2026-09"
  payPeriod!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'basic_salary' })
  basicSalary!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'gross_taxable_income' })
  grossTaxableIncome!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'employment_income_tax' })
  employmentIncomeTax!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'employee_pension' })
  employeePension!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'employer_pension' })
  employerPension!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'net_pay' })
  netPay!: number;

  @Column({ default: PayrollStatus.DRAFT })
  status!: PayrollStatus;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId!: string | null;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'finalized_by_user_id', type: 'uuid', nullable: true })
  finalizedByUserId!: string | null;

  @Column({ name: 'finalized_at', type: 'timestamptz', nullable: true })
  finalizedAt!: Date | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;
}
