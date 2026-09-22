import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Branch } from './branch.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId: string;

  @Index()
  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.departments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
