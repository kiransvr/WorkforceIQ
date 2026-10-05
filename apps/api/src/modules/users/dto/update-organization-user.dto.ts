import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class UpdateOrganizationUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
