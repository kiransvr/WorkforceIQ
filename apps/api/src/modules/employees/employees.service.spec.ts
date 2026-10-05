import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  const employeeRepository = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const auditService = {
    record: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmployeesService(
      employeeRepository as unknown as Repository<Employee>,
      auditService as never,
    );
    auditService.record.mockResolvedValue(undefined);
  });

  it('creates an employee within the authenticated organization', async () => {
    const employee = { id: 'employee-id' } as Employee;
    employeeRepository.findOne.mockResolvedValue(null);
    employeeRepository.create.mockReturnValue(employee);
    employeeRepository.save.mockResolvedValue(employee);

    const result = await service.create(
      {
        firstName: 'Ava',
        fatherName: 'Mekonnen',
        grandFatherName: 'Tesfaye',
        email: ' Ava@example.com ',
        tinNumber: '1234567890',
        basicSalary: 10000,
        bankAccountNumber: '12345678',
      },
      'organization-id',
      { id: 'user-id', role: 'org_admin' },
    );

    expect(employeeRepository.findOne).toHaveBeenCalledWith({
      where: [
        { organizationId: 'organization-id', email: 'ava@example.com' },
        { organizationId: 'organization-id', tinNumber: '1234567890' },
      ],
    });
    expect(employeeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ava@example.com',
        organizationId: 'organization-id',
        organization: { id: 'organization-id' },
      }),
    );
    expect(result).toBe(employee);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATED',
        entityType: 'Employee',
        after: expect.not.objectContaining({
          bankAccountNumber: expect.anything(),
        }),
      }),
    );
  });

  it('rejects duplicate employee identity values in the same organization', async () => {
    employeeRepository.findOne.mockResolvedValue({ id: 'existing-employee' });

    await expect(
      service.create(
        {
          firstName: 'Ava',
          fatherName: 'Mekonnen',
          grandFatherName: 'Tesfaye',
          email: 'ava@example.com',
          tinNumber: '1234567890',
          basicSalary: 10000,
          bankAccountNumber: '12345678',
        },
        'organization-id',
        { id: 'user-id', role: 'org_admin' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(employeeRepository.create).not.toHaveBeenCalled();
  });

  it('always scopes list queries to the authenticated organization', async () => {
    employeeRepository.find.mockResolvedValue([]);

    await service.findAll('organization-id');

    expect(employeeRepository.find).toHaveBeenCalledWith({
      where: { organizationId: 'organization-id' },
      order: { createdAt: 'DESC' },
    });
  });

  it('returns not found when an employee is outside the organization', async () => {
    employeeRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findOne('employee-id', 'organization-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(employeeRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'employee-id', organizationId: 'organization-id' },
    });
  });

  it('audits bank-account changes without recording the account number', async () => {
    const employee = {
      id: 'employee-id',
      organizationId: 'organization-id',
      email: 'ava@example.com',
      tinNumber: '1234567890',
      bankName: 'Example Bank',
      bankAccountNumber: 'old-account',
    } as Employee;
    employeeRepository.findOne.mockResolvedValue(employee);
    employeeRepository.save.mockImplementation(async (saved) => saved);

    await service.update(
      'employee-id',
      { bankAccountNumber: 'new-account' },
      'organization-id',
      { id: 'user-id', role: 'org_admin' },
    );

    const event = auditService.record.mock.calls[0][0];
    expect(event.action).toBe('BANK_ACCOUNT_UPDATED');
    expect(JSON.stringify(event)).not.toContain('old-account');
    expect(JSON.stringify(event)).not.toContain('new-account');
    expect(event.after.bankAccountNumberUpdated).toBe(true);
  });
});
