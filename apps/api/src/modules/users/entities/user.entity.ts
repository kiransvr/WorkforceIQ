import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../enums/user-role.enum';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.EMPLOYEE })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'must_change_password', type: 'boolean', default: false })
  mustChangePassword!: boolean;

  @Column({ type: 'boolean', default: false })
  mfaEnabled!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  mfaSecret!: string | null;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  // ─── Tenant scoping ─────────────────────────────────────────
  @Index()
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId!: string | null;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization | null;
}
