import { Entity, Column, Index, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Immutable, append-only audit log.
 * Never update or delete rows. Corrections are new rows.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp!: Date;

  @Index()
  @Column({ type: 'uuid' })
  organizationId!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  actorId!: string | null; // null = system/job

  @Column({ type: 'varchar', length: 100 })
  actorRole!: string;

  @Column({ type: 'varchar', length: 100 })
  entityType!: string; // e.g. 'PayrollRun', 'Employee'

  @Index()
  @Column({ type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({ type: 'varchar', length: 100 })
  action!: string; // e.g. 'CREATE', 'UPDATE', 'FINALIZE', 'APPROVE'

  @Column({ type: 'jsonb', nullable: true })
  before!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;
}
