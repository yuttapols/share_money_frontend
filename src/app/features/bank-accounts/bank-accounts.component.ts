import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Bank, BankAccount } from '../../core/models/phase-three.model';
import { BankAccountApiService } from '../../core/services/bank-account-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppDialogComponent } from '../../shared/components/app-dialog/app-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { bankAccountValidators } from '../../shared/utils/validators.util';

@Component({
  selector: 'app-bank-accounts',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AppButtonComponent,
    AppDialogComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="m-0 text-base font-bold text-slate-800 dark:text-slate-100">{{ 'bank.title' | translate }}</h1>
        <p class="mb-0 mt-1 text-sm text-slate-500 dark:text-slate-400">{{ 'bank.description' | translate }}</p>
      </div>
      @if (canManage() && accounts().length > 0) {
        <app-button icon="pi-plus" (pressed)="openCreate()">{{ 'bank.add' | translate }}</app-button>
      }
    </header>

    @if (loading()) {
      <section class="mt-5 grid gap-4 sm:grid-cols-2">
        @for (row of [1, 2]; track row) {
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
    } @else if (accounts().length === 0) {
      <div class="mt-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <app-empty-state
          icon="pi-wallet"
          [title]="'bank.empty' | translate"
          [message]="(canManage() ? 'bank.emptyDescription' : 'bank.emptyReadonlyDescription') | translate"
          [actionLabel]="canManage() ? ('bank.add' | translate) : ''"
          (action)="openCreate()"
        />
      </div>
    } @else {
      <section
        class="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[42rem] border-collapse text-left">
            <thead>
              <tr
                class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
              >
                <th class="px-5 py-3 font-semibold">{{ 'bank.bankName' | translate }}</th>
                <th class="px-5 py-3 font-semibold">{{ 'bank.accountNo' | translate }}</th>
                <th class="px-5 py-3 font-semibold">{{ 'bank.accountName' | translate }}</th>
                <th class="px-5 py-3 font-semibold">{{ 'bank.paymentNote' | translate }}</th>
                @if (canManage()) {
                  <th class="px-5 py-3 text-right font-semibold">{{ 'bank.actions' | translate }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (account of accounts(); track account.id) {
                <tr class="border-t border-slate-100 dark:border-slate-700">
                  <td class="px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {{ account.bankName }}
                  </td>
                  <td class="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{{ account.accountNo }}</td>
                  <td class="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{{ account.accountName }}</td>
                  <td class="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">
                    {{ account.paymentNote || '-' }}
                  </td>
                  @if (canManage()) {
                    <td class="px-5 py-3">
                      <div class="flex justify-end gap-1">
                        <button
                          type="button"
                          class="icon-action edit"
                          (click)="openEdit(account)"
                          [title]="'common.edit' | translate"
                        >
                          <span class="pi pi-pencil"></span>
                        </button>
                        <button
                          type="button"
                          class="icon-action delete"
                          [disabled]="deletingId() === account.id"
                          (click)="deleteAccount(account)"
                          [title]="'common.delete' | translate"
                        >
                          @if (deletingId() === account.id) {
                            <span class="pi pi-spin pi-spinner"></span>
                          } @else {
                            <span class="pi pi-trash"></span>
                          }
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }

    @if (canManage()) {
      <app-dialog
        [title]="(editingId() ? 'bank.editAccount' : 'bank.add') | translate"
        [visible]="dialogOpen()"
        (visibleChange)="closeDialog($event)"
      >
        <form class="grid gap-4 pt-2" [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label>{{ 'bank.bankName' | translate }} <b>*</b></label>
            <select formControlName="bankName">
              <option value="" disabled>{{ 'bank.chooseBank' | translate }}</option>
              @for (bank of bankOptions(); track bank.code) {
                <option [value]="bank.name">{{ bank.name }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>{{ 'bank.accountNo' | translate }} <b>*</b></label>
            <input
              type="text"
              formControlName="accountNo"
              maxlength="30"
              inputmode="numeric"
              (input)="sanitizeAccountNo($event)"
            />
          </div>
          <div class="field">
            <label>{{ 'bank.accountName' | translate }} <b>*</b></label>
            <input type="text" formControlName="accountName" maxlength="150" />
          </div>
          <div class="field">
            <label>{{ 'bank.paymentNote' | translate }}</label>
            <textarea formControlName="paymentNote" maxlength="255" rows="3"></textarea>
          </div>
          <div class="mt-2 flex justify-end gap-2">
            <app-button variant="secondary" (pressed)="closeDialog(false)">{{
              'common.cancel' | translate
            }}</app-button>
            <app-button type="submit" [loading]="saving()" [disabled]="form.invalid">{{
              'common.save' | translate
            }}</app-button>
          </div>
        </form>
      </app-dialog>
    }
  `,
  styles: `
    .icon-action {
      width: 2.25rem;
      height: 2.25rem;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 0.6rem;
      background: transparent;
      cursor: pointer;
    }
    .icon-action.edit {
      color: #2563eb;
    }
    .icon-action.edit:hover {
      background: color-mix(in srgb, #2563eb 12%, var(--color-surface));
    }
    .icon-action.delete {
      color: #dc2626;
    }
    .icon-action.delete:hover {
      background: color-mix(in srgb, #dc2626 12%, var(--color-surface));
    }
    .icon-action:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .field {
      display: grid;
      gap: 0.4rem;
    }
    .field label {
      color: var(--color-text-primary);
      font-size: 0.83rem;
      font-weight: 650;
    }
    .field label b {
      color: #dc2626;
    }
    .field input,
    .field select,
    .field textarea {
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--input-radius);
      padding: 0.65rem 0.8rem;
      background: var(--color-surface);
      color: var(--color-text-primary);
      font: inherit;
      outline: 0;
      resize: vertical;
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankAccountsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BankAccountApiService);
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(SweetAlertService);
  readonly canManage = computed(() => this.auth.currentUser()?.role === 'CREDITOR');
  readonly accounts = signal<BankAccount[]>([]);
  readonly banks = signal<Bank[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly dialogOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly deletingId = signal<number | null>(null);
  readonly bankOptions = computed(() => {
    const current = this.editingAccount()?.bankName;
    const banks = this.banks();
    if (!current || banks.some((bank) => bank.name === current)) return banks;
    return [{ code: current, name: current }, ...banks];
  });
  private readonly editingAccount = computed(() => {
    const id = this.editingId();
    return id ? (this.accounts().find((account) => account.id === id) ?? null) : null;
  });
  readonly form = this.fb.nonNullable.group({
    bankName: ['', Validators.required],
    accountNo: ['', bankAccountValidators()],
    accountName: ['', [Validators.required, Validators.maxLength(150)]],
    paymentNote: ['', Validators.maxLength(255)]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    forkJoin({
      accounts: this.api.getAll(),
      banks: this.canManage() ? this.api.getBanks() : of([])
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ accounts, banks }) => {
          this.accounts.set(accounts);
          this.banks.set(banks);
        },
        error: () => this.loadError.set(true)
      });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ bankName: '', accountNo: '', accountName: '', paymentNote: '' });
    this.dialogOpen.set(true);
  }

  openEdit(account: BankAccount): void {
    this.editingId.set(account.id);
    this.form.reset({ ...account, paymentNote: account.paymentNote ?? '' });
    this.dialogOpen.set(true);
  }

  closeDialog(open: boolean): void {
    this.dialogOpen.set(open);
  }

  save(): void {
    if (!this.canManage() || this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const value = this.form.getRawValue();
    const id = this.editingId();
    const request = id ? this.api.update(id, value) : this.api.create(value);
    request.pipe(finalize(() => this.saving.set(false))).subscribe(() => {
      this.dialogOpen.set(false);
      this.alerts.success('toast.bankUpdated');
      this.load();
    });
  }

  async deleteAccount(account: BankAccount): Promise<void> {
    if (!this.canManage() || this.deletingId()) return;
    const confirmed = await this.alerts.confirm({
      titleKey: 'bank.deleteTitle',
      textKey: 'bank.deleteDescription',
      confirmButtonKey: 'common.delete',
      cancelButtonKey: 'common.cancel'
    });
    if (!confirmed) return;
    this.deletingId.set(account.id);
    this.api
      .delete(account.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe(() => {
        this.alerts.success('toast.bankDeleted');
        this.load();
      });
  }

  sanitizeAccountNo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9\-\s]/g, '').slice(0, 30);
    if (value === input.value) return;
    input.value = value;
    this.form.controls.accountNo.setValue(value);
  }
}
