import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee } from './entities/employee.entity'; // Ensure this path points exactly to your Employee entity file

@Module({
  imports: [
    // Register the TypeORM repository provider context explicitly for this module
    TypeOrmModule.forFeature([Employee]),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
