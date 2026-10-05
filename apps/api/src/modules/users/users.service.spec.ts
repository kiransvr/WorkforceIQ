import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuditService } from '../audit/audit.service';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { UsersService } from './users.service';

describe('UsersService organization management', () => {
  const repository = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const auditService = {
    record: jest.fn(),
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(
      repository as never,
      auditService as unknown as AuditService,
    );
    auditService.record.mockResolvedValue(undefined);
    repository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    });
  });

  it('lists only the requested organization and excludes secrets', async () => {
    repository.find.mockResolvedValue([]);

    await service.listOrganizationUsers('organization-id');

    expect(repository.find).toHaveBeenCalledWith({
      where: { organizationId: 'organization-id' },
      select: [
        'id',
        'email',
        'role',
        'isActive',
        'mustChangePassword',
        'lastLoginAt',
        'createdAt',
      ],
      order: { createdAt: 'ASC' },
    });
  });

  it('creates a normalized, inactive-until-password-changed payroll user and audits without credentials', async () => {
    const savedUser = {
      id: 'user-id',
      email: 'payroll@example.com',
      role: UserRole.PAYROLL_OFFICER,
      organizationId: 'organization-id',
      isActive: true,
      mustChangePassword: true,
      lastLoginAt: null,
      createdAt: new Date(),
    } as User;
    repository.create.mockImplementation((user) => user);
    repository.save.mockResolvedValue(savedUser);

    const result = await service.createOrganizationUser(
      {
        email: ' Payroll@Example.com ',
        temporaryPassword: 'temporary-password-123',
        role: UserRole.PAYROLL_OFFICER,
      },
      'organization-id',
      { id: 'admin-id', role: UserRole.ORG_ADMIN },
    );

    const storedUser = repository.create.mock.calls[0][0];
    expect(storedUser.email).toBe('payroll@example.com');
    expect(storedUser.passwordHash).not.toBe('temporary-password-123');
    expect(await argon2.verify(storedUser.passwordHash, 'temporary-password-123')).toBe(true);
    expect(storedUser.mustChangePassword).toBe(true);
    expect(result).not.toHaveProperty('passwordHash');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATED',
        after: expect.not.objectContaining({
          temporaryPassword: expect.anything(),
          passwordHash: expect.anything(),
        }),
      }),
    );
  });

  it('does not allow organization admins to assign privileged admin roles', async () => {
    await expect(
      service.createOrganizationUser(
        {
          email: 'admin2@example.com',
          temporaryPassword: 'temporary-password-123',
          role: UserRole.ORG_ADMIN,
        },
        'organization-id',
        { id: 'admin-id', role: UserRole.ORG_ADMIN },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects duplicate email addresses', async () => {
    repository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 'existing-user' }),
    });

    await expect(
      service.createOrganizationUser(
        {
          email: 'existing@example.com',
          temporaryPassword: 'temporary-password-123',
          role: UserRole.PAYROLL_OFFICER,
        },
        'organization-id',
        { id: 'admin-id', role: UserRole.ORG_ADMIN },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents self-deactivation and never modifies an out-of-organization account', async () => {
    await expect(
      service.updateOrganizationUser(
        'admin-id',
        { isActive: false },
        'organization-id',
        { id: 'admin-id', role: UserRole.ORG_ADMIN },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    repository.findOne.mockResolvedValue(null);
    await expect(
      service.updateOrganizationUser(
        'other-user',
        { isActive: false },
        'organization-id',
        { id: 'admin-id', role: UserRole.ORG_ADMIN },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'other-user', organizationId: 'organization-id' },
    });
  });
});
