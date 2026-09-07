export type UserRole = 'ADMIN' | 'CREDITOR' | 'DEBTOR';
export interface AuthUser {
  username: string;
  name: string;
  role: UserRole;
  creditorUsername?: string;
}
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
export interface AuthResponse extends AuthUser {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
