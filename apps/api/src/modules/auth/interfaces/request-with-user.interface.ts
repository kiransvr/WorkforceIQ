import { Request } from 'express';
import { User } from '@modules/users/entities/user.entity';

export interface JwtPayload {
  sub: string;           // user id
  email: string;
  role: string;
  organizationId: string | null;
}

export interface RequestWithUser extends Request {
  user: any;
}
