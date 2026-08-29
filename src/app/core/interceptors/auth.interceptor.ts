import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, finalize, switchMap, take, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

let refreshing = false;
const refreshedToken = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const tokens = inject(TokenStorageService);
  const isAuthEndpoint =
    request.url.startsWith(`${environment.apiUrl}/auth/login`) ||
    request.url.startsWith(`${environment.apiUrl}/auth/refresh`);
  const authenticatedRequest =
    tokens.accessToken && !isAuthEndpoint
      ? request.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } })
      : request;
  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthEndpoint || !tokens.refreshToken) return throwError(() => error);
      if (refreshing)
        return refreshedToken.pipe(
          filter(Boolean),
          take(1),
          switchMap((token) => next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
        );
      refreshing = true;
      refreshedToken.next(null);
      return auth.refresh().pipe(
        switchMap((response) => {
          refreshedToken.next(response.accessToken);
          return next(request.clone({ setHeaders: { Authorization: `Bearer ${response.accessToken}` } }));
        }),
        catchError((refreshError) => {
          auth.endSession();
          return throwError(() => refreshError);
        }),
        finalize(() => (refreshing = false))
      );
    })
  );
};
