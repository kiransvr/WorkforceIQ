import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/request-with-user.interface';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';

type EmployeeResponse = Omit<Employee, 'bankAccountNumber'>;

@Controller({ path: 'employees', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORG_ADMIN)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeResponse> {
    return this.employeesService
      .create(dto, this.organizationIdFor(user))
      .then(({ bankAccountNumber: _bankAccountNumber, ...employee }) => employee);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<EmployeeResponse[]> {
    const employees = await this.employeesService.findAll(this.organizationIdFor(user));
    return employees.map(({ bankAccountNumber: _bankAccountNumber, ...employee }) => employee);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeResponse> {
    const { bankAccountNumber: _bankAccountNumber, ...employee } = await this.employeesService.findOne(
      id,
      this.organizationIdFor(user),
    );
    return employee;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeResponse> {
    return this.employeesService
      .update(id, dto, this.organizationIdFor(user))
      .then(({ bankAccountNumber: _bankAccountNumber, ...employee }) => employee);
  }

  private organizationIdFor(user: AuthenticatedUser): string {
    if (!user.organizationId) {
      throw new ForbiddenException('This account is not assigned to an organization.');
    }
    return user.organizationId;
  }
}
