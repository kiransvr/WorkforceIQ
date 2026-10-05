import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);
    if (!authenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.user.mustChangePassword && !this.isPasswordSetupRoute(request)) {
      throw new ForbiddenException(
        'Change your temporary password before using this application.',
      );
    }
    return true;
  }

  private isPasswordSetupRoute(request: RequestWithUser): boolean {
    const path = request.path;
    return (
      (request.method === 'GET' && path.endsWith('/auth/me')) ||
      (request.method === 'PATCH' && path.endsWith('/auth/password')) ||
      (request.method === 'POST' && path.endsWith('/auth/logout'))
    );
  }
}
