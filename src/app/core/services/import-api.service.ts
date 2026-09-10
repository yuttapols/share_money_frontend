import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ImportCommitResult, ImportValidationResult } from '../models/import.model';

@Injectable({ providedIn: 'root' })
export class ImportApiService {
  private readonly http = inject(HttpClient);

  validate(file: File): Observable<ImportValidationResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<ImportValidationResult>>(`${environment.apiUrl}/admin/imports/validate`, formData)
      .pipe(map((response) => response.data));
  }

  commit(batchId: string): Observable<ImportCommitResult> {
    return this.http
      .post<ApiResponse<ImportCommitResult>>(
        `${environment.apiUrl}/admin/imports/${encodeURIComponent(batchId)}/commit`,
        {}
      )
      .pipe(map((response) => response.data));
  }

  downloadErrors(batchId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/admin/imports/${encodeURIComponent(batchId)}/errors.xlsx`, {
      responseType: 'blob'
    });
  }
}
