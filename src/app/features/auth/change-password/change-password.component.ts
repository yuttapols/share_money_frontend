import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AppButtonComponent],
  template: `
    <section id="security" class="security-card">
      <header>
        <h2>{{ 'profile.security' | translate }}</h2>
        @if (!editing()) {
          <button type="button" class="edit-button" (click)="startEdit()" [attr.aria-label]="'common.edit' | translate">
            <span class="pi pi-pencil"></span>
          </button>
        }
      </header>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label for="oldPassword">{{ 'auth.oldPassword' | translate }} <b>*</b></label>
        <input
          id="oldPassword"
          type="password"
          formControlName="oldPassword"
          maxlength="100"
          autocomplete="current-password"
          [class.invalid]="showError('oldPassword')"
          [attr.aria-invalid]="showError('oldPassword')"
          (blur)="form.controls.oldPassword.markAsTouched()"
        />
        @if (showError('oldPassword')) {
          <small class="field-error" role="alert">{{ oldPasswordError() | translate: { max: 100 } }}</small>
        }
        <label for="newPassword">{{ 'auth.newPassword' | translate }} <b>*</b></label>
        <input
          id="newPassword"
          type="password"
          formControlName="newPassword"
          maxlength="100"
          autocomplete="new-password"
          [class.invalid]="showError('newPassword')"
          [attr.aria-invalid]="showError('newPassword')"
          (blur)="form.controls.newPassword.markAsTouched()"
        />
        @if (showError('newPassword')) {
          <small class="field-error" role="alert">{{ newPasswordError() | translate: { min: 6, max: 100 } }}</small>
        }
        @if (editing()) {
          <div class="form-actions">
            <app-button type="submit" [loading]="saving()" [disabled]="form.invalid">{{
              'auth.changePassword' | translate
            }}</app-button>
            <button type="button" class="cancel-button" (click)="cancelEdit()">
              {{ 'common.cancel' | translate }}
            </button>
          </div>
        }
      </form>
    </section>
  `,
  styles: `
    .security-card {
      border: 1px solid #e8edf3;
      border-top: 4px solid #f59e0b;
      border-radius: 1rem;
      background: #fff;
      overflow: hidden;
    }
    .security-card > header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.2rem 1.35rem;
      border-bottom: 1px solid #eef2f6;
    }
    .security-card h2 {
      margin: 0;
      color: #1e293b;
      font-size: 1rem;
    }
    .edit-button {
      width: 2.2rem;
      height: 2.2rem;
      display: grid;
      place-items: center;
      border: 1px solid #bfdbfe;
      border-radius: 0.6rem;
      background: #dbeafe;
      color: #1d4ed8;
      cursor: pointer;
    }
    .edit-button:hover {
      border-color: #93c5fd;
      color: #1e40af;
      background: #bfdbfe;
    }
    .security-card form {
      display: grid;
      padding: 1.35rem;
    }
    .security-card label {
      margin: 0.85rem 0 0.4rem;
      color: #334155;
      font-size: 0.83rem;
      font-weight: 650;
    }
    .security-card label b {
      color: #dc2626;
    }
    .security-card input {
      min-height: 2.8rem;
      border: 1px solid #d9e0e9;
      border-radius: 0.7rem;
      padding: 0 0.85rem;
      background: #fff !important;
      color: #1e293b !important;
      -webkit-text-fill-color: #1e293b;
      box-shadow: 0 0 0 1000px #fff inset;
      font: inherit;
      outline: 0;
    }
    .security-card input:focus {
      border-color: #2563eb;
      box-shadow:
        0 0 0 3px rgba(37, 99, 235, 0.1),
        0 0 0 1000px #fff inset;
    }
    .security-card input.invalid {
      border-color: #dc2626;
    }
    .security-card input.invalid:focus {
      border-color: #dc2626;
      box-shadow:
        0 0 0 3px rgba(220, 38, 38, 0.1),
        0 0 0 1000px #fff inset;
    }
    .security-card input:disabled {
      background: #f8fafc !important;
      color: #94a3b8 !important;
      -webkit-text-fill-color: #94a3b8;
      box-shadow: 0 0 0 1000px #f8fafc inset;
      cursor: not-allowed;
    }
    .security-card .field-error {
      margin: 0.4rem 0 0;
      color: #dc2626;
      font-size: 0.75rem;
    }
    .form-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-top: 1.15rem;
    }
    .cancel-button {
      border: 1px solid #fecaca;
      border-radius: 0.7rem;
      background: #fef2f2;
      padding: 0.65rem 1rem;
      color: #dc2626;
      font: inherit;
      font-weight: 650;
      cursor: pointer;
    }
    .cancel-button:hover {
      border-color: #fca5a5;
      background: #fee2e2;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(SweetAlertService);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly form = this.fb.nonNullable.group({
    oldPassword: ['', [Validators.required, Validators.maxLength(100)]],
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]]
  });

  constructor() {
    this.form.disable();
  }

  startEdit(): void {
    this.editing.set(true);
    this.form.enable();
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.form.reset();
    this.form.disable();
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.auth
      .changePassword(value.oldPassword, value.newPassword)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => {
        this.form.reset();
        this.form.disable();
        this.editing.set(false);
        this.toast.success('toast.passwordChanged');
      });
  }

  showError(name: 'oldPassword' | 'newPassword'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  oldPasswordError(): string {
    const errors = this.form.controls.oldPassword.errors;
    if (errors?.['required']) return 'validation.required';
    return 'validation.maxlength';
  }

  newPasswordError(): string {
    const errors = this.form.controls.newPassword.errors;
    if (errors?.['required']) return 'validation.required';
    if (errors?.['minlength']) return 'validation.minlength';
    return 'validation.maxlength';
  }
}
