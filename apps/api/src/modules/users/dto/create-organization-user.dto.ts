import { IsEnum, IsString, IsEmail, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export const ORGANIZATION_MANAGED_ROLES = [
  UserRole.BRANCH_MANAGER,
  UserRole.PAYROLL_OFFICER,
  UserRole.EMPLOYEE,
  UserRole.AUDITOR,
] as const;

export type OrganizationManagedRole = (typeof ORGANIZATION_MANAGED_ROLES)[number];

export class CreateOrganizationUserDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  temporaryPassword!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
