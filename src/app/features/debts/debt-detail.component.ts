import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { DebtDetail, Installment, OpenLoanRecord } from '../../core/models/debt.model';
import { AuthService } from '../../core/services/auth.service';
import { DebtApiService } from '../../core/services/debt-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { AppDialogComponent } from '../../shared/components/app-dialog/app-dialog.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { currencyAmountValidators } from '../../shared/utils/validators.util';

@Component({
  selector: 'app-debt-detail',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
    TranslatePipe,
    AppButtonComponent,
    AppDialogComponent,
    ErrorStateComponent
  ],
  template: `
    <a routerLink="/debts" [queryParams]="backQueryParams" class="back"
      ><span class="pi pi-arrow-left"></span>{{ 'debts.backToList' | translate }}</a
    >
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
    } @else {
      @if (debt(); as current) {
        <header class="detail-header">
          <div>
            <div class="badges">
              <span class="method">{{ 'debtMethod.' + current.method | translate }}</span
              ><span [class]="'status ' + current.status.toLowerCase()">{{
                'debtStatus.' + current.status | translate
              }}</span>
            </div>
            <h1>{{ current.title }}</h1>
            <p>{{ current.description }}</p>
          </div>
          @if (canManage() && current.method === 'FULL') {
            <app-button
              [variant]="current.status === 'PAID' ? 'danger' : 'primary'"
              [loading]="actionKey() === 'full'"
              (pressed)="toggleFullPaid(current)"
              >{{ (current.status === 'PAID' ? 'debts.cancelPayment' : 'debts.markFullPaid') | translate }}</app-button
            >
          }
        </header>
        <section class="summary-grid">
          <article>
            <span>{{ 'debts.totalAmount' | translate }}</span
            ><strong>฿{{ current.amount | number: '1.2-2' }}</strong>
          </article>
          <article>
            <span>{{ 'debts.paidAmount' | translate }}</span
            ><strong>฿{{ paidAmount() | number: '1.2-2' }}</strong>
          </article>
          <article>
            <span>{{ 'debts.remainingAmount' | translate }}</span
            ><strong>฿{{ current.amount - paidAmount() | number: '1.2-2' }}</strong>
          </article>
          <article>
            <span>{{ 'debts.startDate' | translate }}</span
            ><strong>{{ current.startDate | date: 'd MMM y' }}</strong>
          </article>
        </section>

        @if (current.method === 'INSTALLMENT') {
          <section class="table-card">
            <header>
              <div>
                <h2>{{ 'debts.installments' | translate }}</h2>
                <p>{{ 'debts.installmentsDescription' | translate }}</p>
              </div>
            </header>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{{ 'debts.dueDate' | translate }}</th>
                    <th class="right">{{ 'debts.amount' | translate }}</th>
                    <th>{{ 'debts.kind' | translate }}</th>
                    <th>{{ 'debts.status' | translate }}</th>
                    <th class="right">{{ 'debts.actions' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of current.installments ?? []; track row.no) {
                    <tr>
                      <td>{{ row.no }}</td>
                      <td>{{ row.dueDate | date: 'd MMM y' }}</td>
                      <td class="right">฿{{ row.amount | number: '1.2-2' }}</td>
                      <td>{{ 'installmentKind.' + row.kind | translate }}</td>
                      <td>
                        <span [class]="row.status === 'PAID' ? 'paid-chip' : 'unpaid-chip'">{{
                          'paymentStatus.' + row.status | translate
                        }}</span>
                      </td>
                      <td class="right actions-cell">
                        @if (canManage()) {
                          <button
                            type="button"
                            [class]="row.status === 'PAID' ? 'pay pay--cancel' : 'pay'"
                            [disabled]="actionKey() !== ''"
                            (click)="payInstallment(row)"
                          >
                            <span
                              [class]="
                                actionKey() === 'pay-' + row.no
                                  ? 'pi pi-spin pi-spinner'
                                  : row.status === 'PAID'
                                    ? 'pi pi-undo'
                                    : 'pi pi-check'
                              "
                            ></span
                            >{{ (row.status === 'PAID' ? 'debts.cancelPayment' : 'debts.pay') | translate }}
                          </button>
                          @if (row.status === 'UNPAID') {
                            <button
                              type="button"
                              class="interest"
                              [disabled]="actionKey() !== ''"
                              (click)="payInterest(row)"
                            >
                              <span
                                [class]="
                                  actionKey() === 'interest-' + row.no ? 'pi pi-spin pi-spinner' : 'pi pi-percentage'
                                "
                              ></span
                              >{{ 'debts.payInterest' | translate }}
                            </button>
                          }
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        @if (current.method === 'OPEN') {
          <section class="table-card">
            <header>
              <div>
                <h2>{{ 'debts.openRecords' | translate }}</h2>
                <p>{{ 'debts.openRecordsDescription' | translate }}</p>
              </div>
              @if (canManage()) {
                <app-button icon="pi-plus" (pressed)="openRecordDialog()">{{
                  'debts.addRecord' | translate
                }}</app-button>
              }
            </header>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{{ 'debts.payDate' | translate }}</th>
                    <th class="right">{{ 'debts.interest' | translate }}</th>
                    <th class="right">{{ 'debts.totalPaid' | translate }}</th>
                    <th class="right">{{ 'debts.remainingPrincipal' | translate }}</th>
                    <th>{{ 'debts.status' | translate }}</th>
                    <th class="right">{{ 'debts.actions' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of current.openRecords ?? []; track row.no) {
                    <tr>
                      <td>{{ row.no }}</td>
                      <td>{{ row.payDate | date: 'd MMM y' }}</td>
                      <td class="right">฿{{ row.interest | number: '1.2-2' }}</td>
                      <td class="right">฿{{ row.totalPaid | number: '1.2-2' }}</td>
                      <td class="right">฿{{ row.remainingPrincipal | number: '1.2-2' }}</td>
                      <td>
                        <span [class]="row.status === 'PAID' ? 'paid-chip' : 'unpaid-chip'">{{
                          'paymentStatus.' + row.status | translate
                        }}</span>
                      </td>
                      <td class="right actions-cell">
                        @if (canManage()) {
                          <button
                            type="button"
                            class="pay"
                            [disabled]="actionKey() !== ''"
                            (click)="editOpenRecord(row)"
                          >
                            <span
                              [class]="actionKey() === 'record-' + row.no ? 'pi pi-spin pi-spinner' : 'pi pi-pencil'"
                            ></span></button
                          ><button
                            type="button"
                            class="delete"
                            [disabled]="actionKey() !== ''"
                            (click)="deleteOpenRecord(row)"
                          >
                            <span
                              [class]="
                                actionKey() === 'delete-record-' + row.no ? 'pi pi-spin pi-spinner' : 'pi pi-trash'
                              "
                            ></span>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      }
    }

    <app-dialog
      [title]="'debts.paymentDate' | translate"
      [visible]="paymentDialog()"
      (visibleChange)="paymentDialog.set($event)"
      ><form class="dialog-form" [formGroup]="paymentForm" (ngSubmit)="confirmPayment()">
        <label>{{ 'debts.payDate' | translate }} <b>*</b></label
        ><input type="date" formControlName="payDate" [max]="today" />
        <div class="dialog-actions">
          <app-button variant="secondary" (pressed)="paymentDialog.set(false)">{{
            'common.cancel' | translate
          }}</app-button
          ><app-button type="submit" [loading]="actionKey() !== ''" [disabled]="paymentForm.invalid">{{
            'common.confirm' | translate
          }}</app-button>
        </div>
      </form></app-dialog
    >

    <app-dialog
      [title]="editingRecord() ? ('debts.editRecord' | translate) : ('debts.addRecord' | translate)"
      [visible]="recordDialog()"
      (visibleChange)="recordDialog.set($event)"
      ><form class="dialog-form" [formGroup]="recordForm" (ngSubmit)="saveOpenRecord()">
        @if (!editingRecord()) {
          <label>{{ 'debts.payDate' | translate }} <b>*</b></label
          ><input type="date" formControlName="payDate" [max]="today" /><label
            >{{ 'debts.interest' | translate }} <b>*</b></label
          ><input type="number" formControlName="interest" min="0" max="9999999.99" step="0.01" /><label
            >{{ 'debts.remainingPrincipal' | translate }} <b>*</b></label
          ><input type="number" formControlName="remainingPrincipal" min="0" max="9999999.99" step="0.01" />
        } @else {
          <label>{{ 'debts.totalPaid' | translate }} <b>*</b></label
          ><input type="number" formControlName="totalPaid" min="0" max="9999999.99" step="0.01" />
        }
        <label>{{ 'debts.status' | translate }} <b>*</b></label
        ><select formControlName="status">
          <option value="UNPAID">{{ 'paymentStatus.UNPAID' | translate }}</option>
          <option value="PAID">{{ 'paymentStatus.PAID' | translate }}</option>
        </select>
        <div class="dialog-actions">
          <app-button variant="secondary" (pressed)="recordDialog.set(false)">{{
            'common.cancel' | translate
          }}</app-button
          ><app-button type="submit" [loading]="actionKey() !== ''" [disabled]="recordForm.invalid">{{
            'common.save' | translate
          }}</app-button>
        </div>
      </form></app-dialog
    >
  `,
  styles: `
    .back {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--color-text-secondary);
      font-size: 0.8rem;
      font-weight: 650;
      text-decoration: none;
    }
    .loading,
    .state {
      min-height: 20rem;
      display: grid;
      place-items: center;
      margin-top: 1rem;
      border-radius: 1rem;
      background: var(--color-surface);
      color: #2563eb;
    }
    .detail-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 1rem;
    }
    h1,
    h2,
    p {
      margin: 0;
    }
    h1 {
      margin-top: 0.5rem;
      color: var(--color-text-primary);
      font-size: var(--font-size-heading);
    }
    .detail-header p {
      margin-top: 0.3rem;
      color: var(--color-text-secondary);
    }
    .badges {
      display: flex;
      gap: 0.45rem;
    }
    .method,
    .status,
    .paid-chip,
    .unpaid-chip {
      border-radius: 999px;
      padding: 0.3rem 0.65rem;
      font-size: 0.68rem;
      font-weight: 750;
    }
    .method {
      background: color-mix(in srgb, #2563eb 12%, var(--color-surface));
      color: #2563eb;
    }
    .status.pending,
    .unpaid-chip {
      background: #fff7ed;
      color: #ea580c;
    }
    .status.partial {
      background: #fffbeb;
      color: #d97706;
    }
    .status.paid,
    .paid-chip {
      background: #ecfdf5;
      color: #059669;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-top: 1.25rem;
    }
    .summary-grid article {
      display: grid;
      gap: 0.35rem;
      border: var(--border-width) solid var(--border-color);
      border-top: 4px solid #93c5fd;
      border-radius: 1rem;
      padding: 1rem;
      background: var(--color-surface);
    }
    .summary-grid span {
      color: var(--color-text-secondary);
      font-size: 0.7rem;
    }
    .summary-grid strong {
      color: var(--color-text-primary);
      font-size: 1rem;
    }
    .table-card {
      margin-top: 1.25rem;
      overflow: hidden;
      border: var(--border-width) solid var(--border-color);
      border-radius: 1rem;
      background: var(--color-surface);
    }
    .table-card > header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.15rem;
    }
    .table-card h2 {
      color: var(--color-text-primary);
      font-size: 1rem;
    }
    .table-card header p {
      margin-top: 0.25rem;
      color: var(--color-text-secondary);
      font-size: 0.72rem;
    }
    .table-wrap {
      overflow-x: auto;
    }
    table {
      width: 100%;
      min-width: 54rem;
      border-collapse: collapse;
    }
    th,
    td {
      border-top: 1px solid var(--border-color);
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.76rem;
    }
    th {
      background: var(--color-surface-muted);
      color: var(--color-text-secondary);
      font-weight: 700;
    }
    td {
      color: var(--color-text-secondary);
    }
    .right {
      text-align: right;
    }
    .actions-cell {
      white-space: nowrap;
    }
    .pay,
    .interest,
    .delete {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      border: 0;
      border-radius: 0.5rem;
      padding: 0.45rem 0.6rem;
      font: inherit;
      font-size: 0.7rem;
      font-weight: 650;
      cursor: pointer;
    }
    .pay {
      background: #16a34a;
      color: #fff;
    }
    .pay.pay--cancel {
      background: #dc2626;
      color: #fff;
    }
    .interest {
      margin-left: 0.35rem;
      background: #faf5ff;
      color: #7c3aed;
    }
    .delete {
      margin-left: 0.35rem;
      background: color-mix(in srgb, #dc2626 12%, var(--color-surface));
      color: #dc2626;
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .dialog-form {
      display: grid;
      gap: 0.5rem;
      padding-top: 0.5rem;
    }
    .dialog-form label {
      margin-top: 0.4rem;
      color: var(--color-text-primary);
      font-size: 0.8rem;
      font-weight: 650;
    }
    .dialog-form b {
      color: #dc2626;
    }
    .dialog-form input,
    .dialog-form select {
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
    .dialog-form input:focus,
    .dialog-form select:focus {
      border-color: var(--input-focus-border);
      box-shadow: var(--input-focus-ring);
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    @media (max-width: 800px) {
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 520px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
      .detail-header {
        flex-direction: column;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DebtDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DebtApiService);
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(SweetAlertService);
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly backQueryParams = { debtor: this.route.snapshot.queryParamMap.get('debtor') || null };
  private paymentAction: 'pay' | 'interest' | 'full' = 'pay';
  private selectedInstallment: Installment | null = null;
  readonly today = new Date().toISOString().slice(0, 10);
  readonly debt = signal<DebtDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly actionKey = signal('');
  readonly paymentDialog = signal(false);
  readonly recordDialog = signal(false);
  readonly editingRecord = signal<OpenLoanRecord | null>(null);
  readonly canManage = computed(() => this.auth.currentUser()?.role === 'CREDITOR');
  readonly paidAmount = computed(() => {
    const current = this.debt();
    if (!current) return 0;
    if (current.method === 'OPEN') {
      return (current.openRecords ?? [])
        .filter((row) => row.status === 'PAID')
        .reduce((sum, row) => sum + row.totalPaid, 0);
    }
    return current.paidAmount;
  });
  readonly paymentForm = this.fb.nonNullable.group({ payDate: [this.today, Validators.required] });
  readonly recordForm = this.fb.nonNullable.group({
    payDate: [this.today, Validators.required],
    interest: [0, currencyAmountValidators(0)],
    remainingPrincipal: [0, currencyAmountValidators(0)],
    totalPaid: [0, currencyAmountValidators(0)],
    status: ['UNPAID' as 'UNPAID' | 'PAID', Validators.required]
  });
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .getById(this.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: (debt) => this.debt.set(debt), error: () => this.loadError.set(true) });
  }
  payInstallment(row: Installment): void {
    if (row.status === 'PAID') {
      this.runInstallmentPayment(row, false);
      return;
    }
    this.selectedInstallment = row;
    this.paymentAction = 'pay';
    this.paymentForm.reset({ payDate: this.today });
    this.paymentDialog.set(true);
  }
  payInterest(row: Installment): void {
    this.selectedInstallment = row;
    this.paymentAction = 'interest';
    this.paymentForm.reset({ payDate: this.today });
    this.paymentDialog.set(true);
  }
  confirmPayment(): void {
    const row = this.selectedInstallment;
    if (!row || this.paymentForm.invalid || this.actionKey()) return;
    this.paymentDialog.set(false);
    if (this.paymentAction === 'interest') {
      this.actionKey.set(`interest-${row.no}`);
      this.api
        .payInterest(this.id, row.no, { payDate: this.paymentForm.getRawValue().payDate })
        .pipe(finalize(() => this.actionKey.set('')))
        .subscribe((debt) => {
          this.debt.set(debt);
          this.alerts.success('toast.paymentUpdated');
        });
    } else this.runInstallmentPayment(row, true);
  }
  runInstallmentPayment(row: Installment, paid: boolean): void {
    if (this.actionKey()) return;
    this.actionKey.set(`pay-${row.no}`);
    const request = paid ? { paid: true, payDate: this.paymentForm.getRawValue().payDate } : { paid: false };
    this.api
      .payInstallment(this.id, row.no, request)
      .pipe(finalize(() => this.actionKey.set('')))
      .subscribe((debt) => {
        this.debt.set(debt);
        this.alerts.success('toast.paymentUpdated');
      });
  }
  toggleFullPaid(current: DebtDetail): void {
    if (this.actionKey()) return;
    this.actionKey.set('full');
    this.api
      .setFullPaid(this.id, current.status === 'PAID' ? { paid: false } : { paid: true, payDate: this.today })
      .pipe(finalize(() => this.actionKey.set('')))
      .subscribe((debt) => {
        this.debt.set(debt);
        this.alerts.success('toast.paymentUpdated');
      });
  }
  openRecordDialog(): void {
    this.editingRecord.set(null);
    this.recordForm.reset({ payDate: this.today, interest: 0, remainingPrincipal: 0, totalPaid: 0, status: 'UNPAID' });
    this.recordDialog.set(true);
  }
  editOpenRecord(row: OpenLoanRecord): void {
    this.editingRecord.set(row);
    this.recordForm.reset({
      payDate: row.payDate,
      interest: row.interest,
      remainingPrincipal: row.remainingPrincipal,
      totalPaid: row.totalPaid,
      status: row.status
    });
    this.recordDialog.set(true);
  }
  saveOpenRecord(): void {
    if (this.recordForm.invalid || this.actionKey()) return;
    const v = this.recordForm.getRawValue();
    const editing = this.editingRecord();
    this.recordDialog.set(false);
    this.actionKey.set(editing ? `record-${editing.no}` : 'create-record');
    const request = editing
      ? this.api.updateOpenRecord(this.id, editing.no, { totalPaid: v.totalPaid, status: v.status })
      : this.api.createOpenRecord(this.id, {
          payDate: v.payDate,
          interest: v.interest,
          remainingPrincipal: v.remainingPrincipal,
          paid: v.status === 'PAID'
        });
    request.pipe(finalize(() => this.actionKey.set(''))).subscribe((debt) => {
      this.debt.set(debt);
      this.alerts.success('toast.openRecordUpdated');
    });
  }
  async deleteOpenRecord(row: OpenLoanRecord): Promise<void> {
    if (this.actionKey()) return;
    const confirmed = await this.alerts.confirm({
      titleKey: 'debts.deleteRecordTitle',
      textKey: 'debts.deleteRecordDescription',
      confirmButtonKey: 'common.delete',
      cancelButtonKey: 'common.cancel'
    });
    if (!confirmed) return;
    this.actionKey.set(`delete-record-${row.no}`);
    this.api
      .deleteOpenRecord(this.id, row.no)
      .pipe(finalize(() => this.actionKey.set('')))
      .subscribe((debt) => {
        this.debt.set(debt);
        this.alerts.success('toast.openRecordDeleted');
      });
  }
}
