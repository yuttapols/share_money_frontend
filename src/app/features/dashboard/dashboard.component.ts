import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AuthService } from '../../core/services/auth.service';
import { UserApiService } from '../../core/services/user-api.service';
import { LoginLog } from '../../core/models/login-log.model';
import { CreditorSummary, Debtor } from '../../core/models/user.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe, DatePipe, EmptyStateComponent, ErrorStateComponent, SkeletonComponent],
  template: `
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      @for (card of overviewCards(); track card.titleKey) {
        <div
          [class]="'relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg ' + card.gradient"
        >
          <div class="absolute -left-6 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl"></div>
          <i
            class="pi absolute -bottom-6 -right-5 text-[7.5rem] text-white/10"
            [class]="'pi ' + card.icon"
            aria-hidden="true"
          ></i>
          <div class="relative">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <i class="pi text-lg" [class]="'pi ' + card.icon"></i>
            </span>
            <p class="mb-0 mt-3 text-xs font-bold uppercase tracking-wide text-white/75">
              {{ card.titleKey | translate }}
            </p>
            @if (card.loading) {
              <span class="mt-1 block h-7 w-14 animate-pulse rounded-md bg-white/25"></span>
            } @else {
              <strong class="block text-3xl font-extrabold">{{ card.count }}</strong>
              @if (card.count === 0) {
                <small class="text-xs text-white/70">{{ card.emptyKey | translate }}</small>
              }
            }
          </div>
        </div>
      }
    </section>

    <section class="mt-4 rounded-3xl border border-t-4 border-slate-100 border-t-violet-300 bg-white p-6 shadow-sm">
      <h2 class="m-0 text-base font-semibold text-slate-800">{{ 'dashboard.quickActions' | translate }}</h2>
      <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        @for (action of quickActions; track action.titleKey) {
          <a
            [routerLink]="action.route"
            [class]="'flex items-center gap-3 rounded-xl border p-3 transition-colors ' + action.rowBg"
          >
            <span [class]="'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ' + action.iconBg">
              <i class="pi" [class]="'pi ' + action.icon"></i>
            </span>
            <div class="min-w-0">
              <strong class="block text-sm text-slate-700">{{ action.titleKey | translate }}</strong>
              <small class="text-xs text-slate-400">{{ action.descKey | translate }}</small>
            </div>
            <i class="pi pi-angle-right ml-auto text-slate-300"></i>
          </a>
        }
      </div>
    </section>

    <section [class]="'mt-4 grid grid-cols-1 gap-4' + (isAdmin() ? ' lg:grid-cols-2' : '')">
      <div
        class="flex h-full flex-col overflow-hidden rounded-3xl border border-t-4 border-slate-100 border-t-teal-300 bg-white shadow-sm"
      >
        <header class="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 class="m-0 text-base font-semibold text-slate-800">{{ 'dashboard.creditorsListTitle' | translate }}</h2>
            <p class="m-0 mt-1 text-xs text-slate-400">{{ 'dashboard.creditorsListDescription' | translate }}</p>
          </div>
          <a
            routerLink="/creditors"
            class="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            {{ 'common.viewAll' | translate }}<i class="pi pi-arrow-right text-xs"></i>
          </a>
        </header>
        @if (creditorsError()) {
          <div class="px-6 pb-6">
            <app-error-state
              [title]="'errors.unexpected' | translate"
              [retryLabel]="'common.retry' | translate"
              (retry)="loadCreditors()"
            />
          </div>
        } @else if (!loadingCreditors() && creditors().length === 0) {
          <app-empty-state
            icon="pi-building"
            [title]="'dashboard.creditorsEmpty' | translate"
            [message]="'dashboard.creditorsEmptyDescription' | translate"
          />
        } @else {
          <div class="flex-1 overflow-x-auto">
            <table class="w-full min-w-[420px] table-fixed border-collapse text-left">
              <thead>
                <tr class="border-t border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th class="w-1/2 px-6 py-3 text-center font-semibold">{{ 'dashboard.tableCreditor' | translate }}</th>
                  <th class="w-1/4 px-6 py-3 text-center font-semibold">
                    {{ 'dashboard.tableDebtorCount' | translate }}
                  </th>
                  <th class="w-1/4 px-6 py-3 text-center font-semibold">{{ 'dashboard.tableStatus' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @if (loadingCreditors()) {
                  @for (row of skeletonRows; track row) {
                    <tr class="border-t border-slate-100">
                      <td class="px-6 py-3">
                        <div class="flex items-center justify-center gap-2.5">
                          <app-skeleton variant="circle" width="2rem" height="2rem" />
                          <app-skeleton width="8rem" height="0.9rem" />
                        </div>
                      </td>
                      <td class="px-6 py-3 text-center"><app-skeleton width="2rem" height="0.9rem" /></td>
                      <td class="px-6 py-3 text-center"><app-skeleton width="4rem" height="1.4rem" /></td>
                    </tr>
                  }
                } @else {
                  @for (row of pagedCreditorRows(); track row.id; let i = $index) {
                    <tr class="border-t border-slate-100 transition-colors hover:bg-slate-50">
                      <td class="px-6 py-3">
                        <div class="flex items-center justify-center gap-2.5">
                          <span
                            [class]="
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                              avatarColor(i)
                            "
                            >{{ initials(row.name) }}</span
                          >
                          <div class="min-w-0 text-left leading-tight">
                            <p class="m-0 text-sm font-semibold text-slate-800">{{ row.name }}</p>
                            <p class="m-0 text-xs text-slate-400">{{ row.username }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-3 text-center text-sm text-slate-600">{{ row.debtorCount }}</td>
                      <td class="px-6 py-3 text-center">
                        @if (row.active) {
                          <span
                            class="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-600"
                            >{{ 'dashboard.statusActive' | translate }}</span
                          >
                        } @else {
                          <span
                            class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-500"
                            >{{ 'dashboard.statusInactive' | translate }}</span
                          >
                        }
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
          @if (creditorTotalPages() > 1) {
            <footer class="flex items-center justify-between border-t border-slate-100 px-6 py-3">
              <span class="text-xs text-slate-400">
                {{ 'common.pageOf' | translate: { current: creditorPage(), total: creditorTotalPages() } }}
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  [disabled]="creditorPage() === 1"
                  (click)="creditorPage.set(creditorPage() - 1)"
                >
                  <i class="pi pi-angle-left text-xs"></i>
                </button>
                <button
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  [disabled]="creditorPage() === creditorTotalPages()"
                  (click)="creditorPage.set(creditorPage() + 1)"
                >
                  <i class="pi pi-angle-right text-xs"></i>
                </button>
              </div>
            </footer>
          }
        }
      </div>

      @if (isAdmin()) {
        <div
          class="flex h-full flex-col overflow-hidden rounded-3xl border border-t-4 border-slate-100 border-t-amber-300 bg-white shadow-sm"
        >
          <header class="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 class="m-0 text-base font-semibold text-slate-800">
                {{ 'dashboard.loginHistoryTitle' | translate }}
              </h2>
              <p class="m-0 mt-1 text-xs text-slate-400">{{ 'dashboard.loginHistoryDescription' | translate }}</p>
            </div>
            <a
              routerLink="/admin/login-logs"
              class="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {{ 'common.viewAll' | translate }}<i class="pi pi-arrow-right text-xs"></i>
            </a>
          </header>
          @if (loginHistoryError()) {
            <div class="px-6 pb-6">
              <app-error-state
                [title]="'errors.unexpected' | translate"
                [retryLabel]="'common.retry' | translate"
                (retry)="loadLoginHistory()"
              />
            </div>
          } @else if (!loadingLoginHistory() && loginHistoryRows().length === 0) {
            <app-empty-state
              icon="pi-history"
              [title]="'dashboard.loginHistoryEmpty' | translate"
              [message]="'dashboard.loginHistoryEmptyDescription' | translate"
            />
          } @else {
            <div class="flex-1 overflow-x-auto">
              <table class="w-full min-w-[480px] table-fixed border-collapse text-left">
                <thead>
                  <tr class="border-t border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th class="w-1/4 px-6 py-3 text-center font-semibold">{{ 'dashboard.tableUser' | translate }}</th>
                    <th class="w-1/6 px-6 py-3 text-center font-semibold">{{ 'dashboard.tableRole' | translate }}</th>
                    <th class="w-1/3 px-6 py-3 text-center font-semibold">{{ 'dashboard.tableTime' | translate }}</th>
                    <th class="w-1/4 px-6 py-3 text-center font-semibold">
                      {{ 'dashboard.tableAction' | translate }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @if (loadingLoginHistory()) {
                    @for (row of skeletonRows; track row) {
                      <tr class="border-t border-slate-100">
                        <td class="px-6 py-3 text-center"><app-skeleton width="5rem" height="0.9rem" /></td>
                        <td class="px-6 py-3 text-center"><app-skeleton width="4rem" height="1.4rem" /></td>
                        <td class="px-6 py-3 text-center"><app-skeleton width="6rem" height="0.9rem" /></td>
                        <td class="px-6 py-3 text-center"><app-skeleton width="5rem" height="0.9rem" /></td>
                      </tr>
                    }
                  } @else {
                    @for (row of pagedLoginHistoryRows(); track row.timestamp + row.username) {
                      <tr class="border-t border-slate-100 transition-colors hover:bg-slate-50">
                        <td class="px-6 py-3 text-center text-sm font-semibold text-slate-800">
                          {{ row.username }}
                        </td>
                        <td class="px-6 py-3 text-center">
                          <span
                            [class]="
                              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase ' +
                              roleColor(row.role)
                            "
                            >{{ row.role }}</span
                          >
                        </td>
                        <td class="px-6 py-3 text-center text-sm text-slate-600">
                          {{ row.timestamp | date: 'd MMM y, HH:mm' }}
                        </td>
                        <td class="px-6 py-3 text-center">
                          <span [class]="'text-sm font-medium ' + actionColor(row.action)">
                            {{ actionLabelKey(row.action) ? (actionLabelKey(row.action) | translate) : row.action }}
                          </span>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
            @if (loginHistoryTotalPages() > 1) {
              <footer class="flex items-center justify-between border-t border-slate-100 px-6 py-3">
                <span class="text-xs text-slate-400">
                  {{ 'common.pageOf' | translate: { current: loginHistoryPage(), total: loginHistoryTotalPages() } }}
                </span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    [disabled]="loginHistoryPage() === 1"
                    (click)="loginHistoryPage.set(loginHistoryPage() - 1)"
                  >
                    <i class="pi pi-angle-left text-xs"></i>
                  </button>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    [disabled]="loginHistoryPage() === loginHistoryTotalPages()"
                    (click)="loginHistoryPage.set(loginHistoryPage() + 1)"
                  >
                    <i class="pi pi-angle-right text-xs"></i>
                  </button>
                </div>
              </footer>
            }
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly userApi = inject(UserApiService);
  private readonly adminApi = inject(AdminApiService);
  private readonly auth = inject(AuthService);
  private readonly pageSize = 5;
  private readonly avatarPalette = [
    'bg-blue-100 text-blue-700',
    'bg-amber-100 text-amber-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-rose-100 text-rose-700',
    'bg-sky-100 text-sky-700'
  ];
  private readonly roleColors: Record<string, string> = {
    ADMIN: 'bg-violet-50 text-violet-600',
    CREDITOR: 'bg-teal-50 text-teal-600',
    DEBTOR: 'bg-blue-50 text-blue-600'
  };
  private readonly actionLabelKeys: Record<string, string> = {
    LOGIN: 'dashboard.actionLogin',
    LOGOUT: 'dashboard.actionLogout'
  };
  private readonly actionColors: Record<string, string> = {
    LOGIN: 'text-emerald-600',
    LOGOUT: 'text-red-600'
  };
  readonly skeletonRows = [1, 2, 3];
  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  readonly debtors = signal<Debtor[]>([]);
  readonly loadingDebtors = signal(true);

  readonly creditors = signal<CreditorSummary[]>([]);
  readonly loadingCreditors = signal(true);
  readonly creditorsError = signal(false);
  readonly creditorPage = signal(1);
  readonly creditorTotalPages = computed(() => Math.max(1, Math.ceil(this.creditors().length / this.pageSize)));
  readonly pagedCreditorRows = computed(() => {
    const start = (this.creditorPage() - 1) * this.pageSize;
    return this.creditors().slice(start, start + this.pageSize);
  });

  readonly loginHistoryRows = signal<LoginLog[]>([]);
  readonly loadingLoginHistory = signal(true);
  readonly loginHistoryError = signal(false);
  readonly loginHistoryPage = signal(1);
  readonly loginHistoryTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.loginHistoryRows().length / this.pageSize))
  );
  readonly pagedLoginHistoryRows = computed(() => {
    const start = (this.loginHistoryPage() - 1) * this.pageSize;
    return this.loginHistoryRows().slice(start, start + this.pageSize);
  });

  readonly totalUsers = computed(() => this.debtors().length + this.creditors().length);
  readonly activeUsers = computed(
    () => this.debtors().filter((debtor) => debtor.active).length + this.creditors().filter((c) => c.active).length
  );
  readonly loadingUsers = computed(() => this.loadingDebtors() || this.loadingCreditors());
  readonly overviewCards = computed(() => [
    {
      titleKey: 'dashboard.activeUsersTitle',
      emptyKey: 'dashboard.activeUsersEmpty',
      count: this.activeUsers(),
      loading: this.loadingUsers(),
      icon: 'pi-check-circle',
      gradient: 'from-emerald-500 via-emerald-600 to-teal-700'
    },
    {
      titleKey: 'dashboard.totalUsersTitle',
      emptyKey: 'dashboard.totalUsersEmpty',
      count: this.totalUsers(),
      loading: this.loadingUsers(),
      icon: 'pi-users',
      gradient: 'from-blue-500 via-indigo-600 to-violet-700'
    }
  ]);
  readonly quickActions = [
    {
      titleKey: 'dashboard.addDebtor',
      descKey: 'dashboard.addDebtorDescription',
      icon: 'pi-user-plus',
      route: '/debtors',
      iconBg: 'bg-blue-100 text-blue-600',
      rowBg: 'border-blue-100 bg-blue-50 hover:border-blue-200 hover:bg-blue-100'
    },
    {
      titleKey: 'dashboard.addCreditor',
      descKey: 'dashboard.addCreditorDescription',
      icon: 'pi-building',
      route: '/creditors',
      iconBg: 'bg-teal-100 text-teal-600',
      rowBg: 'border-teal-100 bg-teal-50 hover:border-teal-200 hover:bg-teal-100'
    },
    {
      titleKey: 'dashboard.exportReport',
      descKey: 'dashboard.exportReportDescription',
      icon: 'pi-file-export',
      route: '/reports',
      iconBg: 'bg-amber-100 text-amber-600',
      rowBg: 'border-amber-100 bg-amber-50 hover:border-amber-200 hover:bg-amber-100'
    }
  ];

  ngOnInit(): void {
    this.loadDebtors();
    this.loadCreditors();
    if (this.isAdmin()) this.loadLoginHistory();
  }

  loadDebtors(): void {
    this.loadingDebtors.set(true);
    this.userApi
      .getDebtors()
      .pipe(finalize(() => this.loadingDebtors.set(false)))
      .subscribe({
        next: (rows) => this.debtors.set(rows),
        error: () => this.debtors.set([])
      });
  }

  loadCreditors(): void {
    this.loadingCreditors.set(true);
    this.creditorsError.set(false);
    this.userApi
      .getCreditors()
      .pipe(finalize(() => this.loadingCreditors.set(false)))
      .subscribe({
        next: (rows) => {
          this.creditors.set(rows);
          this.creditorPage.set(1);
        },
        error: () => this.creditorsError.set(true)
      });
  }

  loadLoginHistory(): void {
    this.loadingLoginHistory.set(true);
    this.loginHistoryError.set(false);
    this.adminApi
      .getLoginLogs(100)
      .pipe(finalize(() => this.loadingLoginHistory.set(false)))
      .subscribe({
        next: (rows) => {
          this.loginHistoryRows.set(rows);
          this.loginHistoryPage.set(1);
        },
        error: () => this.loginHistoryError.set(true)
      });
  }

  initials(name: string): string {
    return name.trim().slice(0, 2).toUpperCase();
  }

  avatarColor(index: number): string {
    return this.avatarPalette[index % this.avatarPalette.length];
  }

  roleColor(role: string): string {
    return this.roleColors[role] ?? 'bg-slate-100 text-slate-600';
  }

  actionLabelKey(action: string): string {
    return this.actionLabelKeys[action] ?? '';
  }

  actionColor(action: string): string {
    return this.actionColors[action] ?? 'text-slate-600';
  }
}
