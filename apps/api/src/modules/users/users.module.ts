import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuditModule],
  controllers: [],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
