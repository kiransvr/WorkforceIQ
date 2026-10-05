import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { AuditService } from '../audit/audit.service';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import {
  CreateOrganizationUserDto,
  ORGANIZATION_MANAGED_ROLES,
  OrganizationManagedRole,
} from './dto/create-organization-user.dto';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto';

export interface UserManagementActor {
  id: string;
  role: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export type OrganizationUserResponse = Pick<
  User,
  | 'id'
  | 'email'
  | 'role'
  | 'isActive'
  | 'mustChangePassword'
  | 'lastLoginAt'
  | 'createdAt'
>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  findByEmailForAuthentication(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .addSelect('user.lockedUntil')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  findActiveById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, isActive: true },
    });
  }

  save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async listOrganizationUsers(
    organizationId: string,
  ): Promise<OrganizationUserResponse[]> {
    return this.userRepository.find({
      where: { organizationId },
      select: [
        'id',
        'email',
        'role',
        'isActive',
        'mustChangePassword',
        'lastLoginAt',
        'createdAt',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async createOrganizationUser(
    dto: CreateOrganizationUserDto,
    organizationId: string,
    actor: UserManagementActor,
  ): Promise<OrganizationUserResponse> {
    this.assertManagedRole(dto.role);
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const user = this.userRepository.create({
      email,
      passwordHash: await argon2.hash(dto.temporaryPassword),
      role: dto.role,
      organizationId,
      isActive: true,
      mustChangePassword: true,
    });
    const savedUser = await this.userRepository.save(user);
    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      actorRole: actor.role,
      entityType: 'User',
      entityId: savedUser.id,
      action: 'CREATED',
      after: this.auditSnapshot(savedUser),
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return this.toResponse(savedUser);
  }

  async updateOrganizationUser(
    userId: string,
    dto: UpdateOrganizationUserDto,
    organizationId: string,
    actor: UserManagementActor,
  ): Promise<OrganizationUserResponse> {
    if (actor.id === userId) {
      throw new ForbiddenException(
        'You cannot change your own role or deactivate your own account.',
      );
    }
    const user = await this.userRepository.findOne({
      where: { id: userId, organizationId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    this.assertManagedRole(user.role);
    if (dto.role !== undefined) {
      this.assertManagedRole(dto.role);
    }
    if (dto.role === undefined && dto.isActive === undefined) {
      throw new ConflictException('Specify a role or active status to update.');
    }

    const before = this.auditSnapshot(user);
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }
    const savedUser = await this.userRepository.save(user);
    await this.auditService.record({
      organizationId,
      actorId: actor.id,
      actorRole: actor.role,
      entityType: 'User',
      entityId: savedUser.id,
      action:
        dto.isActive === false
          ? 'DEACTIVATED'
          : dto.isActive === true
            ? 'REACTIVATED'
            : 'ROLE_UPDATED',
      before,
      after: this.auditSnapshot(savedUser),
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
    return this.toResponse(savedUser);
  }

  findByIdForPasswordChange(id: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id AND user.isActive = :isActive', {
        id,
        isActive: true,
      })
      .getOne();
  }

  async changePassword(
    user: User,
    passwordHash: string,
    actor: UserManagementActor,
  ): Promise<void> {
    user.passwordHash = passwordHash;
    user.mustChangePassword = false;
    await this.userRepository.save(user);
    if (user.organizationId) {
      await this.auditService.record({
        organizationId: user.organizationId,
        actorId: user.id,
        actorRole: user.role,
        entityType: 'User',
        entityId: user.id,
        action: 'PASSWORD_CHANGED',
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }
  }

  private assertManagedRole(role: UserRole): asserts role is OrganizationManagedRole {
    if (!ORGANIZATION_MANAGED_ROLES.includes(role as OrganizationManagedRole)) {
      throw new ForbiddenException(
        'Organization admins may assign branch manager, payroll officer, employee, or auditor roles only.',
      );
    }
  }

  private auditSnapshot(user: User): Record<string, unknown> {
    return {
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    };
  }

  private toResponse(user: User): OrganizationUserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
