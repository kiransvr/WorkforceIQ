import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UserRole } from '../users/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmailForAuthentication: jest.fn(),
    save: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  it('verifies credentials and returns a signed access token', async () => {
    const passwordHash = await argon2.hash('a secure password');
    const user = {
      id: 'user-id',
      email: 'admin@example.com',
      passwordHash,
      role: UserRole.ORG_ADMIN,
      organizationId: 'organization-id',
      isActive: true,
      failedLoginAttempts: 2,
      lockedUntil: null,
      lastLoginAt: null,
    };
    usersService.findByEmailForAuthentication.mockResolvedValue(user);
    usersService.save.mockImplementation(async (value) => value);
    jwtService.signAsync.mockResolvedValue('signed-token');

    const result = await service.login({ email: ' ADMIN@example.com ', password: 'a secure password' });

    expect(usersService.findByEmailForAuthentication).toHaveBeenCalledWith('admin@example.com');
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lastLoginAt).toBeInstanceOf(Date);
    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-id' });
    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: 'user-id',
        email: 'admin@example.com',
        role: UserRole.ORG_ADMIN,
        organizationId: 'organization-id',
      },
    });
  });

  it('returns a generic authentication error and counts failed attempts', async () => {
    const user = {
      id: 'user-id',
      email: 'admin@example.com',
      passwordHash: await argon2.hash('correct password'),
      role: UserRole.ORG_ADMIN,
      organizationId: 'organization-id',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
    };
    usersService.findByEmailForAuthentication.mockResolvedValue(user);

    await expect(
      service.login({ email: 'admin@example.com', password: 'wrong password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(user.failedLoginAttempts).toBe(1);
    expect(usersService.save).toHaveBeenCalledWith(user);
  });

  it('locks the account after the fifth incorrect password', async () => {
    const user = {
      id: 'user-id',
      email: 'admin@example.com',
      passwordHash: await argon2.hash('correct password'),
      role: UserRole.ORG_ADMIN,
      organizationId: 'organization-id',
      isActive: true,
      failedLoginAttempts: 4,
      lockedUntil: null,
      lastLoginAt: null,
    };
    usersService.findByEmailForAuthentication.mockResolvedValue(user);

    await expect(
      service.login({ email: 'admin@example.com', password: 'wrong password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(user.failedLoginAttempts).toBe(5);
    expect(user.lockedUntil).toBeInstanceOf(Date);
  });

  it('does not reveal whether an email exists', async () => {
    usersService.findByEmailForAuthentication.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'any password' }),
    ).rejects.toThrow('Invalid email or password.');
  });
});
