import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Slip, SlipDebtorsResponse } from '../models/phase-three.model';

@Injectable({ providedIn: 'root' })
export class SlipApiService {
  private readonly http = inject(HttpClient);

  upload(creditorUsername: string, file: File): Observable<Slip> {
    const formData = new FormData();
    formData.append('creditorUsername', creditorUsername);
    formData.append('file', file);
    return this.http
      .post<ApiResponse<Slip>>(`${environment.apiUrl}/slips`, formData)
      .pipe(map((response) => response.data));
  }

  getAll(debtorUsername = '', creditorUsername = ''): Observable<Slip[]> {
    let params = new HttpParams();
    if (debtorUsername) params = params.set('debtorUsername', debtorUsername);
    if (creditorUsername) params = params.set('creditorUsername', creditorUsername);
    return this.http
      .get<ApiResponse<Slip[]>>(`${environment.apiUrl}/slips`, { params })
      .pipe(map((response) => response.data));
  }

  getFile(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/slips/${id}/file`, { responseType: 'blob' });
  }

  getThumbnail(id: number, width = 1200): Observable<Blob> {
    const params = new HttpParams().set('w', Math.min(Math.max(width, 120), 1600));
    return this.http.get(`${environment.apiUrl}/slips/${id}/thumbnail`, { params, responseType: 'blob' });
  }

  getSubmittedDebtors(): Observable<string[]> {
    return this.http
      .get<ApiResponse<SlipDebtorsResponse>>(`${environment.apiUrl}/slips/debtors`)
      .pipe(map((response) => response.data.debtorUsernames));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${environment.apiUrl}/slips/${id}`).pipe(map(() => undefined));
  }
}
