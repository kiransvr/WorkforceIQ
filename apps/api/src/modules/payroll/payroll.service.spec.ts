import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from './payroll.service';
import { PayrollRulesEngine } from './payroll-rules.engine';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PayrollRun } from './entities/payroll-run.entity';
import { EmployeesService } from '@modules/employees/employees.service';

describe('PayrollService', () => {
  let service: PayrollService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        PayrollRulesEngine,
        {
          provide: getRepositoryToken(PayrollRun),
          useValue: {}, // Mock repository object
        },
        {
          provide: EmployeesService,
          useValue: {}, // Mock employee service object
        },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
  });

  it('should be defined safely', () => {
    expect(service).toBeDefined();
  });
});
