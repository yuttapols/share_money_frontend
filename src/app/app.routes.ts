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
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder.component').then(
            (m) => m.FeaturePlaceholderComponent
          )
      },
      {
        path: 'debtors',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.debtors', roles: ['ADMIN', 'CREDITOR'] },
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder.component').then(
            (m) => m.FeaturePlaceholderComponent
          )
      },
      {
        path: 'creditors',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.creditors', roles: ['ADMIN'] },
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder.component').then(
            (m) => m.FeaturePlaceholderComponent
          )
      },
      {
        path: 'documents',
        data: { titleKey: 'menu.documents' },
        loadComponent: () =>
          import('./shared/components/error-page/error-page-preview.component').then((m) => m.ErrorPagePreviewComponent)
      },
      {
        path: 'reports',
        data: { titleKey: 'menu.reports' },
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder.component').then(
            (m) => m.FeaturePlaceholderComponent
          )
      },
      {
        path: 'admin/menus',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.admin.menus', roles: ['ADMIN'] },
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder.component').then(
            (m) => m.FeaturePlaceholderComponent
          )
      },
      {
        path: 'admin/installment-choices',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.admin.installments', roles: ['ADMIN'] },
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder.component').then(
            (m) => m.FeaturePlaceholderComponent
          )
      },
      {
        path: 'admin/login-logs',
        canActivate: [roleGuard],
        data: { titleKey: 'menu.admin.logs', roles: ['ADMIN'] },
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder.component').then(
            (m) => m.FeaturePlaceholderComponent
          )
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
