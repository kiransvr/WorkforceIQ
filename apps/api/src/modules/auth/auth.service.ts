import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

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
      },
    };
  }
}
