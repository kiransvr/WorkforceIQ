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

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmployeesService(employeeRepository as unknown as Repository<Employee>);
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

    await expect(service.findOne('employee-id', 'organization-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(employeeRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'employee-id', organizationId: 'organization-id' },
    });
  });
});
