import { UserRole } from './auth.model';

export interface AvatarResponse {
  avatarUrl: string;
}

export interface UserProfile {
  username: string;
  name: string;
  role: UserRole;
  phone: string;
  avatarUrl: string | null;
  preferredLanguage: 'th' | 'en';
}

export interface UpdateProfileRequest {
  name: string;
  phone: string;
  preferredLanguage: 'th' | 'en';
}
