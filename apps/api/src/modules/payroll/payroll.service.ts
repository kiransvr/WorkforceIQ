import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRun } from './entities/payroll-run.entity';
import { PayrollRulesEngine } from './payroll-rules.engine';
import { EmployeesService } from '../employees/employees.service';
import { PayrollStatus } from './enums/payroll-status.enum';
import { AuditService } from '../audit/audit.service';

export interface PayrollAuditActor {
  id: string;
  role: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollRun)
    private readonly payrollRunRepository: Repository<PayrollRun>,
    private readonly employeesService: EmployeesService,
    private readonly rulesEngine: PayrollRulesEngine,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Processes a compliant calculation for an employee and writes the slip to the database
   */
  async calculateAndSaveWorkerPayroll(
    employeeId: string,
    payPeriod: string,
    organizationId: string,
    actor: PayrollAuditActor,
  ): Promise<PayrollRun> {
    // 1. Fetch active employee profile directly from database variables
    const worker = await this.employeesService.findOne(employeeId, organizationId);
    if (!worker) {
      throw new NotFoundException(`Worker with profile ID ${employeeId} does not exist.`);
    }

    const existingRun = await this.payrollRunRepository.findOne({
      where: { payPeriod, employee: { id: employeeId, organizationId } },
    });
    if (existingRun) {
      throw new ConflictException(
        'Payroll has already been calculated for this employee and period.',
      );
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
      status: PayrollStatus.DRAFT,
      createdByUserId: actor.id,
      employee: worker,
    });

    const savedRun = await this.payrollRunRepository.save(newRunRecord);
    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      actorRole: actor.role,
      entityType: 'PayrollRun',
      entityId: savedRun.id,
      action: 'PREPARED',
      after: this.auditSnapshot(savedRun),
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return savedRun;
  }

  /**
   * Fetches full calculations history array processed across a single period block
   */
  async getPeriodRuns(payPeriod: string, organizationId: string): Promise<PayrollRun[]> {
    return await this.payrollRunRepository.find({
      where: { payPeriod, employee: { organizationId } },
      relations: ['employee'],
    });
  }

  async approveRun(
    runId: string,
    organizationId: string,
    actor: PayrollAuditActor,
  ): Promise<PayrollRun> {
    const run = await this.findRun(runId, organizationId);
    if (run.status !== PayrollStatus.DRAFT) {
      throw new ConflictException('Only draft payroll runs can be approved.');
    }
    if (!run.createdByUserId) {
      throw new ConflictException(
        'This legacy payroll draft has no recorded preparer and cannot be approved.',
      );
    }
    if (run.createdByUserId === actor.id) {
      throw new ConflictException(
        'The preparer cannot approve their own payroll run. A different authorized user must approve it.',
      );
    }

    const result = await this.payrollRunRepository.update(
      { id: run.id, status: PayrollStatus.DRAFT },
      {
        status: PayrollStatus.APPROVED,
        approvedByUserId: actor.id,
        approvedAt: new Date(),
      },
    );
    if (result.affected !== 1) {
      throw new ConflictException('This payroll run has already changed.');
    }
    const approvedRun = await this.findRun(runId, organizationId);
    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      actorRole: actor.role,
      entityType: 'PayrollRun',
      entityId: approvedRun.id,
      action: 'APPROVED',
      before: this.auditSnapshot(run),
      after: this.auditSnapshot(approvedRun),
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return approvedRun;
  }

  async finalizeRun(
    runId: string,
    organizationId: string,
    actor: PayrollAuditActor,
  ): Promise<PayrollRun> {
    const run = await this.findRun(runId, organizationId);
    if (run.status !== PayrollStatus.APPROVED) {
      throw new ConflictException('Only approved payroll runs can be finalized.');
    }
    if (run.approvedByUserId !== actor.id) {
      throw new ConflictException(
        'Only the approver may finalize this payroll run.',
      );
    }

    const result = await this.payrollRunRepository.update(
      { id: run.id, status: PayrollStatus.APPROVED },
      {
        status: PayrollStatus.FINALIZED,
        finalizedByUserId: actor.id,
        finalizedAt: new Date(),
      },
    );
    if (result.affected !== 1) {
      throw new ConflictException('This payroll run has already changed.');
    }
    const finalizedRun = await this.findRun(runId, organizationId);
    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      actorRole: actor.role,
      entityType: 'PayrollRun',
      entityId: finalizedRun.id,
      action: 'FINALIZED',
      before: this.auditSnapshot(run),
      after: this.auditSnapshot(finalizedRun),
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return finalizedRun;
  }

  private auditSnapshot(run: PayrollRun): Record<string, unknown> {
    return {
      payPeriod: run.payPeriod,
      status: run.status,
      employeeId: run.employee?.id,
      createdByUserId: run.createdByUserId,
      approvedByUserId: run.approvedByUserId,
      approvedAt: run.approvedAt,
      finalizedByUserId: run.finalizedByUserId,
      finalizedAt: run.finalizedAt,
    };
  }

  private findRun(runId: string, organizationId: string): Promise<PayrollRun> {
    return this.payrollRunRepository.findOne({
      where: { id: runId, employee: { organizationId } },
      relations: ['employee'],
    }).then((run) => {
      if (!run) {
        throw new NotFoundException(`Payroll run with ID ${runId} not found.`);
      }
      return run;
    });
  }
}
