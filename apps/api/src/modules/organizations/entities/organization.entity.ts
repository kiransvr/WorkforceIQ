import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Branch } from './branch.entity';

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index()
  @Column({ type: 'char', length: 2 })
  countryCode!: string; // ISO 3166-1 alpha-2 (e.g. 'ET')

  @Column({ type: 'char', length: 3 })
  currencyCode!: string; // ISO 4217 (e.g. 'ETB')

  @Column({ type: 'varchar', length: 20, default: 'en' })
  locale!: string; // BCP 47 (e.g. 'en-ET')

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  customFields!: Record<string, unknown> | null;

  @OneToMany(() => Branch, (branch) => branch.organization)
  branches!: Branch[];
}
