import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DueReport } from '../models/phase-three.model';

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly http = inject(HttpClient);

  getDueReport(debtorUsername = '__all'): Observable<DueReport> {
    const params = new HttpParams().set('debtorUsername', debtorUsername);
    return this.http
      .get<ApiResponse<DueReport>>(`${environment.apiUrl}/reports/due`, { params })
      .pipe(map((response) => response.data));
  }

  downloadDueReport(debtorUsername = '__all'): Observable<Blob> {
    const params = new HttpParams().set('debtorUsername', debtorUsername);
    return this.http.get(`${environment.apiUrl}/reports/due/pdf`, { params, responseType: 'blob' });
  }
}
