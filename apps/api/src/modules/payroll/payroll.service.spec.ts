import { ConflictException } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollRulesEngine } from './payroll-rules.engine';
import { PayrollRun } from './entities/payroll-run.entity';
import { EmployeesService } from '../employees/employees.service';
import { Repository, UpdateResult } from 'typeorm';
import { PayrollStatus } from './enums/payroll-status.enum';

describe('PayrollService', () => {
  let service: PayrollService;
  const payrollRunRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };
  const employeesService = {
    findOne: jest.fn(),
  };
  const rulesEngine = {
    calculatePayroll: jest.fn(),
  };
  const auditService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service = new PayrollService(
      payrollRunRepository as unknown as Repository<PayrollRun>,
      employeesService as unknown as EmployeesService,
      rulesEngine as unknown as PayrollRulesEngine,
      auditService as never,
    );
    auditService.record.mockResolvedValue(undefined);
  });

  it('records which user prepared a payroll draft', async () => {
    const employee = { id: 'employee-id', basicSalary: 10_000 };
    const draft = { id: 'run-id', status: PayrollStatus.DRAFT };
    employeesService.findOne.mockResolvedValue(employee);
    payrollRunRepository.findOne.mockResolvedValue(null);
    rulesEngine.calculatePayroll.mockReturnValue({
      basicSalary: 10_000,
      grossTaxableIncome: 10_000,
      employmentIncomeTax: 0,
      employeePension: 700,
      employerPension: 1100,
      netPay: 9300,
    });
    payrollRunRepository.create.mockReturnValue(draft);
    payrollRunRepository.save.mockResolvedValue(draft);

    const result = await service.calculateAndSaveWorkerPayroll(
      'employee-id',
      '2026-10',
      'organization-id',
      { id: 'preparer-id', role: 'org_admin' },
    );

    expect(payrollRunRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PayrollStatus.DRAFT,
        createdByUserId: 'preparer-id',
      }),
    );
    expect(result).toBe(draft);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PREPARED',
        entityType: 'PayrollRun',
      }),
    );
  });

  it('prevents the preparer from approving their own draft', async () => {
    payrollRunRepository.findOne.mockResolvedValue({
      id: 'run-id',
      status: PayrollStatus.DRAFT,
      createdByUserId: 'preparer-id',
    });

    await expect(
      service.approveRun('run-id', 'organization-id', {
        id: 'preparer-id',
        role: 'org_admin',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(payrollRunRepository.update).not.toHaveBeenCalled();
  });

  it('does not approve legacy drafts with no recorded preparer', async () => {
    payrollRunRepository.findOne.mockResolvedValue({
      id: 'run-id',
      status: PayrollStatus.DRAFT,
      createdByUserId: null,
    });

    await expect(
      service.approveRun('run-id', 'organization-id', {
        id: 'approver-id',
        role: 'payroll_officer',
      }),
    ).rejects.toThrow('no recorded preparer');
    expect(payrollRunRepository.update).not.toHaveBeenCalled();
  });

  it('records a different user as the approver', async () => {
    payrollRunRepository.findOne
      .mockResolvedValueOnce({
        id: 'run-id',
        status: PayrollStatus.DRAFT,
        createdByUserId: 'preparer-id',
      })
      .mockResolvedValueOnce({
        id: 'run-id',
        status: PayrollStatus.APPROVED,
        createdByUserId: 'preparer-id',
        approvedByUserId: 'approver-id',
      });
    payrollRunRepository.update.mockResolvedValue({
      affected: 1,
    } as UpdateResult);

    const approved = await service.approveRun(
      'run-id',
      'organization-id',
      { id: 'approver-id', role: 'payroll_officer' },
    );

    expect(payrollRunRepository.update).toHaveBeenCalledWith(
      { id: 'run-id', status: PayrollStatus.DRAFT },
      expect.objectContaining({
        status: PayrollStatus.APPROVED,
        approvedByUserId: 'approver-id',
        approvedAt: expect.any(Date),
      }),
    );
    expect(approved.status).toBe(PayrollStatus.APPROVED);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'APPROVED',
        actorId: 'approver-id',
      }),
    );
  });

  it('allows only the approver to finalize an approved payroll run', async () => {
    payrollRunRepository.findOne.mockResolvedValue({
      id: 'run-id',
      status: PayrollStatus.APPROVED,
      approvedByUserId: 'approver-id',
    });

    await expect(
      service.finalizeRun('run-id', 'organization-id', {
        id: 'preparer-id',
        role: 'org_admin',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(payrollRunRepository.update).not.toHaveBeenCalled();
  });

  it('finalizes an approved payroll run without initiating payment', async () => {
    payrollRunRepository.findOne
      .mockResolvedValueOnce({
        id: 'run-id',
        status: PayrollStatus.APPROVED,
        approvedByUserId: 'approver-id',
      })
      .mockResolvedValueOnce({
        id: 'run-id',
        status: PayrollStatus.FINALIZED,
        finalizedByUserId: 'approver-id',
      });
    payrollRunRepository.update.mockResolvedValue({
      affected: 1,
    } as UpdateResult);

    const finalized = await service.finalizeRun(
      'run-id',
      'organization-id',
      { id: 'approver-id', role: 'payroll_officer' },
    );

    expect(payrollRunRepository.update).toHaveBeenCalledWith(
      { id: 'run-id', status: PayrollStatus.APPROVED },
      expect.objectContaining({
        status: PayrollStatus.FINALIZED,
        finalizedByUserId: 'approver-id',
        finalizedAt: expect.any(Date),
      }),
    );
    expect(finalized.status).toBe(PayrollStatus.FINALIZED);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'FINALIZED',
        actorId: 'approver-id',
      }),
    );
  });
});
