import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { EmployeesModule } from '../employees/employees.module';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditModule } from '../audit/audit.module';

// TypeORM payroll entities
import { PayrollRun } from './entities/payroll-run.entity'; 
import { PayrollLineItem } from './entities/payroll-line-item.entity';

// Fixed Import Path
import { PayrollRulesEngine } from './payroll-rules.engine'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([PayrollRun, PayrollLineItem]),
    EmployeesModule,
    AuthModule,
    AuditModule,
  ],
  controllers: [PayrollController],
  providers: [
    PayrollService, 
    PayrollRulesEngine,
    RolesGuard,
  ],
  exports: [PayrollService],
})
export class PayrollModule {}
