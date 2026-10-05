import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from '../users/dto/change-password.dto';
import { UserManagementActor } from '../users/users.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(credentials: LoginDto) {
    const user = await this.usersService.findByEmailForAuthentication(
      credentials.email.trim().toLowerCase(),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }

    const passwordMatches = await argon2.verify(user.passwordHash, credentials.password);
    if (!passwordMatches || !user.isActive) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);
      }
      await this.usersService.save(user);
      throw new UnauthorizedException('Invalid email or password.');
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = now;
    await this.usersService.save(user);

    const accessToken = await this.jwtService.signAsync({ sub: user.id });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    actor: UserManagementActor,
  ): Promise<void> {
    const user = await this.usersService.findByIdForPasswordChange(userId);
    if (!user || !(await argon2.verify(user.passwordHash, dto.currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'The new password must be different from the current password.',
      );
    }

    await this.usersService.changePassword(
      user,
      await argon2.hash(dto.newPassword),
      actor,
    );
  }
}
