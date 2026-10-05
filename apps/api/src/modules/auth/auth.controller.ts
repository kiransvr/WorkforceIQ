import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from '../users/dto/change-password.dto';

const ACCESS_TOKEN_COOKIE = 'access_token';
const ACCESS_TOKEN_COOKIE_PATH = '/api/v1';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(
    @Body() credentials: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, user } = await this.authService.login(credentials);
    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('app.nodeEnv') === 'production',
      sameSite: 'lax',
      path: ACCESS_TOKEN_COOKIE_PATH,
      maxAge:
        this.configService.getOrThrow<number>('jwt.accessExpiresInSeconds') *
        1000,
    });
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      secure: this.configService.get<string>('app.nodeEnv') === 'production',
      sameSite: 'lax',
      path: ACCESS_TOKEN_COOKIE_PATH,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: RequestWithUser['user']) {
    return { user };
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: RequestWithUser['user'],
    @Req() request: RequestWithUser,
  ): Promise<{ success: true }> {
    await this.authService.changePassword(user.id, dto, {
      id: user.id,
      role: user.role,
      ipAddress: request.ip ?? null,
      userAgent: request.get('user-agent') ?? null,
    });
    return { success: true };
  }
}
