import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ProfileApiService } from '../../core/services/profile-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { ChangePasswordComponent } from '../auth/change-password/change-password.component';
import { AvatarCardComponent } from './avatar-card/avatar-card.component';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';
import { resolveValidationError, thaiPhoneValidators } from '../../shared/utils/validators.util';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, TranslatePipe, AppButtonComponent, ChangePasswordComponent, AvatarCardComponent],
  template: `
    <div class="profile-grid">
      <section class="card">
        <header>
          <div>
            <h2>{{ 'profile.personal' | translate }}</h2>
            <p>{{ 'profile.personalDescription' | translate }}</p>
          </div>
          @if (!editing()) {
            <button
              type="button"
              class="edit-button"
              (click)="startEdit()"
              [attr.aria-label]="'common.edit' | translate"
            >
              <span class="pi pi-pencil"></span>
            </button>
          }
        </header>
        <form [formGroup]="profileForm">
          <div class="identity">
            <strong>{{ auth.currentUser()?.name }}</strong
            ><small>{{ auth.currentUser()?.role }}</small>
          </div>
          <label>{{ 'profile.name' | translate }} <b>*</b></label
          ><input
            type="text"
            formControlName="name"
            maxlength="150"
            [class.invalid]="showError('name')"
            [attr.aria-invalid]="showError('name')"
            (blur)="profileForm.controls.name.markAsTouched()"
          />
          @if (showError('name')) {
            <small class="field-error" role="alert">{{ nameError()?.key | translate: nameError()?.params }}</small>
          }
          <label>{{ 'profile.phone' | translate }}</label
          ><input
            type="tel"
            formControlName="phone"
            inputmode="numeric"
            maxlength="10"
            pattern="0[0-9]{9}"
            [class.invalid]="showError('phone')"
            [attr.aria-invalid]="showError('phone')"
            (input)="sanitizePhone($event)"
            (blur)="profileForm.controls.phone.markAsTouched()"
          />
          @if (showError('phone')) {
            <small class="field-error" role="alert">{{ 'validation.phonePattern' | translate }}</small>
          }
          <label>{{ 'auth.username' | translate }}</label
          ><input type="text" [value]="auth.currentUser()?.username" maxlength="50" readonly />
          @if (editing()) {
            <div class="form-actions">
              <app-button
                [loading]="saving()"
                [disabled]="profileForm.invalid || profileForm.pristine"
                (pressed)="save()"
                >{{ 'common.save' | translate }}</app-button
              >
              <button type="button" class="cancel-button" (click)="cancelEdit()">
                {{ 'common.cancel' | translate }}
              </button>
            </div>
          }
        </form>
      </section>
      <div class="side">
        <app-avatar-card />
        <app-change-password />
      </div>
    </div>
  `,
  styles: `
    .profile-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(18rem, 0.75fr);
      gap: 1rem;
    }
    .side {
      display: grid;
      gap: 1rem;
      align-content: start;
    }
    .card {
      border: var(--border-width) solid var(--border-color);
      border-top: 4px solid #3b82f6;
      border-radius: 1rem;
      background: var(--color-surface);
      overflow: hidden;
    }
    .card > header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.2rem 1.35rem;
      border-bottom: 1px solid #eef2f6;
    }
    .card h2 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 1rem;
    }
    .card header p {
      margin: 0.3rem 0 0;
      color: var(--color-text-secondary);
      font-size: 0.78rem;
    }
    .edit-button {
      width: 2.2rem;
      height: 2.2rem;
      flex-shrink: 0;
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
    .card form {
      display: grid;
      padding: 1.35rem;
    }
    .identity {
      display: grid;
      gap: 0.2rem;
      margin-bottom: 0.6rem;
    }
    .identity small {
      color: var(--color-text-secondary);
    }
    .card label {
      margin: 0.85rem 0 0.4rem;
      color: var(--color-text-primary);
      font-size: 0.83rem;
      font-weight: 650;
    }
    .card label b {
      color: #dc2626;
    }
    .card .field-error {
      margin: 0.4rem 0 0;
      color: #dc2626;
      font-size: 0.75rem;
    }
    .card input[type='text'],
    .card input[type='tel'],
    .card input[type='password'] {
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
    .card input:focus {
      border-color: var(--input-focus-border);
      box-shadow:
        var(--input-focus-ring),
        0 0 0 1000px var(--color-surface) inset;
    }
    .card input[readonly] {
      background: var(--color-surface-muted);
      color: var(--color-text-secondary);
      -webkit-text-fill-color: var(--color-text-secondary);
      box-shadow: 0 0 0 1000px var(--color-surface-muted) inset;
    }
    .card input.invalid {
      border-color: #dc2626;
    }
    .card input.invalid:focus {
      border-color: #dc2626;
      box-shadow:
        0 0 0 3px rgba(220, 38, 38, 0.1),
        0 0 0 1000px var(--color-surface) inset;
    }
    .card input:disabled {
      background: var(--color-surface-muted) !important;
      color: var(--color-text-muted) !important;
      -webkit-text-fill-color: var(--color-text-muted);
      box-shadow: 0 0 0 1000px var(--color-surface-muted) inset;
      cursor: not-allowed;
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
    @media (max-width: 850px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileApi = inject(ProfileApiService);
  private readonly alerts = inject(SweetAlertService);
  readonly auth = inject(AuthService);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly preferredLanguage = signal<'th' | 'en'>('th');
  readonly profileForm = this.fb.nonNullable.group({
    name: [this.auth.currentUser()?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    phone: ['', thaiPhoneValidators()]
  });

  constructor() {
    this.profileForm.disable();
  }

  ngOnInit(): void {
    this.profileApi.getMine().subscribe((profile) => {
      this.profileForm.reset({ name: profile.name, phone: profile.phone ?? '' });
      this.preferredLanguage.set(profile.preferredLanguage);
      this.profileForm.disable();
    });
  }

  startEdit(): void {
    this.editing.set(true);
    this.profileForm.enable();
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.ngOnInit();
  }

  save(): void {
    if (this.profileForm.invalid || this.saving()) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const value = this.profileForm.getRawValue();
    this.saving.set(true);
    this.profileApi
      .updateMine({ ...value, preferredLanguage: this.preferredLanguage() })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe((profile) => {
        this.auth.updateCurrentUser(profile.name);
        this.profileForm.reset({ name: profile.name, phone: profile.phone ?? '' });
        this.profileForm.disable();
        this.editing.set(false);
        this.alerts.success('toast.profileUpdated');
      });
  }

  sanitizePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D/g, '').slice(0, 10);

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
      this.profileForm.controls.phone.setValue(sanitizedValue);
    }
  }

  showError(name: 'name' | 'phone'): boolean {
    const control = this.profileForm.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  nameError() {
    return resolveValidationError(this.profileForm.controls.name.errors);
  }
}
