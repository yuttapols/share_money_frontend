import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ImportApiService {
  private readonly http = inject(HttpClient);

  importLegacyData(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<null>>(`${environment.apiUrl}/admin/migration/legacy-import`, formData)
      .pipe(map(() => undefined));
  }
}
