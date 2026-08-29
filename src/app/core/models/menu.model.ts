import { UserRole } from './auth.model';

export interface MenuItem {
  id: number;
  menuKey: string;
  icon: string;
  route: string | null;
  sortOrder: number;
  children: MenuItem[];
}

export interface AdminMenuItem {
  id: number;
  parentId: number | null;
  menuKey: string;
  icon: string;
  route: string | null;
  sortOrder: number;
  active: boolean;
  roles: UserRole[];
}

export interface CreateMenuRequest {
  parentId: number | null;
  menuKey: string;
  icon: string;
  route: string | null;
  sortOrder: number;
  roles: UserRole[];
}

export interface UpdateMenuRequest {
  icon: string;
  route: string | null;
  sortOrder: number;
  active: boolean;
}

export interface UpdateMenuPermissionsRequest {
  roles: UserRole[];
}

export interface MenuPermissionsResponse {
  menuItemId: number;
  roles: UserRole[];
}
