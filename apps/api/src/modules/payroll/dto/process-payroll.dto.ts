import { IsString, Matches, IsUUID } from 'class-validator';

export class ProcessPayrollDto {
  @IsUUID()
  employeeId!: string;

  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  payPeriod!: string;
}
