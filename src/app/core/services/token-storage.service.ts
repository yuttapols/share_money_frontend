import { Injectable } from '@angular/core';
import { AuthResponse, RefreshResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly accessTokenKey = 'shareMoney.accessToken';
  private readonly refreshTokenKey = 'shareMoney.refreshToken';
  get accessToken(): string | null {
    return sessionStorage.getItem(this.accessTokenKey);
  }
  get refreshToken(): string | null {
    return sessionStorage.getItem(this.refreshTokenKey);
  }
  get hasSession(): boolean {
    return Boolean(this.accessToken && this.refreshToken);
  }
  save(tokens: AuthResponse | RefreshResponse): void {
    sessionStorage.setItem(this.accessTokenKey, tokens.accessToken);
    sessionStorage.setItem(this.refreshTokenKey, tokens.refreshToken);
  }
  clear(): void {
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
  }
}
