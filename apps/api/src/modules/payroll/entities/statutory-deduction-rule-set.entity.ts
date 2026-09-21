import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

export interface StatutoryDeductionRule {
  name: string;               // e.g. "Private Pension"
  employeeRate: number;       // decimal, e.g. 0.07
  employerRate: number;       // decimal, e.g. 0.11
  ceiling: number | null;     // max pensionable salary; null = no ceiling

}

/**
 * Versioned, effective-dated statutory deduction rule set (pension,
 * provident fund, social security, etc.) scoped to a country.
 * Adding/updating rules for any country is a data operation only.
 */
@Entity('statutory_deduction_rule_sets')
export class StatutoryDeductionRuleSet extends BaseEntity {
  @Index()
  @Column({ type: 'char', length: 2 })
  countryCode: string;

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. "Ethiopia Private Pension 2011"

  @Column({ type: 'jsonb' })
  rules: StatutoryDeductionRule[];

  @Index()
  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ type: 'text', nullable: true })
  sourceReference: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
