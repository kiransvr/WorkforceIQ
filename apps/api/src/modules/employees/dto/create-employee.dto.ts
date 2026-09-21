// Replace the very first line with this:
import { IsString, IsEmail, IsNotEmpty, IsNumber, Min, Length } from 'class-validator';

export class CreateEmployeeDto {
  // ... (keep names the same)

  // Update these three properties to use @Min:
  @IsNumber()
  @Min(0)
  basicSalary: number;

  @IsNumber()
  @Min(0)
  transportAllowance: number;

  @IsNumber()
  @Min(0)
  otherAllowances: number;

  // ... (keep the rest of the file exactly the same)
}
