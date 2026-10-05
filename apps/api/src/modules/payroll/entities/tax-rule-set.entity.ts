import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export interface TaxBracket {
  minIncome: number;
  maxIncome: number | null; // null = no upper bound
  rate: number;             // decimal, e.g. 0.35
  fixedDeduction: number;   // pre-computed deduction amount for the bracket
}

/**
 * Versioned, effective-dated income tax rule set scoped to a country.
 * A new government directive = new row; existing rows are never mutated.
 * Every PayrollRun snapshots the active rule set on its pay date.
 */
@Entity('tax_rule_sets')
export class TaxRuleSet extends BaseEntity {
  @Index()
  @Column({ type: 'char', length: 2 })
  countryCode!: string; // ISO 3166-1 alpha-2

  @Column({ type: 'varchar', length: 255 })
  name!: string; // e.g. "Ethiopia PAYE 2024/25"

  @Column({ type: 'jsonb' })
  brackets!: TaxBracket[];

  @Index()
  @Column({ type: 'date' })
  effectiveDate!: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  sourceReference!: string | null; // e.g. "ERCA Directive 2024"

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
