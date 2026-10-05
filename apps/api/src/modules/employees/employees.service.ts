import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(dto: CreateEmployeeDto, organizationId: string): Promise<Employee> {
    const email = dto.email.trim().toLowerCase();
    const duplicate = await this.employeeRepository.findOne({
      where: [
        { organizationId, email },
        { organizationId, tinNumber: dto.tinNumber.trim() },
      ],
    });
    if (duplicate) {
      throw new ConflictException('An employee with this email or TIN already exists in your organization.');
    }

    const employee = this.employeeRepository.create({
      ...dto,
      email,
      tinNumber: dto.tinNumber.trim(),
      organizationId,
      organization: { id: organizationId },
    });
    return this.employeeRepository.save(employee);
  }

  async findAll(organizationId: string): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id, organizationId } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, organizationId: string): Promise<Employee> {
    const employee = await this.findOne(id, organizationId);
    if (dto.email || dto.tinNumber) {
      const duplicate = await this.employeeRepository
        .createQueryBuilder('employee')
        .where('employee.organizationId = :organizationId', { organizationId })
        .andWhere('employee.id != :id', { id })
        .andWhere('(LOWER(employee.email) = LOWER(:email) OR employee.tinNumber = :tinNumber)', {
          email: dto.email?.trim() ?? employee.email,
          tinNumber: dto.tinNumber?.trim() ?? employee.tinNumber,
        })
        .getOne();
      if (duplicate) {
        throw new ConflictException('An employee with this email or TIN already exists in your organization.');
      }
    }
    Object.assign(employee, dto);
    if (dto.email) {
      employee.email = dto.email.trim().toLowerCase();
    }
    if (dto.tinNumber) {
      employee.tinNumber = dto.tinNumber.trim();
    }
    return this.employeeRepository.save(employee);
  }
}
