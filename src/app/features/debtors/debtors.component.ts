import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserApiService } from '../../core/services/user-api.service';
import { Debtor } from '../../core/models/user.model';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppDialogComponent } from '../../shared/components/app-dialog/app-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

type SortField = 'name' | 'username';

@Component({
  selector: 'app-debtors',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AppButtonComponent,
    AppDialogComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent
  ],
  template: `
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="m-0 text-2xl font-bold text-slate-800">{{ 'debtors.title' | translate }}</h1>
        <p class="mb-0 mt-1 text-sm text-slate-500">{{ 'debtors.description' | translate }}</p>
      </div>
      @if (canCreate()) {
        <app-button icon="pi-plus" (pressed)="openCreate()">{{ 'debtors.add' | translate }}</app-button>
      }
    </header>

    <section class="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative w-full sm:max-w-sm">
          <span class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></span>
          <input
            class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            type="search"
            maxlength="50"
            [value]="search()"
            [placeholder]="'debtors.search' | translate"
            (input)="setSearch($event)"
          />
        </div>
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          (click)="toggleSort()"
        >
          <span class="pi pi-sort-alt"></span>{{ sortLabel() | translate }}
        </button>
      </div>

      @if (loading()) {
        <div class="grid gap-3 p-5">
          @for (row of skeletonRows; track row) {
            <div class="grid grid-cols-[2.5rem_1fr_7rem] items-center gap-3">
              <app-skeleton variant="circle" width="2.5rem" height="2.5rem" />
              <app-skeleton width="45%" height="1rem" />
              <app-skeleton width="7rem" height="2rem" />
            </div>
          }
        </div>
      } @else if (loadError()) {
        <app-error-state
          [title]="'errors.unexpected' | translate"
          [retryLabel]="'common.retry' | translate"
          (retry)="loadDebtors()"
        />
      } @else if (filteredDebtors().length === 0) {
        <app-empty-state
          icon="pi-users"
          [title]="(search() ? 'debtors.notFound' : 'debtors.empty') | translate"
          [message]="(search() ? 'debtors.notFoundDescription' : 'debtors.emptyDescription') | translate"
          [actionLabel]="!search() && canCreate() ? ('debtors.add' | translate) : ''"
          (action)="openCreate()"
        />
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full min-w-[42rem] border-collapse text-left">
            <thead>
              <tr class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th class="px-5 py-3 font-semibold">{{ 'debtors.name' | translate }}</th>
                <th class="px-5 py-3 font-semibold">{{ 'auth.username' | translate }}</th>
                <th class="px-5 py-3 font-semibold">{{ 'debtors.creditor' | translate }}</th>
                <th class="px-5 py-3 text-right font-semibold">{{ 'debtors.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (debtor of pagedDebtors(); track debtor.id) {
                <tr class="border-t border-slate-100 hover:bg-slate-50/70">
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-3">
                      <span
                        class="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700"
                      >
                        {{ initials(debtor.name) }}
                      </span>
                      <strong class="text-sm text-slate-800">{{ debtor.name }}</strong>
                    </div>
                  </td>
                  <td class="px-5 py-3 text-sm text-slate-600">{{ debtor.username }}</td>
                  <td class="px-5 py-3 text-sm text-slate-600">{{ debtor.creditorUsername }}</td>
                  <td class="px-5 py-3">
                    <div class="flex justify-end gap-1">
                      <button
                        type="button"
                        class="icon-action edit"
                        (click)="openEdit(debtor)"
                        [title]="'common.edit' | translate"
                      >
                        <span class="pi pi-pencil"></span>
                      </button>
                      <button
                        type="button"
                        class="icon-action delete"
                        (click)="deleteDebtor(debtor)"
                        [title]="'common.delete' | translate"
                      >
                        @if (deletingUsername() === debtor.username) {
                          <span class="pi pi-spin pi-spinner"></span>
                        } @else {
                          <span class="pi pi-trash"></span>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <footer class="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <span class="text-xs text-slate-500">
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
      }
    </section>

    <app-dialog [title]="dialogTitle()" [visible]="dialogOpen()" (visibleChange)="closeDialog($event)">
      <form class="grid gap-4 pt-2" [formGroup]="form" (ngSubmit)="save()">
        <div class="field">
          <label>{{ 'debtors.name' | translate }} <b>*</b></label>
          <input type="text" formControlName="name" maxlength="50" [class.invalid]="showError('name')" />
          @if (showError('name')) {
            <small>{{ fieldError('name') | translate: { min: 1, max: 50 } }}</small>
          }
        </div>
        <div class="field">
          <label>{{ 'auth.username' | translate }} <b>*</b></label>
          <input
            type="text"
            formControlName="username"
            maxlength="50"
            [class.invalid]="showError('username')"
            (input)="sanitizeUsername($event)"
          />
          @if (showError('username')) {
            <small>{{ fieldError('username') | translate: { min: 1, max: 50 } }}</small>
          }
        </div>
        <div class="field">
          <label
            >{{ 'auth.password' | translate }}
            @if (!editing()) {
              <b>*</b>
            }
          </label>
          <input type="password" formControlName="password" maxlength="50" [class.invalid]="showError('password')" />
          @if (showError('password')) {
            <small>{{ fieldError('password') | translate: { min: 6, max: 50 } }}</small>
          }
          @if (editing()) {
            <span>{{ 'debtors.passwordOptional' | translate }}</span>
          }
        </div>
        <div class="mt-2 flex justify-end gap-2">
          <app-button variant="secondary" (pressed)="closeDialog(false)">{{ 'common.cancel' | translate }}</app-button>
          <app-button type="submit" [loading]="saving()" [disabled]="form.invalid">{{
            'common.save' | translate
          }}</app-button>
        </div>
      </form>
    </app-dialog>
  `,
  styles: `
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
    .icon-action.edit {
      color: #2563eb;
    }
    .icon-action.edit:hover {
      background: #eff6ff;
    }
    .icon-action.delete {
      color: #dc2626;
    }
    .icon-action.delete:hover {
      background: #fef2f2;
    }
    .page-button {
      border: 1px solid #e2e8f0;
      color: #475569;
    }
    .page-button:disabled {
      cursor: not-allowed;
      opacity: 0.35;
    }
    .field {
      display: grid;
      gap: 0.4rem;
    }
    .field label {
      color: #334155;
      font-size: 0.82rem;
      font-weight: 650;
    }
    .field b,
    .field small {
      color: #dc2626;
    }
    .field span {
      color: #64748b;
      font-size: 0.72rem;
    }
    .field input {
      height: 2.75rem;
      border: 1px solid #d9e0e9;
      border-radius: 0.7rem;
      padding: 0 0.8rem;
      background: #fff;
      color: #1e293b;
      font: inherit;
      outline: 0;
    }
    .field input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .field input.invalid {
      border-color: #dc2626;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DebtorsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userApi = inject(UserApiService);
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(SweetAlertService);
  private readonly translate = inject(TranslateService);
  private readonly pageSize = 10;
  readonly skeletonRows = [1, 2, 3, 4, 5];
  readonly debtors = signal<Debtor[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly search = signal('');
  readonly sortField = signal<SortField>('name');
  readonly sortAscending = signal(true);
  readonly page = signal(1);
  readonly dialogOpen = signal(false);
  readonly editing = signal<Debtor | null>(null);
  readonly saving = signal(false);
  readonly deletingUsername = signal('');
  readonly canCreate = computed(() => this.auth.currentUser()?.role === 'CREDITOR');
  readonly dialogTitle = computed(() => this.translate.instant(this.editing() ? 'debtors.edit' : 'debtors.add'));
  readonly sortLabel = computed(() => (this.sortField() === 'name' ? 'debtors.sortByName' : 'debtors.sortByUsername'));
  readonly filteredDebtors = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    const field = this.sortField();
    return this.debtors()
      .filter(
        (row) => !term || row.name.toLocaleLowerCase().includes(term) || row.username.toLowerCase().includes(term)
      )
      .sort((left, right) => {
        const result = left[field].localeCompare(right[field], undefined, { sensitivity: 'base' });
        return this.sortAscending() ? result : -result;
      });
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredDebtors().length / this.pageSize)));
  readonly pagedDebtors = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredDebtors().slice(start, start + this.pageSize);
  });
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    username: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]]
  });

  ngOnInit(): void {
    this.loadDebtors();
  }

  loadDebtors(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.userApi
      .getDebtors()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.debtors.set(rows),
        error: () => this.loadError.set(true)
      });
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value.slice(0, 50));
    this.page.set(1);
  }

  toggleSort(): void {
    if (this.sortAscending()) this.sortField.update((field) => (field === 'name' ? 'username' : 'name'));
    this.sortAscending.update((value) => !value);
    this.page.set(1);
  }

  setPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  openCreate(): void {
    if (!this.canCreate()) return;
    this.editing.set(null);
    this.form.reset();
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(50)]);
    this.form.controls.password.updateValueAndValidity();
    this.dialogOpen.set(true);
  }

  openEdit(debtor: Debtor): void {
    this.editing.set(debtor);
    this.form.reset({ name: debtor.name, username: debtor.username, password: '' });
    this.form.controls.password.setValidators([Validators.minLength(6), Validators.maxLength(50)]);
    this.form.controls.password.updateValueAndValidity();
    this.dialogOpen.set(true);
  }

  closeDialog(visible: boolean): void {
    if (this.saving()) return;
    this.dialogOpen.set(visible);
    if (!visible) this.editing.set(null);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const current = this.editing();
    this.saving.set(true);
    const request: Observable<unknown> = current
      ? this.userApi.updateDebtor(current.username, value)
      : this.userApi.createDebtor(value);
    request.pipe(finalize(() => this.saving.set(false))).subscribe(() => {
      this.alerts.success(current ? 'toast.debtorUpdated' : 'toast.debtorCreated');
      this.dialogOpen.set(false);
      this.editing.set(null);
      this.loadDebtors();
    });
  }

  async deleteDebtor(debtor: Debtor): Promise<void> {
    if (this.deletingUsername()) return;
    const confirmed = await this.alerts.confirm({
      titleKey: 'debtors.deleteTitle',
      textKey: 'debtors.deleteDescription',
      confirmButtonKey: 'common.delete',
      cancelButtonKey: 'common.cancel'
    });
    if (!confirmed) return;
    this.deletingUsername.set(debtor.username);
    this.userApi
      .deleteDebtor(debtor.username)
      .pipe(finalize(() => this.deletingUsername.set('')))
      .subscribe(() => {
        this.alerts.success('toast.debtorDeleted');
        this.loadDebtors();
      });
  }

  sanitizeUsername(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 50);
    if (value === input.value) return;
    input.value = value;
    this.form.controls.username.setValue(value);
  }

  showError(name: 'name' | 'username' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  fieldError(name: 'name' | 'username' | 'password'): string {
    const errors = this.form.controls[name].errors;
    if (errors?.['required']) return 'validation.required';
    if (errors?.['minlength']) return 'validation.minlength';
    if (errors?.['maxlength']) return 'validation.maxlength';
    return 'validation.usernamePattern';
  }

  initials(name: string): string {
    return name.trim().slice(0, 2).toUpperCase();
  }
}
