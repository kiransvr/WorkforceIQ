import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollRun } from './entities/payroll-run.entity';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('process')
  async processSingleWorker(
    @Body('employeeId') employeeId: string,
    @Body('payPeriod') payPeriod: string,
  ): Promise<PayrollRun> {
    return await this.payrollService.calculateAndSaveWorkerPayroll(employeeId, payPeriod);
  }

  @Get('period/:payPeriod')
  async fetchPeriodSlips(@Param('payPeriod') payPeriod: string): Promise<PayrollRun[]> {
    return await this.payrollService.getPeriodRuns(payPeriod);
  }
}
