import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRun } from './entities/payroll-run.entity';
import { PayrollRulesEngine } from './payroll-rules.engine';
import { EmployeesService } from '@modules/employees/employees.service';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollRun)
    private readonly payrollRunRepository: Repository<PayrollRun>,
    private readonly employeesService: EmployeesService,
    private readonly rulesEngine: PayrollRulesEngine,
  ) {}

  /**
   * Processes a compliant calculation for an employee and writes the slip to the database
   */
  async calculateAndSaveWorkerPayroll(employeeId: string, payPeriod: string): Promise<PayrollRun> {
    // 1. Fetch active employee profile directly from database variables
    const worker = await this.employeesService.findOne(employeeId);
    if (!worker) {
      throw new NotFoundException(`Worker with profile ID ${employeeId} does not exist.`);
    }

    // 2. Feed database variables directly to your streamlined Ethiopian math engine
    const calculation = this.rulesEngine.calculatePayroll({
      basicSalary: Number(worker.basicSalary),
      transportAllowance: Number(worker.transportAllowance),
      otherAllowances: Number(worker.otherAllowances),
    });

    // 3. Map calculation outputs back onto a persistent database record layout
    const newRunRecord = this.payrollRunRepository.create({
      payPeriod,
      basicSalary: calculation.basicSalary,
      grossTaxableIncome: calculation.grossTaxableIncome,
      employmentIncomeTax: calculation.employmentIncomeTax,
      employeePension: calculation.employeePension,
      employerPension: calculation.employerPension,
      netPay: calculation.netPay,
      status: 'Draft',
      employee: worker,
    });

    return await this.payrollRunRepository.save(newRunRecord);
  }

  /**
   * Fetches full calculations history array processed across a single period block
   */
  async getPeriodRuns(payPeriod: string): Promise<PayrollRun[]> {
    return await this.payrollRunRepository.find({
      where: { payPeriod },
      relations: ['employee'],
    });
  }
}
