import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DocumentItem } from '../models/phase-three.model';

@Injectable({ providedIn: 'root' })
export class DocumentApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<DocumentItem[]> {
    return this.http
      .get<ApiResponse<DocumentItem[]>>(`${environment.apiUrl}/documents`)
      .pipe(map((response) => response.data));
  }

  upload(title: string, file: File, debtorUsername = ''): Observable<DocumentItem> {
    const formData = new FormData();
    formData.append('title', title);
    if (debtorUsername) formData.append('debtorUsername', debtorUsername);
    formData.append('file', file);
    return this.http
      .post<ApiResponse<DocumentItem>>(`${environment.apiUrl}/documents`, formData)
      .pipe(map((response) => response.data));
  }

  download(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/documents/${id}/download`, { responseType: 'blob' });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${environment.apiUrl}/documents/${id}`).pipe(map(() => undefined));
  }
}
