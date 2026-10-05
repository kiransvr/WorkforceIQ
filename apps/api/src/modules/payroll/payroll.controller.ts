import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/request-with-user.interface';
import { ProcessPayrollDto } from './dto/process-payroll.dto';
import { PayrollService } from './payroll.service';
import { PayrollRun } from './entities/payroll-run.entity';

@Controller({ path: 'payroll', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORG_ADMIN, UserRole.PAYROLL_OFFICER)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('process')
  async processSingleWorker(
    @Body() dto: ProcessPayrollDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PayrollRun> {
    return this.payrollService.calculateAndSaveWorkerPayroll(
      dto.employeeId,
      dto.payPeriod,
      this.organizationIdFor(user),
    );
  }

  @Get('period/:payPeriod')
  async fetchPeriodSlips(
    @Param('payPeriod') payPeriod: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PayrollRun[]> {
    return this.payrollService.getPeriodRuns(payPeriod, this.organizationIdFor(user));
  }

  private organizationIdFor(user: AuthenticatedUser): string {
    if (!user.organizationId) {
      throw new ForbiddenException('This account is not assigned to an organization.');
    }
    return user.organizationId;
  }
}
