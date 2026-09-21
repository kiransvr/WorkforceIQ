import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';
import redisConfig from '@config/redis.config';
import jwtConfig from '@config/jwt.config';
import storageConfig from '@config/storage.config';
import aiConfig from '@config/ai.config';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { OrganizationsModule } from '@modules/organizations/organizations.module';
import { EmployeesModule } from '@modules/employees/employees.module';
import { AttendanceModule } from '@modules/attendance/attendance.module';
import { LeaveModule } from '@modules/leave/leave.module';
import { PayrollModule } from '@modules/payroll/payroll.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { AuditModule } from '@modules/audit/audit.module';
import { CountryProfilesModule } from '@modules/country-profiles/country-profiles.module';

@Module({
  imports: [
    // ─── Config (global) ───────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, storageConfig, aiConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // ─── Rate limiting ─────────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
    ]),

    // ─── Infrastructure ────────────────────────────────────────
    DatabaseModule,

    // ─── Domain modules ────────────────────────────────────────
    AuthModule,
    UsersModule,
    OrganizationsModule,
    EmployeesModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    ReportsModule,
    AuditModule,
    CountryProfilesModule,
  ],
})
export class AppModule {}
