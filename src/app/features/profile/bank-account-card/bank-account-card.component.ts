import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BankAccountApiService } from '../../../core/services/bank-account-api.service';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-bank-account-card',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AppButtonComponent, ErrorStateComponent],
  template: `
    <section class="bank-card">
      <header>
        <div>
          <h2>{{ 'bank.title' | translate }}</h2>
          <p>{{ 'bank.description' | translate }}</p>
        </div>
        @if (canEdit() && !editing() && !loading()) {
          <button type="button" class="edit-button" (click)="startEdit()"><span class="pi pi-pencil"></span></button>
        }
      </header>
      @if (loading()) {
        <div class="loading"><span class="pi pi-spin pi-spinner"></span></div>
      } @else if (loadError()) {
        <app-error-state
          [title]="'errors.unexpected' | translate"
          [retryLabel]="'common.retry' | translate"
          (retry)="load()"
        />
      } @else {
        <form [formGroup]="form">
          <label>{{ 'bank.bankName' | translate }} <b>*</b></label>
          <input type="text" formControlName="bankName" maxlength="100" />
          <label>{{ 'bank.accountNo' | translate }} <b>*</b></label>
          <input
            type="text"
            formControlName="accountNo"
            maxlength="30"
            inputmode="numeric"
            (input)="sanitizeAccountNo($event)"
          />
          <label>{{ 'bank.accountName' | translate }} <b>*</b></label>
          <input type="text" formControlName="accountName" maxlength="150" />
          <label>{{ 'bank.paymentNote' | translate }}</label>
          <textarea formControlName="paymentNote" maxlength="255" rows="3"></textarea>
          @if (editing()) {
            <div class="actions">
              <app-button [loading]="saving()" [disabled]="form.invalid || form.pristine" (pressed)="save()">{{
                'common.save' | translate
              }}</app-button>
              <app-button variant="secondary" (pressed)="cancel()">{{ 'common.cancel' | translate }}</app-button>
            </div>
          }
        </form>
      }
    </section>
  `,
  styles: `
    .bank-card {
      border: 1px solid #e8edf3;
      border-top: 4px solid #14b8a6;
      border-radius: 1rem;
      background: #fff;
      overflow: hidden;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.2rem 1.35rem;
      border-bottom: 1px solid #eef2f6;
    }
    h2,
    p {
      margin: 0;
    }
    h2 {
      color: #1e293b;
      font-size: 1rem;
    }
    p {
      margin-top: 0.3rem;
      color: #64748b;
      font-size: 0.78rem;
    }
    .edit-button {
      width: 2.2rem;
      height: 2.2rem;
      display: grid;
      place-items: center;
      border: 1px solid #99f6e4;
      border-radius: 0.6rem;
      background: #ccfbf1;
      color: #0f766e;
      cursor: pointer;
    }
    form {
      display: grid;
      padding: 1.35rem;
    }
    label {
      margin: 0.75rem 0 0.35rem;
      color: #334155;
      font-size: 0.82rem;
      font-weight: 650;
    }
    b {
      color: #dc2626;
    }
    input,
    textarea {
      border: 1px solid #d9e0e9;
      border-radius: 0.7rem;
      padding: 0.7rem 0.8rem;
      background: #fff;
      color: #1e293b;
      font: inherit;
      outline: 0;
      resize: vertical;
    }
    input:disabled,
    textarea:disabled {
      background: #f8fafc;
      color: #64748b;
      opacity: 1;
    }
    input:focus,
    textarea:focus {
      border-color: #14b8a6;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }
    .actions {
      display: flex;
      gap: 0.65rem;
      margin-top: 1rem;
    }
    .loading {
      display: grid;
      min-height: 12rem;
      place-items: center;
      color: #14b8a6;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankAccountCardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BankAccountApiService);
  private readonly alerts = inject(SweetAlertService);
  private readonly auth = inject(AuthService);
  readonly canEdit = computed(() => this.auth.currentUser()?.role === 'CREDITOR');
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    bankName: ['', [Validators.required, Validators.maxLength(100)]],
    accountNo: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[0-9\-\s]+$/)]],
    accountName: ['', [Validators.required, Validators.maxLength(150)]],
    paymentNote: ['', Validators.maxLength(255)]
  });

  ngOnInit(): void {
    this.form.disable();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .getMine()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (account) => {
          this.form.reset(account);
          this.form.disable();
        },
        error: () => this.loadError.set(true)
      });
  }

  startEdit(): void {
    this.editing.set(true);
    this.form.enable();
  }

  cancel(): void {
    this.editing.set(false);
    this.load();
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api
      .updateMine(this.form.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe((account) => {
        this.form.reset(account);
        this.form.disable();
        this.editing.set(false);
        this.alerts.success('toast.bankUpdated');
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
