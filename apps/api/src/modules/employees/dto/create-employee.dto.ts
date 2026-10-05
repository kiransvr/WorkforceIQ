import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fatherName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  grandFatherName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tinNumber!: string;

  @IsNumber()
  @Min(0)
  basicSalary!: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsNumber()
  @Min(0)
  transportAllowance?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsNumber()
  @Min(0)
  otherAllowances?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(255)
  region?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(255)
  subCity?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(255)
  woreda?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(255)
  kebele?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(255)
  bankName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bankAccountNumber!: string;
}
