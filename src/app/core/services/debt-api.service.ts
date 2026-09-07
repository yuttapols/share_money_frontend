import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CreateDebtRequest,
  CreateOpenRecordRequest,
  DebtDetail,
  DebtSummary,
  PayInstallmentRequest,
  PayInterestRequest,
  UpdateOpenRecordRequest
} from '../models/debt.model';

@Injectable({ providedIn: 'root' })
export class DebtApiService {
  private readonly http = inject(HttpClient);

  getAll(debtorUsername = '', search = ''): Observable<DebtSummary[]> {
    let params = new HttpParams();
    if (debtorUsername) params = params.set('debtorUsername', debtorUsername);
    if (search) params = params.set('search', search);
    return this.http
      .get<ApiResponse<DebtSummary[]>>(`${environment.apiUrl}/debts`, { params })
      .pipe(map((response) => response.data));
  }

  getById(id: number): Observable<DebtDetail> {
    return this.http
      .get<ApiResponse<DebtDetail>>(`${environment.apiUrl}/debts/${id}`)
      .pipe(map((response) => response.data));
  }

  create(request: CreateDebtRequest): Observable<DebtDetail> {
    return this.http
      .post<ApiResponse<DebtDetail>>(`${environment.apiUrl}/debts`, request)
      .pipe(map((response) => response.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${environment.apiUrl}/debts/${id}`).pipe(map(() => undefined));
  }

  reorder(orderedIds: number[]): Observable<void> {
    return this.http
      .put<ApiResponse<unknown>>(`${environment.apiUrl}/debts/reorder`, { orderedIds })
      .pipe(map(() => undefined));
  }

  payInstallment(id: number, no: number, request: PayInstallmentRequest): Observable<DebtDetail> {
    return this.http
      .post<ApiResponse<DebtDetail>>(`${environment.apiUrl}/debts/${id}/installments/${no}/pay`, request)
      .pipe(map((response) => response.data));
  }

  payInterest(id: number, no: number, request: PayInterestRequest): Observable<DebtDetail> {
    return this.http
      .post<ApiResponse<DebtDetail>>(`${environment.apiUrl}/debts/${id}/installments/${no}/pay-interest`, request)
      .pipe(map((response) => response.data));
  }

  setFullPaid(id: number, request: PayInstallmentRequest): Observable<DebtDetail> {
    return this.http
      .post<ApiResponse<DebtDetail>>(`${environment.apiUrl}/debts/${id}/full-paid`, request)
      .pipe(map((response) => response.data));
  }

  createOpenRecord(id: number, request: CreateOpenRecordRequest): Observable<DebtDetail> {
    return this.http
      .post<ApiResponse<DebtDetail>>(`${environment.apiUrl}/debts/${id}/open-records`, request)
      .pipe(map((response) => response.data));
  }

  updateOpenRecord(id: number, no: number, request: UpdateOpenRecordRequest): Observable<DebtDetail> {
    return this.http
      .put<ApiResponse<DebtDetail>>(`${environment.apiUrl}/debts/${id}/open-records/${no}`, request)
      .pipe(map((response) => response.data));
  }

  deleteOpenRecord(id: number, no: number): Observable<DebtDetail> {
    return this.http
      .delete<ApiResponse<DebtDetail>>(`${environment.apiUrl}/debts/${id}/open-records/${no}`)
      .pipe(map((response) => response.data));
  }
}
