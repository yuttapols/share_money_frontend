import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { CreateDebtRequest, DebtMethod, DebtSummary } from '../../core/models/debt.model';
import { Debtor } from '../../core/models/user.model';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AuthService } from '../../core/services/auth.service';
import { DebtApiService } from '../../core/services/debt-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppDialogComponent } from '../../shared/components/app-dialog/app-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { currencyAmountValidators } from '../../shared/utils/validators.util';

@Component({
  selector: 'app-debts',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    TranslatePipe,
    AppButtonComponent,
    AppDialogComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="m-0 text-base font-bold text-slate-800 dark:text-slate-100">{{ 'debts.title' | translate }}</h1>
        <p class="mb-0 mt-1 text-sm text-slate-500 dark:text-slate-400">{{ 'debts.description' | translate }}</p>
      </div>
      @if (canManage()) {
        <app-button icon="pi-plus" (pressed)="openCreate()">{{ 'debts.add' | translate }}</app-button>
      }
    </header>

    <section
      class="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-2"
    >
      <div class="relative">
        <span class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"></span>
        <input
          type="search"
          maxlength="50"
          [value]="search()"
          [placeholder]="'debts.search' | translate"
          (input)="searchChanged($event)"
        />
      </div>
      @if (canManage()) {
        <select maxlength="50" [value]="debtorFilter()" (change)="filterChanged($event)">
          <option value="">{{ 'debts.allDebtors' | translate }}</option>
          @for (debtor of debtors(); track debtor.id) {
            <option [value]="debtor.username">{{ debtor.name }} ({{ debtor.username }})</option>
          }
        </select>
      }
    </section>

    @if (canManage() && !hasSelectedFilter()) {
      <div class="mt-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <app-empty-state
          icon="pi-users"
          [title]="'debts.chooseDebtor' | translate"
          [message]="'debts.chooseDebtorDescription' | translate"
        />
      </div>
    } @else if (loading()) {
      <section class="mt-5 grid gap-4 lg:grid-cols-2">
        @for (row of [1, 2, 3, 4]; track row) {
          <div class="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
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
    } @else if (debts().length === 0) {
      <div class="mt-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <app-empty-state
          icon="pi-receipt"
          [title]="'debts.empty' | translate"
          [message]="'debts.emptyDescription' | translate"
          [actionLabel]="canManage() ? ('debts.add' | translate) : ''"
          (action)="openCreate()"
        />
      </div>
    } @else {
      <section
        class="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[54rem] border-collapse text-left">
            <thead>
              <tr
                class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
              >
                @if (canManage()) {
                  <th class="w-10 px-3 py-3"></th>
                }
                <th class="px-5 py-3 font-semibold">{{ 'debts.debtTitle' | translate }}</th>
                <th class="px-5 py-3 font-semibold">{{ 'debts.debtor' | translate }}</th>
                <th class="px-5 py-3 font-semibold">{{ 'debts.method' | translate }}</th>
                <th class="px-5 py-3 font-semibold">{{ 'debts.status' | translate }}</th>
                <th class="px-5 py-3 text-right font-semibold">{{ 'debts.totalAmount' | translate }}</th>
                <th class="px-5 py-3 text-right font-semibold">{{ 'debts.paidAmount' | translate }}</th>
                <th class="px-5 py-3 text-right font-semibold">{{ 'debts.dueAmount' | translate }}</th>
                <th class="px-5 py-3 text-right font-semibold">{{ 'debts.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (debt of pagedDebts(); track debt.id) {
                <tr
                  class="border-t border-slate-100 hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-800/50"
                  [class.dragging]="draggedId() === debt.id"
                  [attr.draggable]="canManage()"
                  (dragstart)="dragStart(debt.id)"
                  (dragover)="dragOver($event)"
                  (drop)="dropOn(debt.id)"
                  (dragend)="draggedId.set(null)"
                >
                  @if (canManage()) {
                    <td class="px-3 py-3"><span class="pi pi-bars drag-handle"></span></td>
                  }
                  <td class="px-5 py-3">
                    <strong class="text-sm text-slate-800 dark:text-slate-100">{{ debt.title }}</strong>
                  </td>
                  <td class="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{{ debt.debtorUsername }}</td>
                  <td class="px-5 py-3">
                    <span [class]="'method ' + debt.method.toLowerCase()">{{
                      'debtMethod.' + debt.method | translate
                    }}</span>
                  </td>
                  <td class="px-5 py-3">
                    <span [class]="'status ' + debt.status.toLowerCase()">{{
                      'debtStatus.' + debt.status | translate
                    }}</span>
                  </td>
                  <td class="px-5 py-3 text-right text-sm text-slate-600 dark:text-slate-300">
                    ฿{{ debt.amount | number: '1.2-2' }}
                  </td>
                  <td class="px-5 py-3 text-right text-sm text-slate-600 dark:text-slate-300">
                    ฿{{ debt.paidAmount | number: '1.2-2' }}
                  </td>
                  <td class="px-5 py-3 text-right text-sm font-semibold text-red-600">
                    ฿{{ debt.dueAmount | number: '1.2-2' }}
                  </td>
                  <td class="px-5 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <a
                        class="view-link"
                        [routerLink]="['/debts', debt.id]"
                        [queryParams]="{ debtor: debtorFilter() || null }"
                        >{{ 'common.viewDetails' | translate }}</a
                      >
                      @if (canManage()) {
                        <button
                          type="button"
                          class="icon-action delete"
                          [disabled]="deletingId() === debt.id"
                          (click)="deleteDebt(debt)"
                        >
                          <span [class]="deletingId() === debt.id ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <footer class="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-700">
          <span class="text-xs text-slate-500 dark:text-slate-400">
            {{ 'common.pageOf' | translate: { current: page(), total: totalPages() } }}
          </span>
          <div class="flex gap-1">
            <button type="button" class="page-button" [disabled]="page() === 1" (click)="setPage(page() - 1)">
              <span class="pi pi-angle-left"></span>
            </button>
            <button
              type="button"
              class="page-button"
              [disabled]="page() === totalPages()"
              (click)="setPage(page() + 1)"
            >
              <span class="pi pi-angle-right"></span>
            </button>
          </div>
        </footer>
      </section>
      @if (reordering()) {
        <div class="saving-order"><span class="pi pi-spin pi-spinner"></span>{{ 'debts.savingOrder' | translate }}</div>
      }
    }

    <app-dialog
      [title]="'debts.add' | translate"
      [visible]="dialogOpen()"
      width="38rem"
      (visibleChange)="closeDialog($event)"
    >
      <form class="form" [formGroup]="form" (ngSubmit)="create()">
        <div class="field">
          <label>{{ 'debts.debtor' | translate }} <b>*</b></label
          ><select formControlName="debtorUsername">
            <option value="">{{ 'debts.chooseDebtor' | translate }}</option>
            @for (debtor of debtors(); track debtor.id) {
              <option [value]="debtor.username">{{ debtor.name }} ({{ debtor.username }})</option>
            }
          </select>
        </div>
        <div class="field">
          <label>{{ 'debts.debtTitle' | translate }} <b>*</b></label
          ><input type="text" formControlName="title" maxlength="200" />
        </div>
        @if (method() === 'INSTALLMENT') {
          <div class="field">
            <label>{{ 'debts.descriptionField' | translate }}</label
            ><textarea formControlName="description" maxlength="1000" rows="3"></textarea>
          </div>
        }
        <div class="field">
          <label>{{ 'debts.method' | translate }} <b>*</b></label>
          <div class="method-picker">
            <button type="button" [class.active]="method() === 'INSTALLMENT'" (click)="setMethod('INSTALLMENT')">
              {{ 'debtMethod.INSTALLMENT' | translate }}</button
            ><button type="button" [class.active]="method() === 'OPEN'" (click)="setMethod('OPEN')">
              {{ 'debtMethod.OPEN' | translate }}
            </button>
          </div>
        </div>
        <div class="field">
          <label>{{ 'debts.startDate' | translate }} <b>*</b></label
          ><input type="date" formControlName="startDate" />
        </div>
        @if (method() === 'INSTALLMENT') {
          <div class="two-columns">
            <div class="field">
              <label>{{ 'debts.installmentCount' | translate }} <b>*</b></label
              ><select formControlName="installmentCount">
                <option [ngValue]="0">{{ 'debts.chooseCount' | translate }}</option>
                @for (choice of installmentChoices(); track choice) {
                  <option [ngValue]="choice">{{ choice }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label>{{ 'debts.installmentAmount' | translate }} <b>*</b></label
              ><input type="number" formControlName="installmentAmount" min="0.01" max="9999999.99" step="0.01" />
            </div>
          </div>
        } @else {
          <div class="two-columns">
            <div class="field">
              <label>{{ 'debts.principal' | translate }} <b>*</b></label
              ><input type="number" formControlName="principal" min="0.01" max="9999999.99" step="0.01" />
            </div>
            <div class="field">
              <label>{{ 'debts.monthlyInterest' | translate }} <b>*</b></label
              ><input type="number" formControlName="installmentAmount" min="0.01" max="9999999.99" step="0.01" />
            </div>
          </div>
        }
        <div class="flex justify-end gap-2 pt-2">
          <app-button variant="secondary" (pressed)="closeDialog(false)">{{ 'common.cancel' | translate }}</app-button
          ><app-button type="submit" [loading]="creating()" [disabled]="form.invalid">{{
            'common.save' | translate
          }}</app-button>
        </div>
      </form>
    </app-dialog>
  `,
  styles: `
    section input,
    section select {
      width: 100%;
      min-height: 2.75rem;
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--input-radius);
      padding: 0 0.8rem;
      background: var(--color-surface);
      color: var(--color-text-primary);
      font: inherit;
      outline: 0;
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }
    section input:focus,
    section select:focus {
      border-color: var(--input-focus-border);
      box-shadow: var(--input-focus-ring);
    }
    section input {
      padding-left: 2.5rem;
    }
    tr.dragging {
      opacity: 0.5;
    }
    .drag-handle {
      color: var(--color-text-muted);
      cursor: grab;
    }
    .method,
    .status {
      border-radius: 999px;
      padding: 0.25rem 0.55rem;
      font-size: 0.66rem;
      font-weight: 750;
    }
    .method.installment {
      background: color-mix(in srgb, #2563eb 12%, var(--color-surface));
      color: #2563eb;
    }
    .method.open {
      background: #faf5ff;
      color: #7c3aed;
    }
    .method.full {
      background: var(--color-surface-muted);
      color: var(--color-text-secondary);
    }
    .status.pending {
      background: #fff7ed;
      color: #ea580c;
    }
    .status.partial {
      background: #fffbeb;
      color: #d97706;
    }
    .status.paid {
      background: #ecfdf5;
      color: #059669;
    }
    .icon-action,
    .page-button {
      width: 2.25rem;
      height: 2.25rem;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 0.6rem;
      background: transparent;
      cursor: pointer;
    }
    .icon-action.delete {
      color: #dc2626;
    }
    .icon-action.delete:hover {
      background: color-mix(in srgb, #dc2626 12%, var(--color-surface));
    }
    .icon-action.delete:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .page-button {
      border: var(--border-width) solid var(--border-color);
      color: var(--color-text-secondary);
    }
    .page-button:disabled {
      cursor: not-allowed;
      opacity: 0.35;
    }
    .view-link {
      color: #2563eb;
      font-weight: 700;
      font-size: 0.8rem;
      text-decoration: none;
      white-space: nowrap;
    }
    .saving-order {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 70;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      background: #1e293b;
      color: #fff;
      font-size: 0.78rem;
    }
    .form {
      display: grid;
      gap: 1rem;
      padding-top: 0.5rem;
    }
    .field {
      display: grid;
      gap: 0.4rem;
    }
    .field label {
      color: var(--color-text-primary);
      font-size: 0.8rem;
      font-weight: 650;
    }
    .field b {
      color: #dc2626;
    }
    .field input,
    .field select,
    .field textarea {
      width: 100%;
      min-height: 2.75rem;
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--input-radius);
      padding: 0.65rem 0.8rem;
      background: var(--color-surface);
      color: var(--color-text-primary);
      font: inherit;
      outline: 0;
      box-sizing: border-box;
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }
    .field input:focus,
    .field select:focus,
    .field textarea:focus {
      border-color: var(--input-focus-border);
      box-shadow: var(--input-focus-ring);
    }
    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .method-picker {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .method-picker button {
      min-height: 2.75rem;
      border: var(--border-width) solid var(--border-color);
      border-radius: 0.7rem;
      background: var(--color-surface);
      color: var(--color-text-secondary);
      font: inherit;
      cursor: pointer;
    }
    .method-picker button.active {
      border-color: #2563eb;
      background: color-mix(in srgb, #2563eb 12%, var(--color-surface));
      color: #1d4ed8;
      font-weight: 700;
    }
    @media (max-width: 520px) {
      .two-columns {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DebtsComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DebtApiService);
  private readonly userApi = inject(UserApiService);
  private readonly adminApi = inject(AdminApiService);
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(SweetAlertService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private searchTimer?: ReturnType<typeof setTimeout>;
  private previousOrder: DebtSummary[] = [];
  private readonly pageSize = 10;
  readonly today = new Date().toISOString().slice(0, 10);
  readonly page = signal(1);
  readonly debts = signal<DebtSummary[]>([]);
  readonly debtors = signal<Debtor[]>([]);
  readonly installmentChoices = signal<number[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly search = signal('');
  readonly debtorFilter = signal('');
  readonly hasSelectedFilter = signal(false);
  readonly dialogOpen = signal(false);
  readonly creating = signal(false);
  readonly deletingId = signal<number | null>(null);
  readonly draggedId = signal<number | null>(null);
  readonly reordering = signal(false);
  readonly method = signal<DebtMethod>('INSTALLMENT');
  readonly canManage = computed(() => this.auth.currentUser()?.role === 'CREDITOR');
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.debts().length / this.pageSize)));
  readonly pagedDebts = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.debts().slice(start, start + this.pageSize);
  });
  readonly form = this.fb.nonNullable.group({
    debtorUsername: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(1000)],
    startDate: ['', Validators.required],
    installmentCount: [0, Validators.min(1)],
    installmentAmount: [0, currencyAmountValidators()],
    principal: [0]
  });

  ngOnInit(): void {
    if (this.canManage()) {
      const restoredDebtor = this.route.snapshot.queryParamMap.get('debtor');
      if (restoredDebtor) {
        this.debtorFilter.set(restoredDebtor);
        this.hasSelectedFilter.set(true);
        this.load();
      }
      this.userApi.getDebtors().subscribe({
        next: (rows) => {
          this.debtors.set(rows);
          if (restoredDebtor) {
            this.debtorFilter.set('');
            queueMicrotask(() => this.debtorFilter.set(restoredDebtor));
          }
        },
        error: () => this.debtors.set([])
      });
      this.adminApi
        .getInstallmentChoices()
        .subscribe({ next: (rows) => this.installmentChoices.set(rows), error: () => this.installmentChoices.set([]) });
      this.loading.set(false);
    } else {
      this.load();
    }
  }
  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }
  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .getAll(this.debtorFilter(), this.search())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => {
          this.debts.set(rows);
          this.page.set(1);
        },
        error: () => this.loadError.set(true)
      });
  }
  setPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }
  searchChanged(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value.slice(0, 50));
    this.hasSelectedFilter.set(true);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 350);
  }
  filterChanged(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.debtorFilter.set(value);
    this.hasSelectedFilter.set(Boolean(value));
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { debtor: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    if (value) this.load();
  }
  openCreate(): void {
    if (!this.canManage()) return;
    this.form.reset({
      debtorUsername: this.debtorFilter(),
      title: '',
      description: '',
      startDate: this.today,
      installmentCount: 0,
      installmentAmount: 0,
      principal: 0
    });
    this.setMethod('INSTALLMENT');
    this.dialogOpen.set(true);
  }
  closeDialog(visible: boolean): void {
    if (!this.creating()) this.dialogOpen.set(visible);
  }
  setMethod(method: DebtMethod): void {
    this.method.set(method);
    const principal = this.form.controls.principal;
    const count = this.form.controls.installmentCount;
    if (method === 'OPEN') {
      principal.setValidators(currencyAmountValidators());
      count.clearValidators();
    } else {
      principal.clearValidators();
      count.setValidators([Validators.required, Validators.min(1)]);
    }
    principal.updateValueAndValidity();
    count.updateValueAndValidity();
  }
  create(): void {
    if (this.form.invalid || this.creating()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: CreateDebtRequest =
      this.method() === 'OPEN'
        ? {
            debtorUsername: v.debtorUsername,
            title: v.title.trim(),
            method: 'OPEN',
            startDate: v.startDate,
            principal: v.principal,
            installmentAmount: v.installmentAmount
          }
        : {
            debtorUsername: v.debtorUsername,
            title: v.title.trim(),
            description: v.description.trim(),
            method: 'INSTALLMENT',
            startDate: v.startDate,
            installmentCount: v.installmentCount,
            installmentAmount: v.installmentAmount
          };
    this.creating.set(true);
    this.api
      .create(request)
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe(() => {
        this.alerts.success('toast.debtCreated');
        this.dialogOpen.set(false);
        this.load();
      });
  }
  async deleteDebt(debt: DebtSummary): Promise<void> {
    if (this.deletingId() !== null) return;
    const confirmed = await this.alerts.confirm({
      titleKey: 'debts.deleteTitle',
      titleParams: { title: debt.title },
      textKey: 'debts.deleteDescription',
      confirmButtonKey: 'common.delete',
      cancelButtonKey: 'common.cancel'
    });
    if (!confirmed) return;
    this.deletingId.set(debt.id);
    this.api
      .delete(debt.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe(() => {
        this.alerts.success('toast.debtDeleted');
        this.load();
      });
  }
  dragStart(id: number): void {
    if (this.canManage()) this.draggedId.set(id);
  }
  dragOver(event: DragEvent): void {
    if (this.canManage()) event.preventDefault();
  }
  dropOn(targetId: number): void {
    const sourceId = this.draggedId();
    if (!sourceId || sourceId === targetId || this.reordering()) return;
    this.previousOrder = [...this.debts()];
    const rows = [...this.debts()];
    const from = rows.findIndex((row) => row.id === sourceId);
    const to = rows.findIndex((row) => row.id === targetId);
    const [moved] = rows.splice(from, 1);
    rows.splice(to, 0, moved);
    this.debts.set(rows);
    this.reordering.set(true);
    this.api
      .reorder(rows.map((row) => row.id))
      .pipe(
        finalize(() => {
          this.reordering.set(false);
          this.draggedId.set(null);
        })
      )
      .subscribe({
        next: () => this.alerts.success('toast.debtReordered'),
        error: () => {
          this.debts.set(this.previousOrder);
          this.alerts.error('debts.reorderFailed');
        }
      });
  }
}
