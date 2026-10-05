import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Employee } from "../employees/entities/employee.entity";
import { Branch } from "./entities/branch.entity";
import { Department } from "./entities/department.entity";
import { Organization } from "./entities/organization.entity";

export interface OrganizationSummary {
  id: string;
  name: string;
  countryCode: string;
  currencyCode: string;
  locale: string;
  isActive: boolean;
  createdAt: Date;
  employeeCount: number;
  departmentCount: number;
  branches: {
    id: string;
    name: string;
    address: string | null;
    isActive: boolean;
    departmentCount: number;
  }[];
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async getCurrentOrganization(
    organizationId: string,
  ): Promise<OrganizationSummary> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      select: [
        "id",
        "name",
        "countryCode",
        "currencyCode",
        "locale",
        "isActive",
        "createdAt",
      ],
    });
    if (!organization) {
      throw new NotFoundException(
        "The organization assigned to this account was not found.",
      );
    }

    const [employeeCount, departmentCount, branches] = await Promise.all([
      this.employeeRepository.count({ where: { organizationId } }),
      this.departmentRepository.count({ where: { organizationId } }),
      this.branchRepository.find({
        where: { organizationId },
        select: ["id", "name", "address", "isActive"],
        order: { name: "ASC" },
      }),
    ]);

    const branchDepartmentCounts = await Promise.all(
      branches.map((branch) =>
        this.departmentRepository.count({
          where: { branchId: branch.id, organizationId },
        }),
      ),
    );

    return {
      ...organization,
      employeeCount,
      departmentCount,
      branches: branches.map((branch, index) => ({
        ...branch,
        departmentCount: branchDepartmentCounts[index],
      })),
    };
  }
}
