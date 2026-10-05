import { Controller, ForbiddenException, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../auth/interfaces/request-with-user.interface";
import {
  OrganizationSummary,
  OrganizationsService,
} from "./organizations.service";

@Controller({ path: "organizations", version: "1" })
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get("me")
  getCurrentOrganization(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrganizationSummary> {
    if (!user.organizationId) {
      throw new ForbiddenException(
        "This account is not assigned to an organization.",
      );
    }
    return this.organizationsService.getCurrentOrganization(
      user.organizationId,
    );
  }
}
