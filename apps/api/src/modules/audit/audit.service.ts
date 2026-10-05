import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditEvent {
  organizationId: string;
  actorId: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async record(event: AuditEvent): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      organizationId: event.organizationId,
      actorId: event.actorId,
      actorRole: event.actorRole,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      before: event.before ?? null,
      after: event.after ?? null,
      ipAddress: event.ipAddress ?? null,
      userAgent: event.userAgent?.slice(0, 500) ?? null,
    });
    await this.auditLogRepository.save(auditLog);
  }
}
