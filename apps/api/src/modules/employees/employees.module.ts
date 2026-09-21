import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service.ts';
import { EmployeesController } from './employees.controller.ts/index.js';
import { Employee } from './entities/employee.entity';

@Module({
  imports: [
    // Registers the Employee database entity for database queries
    TypeOrmModule.forFeature([Employee])
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  // CRITICAL: Exporting the service allows PayrollModule to import and use it
  exports: [EmployeesService], 
})
export class EmployeesModule {}
