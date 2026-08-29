import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CreateCreditorRequest,
  CreateDebtorRequest,
  Creditor,
  CreditorSummary,
  Debtor,
  DeleteDebtorResponse,
  UpdateDebtorRequest
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);

  createCreditor(request: CreateCreditorRequest): Observable<Creditor> {
    return this.http
      .post<ApiResponse<Creditor>>(`${environment.apiUrl}/creditors`, request)
      .pipe(map((response) => response.data));
  }

  getCreditors(): Observable<CreditorSummary[]> {
    return this.http
      .get<ApiResponse<CreditorSummary[]>>(`${environment.apiUrl}/creditors`)
      .pipe(map((response) => response.data));
  }

  createDebtor(request: CreateDebtorRequest): Observable<Debtor> {
    return this.http
      .post<ApiResponse<Debtor>>(`${environment.apiUrl}/debtors`, request)
      .pipe(map((response) => response.data));
  }

  getDebtors(search = ''): Observable<Debtor[]> {
    const options = search ? { params: new HttpParams().set('search', search) } : {};
    return this.http
      .get<ApiResponse<Debtor[]>>(`${environment.apiUrl}/debtors`, options)
      .pipe(map((response) => response.data));
  }

  updateDebtor(username: string, request: UpdateDebtorRequest): Observable<Debtor> {
    return this.http
      .put<ApiResponse<Debtor>>(`${environment.apiUrl}/debtors/${encodeURIComponent(username)}`, request)
      .pipe(map((response) => response.data));
  }

  deleteDebtor(username: string): Observable<DeleteDebtorResponse> {
    return this.http
      .delete<ApiResponse<DeleteDebtorResponse>>(`${environment.apiUrl}/debtors/${encodeURIComponent(username)}`)
      .pipe(map((response) => response.data));
  }
}
