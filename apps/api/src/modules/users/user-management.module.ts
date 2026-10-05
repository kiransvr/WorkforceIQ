import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from './users.module';
import { OrganizationUsersController } from './organization-users.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [OrganizationUsersController],
  providers: [RolesGuard],
})
export class UserManagementModule {}
