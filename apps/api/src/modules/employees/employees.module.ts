import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee } from './entities/employee.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Employee]), AuthModule, AuditModule],
  controllers: [EmployeesController],
  providers: [EmployeesService, RolesGuard],
  exports: [EmployeesService],
})
export class EmployeesModule {}
