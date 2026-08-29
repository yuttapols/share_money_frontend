import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { LoginLog } from '../models/login-log.model';
import {
  AdminMenuItem,
  CreateMenuRequest,
  MenuPermissionsResponse,
  UpdateMenuPermissionsRequest,
  UpdateMenuRequest
} from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  getMenus(): Observable<AdminMenuItem[]> {
    return this.http
      .get<ApiResponse<AdminMenuItem[]>>(`${environment.apiUrl}/admin/menus`)
      .pipe(map((response) => response.data));
  }

  createMenu(request: CreateMenuRequest): Observable<AdminMenuItem> {
    return this.http
      .post<ApiResponse<AdminMenuItem>>(`${environment.apiUrl}/admin/menus`, request)
      .pipe(map((response) => response.data));
  }

  updateMenu(id: number, request: UpdateMenuRequest): Observable<AdminMenuItem> {
    return this.http
      .put<ApiResponse<AdminMenuItem>>(`${environment.apiUrl}/admin/menus/${id}`, request)
      .pipe(map((response) => response.data));
  }

  updateMenuPermissions(id: number, request: UpdateMenuPermissionsRequest): Observable<MenuPermissionsResponse> {
    return this.http
      .put<ApiResponse<MenuPermissionsResponse>>(`${environment.apiUrl}/admin/menus/${id}/permissions`, request)
      .pipe(map((response) => response.data));
  }

  deleteMenu(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/admin/menus/${id}`).pipe(map(() => undefined));
  }

  getLoginLogs(limit = 200): Observable<LoginLog[]> {
    const params = new HttpParams().set('limit', Math.min(Math.max(limit, 1), 1000));
    return this.http
      .get<ApiResponse<LoginLog[]>>(`${environment.apiUrl}/admin/login-logs`, { params })
      .pipe(map((response) => response.data));
  }
}
