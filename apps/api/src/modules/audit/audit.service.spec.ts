import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  const repository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  let service: AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuditService(repository as unknown as Repository<AuditLog>);
    repository.create.mockImplementation((event) => event);
    repository.save.mockImplementation(async (event) => event);
  });

  it('stores an append-only event with normalized optional metadata', async () => {
    await service.record({
      organizationId: 'organization-id',
      actorId: 'user-id',
      actorRole: 'org_admin',
      entityType: 'Employee',
      entityId: 'employee-id',
      action: 'BANK_ACCOUNT_UPDATED',
      after: { bankAccountNumberUpdated: true },
      userAgent: 'x'.repeat(600),
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'organization-id',
        actorId: 'user-id',
        action: 'BANK_ACCOUNT_UPDATED',
        before: null,
        ipAddress: null,
        userAgent: 'x'.repeat(500),
        after: { bankAccountNumberUpdated: true },
      }),
    );
  });

  it('propagates persistence errors instead of reporting false audit success', async () => {
    repository.save.mockRejectedValue(new Error('database unavailable'));

    await expect(
      service.record({
        organizationId: 'organization-id',
        actorId: 'user-id',
        actorRole: 'org_admin',
        entityType: 'Employee',
        entityId: 'employee-id',
        action: 'UPDATED',
      }),
    ).rejects.toThrow('database unavailable');
  });
});
