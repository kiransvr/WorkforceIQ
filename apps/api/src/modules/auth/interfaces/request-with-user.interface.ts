import { Request } from 'express';
import { UserRole } from '../../users/enums/user-role.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  mustChangePassword: boolean;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
