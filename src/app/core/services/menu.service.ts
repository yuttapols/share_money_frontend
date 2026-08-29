import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { MenuItem } from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly menuState = signal<MenuItem[]>([]);
  readonly menuTree = this.menuState.asReadonly();
  loadMenu() {
    return this.http
      .get<ApiResponse<MenuItem[]>>(`${environment.apiUrl}/menus`)
      .pipe(map((response) => response.data))
      .pipe(tap((items) => this.menuState.set(items)));
  }
  clear(): void {
    this.menuState.set([]);
  }
}
