import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { passwordValidators, resolveValidationError } from '../../../shared/utils/validators.util';

@Component({
  selector: 'app-change-password',
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
          <small class="field-error" role="alert">{{
            oldPasswordError()?.key | translate: oldPasswordError()?.params
          }}</small>
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
          <small class="field-error" role="alert">{{
            newPasswordError()?.key | translate: newPasswordError()?.params
          }}</small>
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
      border: var(--border-width) solid var(--border-color);
      border-top: 4px solid #f59e0b;
      border-radius: 1rem;
      background: var(--color-surface);
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
      color: var(--color-text-primary);
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
      color: var(--color-text-primary);
      font-size: 0.83rem;
      font-weight: 650;
    }
    .security-card label b {
      color: #dc2626;
    }
    .security-card input {
      min-height: 2.8rem;
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--input-radius);
      padding: 0 0.85rem;
      background: var(--color-surface) !important;
      color: var(--color-text-primary) !important;
      -webkit-text-fill-color: var(--color-text-primary);
      box-shadow: 0 0 0 1000px var(--color-surface) inset;
      font: inherit;
      outline: 0;
      transition:
        border-color 0.15s,
        box-shadow 0.15s;
    }
    .security-card input:focus {
      border-color: var(--input-focus-border);
      box-shadow:
        var(--input-focus-ring),
        0 0 0 1000px var(--color-surface) inset;
    }
    .security-card input.invalid {
      border-color: #dc2626;
    }
    .security-card input.invalid:focus {
      border-color: #dc2626;
      box-shadow:
        0 0 0 3px rgba(220, 38, 38, 0.1),
        0 0 0 1000px var(--color-surface) inset;
    }
    .security-card input:disabled {
      background: var(--color-surface-muted) !important;
      color: var(--color-text-muted) !important;
      -webkit-text-fill-color: var(--color-text-muted);
      box-shadow: 0 0 0 1000px var(--color-surface-muted) inset;
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
      background: color-mix(in srgb, #dc2626 12%, var(--color-surface));
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
    newPassword: ['', passwordValidators()]
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

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const confirmed = await this.toast.confirm({
      titleKey: 'auth.changePasswordConfirmTitle',
      textKey: 'auth.changePasswordConfirmText',
      confirmButtonKey: 'common.confirm',
      cancelButtonKey: 'common.cancel'
    });
    if (!confirmed) return;
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.auth
      .changePassword(value.oldPassword, value.newPassword)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => {
        this.toast.success('toast.passwordChanged');
        this.auth.logout();
      });
  }

  showError(name: 'oldPassword' | 'newPassword'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  oldPasswordError() {
    return resolveValidationError(this.form.controls.oldPassword.errors);
  }

  newPasswordError() {
    return resolveValidationError(this.form.controls.newPassword.errors);
  }
}
