import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { BankAccount } from '../models/phase-three.model';

@Injectable({ providedIn: 'root' })
export class BankAccountApiService {
  private readonly http = inject(HttpClient);

  getMine(): Observable<BankAccount> {
    return this.http
      .get<ApiResponse<BankAccount>>(`${environment.apiUrl}/bank-accounts/me`)
      .pipe(map((response) => response.data));
  }

  updateMine(request: BankAccount): Observable<BankAccount> {
    return this.http
      .put<ApiResponse<BankAccount>>(`${environment.apiUrl}/bank-accounts/me`, request)
      .pipe(map((response) => response.data));
  }
}
