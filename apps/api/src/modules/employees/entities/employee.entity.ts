import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('employees')
@Index('UQ_employees_organization_email', ['organizationId', 'email'], { unique: true })
@Index('UQ_employees_organization_tin', ['organizationId', 'tinNumber'], { unique: true })
export class Employee extends BaseEntity {
  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'father_name' }) // Standard naming convention in Ethiopia
  fatherName!: string;

  @Column({ name: 'grand_father_name' }) // Standard naming convention in Ethiopia
  grandFatherName!: string;

  @Column()
  email!: string;

  @Column({ name: 'tin_number' })
  tinNumber!: string;

  // --- Financial Compensation Lines ---
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'basic_salary', default: 0.00 })
  basicSalary!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'transport_allowance', default: 0.00 })
  transportAllowance!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'other_allowances', default: 0.00 })
  otherAllowances!: number;

  // --- Localized Ethiopian Address Schema ---
  @Column({ default: 'Addis Ababa' })
  region!: string; // e.g., Addis Ababa, Oromia, Amhara, Sidama, etc.

  @Column({ nullable: true })
  subCity!: string; // e.g., Bole, Yeka, Kirkos

  @Column({ nullable: true })
  woreda!: string;

  @Column({ nullable: true })
  kebele!: string;

  // --- Local Financial Disbursal Target ---
  @Column({ name: 'bank_name', default: 'Commercial Bank of Ethiopia' })
  bankName!: string;

  @Column({ name: 'bank_account_number', select: false })
  bankAccountNumber!: string;

  // --- Workspace Matrix Structural Links ---
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;
}
