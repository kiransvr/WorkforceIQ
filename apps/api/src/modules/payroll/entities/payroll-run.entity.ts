import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('payroll_runs')
export class PayrollRun extends BaseEntity {
  @Column({ name: 'pay_period' }) // e.g., "2026-09"
  payPeriod: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'basic_salary' })
  basicSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'gross_taxable_income' })
  grossTaxableIncome: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'employment_income_tax' })
  employmentIncomeTax: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'employee_pension' })
  employeePension: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'employer_pension' })
  employerPension: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'net_pay' })
  netPay: number;

  @Column({ default: 'Draft' }) // Draft, Approved, Paid
  status: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
