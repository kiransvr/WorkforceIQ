import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Employee } from "../employees/entities/employee.entity";
import { Branch } from "./entities/branch.entity";
import { Department } from "./entities/department.entity";
import { Organization } from "./entities/organization.entity";
import { OrganizationsService } from "./organizations.service";

describe("OrganizationsService", () => {
  let service: OrganizationsService;
  const organizationRepository = { findOne: jest.fn() };
  const branchRepository = { find: jest.fn() };
  const departmentRepository = { count: jest.fn() };
  const employeeRepository = { count: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganizationsService(
      organizationRepository as unknown as Repository<Organization>,
      branchRepository as unknown as Repository<Branch>,
      departmentRepository as unknown as Repository<Department>,
      employeeRepository as unknown as Repository<Employee>,
    );
  });

  it("returns the authenticated organization with scoped workforce and location counts", async () => {
    const organization = {
      id: "organization-id",
      name: "WorkforceIQ Test Org",
      countryCode: "ET",
      currencyCode: "ETB",
      locale: "en-ET",
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    } as Organization;
    const branches = [
      { id: "branch-a", name: "Addis", address: "Central", isActive: true },
      { id: "branch-b", name: "Hawassa", address: null, isActive: false },
    ] as Branch[];
    organizationRepository.findOne.mockResolvedValue(organization);
    branchRepository.find.mockResolvedValue(branches);
    employeeRepository.count.mockResolvedValue(4);
    departmentRepository.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    const result = await service.getCurrentOrganization("organization-id");

    expect(organizationRepository.findOne).toHaveBeenCalledWith({
      where: { id: "organization-id" },
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
    expect(employeeRepository.count).toHaveBeenCalledWith({
      where: { organizationId: "organization-id" },
    });
    expect(departmentRepository.count).toHaveBeenNthCalledWith(1, {
      where: { organizationId: "organization-id" },
    });
    expect(branchRepository.find).toHaveBeenCalledWith({
      where: { organizationId: "organization-id" },
      select: ["id", "name", "address", "isActive"],
      order: { name: "ASC" },
    });
    expect(result).toMatchObject({
      id: "organization-id",
      employeeCount: 4,
      departmentCount: 3,
      branches: [
        { id: "branch-a", departmentCount: 2 },
        { id: "branch-b", departmentCount: 1 },
      ],
    });
  });

  it("returns not found when the account organization no longer exists", async () => {
    organizationRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getCurrentOrganization("organization-id"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(branchRepository.find).not.toHaveBeenCalled();
    expect(employeeRepository.count).not.toHaveBeenCalled();
  });
});
