import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { DueReport } from '../../core/models/phase-three.model';
import { Debtor } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ReportApiService } from '../../core/services/report-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { FileDownloadService } from '../../shared/services/file-download.service';

@Component({
  selector: 'app-reports',
  imports: [FormsModule, DecimalPipe, TranslatePipe, AppButtonComponent, EmptyStateComponent, ErrorStateComponent],
  template: `
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="m-0 text-base font-bold text-slate-800 dark:text-slate-100">{{ 'reports.title' | translate }}</h1>
        <p class="mb-0 mt-1 text-sm text-slate-500 dark:text-slate-400">{{ 'reports.description' | translate }}</p>
      </div>
      @if (!canFilterByDebtor() || selectedDebtor) {
        <app-button icon="pi-file-pdf" [loading]="downloading()" [disabled]="!report()" (pressed)="downloadPdf()">{{
          'reports.downloadPdf' | translate
        }}</app-button>
      }
    </header>

    @if (canFilterByDebtor()) {
      <section
        class="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{{
          'reports.debtorFilter' | translate
        }}</label>
        <select
          class="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-shadow focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:max-w-sm"
          maxlength="50"
          [(ngModel)]="selectedDebtor"
          (ngModelChange)="load()"
        >
          <option value="" disabled>{{ 'reports.selectDebtorPlaceholder' | translate }}</option>
          <option value="__all">{{ 'reports.allDebtors' | translate }}</option>
          @for (debtor of debtors(); track debtor.id) {
            <option [value]="debtor.username">{{ debtor.name }} ({{ debtor.username }})</option>
          }
        </select>
      </section>
    }

    @if (loading()) {
      <section class="mt-5 grid gap-4 sm:grid-cols-3">
        @for (row of [1, 2, 3]; track row) {
          <div class="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
        }
      </section>
    } @else if (loadError()) {
      <div class="mt-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <app-error-state
          [title]="'errors.unexpected' | translate"
          [retryLabel]="'common.retry' | translate"
          (retry)="load()"
        />
      </div>
    } @else if (canFilterByDebtor() && !selectedDebtor) {
      <div class="mt-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <app-empty-state
          icon="pi-users"
          [title]="'reports.selectDebtorTitle' | translate"
          [message]="'reports.selectDebtorDescription' | translate"
        />
      </div>
    } @else {
      @if (report(); as data) {
        <section class="mt-5 grid gap-4 sm:grid-cols-3">
          <article class="summary from-blue-500 to-indigo-600">
            <span>{{ 'reports.issuedAt' | translate }}</span
            ><strong>{{ data.issuedAt }}</strong>
          </article>
          <article class="summary from-amber-500 to-orange-600">
            <span>{{ 'reports.dueCount' | translate }}</span
            ><strong>{{ data.dueCount | number }}</strong>
          </article>
          <article class="summary from-emerald-500 to-teal-600">
            <span>{{ 'reports.totalDue' | translate }}</span
            ><strong>&#3647;{{ data.total | number: '1.2-2' }}</strong>
          </article>
        </section>
        <section
          class="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          @if (data.lines.length === 0) {
            <app-empty-state
              icon="pi-check-circle"
              [title]="'reports.empty' | translate"
              [message]="'reports.emptyDescription' | translate"
            />
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full min-w-[38rem] border-collapse text-left">
                <thead>
                  <tr class="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <th>{{ 'reports.debtTitle' | translate }}</th>
                    <th>{{ 'reports.detail' | translate }}</th>
                    <th class="text-right">{{ 'reports.amount' | translate }}</th>
                    <th class="text-center">{{ 'reports.status' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of data.lines; track line.title + line.what) {
                    <tr class="border-t border-slate-100 dark:border-slate-700">
                      <td class="font-semibold text-slate-800 dark:text-slate-100">{{ line.title }}</td>
                      <td class="text-slate-600 dark:text-slate-300">{{ line.what }}</td>
                      <td class="text-right font-semibold text-slate-700 dark:text-slate-300">
                        &#3647;{{ line.due | number: '1.2-2' }}
                      </td>
                      <td class="text-center">
                        <span [class]="line.paid ? 'paid' : 'pending'">{{
                          (line.paid ? 'reports.paid' : 'reports.pending') | translate
                        }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    }
  `,
  styles: `
    .summary {
      display: grid;
      gap: 0.4rem;
      border-radius: 1rem;
      padding: 1.25rem;
      background-image: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to));
      color: #fff;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
    }
    .summary span {
      color: rgba(255, 255, 255, 0.78);
      font-size: 0.75rem;
      font-weight: 650;
    }
    .summary strong {
      font-size: 1.55rem;
    }
    th,
    td {
      padding: 0.85rem 1.25rem;
      font-size: 0.82rem;
    }
    th {
      font-weight: 650;
    }
    .paid,
    .pending {
      display: inline-flex;
      border-radius: 999px;
      padding: 0.3rem 0.65rem;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .paid {
      background: #ecfdf5;
      color: #059669;
    }
    .pending {
      background: #fff7ed;
      color: #ea580c;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(ReportApiService);
  private readonly userApi = inject(UserApiService);
  private readonly auth = inject(AuthService);
  private readonly downloads = inject(FileDownloadService);
  readonly debtors = signal<Debtor[]>([]);
  readonly report = signal<DueReport | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly downloading = signal(false);
  readonly canFilterByDebtor = computed(() => this.auth.currentUser()?.role === 'CREDITOR');
  selectedDebtor = '';

  ngOnInit(): void {
    if (this.canFilterByDebtor()) {
      this.userApi
        .getDebtors()
        .subscribe({ next: (rows) => this.debtors.set(rows), error: () => this.debtors.set([]) });
      return;
    }
    this.selectedDebtor = '__all';
    this.load();
  }

  load(): void {
    this.report.set(null);
    this.loadError.set(false);
    if (!this.selectedDebtor) return;
    this.loading.set(true);
    this.api
      .getDueReport(this.selectedDebtor)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (report) => this.report.set(report), error: () => this.loadError.set(true) });
  }

  downloadPdf(): void {
    if (this.downloading()) return;
    this.downloading.set(true);
    this.api
      .downloadDueReport(this.selectedDebtor)
      .pipe(finalize(() => this.downloading.set(false)))
      .subscribe((blob) => this.downloads.save(blob, `ShareMoney_${this.report()?.issuedAt ?? 'report'}.pdf`));
  }
}
