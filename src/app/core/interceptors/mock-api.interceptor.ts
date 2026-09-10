import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, UserRole } from '../models/auth.model';
import { MenuItem } from '../models/menu.model';

const users: Record<string, { name: string; role: UserRole }> = {
  admin: { name: 'ผู้ดูแลระบบ', role: 'ADMIN' },
  creditor: { name: 'วรรณา เจ้าหนี้', role: 'CREDITOR' },
  debtor: { name: 'สมหญิง ลูกหนี้', role: 'DEBTOR' }
};

const baseMenus: MenuItem[] = [
  { id: 1, menuKey: 'menu.dashboard', icon: 'pi-chart-pie', route: '/dashboard', sortOrder: 0, children: [] },
  { id: 2, menuKey: 'menu.debts', icon: 'pi-receipt', route: '/debts', sortOrder: 1, children: [] },
  { id: 3, menuKey: 'menu.documents', icon: 'pi-file', route: '/documents', sortOrder: 3, children: [] },
  { id: 4, menuKey: 'menu.reports', icon: 'pi-chart-bar', route: '/reports', sortOrder: 4, children: [] }
];

export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!environment.useMockApi || !request.url.startsWith(environment.apiUrl)) return next(request);
  const path = request.url.slice(environment.apiUrl.length);
  if (path === '/auth/login' && request.method === 'POST') {
    const body = request.body as { username: string; password: string };
    const user = users[body.username.toLowerCase()];
    if (!user || body.password !== '123456')
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: {
              status: 'E',
              errorCode: 'ERR_INVALID_CREDENTIALS',
              errorDesc: 'Invalid credentials',
              displayMessage: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
              data: null
            }
          })
      ).pipe(delay(500));
    const response: AuthResponse = {
      username: body.username.toLowerCase(),
      name: user.name,
      role: user.role,
      accessToken: `mock-${body.username}`,
      refreshToken: `refresh-${body.username}`,
      expiresIn: 1800
    };
    sessionStorage.setItem('shareMoney.mockUser', JSON.stringify(response));
    return success(response, 650);
  }
  const stored = sessionStorage.getItem('shareMoney.mockUser');
  const user = stored ? (JSON.parse(stored) as AuthResponse) : null;
  if (path === '/auth/refresh')
    return user
      ? success({ accessToken: user.accessToken, refreshToken: user.refreshToken, expiresIn: 1800 }, 250)
      : unauthorized();
  if (path === '/auth/me')
    return user ? success({ username: user.username, name: user.name, role: user.role }, 250) : unauthorized();
  if (path === '/auth/logout') {
    sessionStorage.removeItem('shareMoney.mockUser');
    return success(null, 250);
  }
  if (path === '/auth/change-password') return success(null, 500);
  if (path === '/menus' && user) {
    const menus = [...baseMenus];
    if (user.role !== 'DEBTOR')
      menus.splice(2, 0, {
        id: 5,
        menuKey: 'menu.debtors',
        icon: 'pi-users',
        route: '/debtors',
        sortOrder: 2,
        children: []
      });
    if (user.role === 'ADMIN')
      menus.push({
        id: 6,
        menuKey: 'menu.admin',
        icon: 'pi-cog',
        route: null,
        sortOrder: 9,
        children: [
          { id: 7, menuKey: 'menu.admin.menus', icon: 'pi-list', route: '/admin/menus', sortOrder: 0, children: [] },
          { id: 8, menuKey: 'menu.admin.import', icon: 'pi-upload', route: '/admin/import', sortOrder: 1, children: [] }
        ]
      });
    return success(menus, 450);
  }
  return success({}, 300);
};

function unauthorized() {
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 401,
        error: {
          status: 'E',
          errorCode: '401',
          errorDesc: 'Unauthorized',
          displayMessage: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
          data: null
        }
      })
  );
}

function success<T>(data: T, responseDelay: number) {
  const body: ApiResponse<T> = {
    status: 'C',
    errorCode: '0000',
    errorDesc: 'SUCCESS',
    displayMessage: 'SUCCESS',
    data
  };
  return of(new HttpResponse({ status: 200, body })).pipe(delay(responseDelay));
}
