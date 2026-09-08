import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./core/layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'dashboard',
        data: { titleKey: 'menu.dashboard' },
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'profile',
        data: { titleKey: 'menu.profile' },
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent)
      },
      {
        path: 'debts',
        data: { titleKey: 'menu.debts' },
        loadComponent: () => import('./features/debts/debts.component').then((m) => m.DebtsComponent)
      },
      {
        path: 'debts/:id',
        data: { titleKey: 'debts.detailTitle' },
        loadComponent: () => import('./features/debts/debt-detail.component').then((m) => m.DebtDetailComponent)
      },
      {
        path: 'debtors',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.debtors', roles: ['ADMIN', 'CREDITOR'] },
        loadComponent: () => import('./features/debtors/debtors.component').then((m) => m.DebtorsComponent)
      },
      {
        path: 'creditors',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.creditors', roles: ['ADMIN'], adminMode: 'creditors' },
        loadComponent: () =>
          import('./features/admin/admin-management.component').then((m) => m.AdminManagementComponent)
      },
      {
        path: 'documents',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.documents', roles: ['ADMIN', 'CREDITOR'] },
        loadComponent: () => import('./features/documents/documents.component').then((m) => m.DocumentsComponent)
      },
      {
        path: 'bank-accounts',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.bankAccount', roles: ['ADMIN', 'CREDITOR', 'DEBTOR'] },
        loadComponent: () =>
          import('./features/bank-accounts/bank-accounts.component').then((m) => m.BankAccountsComponent)
      },
      {
        path: 'slips',
        data: { titleKey: 'slips.title' },
        loadComponent: () => import('./features/slips/slips.component').then((m) => m.SlipsComponent)
      },
      {
        path: 'reports',
        data: { titleKey: 'menu.reports' },
        loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent)
      },
      {
        path: 'admin/menus',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.admin.menus', roles: ['ADMIN'], adminMode: 'menus' },
        loadComponent: () =>
          import('./features/admin/admin-management.component').then((m) => m.AdminManagementComponent)
      },
      {
        path: 'admin/installment-choices',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.admin.installments', roles: ['ADMIN'], adminMode: 'installments' },
        loadComponent: () =>
          import('./features/admin/admin-management.component').then((m) => m.AdminManagementComponent)
      },
      {
        path: 'admin/login-logs',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.admin.logs', roles: ['ADMIN'], adminMode: 'logs' },
        loadComponent: () =>
          import('./features/admin/admin-management.component').then((m) => m.AdminManagementComponent)
      },
      {
        path: 'admin/migrations',
        canActivate: [roleGuard],
        data: { titleKey: 'admin.migrationsTitle', roles: ['ADMIN'], adminMode: 'migrations' },
        loadComponent: () =>
          import('./features/admin/admin-management.component').then((m) => m.AdminManagementComponent)
      },
      { path: 'admin/creditors', redirectTo: 'creditors', pathMatch: 'full' },
      {
        path: 'error/:code',
        data: { titleKey: 'errorPage.breadcrumbLabel' },
        loadComponent: () =>
          import('./shared/components/error-page/error-page.component').then((m) => m.ErrorPageComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: '**', redirectTo: 'error/404' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
