import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PayrollRun } from './entities/payroll-run.entity';
import { PayrollRulesEngine } from './payroll-rules.engine';
import { EmployeesModule } from '../Employees/employees.module'; // Import the employee module folder context

@Module({
  imports: [
    TypeOrmModule.forFeature([PayrollRun]),
    EmployeesModule, // Injecting EmployeesModule makes EmployeesService available here
  ],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollRulesEngine],
  exports: [PayrollService],
})
export class PayrollModule {}
