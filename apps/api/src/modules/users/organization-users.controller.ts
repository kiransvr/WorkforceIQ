import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  RequestWithUser,
} from '../auth/interfaces/request-with-user.interface';
import { UserRole } from './enums/user-role.enum';
import { CreateOrganizationUserDto } from './dto/create-organization-user.dto';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto';
import { OrganizationUserResponse, UsersService } from './users.service';

@Controller({ path: 'organization-users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORG_ADMIN)
export class OrganizationUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrganizationUserResponse[]> {
    return this.usersService.listOrganizationUsers(
      this.organizationIdFor(user),
    );
  }

  @Post()
  create(
    @Body() dto: CreateOrganizationUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ): Promise<OrganizationUserResponse> {
    return this.usersService.createOrganizationUser(
      dto,
      this.organizationIdFor(user),
      this.auditActor(user, request),
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ): Promise<OrganizationUserResponse> {
    return this.usersService.updateOrganizationUser(
      id,
      dto,
      this.organizationIdFor(user),
      this.auditActor(user, request),
    );
  }

  private organizationIdFor(user: AuthenticatedUser): string {
    if (!user.organizationId) {
      throw new ForbiddenException(
        'This account is not assigned to an organization.',
      );
    }
    return user.organizationId;
  }

  private auditActor(
    user: AuthenticatedUser,
    request: RequestWithUser,
  ): {
    id: string;
    role: string;
    ipAddress: string | null;
    userAgent: string | null;
  } {
    return {
      id: user.id,
      role: user.role,
      ipAddress: request.ip ?? null,
      userAgent: request.get('user-agent') ?? null,
    };
  }
}
