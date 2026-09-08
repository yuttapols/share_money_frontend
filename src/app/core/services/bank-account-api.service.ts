import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Bank, BankAccount, BankAccountRequest } from '../models/phase-three.model';

@Injectable({ providedIn: 'root' })
export class BankAccountApiService {
  private readonly http = inject(HttpClient);

  getBanks(): Observable<Bank[]> {
    return this.http.get<ApiResponse<Bank[]>>(`${environment.apiUrl}/banks`).pipe(map((response) => response.data));
  }

  getAll(): Observable<BankAccount[]> {
    return this.http
      .get<ApiResponse<BankAccount[]>>(`${environment.apiUrl}/bank-accounts`)
      .pipe(map((response) => response.data));
  }

  create(request: BankAccountRequest): Observable<BankAccount> {
    return this.http
      .post<ApiResponse<BankAccount>>(`${environment.apiUrl}/bank-accounts`, request)
      .pipe(map((response) => response.data));
  }

  update(id: number, request: BankAccountRequest): Observable<BankAccount> {
    return this.http
      .put<ApiResponse<BankAccount>>(`${environment.apiUrl}/bank-accounts/${id}`, request)
      .pipe(map((response) => response.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${environment.apiUrl}/bank-accounts/${id}`)
      .pipe(map(() => undefined));
  }
}
