import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { EmployeesModule } from '../employees/employees.module';

// TypeORM payroll entities
import { PayrollRun } from './entities/payroll-run.entity'; 
import { PayrollLineItem } from './entities/payroll-line-item.entity';

// Fixed Import Path
import { PayrollRulesEngine } from './payroll-rules.engine'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([PayrollRun, PayrollLineItem]),
    EmployeesModule,
  ],
  controllers: [PayrollController],
  providers: [
    PayrollService, 
    PayrollRulesEngine
  ],
  exports: [PayrollService],
})
export class PayrollModule {}
