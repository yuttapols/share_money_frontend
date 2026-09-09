import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AuthService } from '../../core/services/auth.service';
import { BankAccountApiService } from '../../core/services/bank-account-api.service';
import { DebtApiService } from '../../core/services/debt-api.service';
import { DocumentApiService } from '../../core/services/document-api.service';
import { ReportApiService } from '../../core/services/report-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { DebtSummary } from '../../core/models/debt.model';
import { LoginLog } from '../../core/models/login-log.model';
import { BankAccount, DocumentItem, DueReport } from '../../core/models/phase-three.model';
import { CreditorSummary, Debtor } from '../../core/models/user.model';
import { AppCardComponent, CardAccent } from '../../shared/components/app-card/app-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

interface DashboardOverviewCard {
  titleKey: string;
  emptyKey: string;
  count: number;
  loading: boolean;
  icon: string;
  gradient: string;
  currency?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    TranslatePipe,
    DatePipe,
    DecimalPipe,
    AppCardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent
  ],
  template: `
    @if (isDebtor()) {
      <section
        class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <header class="flex items-center gap-2 pb-3">
          <i class="pi pi-building text-rose-500"></i>
          <h2 class="m-0 text-sm font-semibold text-slate-800 dark:text-slate-100">{{ 'bank.title' | translate }}</h2>
        </header>
        @if (loadingBankAccounts()) {
          <div class="rounded-2xl border border-rose-100 bg-rose-50 p-5 dark:border-rose-500/20 dark:bg-rose-500/10">
            <app-skeleton width="60%" height="2.5rem" />
          </div>
        } @else if (bankAccounts().length === 0) {
          <app-empty-state
            icon="pi-wallet"
            [title]="'bank.empty' | translate"
            [message]="'bank.emptyDescription' | translate"
          />
        } @else {
          <div class="grid gap-3">
            @for (account of bankAccounts(); track account.id) {
              <div
                class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-5 dark:border-rose-500/20 dark:bg-rose-500/10"
              >
                <div class="flex flex-wrap items-center gap-3">
                  <strong class="text-3xl font-extrabold tracking-wide text-rose-600 dark:text-rose-400">{{
                    account.accountNo
                  }}</strong>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm transition-colors hover:bg-white dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
                    (click)="copyAccountNo(account.accountNo)"
                  >
                    <i class="pi pi-copy"></i>{{ 'bank.copy' | translate }}
                  </button>
                </div>
                <p class="m-0 w-full text-sm font-semibold text-rose-500 dark:text-rose-300">
                  {{ account.bankName }} · {{ account.accountName }}
                </p>
                <p class="payment-note m-0 w-full text-sm font-extrabold text-red-600 dark:text-red-500">
                  {{ 'bank.paymentDeadlineNotice' | translate }}
                </p>
              </div>
            }
          </div>
        }
      </section>
    }

    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2" [class.mt-4]="isDebtor()">
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
            <p class="mb-0 mt-3 text-sm font-bold uppercase tracking-wide text-white/75">
              {{ card.titleKey | translate }}
            </p>
            @if (card.loading) {
              <span class="mt-1 block h-10 w-20 animate-pulse rounded-md bg-white/25"></span>
            } @else {
              <strong class="block text-5xl font-extrabold">
                @if (card.currency) {
                  &#3647;{{ card.count | number: '1.2-2' }}
                } @else {
                  {{ card.count | number }}
                }
              </strong>
              @if (card.count === 0) {
                <small class="text-sm text-white/70">{{ card.emptyKey | translate }}</small>
              }
            }
          </div>
        </div>
      }
    </section>

    @if (isAdmin()) {
      <section class="mt-4">
        <h2 class="m-0 text-base font-semibold text-slate-800 dark:text-slate-100">
          {{ 'dashboard.quickActions' | translate }}
        </h2>
        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          @for (action of quickActions; track action.titleKey) {
            <app-card
              [icon]="action.icon"
              [accent]="action.accent"
              [title]="action.titleKey | translate"
              [description]="action.descKey | translate"
              [buttonLabel]="'dashboard.quickActionButton' | translate"
              (pressed)="router.navigate([action.route])"
            />
          }
        </div>
      </section>
    }

    @if (isCreditor()) {
      <section class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          class="flex h-full flex-col overflow-hidden rounded-3xl border border-t-4 border-slate-300 border-t-blue-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <header class="flex items-center justify-between p-5 pb-3">
            <h2 class="m-0 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {{ 'dashboard.debtorsListTitle' | translate }}
            </h2>
            <a
              routerLink="/debtors"
              class="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {{ 'common.viewAll' | translate }}<i class="pi pi-arrow-right text-[0.65rem]"></i>
            </a>
          </header>
          @if (!loadingDebtors() && debtors().length === 0) {
            <app-empty-state
              icon="pi-users"
              [title]="'debtors.empty' | translate"
              [message]="'debtors.emptyDescription' | translate"
            />
          } @else {
            <div class="flex-1 divide-y divide-slate-100 dark:divide-slate-700">
              @if (loadingDebtors()) {
                @for (row of skeletonRows; track row) {
                  <div class="flex items-center gap-2.5 px-5 py-3">
                    <app-skeleton variant="circle" width="2rem" height="2rem" />
                    <app-skeleton width="60%" height="0.9rem" />
                  </div>
                }
              } @else {
                @for (row of pagedDebtorRows(); track row.id; let i = $index) {
                  <div class="flex items-center justify-between gap-2 px-5 py-3">
                    <div class="flex min-w-0 items-center gap-2.5">
                      <span
                        [class]="
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                          avatarColor(i)
                        "
                        >{{ initials(row.name) }}</span
                      >
                      <div class="min-w-0 leading-tight">
                        <p class="m-0 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {{ row.name }}
                        </p>
                        <p class="m-0 truncate text-xs text-slate-400 dark:text-slate-500">{{ row.username }}</p>
                      </div>
                    </div>
                    @if (owingDebtorUsernames().has(row.username)) {
                      <span
                        class="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase text-amber-600"
                        >{{ 'dashboard.debtorOwing' | translate }}</span
                      >
                    } @else {
                      <span
                        class="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase text-emerald-600"
                        >{{ 'dashboard.debtorPaidUp' | translate }}</span
                      >
                    }
                  </div>
                }
              }
            </div>
            @if (debtorTotalPages() > 1) {
              <footer
                class="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 dark:border-slate-700"
              >
                <span class="text-xs text-slate-400 dark:text-slate-500">
                  {{ 'common.pageOf' | translate: { current: debtorPage(), total: debtorTotalPages() } }}
                </span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-500 dark:hover:bg-slate-700"
                    [disabled]="debtorPage() === 1"
                    (click)="debtorPage.set(debtorPage() - 1)"
                  >
                    <i class="pi pi-angle-left text-xs"></i>
                  </button>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-500 dark:hover:bg-slate-700"
                    [disabled]="debtorPage() === debtorTotalPages()"
                    (click)="debtorPage.set(debtorPage() + 1)"
                  >
                    <i class="pi pi-angle-right text-xs"></i>
                  </button>
                </div>
              </footer>
            }
          }
        </div>

        <div
          class="flex h-full flex-col overflow-hidden rounded-3xl border border-t-4 border-slate-300 border-t-teal-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <header class="flex items-center justify-between p-5 pb-3">
            <h2 class="m-0 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {{ 'bank.title' | translate }}
            </h2>
            <a
              routerLink="/bank-accounts"
              class="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {{ 'common.viewAll' | translate }}<i class="pi pi-arrow-right text-[0.65rem]"></i>
            </a>
          </header>
          @if (!loadingBankAccounts() && bankAccounts().length === 0) {
            <app-empty-state
              icon="pi-wallet"
              [title]="'bank.empty' | translate"
              [message]="'bank.emptyDescription' | translate"
            />
          } @else {
            <div class="flex-1 divide-y divide-slate-100 dark:divide-slate-700">
              @if (loadingBankAccounts()) {
                @for (row of skeletonRows; track row) {
                  <div class="flex items-center gap-2.5 px-5 py-3">
                    <app-skeleton variant="circle" width="2rem" height="2rem" />
                    <app-skeleton width="60%" height="0.9rem" />
                  </div>
                }
              } @else {
                @for (account of recentBankAccounts(); track account.id) {
                  <div class="flex items-center gap-2.5 px-5 py-3">
                    <span
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-500/10"
                    >
                      <i class="pi pi-building text-xs"></i>
                    </span>
                    <div class="min-w-0 leading-tight">
                      <p class="m-0 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {{ account.bankName }}
                      </p>
                      <p class="m-0 truncate text-xs text-slate-400 dark:text-slate-500">{{ account.accountNo }}</p>
                    </div>
                  </div>
                }
              }
            </div>
          }
        </div>

        <div
          class="flex h-full flex-col overflow-hidden rounded-3xl border border-t-4 border-slate-300 border-t-violet-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <header class="flex items-center justify-between p-5 pb-3">
            <h2 class="m-0 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {{ 'documents.title' | translate }}
            </h2>
            <a
              routerLink="/documents"
              class="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {{ 'common.viewAll' | translate }}<i class="pi pi-arrow-right text-[0.65rem]"></i>
            </a>
          </header>
          @if (!loadingDocuments() && documents().length === 0) {
            <app-empty-state
              icon="pi-file"
              [title]="'documents.empty' | translate"
              [message]="'documents.emptyDescription' | translate"
            />
          } @else {
            <div class="flex-1 divide-y divide-slate-100 dark:divide-slate-700">
              @if (loadingDocuments()) {
                @for (row of skeletonRows; track row) {
                  <div class="flex items-center gap-2.5 px-5 py-3">
                    <app-skeleton variant="circle" width="2rem" height="2rem" />
                    <app-skeleton width="60%" height="0.9rem" />
                  </div>
                }
              } @else {
                @for (document of recentDocuments(); track document.id) {
                  <div class="flex items-center gap-2.5 px-5 py-3">
                    <span
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-500/10"
                    >
                      <i class="pi pi-file-pdf text-xs"></i>
                    </span>
                    <p class="m-0 min-w-0 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {{ document.title }}
                    </p>
                  </div>
                }
              }
            </div>
          }
        </div>
      </section>
    }

    @if (isDebtor()) {
      <section class="mt-4 grid grid-cols-1 gap-4">
        <div
          class="flex h-full flex-col overflow-hidden rounded-3xl border border-t-4 border-slate-300 border-t-violet-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <header class="flex items-center justify-between p-5 pb-3">
            <h2 class="m-0 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {{ 'documents.title' | translate }}
            </h2>
            <a
              routerLink="/documents"
              class="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {{ 'common.viewAll' | translate }}<i class="pi pi-arrow-right text-[0.65rem]"></i>
            </a>
          </header>
          @if (!loadingDocuments() && documents().length === 0) {
            <app-empty-state
              icon="pi-file"
              [title]="'documents.empty' | translate"
              [message]="'documents.emptyDescription' | translate"
            />
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
                <thead>
                  <tr class="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <th class="px-5 py-2">{{ 'documents.documentTitle' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @if (loadingDocuments()) {
                    @for (row of skeletonRows; track row) {
                      <tr class="border-t border-slate-100 dark:border-slate-700">
                        <td class="px-5 py-3"><app-skeleton width="60%" height="0.9rem" /></td>
                      </tr>
                    }
                  } @else {
                    @for (document of recentDocuments(); track document.id) {
                      <tr class="border-t border-slate-100 dark:border-slate-700">
                        <td class="px-5 py-3 text-slate-700 dark:text-slate-200">
                          <span class="flex items-center gap-2.5">
                            <i class="pi pi-file-pdf text-xs text-violet-600"></i>{{ document.title }}
                          </span>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>
    }

    <section [class]="'mt-4 grid grid-cols-1 gap-4' + (isAdmin() ? ' lg:grid-cols-2' : '')">
      @if (isAdmin()) {
        <div
          class="flex h-full flex-col overflow-hidden rounded-3xl border border-t-4 border-slate-300 border-t-teal-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <header class="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 class="m-0 text-base font-semibold text-slate-800 dark:text-slate-100">
                {{ 'dashboard.creditorsListTitle' | translate }}
              </h2>
              <p class="m-0 mt-1 text-xs text-slate-400 dark:text-slate-500">
                {{ 'dashboard.creditorsListDescription' | translate }}
              </p>
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
                  <tr
                    class="border-t border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500"
                  >
                    <th class="w-1/2 px-6 py-3 text-center font-semibold">
                      {{ 'dashboard.tableCreditor' | translate }}
                    </th>
                    <th class="w-1/4 px-6 py-3 text-center font-semibold">
                      {{ 'dashboard.tableDebtorCount' | translate }}
                    </th>
                    <th class="w-1/4 px-6 py-3 text-center font-semibold">{{ 'dashboard.tableStatus' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @if (loadingCreditors()) {
                    @for (row of skeletonRows; track row) {
                      <tr class="border-t border-slate-100 dark:border-slate-700">
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
                      <tr
                        class="border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                      >
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
                              <p class="m-0 text-sm font-semibold text-slate-800 dark:text-slate-100">{{ row.name }}</p>
                              <p class="m-0 text-xs text-slate-400 dark:text-slate-500">{{ row.username }}</p>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-3 text-center text-sm text-slate-600 dark:text-slate-300">
                          {{ row.debtorCount }}
                        </td>
                        <td class="px-6 py-3 text-center">
                          @if (row.active) {
                            <span
                              class="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-600"
                              >{{ 'dashboard.statusActive' | translate }}</span
                            >
                          } @else {
                            <span
                              class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-400"
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
              <footer
                class="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-700"
              >
                <span class="text-xs text-slate-400 dark:text-slate-500">
                  {{ 'common.pageOf' | translate: { current: creditorPage(), total: creditorTotalPages() } }}
                </span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-500 dark:hover:bg-slate-700"
                    [disabled]="creditorPage() === 1"
                    (click)="creditorPage.set(creditorPage() - 1)"
                  >
                    <i class="pi pi-angle-left text-xs"></i>
                  </button>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-500 dark:hover:bg-slate-700"
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
      }

      @if (isAdmin()) {
        <div
          class="flex h-full flex-col overflow-hidden rounded-3xl border border-t-4 border-slate-300 border-t-amber-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <header class="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 class="m-0 text-base font-semibold text-slate-800 dark:text-slate-100">
                {{ 'dashboard.loginHistoryTitle' | translate }}
              </h2>
              <p class="m-0 mt-1 text-xs text-slate-400 dark:text-slate-500">
                {{ 'dashboard.loginHistoryDescription' | translate }}
              </p>
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
                  <tr
                    class="border-t border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500"
                  >
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
                      <tr class="border-t border-slate-100 dark:border-slate-700">
                        <td class="px-6 py-3 text-center"><app-skeleton width="5rem" height="0.9rem" /></td>
                        <td class="px-6 py-3 text-center"><app-skeleton width="4rem" height="1.4rem" /></td>
                        <td class="px-6 py-3 text-center"><app-skeleton width="6rem" height="0.9rem" /></td>
                        <td class="px-6 py-3 text-center"><app-skeleton width="5rem" height="0.9rem" /></td>
                      </tr>
                    }
                  } @else {
                    @for (row of pagedLoginHistoryRows(); track row.timestamp + row.username) {
                      <tr
                        class="border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                      >
                        <td class="px-6 py-3 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
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
                        <td class="px-6 py-3 text-center text-sm text-slate-600 dark:text-slate-300">
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
              <footer
                class="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-700"
              >
                <span class="text-xs text-slate-400 dark:text-slate-500">
                  {{ 'common.pageOf' | translate: { current: loginHistoryPage(), total: loginHistoryTotalPages() } }}
                </span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-500 dark:hover:bg-slate-700"
                    [disabled]="loginHistoryPage() === 1"
                    (click)="loginHistoryPage.set(loginHistoryPage() - 1)"
                  >
                    <i class="pi pi-angle-left text-xs"></i>
                  </button>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-500 dark:hover:bg-slate-700"
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
  styles: `
    .payment-note {
      animation: payment-note-blink 1s step-start infinite;
    }
    @keyframes payment-note-blink {
      50% {
        opacity: 0.25;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly userApi = inject(UserApiService);
  private readonly adminApi = inject(AdminApiService);
  private readonly debtApi = inject(DebtApiService);
  private readonly bankAccountApi = inject(BankAccountApiService);
  private readonly documentApi = inject(DocumentApiService);
  private readonly reportApi = inject(ReportApiService);
  private readonly alerts = inject(SweetAlertService);
  private readonly auth = inject(AuthService);
  protected readonly router = inject(Router);
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
  readonly isCreditor = computed(() => this.auth.currentUser()?.role === 'CREDITOR');
  readonly isDebtor = computed(() => this.auth.currentUser()?.role === 'DEBTOR');

  readonly debtors = signal<Debtor[]>([]);
  readonly loadingDebtors = signal(true);
  readonly debtorPage = signal(1);
  readonly debtorTotalPages = computed(() => Math.max(1, Math.ceil(this.debtors().length / this.pageSize)));
  readonly pagedDebtorRows = computed(() => {
    const start = (this.debtorPage() - 1) * this.pageSize;
    return this.debtors().slice(start, start + this.pageSize);
  });

  readonly debts = signal<DebtSummary[]>([]);
  readonly loadingDebts = signal(true);
  readonly owingDebtorUsernames = computed(
    () =>
      new Set(
        this.debts()
          .filter((debt) => debt.status !== 'PAID')
          .map((debt) => debt.debtorUsername)
      )
  );
  readonly owingDebtorCount = computed(() => this.owingDebtorUsernames().size);

  readonly dueReport = signal<DueReport | null>(null);
  readonly loadingDueReport = signal(true);

  readonly bankAccounts = signal<BankAccount[]>([]);
  readonly loadingBankAccounts = signal(true);
  readonly recentBankAccounts = computed(() => this.bankAccounts().slice(0, 5));

  readonly documents = signal<DocumentItem[]>([]);
  readonly loadingDocuments = signal(true);
  readonly recentDocuments = computed(() => this.documents().slice(0, 5));

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
  readonly creditorCount = computed(() => new Set(this.debts().map((debt) => debt.creditorUsername)).size);
  readonly overviewCards = computed<DashboardOverviewCard[]>(() => {
    if (this.isCreditor()) {
      return [
        {
          titleKey: 'dashboard.totalDebtorsTitle',
          emptyKey: 'dashboard.totalDebtorsEmpty',
          count: this.debtors().length,
          loading: this.loadingDebtors(),
          icon: 'pi-users',
          gradient: 'from-blue-500 via-indigo-600 to-violet-700'
        },
        {
          titleKey: 'dashboard.owingDebtorsTitle',
          emptyKey: 'dashboard.owingDebtorsEmpty',
          count: this.owingDebtorCount(),
          loading: this.loadingDebtors() || this.loadingDebts(),
          icon: 'pi-exclamation-circle',
          gradient: 'from-amber-500 via-orange-600 to-red-600'
        }
      ];
    }
    if (this.isAdmin()) {
      return [
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
      ];
    }
    if (this.isDebtor()) {
      return [
        {
          titleKey: 'dashboard.myDueAmountTitle',
          emptyKey: 'dashboard.myDueAmountEmpty',
          count: this.dueReport()?.total ?? 0,
          loading: this.loadingDueReport(),
          icon: 'pi-wallet',
          gradient: 'from-amber-500 via-orange-600 to-red-600',
          currency: true
        },
        {
          titleKey: 'dashboard.myCreditorCountTitle',
          emptyKey: 'dashboard.myCreditorCountEmpty',
          count: this.creditorCount(),
          loading: this.loadingDebts(),
          icon: 'pi-building',
          gradient: 'from-blue-500 via-indigo-600 to-violet-700'
        }
      ];
    }
    return [];
  });
  readonly quickActions: { titleKey: string; descKey: string; icon: string; route: string; accent: CardAccent }[] = [
    {
      titleKey: 'admin.menusTitle',
      descKey: 'admin.menusDescription',
      icon: 'pi-list',
      route: '/admin/menus',
      accent: 'blue'
    },
    {
      titleKey: 'admin.installmentsTitle',
      descKey: 'admin.installmentsDescription',
      icon: 'pi-sliders-h',
      route: '/admin/installment-choices',
      accent: 'emerald'
    },
    {
      titleKey: 'admin.creditorsTitle',
      descKey: 'admin.creditorsDescription',
      icon: 'pi-building',
      route: '/creditors',
      accent: 'violet'
    }
  ];

  ngOnInit(): void {
    if (this.isAdmin() || this.isCreditor()) {
      this.loadDebtors();
    }
    if (this.isAdmin()) {
      this.loadCreditors();
      this.loadLoginHistory();
    }
    if (this.isCreditor() || this.isDebtor()) {
      this.loadDebts();
      this.loadBankAccounts();
      this.loadDocuments();
    }
    if (this.isDebtor()) {
      this.loadDueReport();
    }
  }

  loadDueReport(): void {
    this.loadingDueReport.set(true);
    this.reportApi
      .getDueReport()
      .pipe(finalize(() => this.loadingDueReport.set(false)))
      .subscribe({
        next: (report) => this.dueReport.set(report),
        error: () => this.dueReport.set(null)
      });
  }

  loadBankAccounts(): void {
    this.loadingBankAccounts.set(true);
    this.bankAccountApi
      .getAll()
      .pipe(finalize(() => this.loadingBankAccounts.set(false)))
      .subscribe({
        next: (rows) => this.bankAccounts.set(rows),
        error: () => this.bankAccounts.set([])
      });
  }

  copyAccountNo(accountNo: string): void {
    void navigator.clipboard.writeText(accountNo).then(() => this.alerts.success('bank.copied'));
  }

  loadDocuments(): void {
    this.loadingDocuments.set(true);
    this.documentApi
      .getAll()
      .pipe(finalize(() => this.loadingDocuments.set(false)))
      .subscribe({
        next: (rows) => this.documents.set(rows),
        error: () => this.documents.set([])
      });
  }

  loadDebts(): void {
    this.loadingDebts.set(true);
    this.debtApi
      .getAll()
      .pipe(finalize(() => this.loadingDebts.set(false)))
      .subscribe({
        next: (rows) => this.debts.set(rows),
        error: () => this.debts.set([])
      });
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
    return this.roleColors[role] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
  }

  actionLabelKey(action: string): string {
    return this.actionLabelKeys[action] ?? '';
  }

  actionColor(action: string): string {
    return this.actionColors[action] ?? 'text-slate-600 dark:text-slate-300';
  }
}
