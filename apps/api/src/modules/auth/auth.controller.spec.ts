import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };
  let controller: AuthController;
  let response: {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(
      authService as unknown as AuthService,
      configService as unknown as ConfigService,
    );
    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    configService.get.mockReturnValue('development');
    configService.getOrThrow.mockReturnValue(900);
  });

  it('sets an HttpOnly, SameSite cookie and omits the JWT from the login body', async () => {
    const user = {
      id: 'user-id',
      email: 'admin@example.com',
      role: 'ORG_ADMIN',
      organizationId: 'organization-id',
    };
    authService.login.mockResolvedValue({ accessToken: 'signed-token', user });

    const result = await controller.login(
      { email: 'admin@example.com', password: 'password' },
      response as unknown as Response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'signed-token',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/v1',
        maxAge: 900_000,
      }),
    );
    expect(result).toEqual({ user });
    expect(result).not.toHaveProperty('accessToken');
  });

  it('clears the access cookie on logout', () => {
    controller.logout(response as unknown as Response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/v1',
      }),
    );
  });
});
