import { UserRole } from './auth.model';

export interface LoginLog {
  timestamp: string;
  username: string;
  role: UserRole;
  action: string;
}
