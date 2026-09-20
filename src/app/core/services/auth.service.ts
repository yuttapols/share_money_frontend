import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AuthResponse,
  AuthUser,
  ChangePasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshResponse,
  RefreshTokenRequest
} from '../models/auth.model';
import { ProfileApiService } from './profile-api.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenStorageService);
  private readonly profileApi = inject(ProfileApiService);
  private readonly currentUserState = signal<AuthUser | null>(null);
  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.currentUserState()));

  updateCurrentUser(name: string): void {
    const current = this.currentUserState();
    if (current) this.currentUserState.set({ ...current, name });
  }

  updateAvatarUrl(avatarUrl: string | null): void {
    const current = this.currentUserState();
    if (current) this.currentUserState.set({ ...current, avatarUrl });
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, request).pipe(
      map((response) => response.data),
      tap((response) => {
        this.tokens.save(response);
        this.currentUserState.set({
          username: response.username,
          name: response.name,
          role: response.role,
          creditorUsername: response.creditorUsername
        });
        this.loadAvatar();
      })
    );
  }

  restoreSession(): Observable<boolean> {
    if (this.currentUserState()) return of(true);
    if (!this.tokens.hasSession) return of(false);
    return this.http.get<ApiResponse<AuthUser>>(`${environment.apiUrl}/auth/me`).pipe(
      map((response) => response.data),
      tap((user) => {
        this.currentUserState.set(user);
        this.loadAvatar();
      }),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  private loadAvatar(): void {
    this.profileApi.getMine().subscribe((profile) => this.updateAvatarUrl(profile.avatarUrl));
  }

  refresh(): Observable<RefreshResponse> {
    const request: RefreshTokenRequest = { refreshToken: this.tokens.refreshToken ?? '' };
    return this.http.post<ApiResponse<RefreshResponse>>(`${environment.apiUrl}/auth/refresh`, request).pipe(
      map((response) => response.data),
      tap((response) => this.tokens.save(response))
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    const request: ChangePasswordRequest = { oldPassword, newPassword };
    return this.http
      .post<ApiResponse<null>>(`${environment.apiUrl}/auth/change-password`, request)
      .pipe(map(() => undefined));
  }

  logout(): void {
    const request: LogoutRequest = { refreshToken: this.tokens.refreshToken ?? '' };
    this.http
      .post<ApiResponse<null>>(`${environment.apiUrl}/auth/logout`, request)
      .pipe(finalize(() => this.endSession()))
      .subscribe();
  }
  endSession(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }
  private clearSession(): void {
    this.tokens.clear();
    this.currentUserState.set(null);
  }
}
