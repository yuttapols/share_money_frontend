import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { ApiError } from '../models/api-error.model';

const FULL_PAGE_ERROR_CODES = [403, 429, 500];

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const injector = inject(Injector);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (FULL_PAGE_ERROR_CODES.includes(error.status)) {
        void injector.get(Router).navigateByUrl(`/error/${error.status}`);
        return throwError(() => error);
      }
      const apiError = error.error as ApiError | undefined;
      if (error.status !== 401 || request.url.includes('/auth/login')) {
        const toast = injector.get(SweetAlertService);
        if (apiError?.displayMessage) toast.errorMessage(apiError.displayMessage);
        else toast.error('errors.unexpected');
      }
      return throwError(() => error);
    })
  );
};
