import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, Observable, switchMap } from 'rxjs';
import { UserRole } from '../../core/models/auth.model';
import { LoginLog } from '../../core/models/login-log.model';
import { AdminMenuItem } from '../../core/models/menu.model';
import { MigrationCommitResult, MigrationStatus, MigrationValidationResult } from '../../core/models/migration.model';
import { CreditorSummary } from '../../core/models/user.model';
import { AdminApiService } from '../../core/services/admin-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppDialogComponent } from '../../shared/components/app-dialog/app-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { FileDownloadService } from '../../shared/services/file-download.service';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { menuKeyValidators, passwordValidators, usernameValidators } from '../../shared/utils/validators.util';

type AdminMode = 'creditors' | 'installments' | 'logs' | 'menus' | 'migrations';

@Component({
  selector: 'app-admin-management',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    TranslatePipe,
    AppButtonComponent,
    AppDialogComponent,
    EmptyStateComponent,
    ErrorStateComponent
  ],
  template: `
    <header class="page-header">
      <div>
        <h1>{{ titleKey() | translate }}</h1>
        <p>{{ descriptionKey() | translate }}</p>
      </div>
      @if (mode() === 'creditors') {
        <app-button icon="pi-plus" (pressed)="openCreditorDialog()">{{ 'admin.addCreditor' | translate }}</app-button>
      }
      @if (mode() === 'menus') {
        <app-button icon="pi-plus" (pressed)="openMenuDialog()">{{ 'admin.addMenu' | translate }}</app-button>
      }
    </header>

    @if (loading()) {
      <div class="loading"><span class="pi pi-spin pi-spinner"></span></div>
    } @else if (loadError()) {
      <div class="state">
        <app-error-state
          [title]="'errors.unexpected' | translate"
          [retryLabel]="'common.retry' | translate"
          (retry)="load()"
        />
      </div>
    } @else if (mode() === 'creditors') {
      <section class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'profile.name' | translate }}</th>
                <th>{{ 'auth.username' | translate }}</th>
                <th class="right">{{ 'dashboard.tableDebtorCount' | translate }}</th>
                <th>{{ 'dashboard.tableStatus' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (row of creditors(); track row.id) {
                <tr>
                  <td class="strong">{{ row.name }}</td>
                  <td>{{ row.username }}</td>
                  <td class="right">{{ row.debtorCount }}</td>
                  <td>
                    <span [class]="row.active ? 'active-chip' : 'inactive-chip'">{{
                      (row.active ? 'dashboard.statusActive' : 'dashboard.statusInactive') | translate
                    }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (creditors().length === 0) {
          <app-empty-state
            icon="pi-building"
            [title]="'admin.noCreditors' | translate"
            [message]="'admin.noCreditorsDescription' | translate"
          />
        }
      </section>
    } @else if (mode() === 'installments') {
      <section class="card form-card">
        <form [formGroup]="choiceForm" (ngSubmit)="addChoice()">
          <div class="field">
            <label>{{ 'admin.installmentCount' | translate }} <b>*</b></label
            ><input type="number" formControlName="count" min="1" max="360" step="1" />
          </div>
          <app-button type="submit" icon="pi-plus" [loading]="saving()" [disabled]="choiceForm.invalid">{{
            'common.save' | translate
          }}</app-button>
        </form>
        <div class="chips">
          @for (count of choices(); track count) {
            <span
              >{{ count }} {{ 'admin.months' | translate
              }}<button type="button" [disabled]="deletingKey() === count.toString()" (click)="deleteChoice(count)">
                <i [class]="deletingKey() === count.toString() ? 'pi pi-spin pi-spinner' : 'pi pi-times'"></i></button
            ></span>
          }
        </div>
      </section>
    } @else if (mode() === 'logs') {
      <section class="card">
        <div class="toolbar">
          <label>{{ 'admin.logLimit' | translate }}</label
          ><select maxlength="4" [value]="logLimit()" (change)="changeLogLimit($event)">
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
          </select>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'dashboard.tableTime' | translate }}</th>
                <th>{{ 'dashboard.tableUser' | translate }}</th>
                <th>{{ 'dashboard.tableRole' | translate }}</th>
                <th>{{ 'dashboard.tableAction' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (row of logs(); track row.timestamp + row.username + row.action) {
                <tr>
                  <td>{{ row.timestamp | date: 'd MMM y, HH:mm:ss' }}</td>
                  <td class="strong">{{ row.username }}</td>
                  <td>{{ row.role }}</td>
                  <td>{{ row.action }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    } @else if (mode() === 'menus') {
      <section class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>menuKey</th>
                <th>Route</th>
                <th>Icon</th>
                <th class="right">Sort</th>
                <th>Roles</th>
                <th class="right">{{ 'debts.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (row of menus(); track row.id) {
                <tr>
                  <td>
                    <div class="strong">{{ row.menuKey | translate }}</div>
                    <small>{{ row.menuKey }}</small>
                  </td>
                  <td>{{ row.route || '-' }}</td>
                  <td><i [class]="'pi ' + row.icon"></i> {{ row.icon }}</td>
                  <td class="right">{{ row.sortOrder }}</td>
                  <td>
                    <div class="role-list">
                      @for (role of row.roles; track role) {
                        <span>{{ role }}</span>
                      }
                    </div>
                  </td>
                  <td class="right">
                    <button type="button" class="edit" (click)="openMenuDialog(row)">
                      <i class="pi pi-pencil"></i></button
                    ><button
                      type="button"
                      class="delete"
                      [disabled]="deletingKey() === row.id.toString()"
                      (click)="deleteMenu(row)"
                    >
                      <i [class]="deletingKey() === row.id.toString() ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    } @else if (mode() === 'migrations') {
      <section class="card migration">
        <input
          #migrationInput
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          (change)="selectMigrationFile($event)"
        /><button type="button" class="file-picker" (click)="migrationInput.click()">
          <i class="pi pi-file-excel"></i>{{ migrationFile()?.name || ('admin.chooseExcel' | translate) }}
          <b>*</b></button
        ><small>{{ 'admin.excelHint' | translate }}</small
        ><app-button
          icon="pi-check-circle"
          [loading]="validating()"
          [disabled]="!migrationFile()"
          (pressed)="validateMigration()"
          >{{ 'admin.validateMigration' | translate }}</app-button
        >
        @if (migrationResult(); as result) {
          <div class="summary">
            <article>
              <span>{{ 'admin.totalRows' | translate }}</span
              ><strong>{{ result.summary.totalRows }}</strong>
            </article>
            <article>
              <span>{{ 'admin.validRows' | translate }}</span
              ><strong>{{ result.summary.validRows }}</strong>
            </article>
            <article>
              <span>{{ 'admin.invalidRows' | translate }}</span
              ><strong>{{ result.summary.invalidRows }}</strong>
            </article>
          </div>
          <div class="migration-actions">
            <app-button
              icon="pi-save"
              [loading]="committing()"
              [disabled]="result.summary.invalidRows > 0"
              (pressed)="commitMigration()"
              >{{ 'admin.commitMigration' | translate }}</app-button
            >
            @if (result.errors.length > 0) {
              <app-button
                variant="secondary"
                icon="pi-download"
                [loading]="downloading()"
                (pressed)="downloadErrors()"
                >{{ 'admin.downloadErrors' | translate }}</app-button
              >
            }
          </div>
          @if (result.errors.length > 0) {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sheet</th>
                    <th>Row</th>
                    <th>Field</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  @for (error of result.errors; track error.sheet + error.row + error.field) {
                    <tr>
                      <td>{{ error.sheet }}</td>
                      <td>{{ error.row }}</td>
                      <td>{{ error.field }}</td>
                      <td class="error-code">{{ error.errorCode }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
        @if (commitResult(); as committed) {
          <div class="completed">
            <i class="pi pi-check-circle"></i><strong>{{ 'admin.migrationCompleted' | translate }}</strong
            ><span
              >Users {{ committed.imported.users }} · Debts {{ committed.imported.debts }} · Payments
              {{ committed.imported.payments }}</span
            >
          </div>
        }
      </section>
    }

    <app-dialog
      [title]="'admin.addCreditor' | translate"
      [visible]="creditorDialog()"
      (visibleChange)="creditorDialog.set($event)"
      ><form class="dialog-form" [formGroup]="creditorForm" (ngSubmit)="createCreditor()">
        <div class="field">
          <label>{{ 'profile.name' | translate }} <b>*</b></label
          ><input type="text" formControlName="name" maxlength="150" />
        </div>
        <div class="field">
          <label>{{ 'auth.username' | translate }} <b>*</b></label
          ><input type="text" formControlName="username" maxlength="50" (input)="sanitizeUsername($event)" />
        </div>
        <div class="field">
          <label>{{ 'auth.password' | translate }} <b>*</b></label
          ><input type="password" formControlName="password" maxlength="100" />
        </div>
        <div class="dialog-actions">
          <app-button variant="secondary" (pressed)="creditorDialog.set(false)">{{
            'common.cancel' | translate
          }}</app-button
          ><app-button type="submit" [loading]="saving()" [disabled]="creditorForm.invalid">{{
            'common.save' | translate
          }}</app-button>
        </div>
      </form></app-dialog
    >

    <app-dialog
      [title]="editingMenu() ? ('admin.editMenu' | translate) : ('admin.addMenu' | translate)"
      [visible]="menuDialog()"
      (visibleChange)="menuDialog.set($event)"
      ><form class="dialog-form" [formGroup]="menuForm" (ngSubmit)="saveMenu()">
        <div class="field">
          <label>menuKey <b>*</b></label
          ><input type="text" formControlName="menuKey" maxlength="100" (input)="sanitizeMenuKey($event)" />
        </div>
        <div class="field">
          <label>Icon <b>*</b></label
          ><input type="text" formControlName="icon" maxlength="50" />
        </div>
        <div class="field"><label>Route</label><input type="text" formControlName="route" maxlength="255" /></div>
        <div class="field">
          <label>Sort order <b>*</b></label
          ><input type="number" formControlName="sortOrder" min="0" max="9999" step="1" />
        </div>
        <div class="field">
          <label>Roles <b>*</b></label>
          <div class="role-picker">
            @for (role of allRoles; track role) {
              <button type="button" [class.active]="selectedRoles().includes(role)" (click)="toggleRole(role)">
                {{ role }}
              </button>
            }
          </div>
        </div>
        @if (editingMenu()) {
          <label class="active-toggle"
            ><input type="checkbox" formControlName="active" />{{ 'admin.activeMenu' | translate }}</label
          >
        }
        <div class="dialog-actions">
          <app-button variant="secondary" (pressed)="menuDialog.set(false)">{{
            'common.cancel' | translate
          }}</app-button
          ><app-button
            type="submit"
            [loading]="saving()"
            [disabled]="menuForm.invalid || selectedRoles().length === 0"
            >{{ 'common.save' | translate }}</app-button
          >
        </div>
      </form></app-dialog
    >
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .page-header h1,
    .page-header p {
      margin: 0;
    }
    .page-header h1 {
      color: var(--color-text-primary);
      font-size: var(--font-size-heading);
    }
    .page-header p {
      margin-top: 0.3rem;
      color: var(--color-text-secondary);
      font-size: 0.82rem;
    }
    .loading,
    .state {
      display: grid;
      min-height: 20rem;
      place-items: center;
      margin-top: 1.25rem;
      border-radius: 1rem;
      background: var(--color-surface);
      color: #2563eb;
    }
    .card {
      margin-top: 1.25rem;
      overflow: hidden;
      border: var(--border-width) solid var(--border-color);
      border-top: 4px solid #818cf8;
      border-radius: 1rem;
      background: var(--color-surface);
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
    }
    .table-wrap {
      overflow-x: auto;
    }
    table {
      width: 100%;
      min-width: 42rem;
      border-collapse: collapse;
    }
    th,
    td {
      border-top: 1px solid var(--border-color);
      padding: 0.8rem 1rem;
      text-align: left;
      font-size: 0.76rem;
      color: var(--color-text-secondary);
    }
    th {
      background: var(--color-surface-muted);
      color: var(--color-text-secondary);
      font-weight: 700;
    }
    .right {
      text-align: right;
    }
    .strong {
      font-weight: 700;
      color: var(--color-text-primary);
    }
    td small {
      display: block;
      margin-top: 0.15rem;
      color: var(--color-text-muted);
      font-size: 0.68rem;
    }
    .active-chip,
    .inactive-chip {
      border-radius: 999px;
      padding: 0.3rem 0.6rem;
      font-size: 0.68rem;
      font-weight: 700;
    }
    .active-chip {
      background: #ecfdf5;
      color: #059669;
    }
    .inactive-chip {
      background: var(--color-surface-muted);
      color: var(--color-text-secondary);
    }
    .form-card {
      padding: 1.25rem;
    }
    .form-card form {
      display: flex;
      align-items: end;
      gap: 0.75rem;
    }
    .field {
      display: grid;
      gap: 0.4rem;
      flex: 1;
    }
    .field label {
      color: var(--color-text-primary);
      font-size: 0.78rem;
      font-weight: 650;
    }
    .field b,
    .file-picker b {
      color: #dc2626;
    }
    .field input,
    .field select,
    .toolbar select {
      min-height: 2.75rem;
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--input-radius);
      padding: 0 0.8rem;
      background: var(--color-surface);
      color: var(--color-text-primary);
      font: inherit;
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }
    .field input:focus,
    .field select:focus,
    .toolbar select:focus {
      border-color: var(--input-focus-border);
      box-shadow: var(--input-focus-ring);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .chips > span {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 999px;
      padding: 0.45rem 0.7rem;
      background: #eef2ff;
      color: #4338ca;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .chips button {
      border: 0;
      background: transparent;
      color: #dc2626;
      cursor: pointer;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem;
    }
    .toolbar label {
      color: var(--color-text-secondary);
      font-size: 0.75rem;
    }
    .toolbar select {
      min-height: 2.25rem;
    }
    .role-list,
    .role-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }
    .role-list span {
      border-radius: 999px;
      padding: 0.2rem 0.45rem;
      background: var(--color-surface-muted);
      font-size: 0.62rem;
      font-weight: 700;
    }
    .edit,
    .delete {
      width: 2rem;
      height: 2rem;
      border: 0;
      border-radius: 0.5rem;
      cursor: pointer;
    }
    .edit {
      background: color-mix(in srgb, #2563eb 12%, var(--color-surface));
      color: #2563eb;
    }
    .delete {
      margin-left: 0.3rem;
      background: color-mix(in srgb, #dc2626 12%, var(--color-surface));
      color: #dc2626;
    }
    .dialog-form {
      display: grid;
      gap: 0.8rem;
      padding-top: 0.5rem;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .role-picker button {
      border: var(--border-width) solid var(--border-color);
      border-radius: 0.6rem;
      padding: 0.5rem 0.65rem;
      background: var(--color-surface);
      color: var(--color-text-secondary);
      font: inherit;
      font-size: 0.72rem;
      cursor: pointer;
    }
    .role-picker button.active {
      border-color: #2563eb;
      background: color-mix(in srgb, #2563eb 12%, var(--color-surface));
      color: #1d4ed8;
      font-weight: 700;
    }
    .active-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-text-secondary);
      font-size: 0.78rem;
    }
    .migration {
      display: grid;
      justify-items: start;
      gap: 0.75rem;
      padding: 1.25rem;
    }
    .migration > input {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
    }
    .file-picker {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px dashed #94a3b8;
      border-radius: 0.75rem;
      padding: 0.8rem 1rem;
      background: var(--color-surface-muted);
      color: var(--color-text-secondary);
      font: inherit;
      cursor: pointer;
    }
    .migration small {
      color: var(--color-text-secondary);
    }
    .summary {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .summary article {
      display: grid;
      gap: 0.25rem;
      border-radius: 0.75rem;
      padding: 1rem;
      background: var(--color-surface-muted);
    }
    .summary span {
      color: var(--color-text-secondary);
      font-size: 0.7rem;
    }
    .summary strong {
      color: var(--color-text-primary);
      font-size: 1.3rem;
    }
    .migration-actions {
      display: flex;
      gap: 0.5rem;
    }
    .error-code {
      color: #dc2626;
      font-weight: 650;
    }
    .completed {
      display: grid;
      justify-items: center;
      width: 100%;
      gap: 0.4rem;
      border-radius: 0.8rem;
      padding: 1.25rem;
      background: #ecfdf5;
      color: #047857;
    }
    .completed i {
      font-size: 2rem;
    }
    @media (max-width: 600px) {
      .page-header,
      .form-card form {
        align-items: stretch;
        flex-direction: column;
      }
      .summary {
        grid-template-columns: 1fr;
      }
      .migration-actions {
        flex-direction: column;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminManagementComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly admin = inject(AdminApiService);
  private readonly users = inject(UserApiService);
  private readonly alerts = inject(SweetAlertService);
  private readonly downloads = inject(FileDownloadService);
  readonly allRoles: UserRole[] = ['ADMIN', 'CREDITOR', 'DEBTOR'];
  readonly mode = signal<AdminMode>('creditors');
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly deletingKey = signal('');
  readonly creditors = signal<CreditorSummary[]>([]);
  readonly choices = signal<number[]>([]);
  readonly logs = signal<LoginLog[]>([]);
  readonly menus = signal<AdminMenuItem[]>([]);
  readonly logLimit = signal(200);
  readonly creditorDialog = signal(false);
  readonly menuDialog = signal(false);
  readonly editingMenu = signal<AdminMenuItem | null>(null);
  readonly selectedRoles = signal<UserRole[]>([]);
  readonly migrationFile = signal<File | null>(null);
  readonly migrationResult = signal<MigrationValidationResult | null>(null);
  readonly migrationStatus = signal<MigrationStatus | null>(null);
  readonly commitResult = signal<MigrationCommitResult | null>(null);
  readonly validating = signal(false);
  readonly committing = signal(false);
  readonly downloading = signal(false);
  readonly creditorForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    username: ['', usernameValidators()],
    password: ['', passwordValidators()]
  });
  readonly choiceForm = this.fb.nonNullable.group({
    count: [1, [Validators.required, Validators.min(1), Validators.max(360)]]
  });
  readonly menuForm = this.fb.nonNullable.group({
    menuKey: ['', menuKeyValidators()],
    icon: ['', [Validators.required, Validators.maxLength(50)]],
    route: ['', Validators.maxLength(255)],
    sortOrder: [0, [Validators.required, Validators.min(0), Validators.max(9999)]],
    active: [true]
  });
  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.mode.set(data['adminMode'] as AdminMode);
      this.load();
    });
  }
  titleKey(): string {
    return `admin.${this.mode()}Title`;
  }
  descriptionKey(): string {
    return `admin.${this.mode()}Description`;
  }
  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    const request: Observable<unknown> | null =
      this.mode() === 'creditors'
        ? this.users.getCreditors()
        : this.mode() === 'installments'
          ? this.admin.getInstallmentChoices()
          : this.mode() === 'logs'
            ? this.admin.getLoginLogs(this.logLimit())
            : this.mode() === 'menus'
              ? this.admin.getMenus()
              : null;
    if (!request) {
      this.loading.set(false);
      return;
    }
    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (rows) => {
        if (this.mode() === 'creditors') this.creditors.set(rows as CreditorSummary[]);
        if (this.mode() === 'installments') this.choices.set(rows as number[]);
        if (this.mode() === 'logs') this.logs.set(rows as LoginLog[]);
        if (this.mode() === 'menus') this.menus.set(rows as AdminMenuItem[]);
      },
      error: () => this.loadError.set(true)
    });
  }
  openCreditorDialog(): void {
    this.creditorForm.reset();
    this.creditorDialog.set(true);
  }
  createCreditor(): void {
    if (this.creditorForm.invalid || this.saving()) return;
    this.saving.set(true);
    this.users
      .createCreditor(this.creditorForm.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => {
        this.creditorDialog.set(false);
        this.alerts.success('toast.creditorCreated');
        this.load();
      });
  }
  sanitizeUsername(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 50);
    input.value = value;
    this.creditorForm.controls.username.setValue(value);
  }
  addChoice(): void {
    if (this.choiceForm.invalid || this.saving()) return;
    this.saving.set(true);
    this.admin
      .addInstallmentChoice(this.choiceForm.getRawValue().count)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe((rows) => {
        this.choices.set(rows);
        this.alerts.success('toast.choiceUpdated');
      });
  }
  deleteChoice(count: number): void {
    if (this.deletingKey()) return;
    this.deletingKey.set(count.toString());
    this.admin
      .deleteInstallmentChoice(count)
      .pipe(finalize(() => this.deletingKey.set('')))
      .subscribe((rows) => {
        this.choices.set(rows);
        this.alerts.success('toast.choiceUpdated');
      });
  }
  changeLogLimit(event: Event): void {
    this.logLimit.set(Number((event.target as HTMLSelectElement).value));
    this.load();
  }
  openMenuDialog(row?: AdminMenuItem): void {
    this.editingMenu.set(row ?? null);
    this.selectedRoles.set(row?.roles ?? []);
    this.menuForm.reset({
      menuKey: row?.menuKey ?? '',
      icon: row?.icon ?? '',
      route: row?.route ?? '',
      sortOrder: row?.sortOrder ?? 0,
      active: row?.active ?? true
    });
    this.menuForm.controls.menuKey[row ? 'disable' : 'enable']();
    this.menuDialog.set(true);
  }
  toggleRole(role: UserRole): void {
    this.selectedRoles.update((roles) =>
      roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role]
    );
  }
  sanitizeMenuKey(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, '')
      .slice(0, 100);
    input.value = value;
    this.menuForm.controls.menuKey.setValue(value);
  }
  saveMenu(): void {
    if (this.menuForm.invalid || this.selectedRoles().length === 0 || this.saving()) return;
    const v = this.menuForm.getRawValue();
    const editing = this.editingMenu();
    this.saving.set(true);
    const request: Observable<unknown> = editing
      ? this.admin
          .updateMenu(editing.id, { icon: v.icon, route: v.route || null, sortOrder: v.sortOrder, active: v.active })
          .pipe(switchMap(() => this.admin.updateMenuPermissions(editing.id, { roles: this.selectedRoles() })))
      : this.admin.createMenu({
          parentId: null,
          menuKey: v.menuKey,
          icon: v.icon,
          route: v.route || null,
          sortOrder: v.sortOrder,
          roles: this.selectedRoles()
        });
    request.pipe(finalize(() => this.saving.set(false))).subscribe(() => {
      this.menuDialog.set(false);
      this.alerts.success('toast.menuUpdated');
      this.load();
    });
  }
  async deleteMenu(row: AdminMenuItem): Promise<void> {
    if (this.deletingKey()) return;
    const confirmed = await this.alerts.confirm({
      titleKey: 'admin.deleteMenuTitle',
      textKey: 'admin.deleteMenuDescription',
      confirmButtonKey: 'common.delete',
      cancelButtonKey: 'common.cancel'
    });
    if (!confirmed) return;
    this.deletingKey.set(row.id.toString());
    this.admin
      .deleteMenu(row.id)
      .pipe(finalize(() => this.deletingKey.set('')))
      .subscribe(() => {
        this.alerts.success('toast.menuDeleted');
        this.load();
      });
  }
  selectMigrationFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    this.migrationFile.set(file?.name.toLowerCase().endsWith('.xlsx') ? file : null);
    this.migrationResult.set(null);
    this.commitResult.set(null);
    if (file && !this.migrationFile()) this.alerts.error('validation.excelType');
  }
  validateMigration(): void {
    const file = this.migrationFile();
    if (!file || this.validating()) return;
    this.validating.set(true);
    this.admin
      .validateMigration(file)
      .pipe(finalize(() => this.validating.set(false)))
      .subscribe((result) => {
        this.migrationResult.set(result);
        this.alerts.success('toast.migrationValidated');
      });
  }
  commitMigration(): void {
    const result = this.migrationResult();
    if (!result || result.summary.invalidRows > 0 || this.committing()) return;
    this.committing.set(true);
    this.admin
      .commitMigration(result.batchId)
      .pipe(finalize(() => this.committing.set(false)))
      .subscribe((committed) => {
        this.commitResult.set(committed);
        this.alerts.success('toast.migrationCommitted');
      });
  }
  downloadErrors(): void {
    const result = this.migrationResult();
    if (!result || this.downloading()) return;
    this.downloading.set(true);
    this.admin
      .downloadMigrationErrors(result.batchId)
      .pipe(finalize(() => this.downloading.set(false)))
      .subscribe((blob) => this.downloads.save(blob, `migration-errors-${result.batchId}.xlsx`));
  }
}
