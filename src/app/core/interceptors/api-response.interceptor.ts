import { HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

export const apiResponseInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    map((event) => {
      if (event.type !== HttpEventType.Response) return event;
      const response = event.body as Partial<ApiResponse<unknown>> | null;
      if (response?.status === 'E') {
        throw new HttpErrorResponse({
          error: response,
          status: event.status || 400,
          statusText: response.errorDesc,
          url: event.url ?? request.url
        });
      }
      return event;
    })
  );
