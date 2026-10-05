import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Branch } from "./entities/branch.entity";
import { Department } from "./entities/department.entity";
import { Organization } from "./entities/organization.entity";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
import { Employee } from "../employees/entities/employee.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Branch, Department, Employee]),
    AuthModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, RolesGuard],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
