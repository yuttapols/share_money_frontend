import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ProfileApiService } from '../../core/services/profile-api.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { ChangePasswordComponent } from '../auth/change-password/change-password.component';
import { AvatarCardComponent } from './avatar-card/avatar-card.component';
import { BankAccountCardComponent } from './bank-account-card/bank-account-card.component';
import { SweetAlertService } from '../../shared/services/sweet-alert.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AppButtonComponent,
    ChangePasswordComponent,
    AvatarCardComponent,
    BankAccountCardComponent
  ],
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
            <span>{{ initials() }}</span>
            <div>
              <strong>{{ auth.currentUser()?.name }}</strong
              ><small>{{ auth.currentUser()?.role }}</small>
            </div>
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
            <small class="field-error" role="alert">{{ nameError() | translate: { max: 150 } }}</small>
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
      <app-bank-account-card class="bank-section" />
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
    .bank-section {
      grid-column: 1 / -1;
    }
    .card {
      border: 1px solid #e8edf3;
      border-top: 4px solid #3b82f6;
      border-radius: 1rem;
      background: #fff;
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
      color: #1e293b;
      font-size: 1rem;
    }
    .card header p {
      margin: 0.3rem 0 0;
      color: #64748b;
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
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 0.6rem;
    }
    .identity > span {
      width: 3.5rem;
      height: 3.5rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #dbeafe;
      color: #1d4ed8;
      font-weight: 800;
    }
    .identity div {
      display: grid;
      gap: 0.2rem;
    }
    .identity small {
      color: #64748b;
    }
    .card label {
      margin: 0.85rem 0 0.4rem;
      color: #334155;
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
    .card input:focus {
      border-color: #2563eb;
      box-shadow:
        0 0 0 3px rgba(37, 99, 235, 0.1),
        0 0 0 1000px #fff inset;
    }
    .card input[readonly] {
      background: #f8fafc;
      color: #64748b;
      -webkit-text-fill-color: #64748b;
      box-shadow: 0 0 0 1000px #f8fafc inset;
    }
    .card input.invalid {
      border-color: #dc2626;
    }
    .card input.invalid:focus {
      border-color: #dc2626;
      box-shadow:
        0 0 0 3px rgba(220, 38, 38, 0.1),
        0 0 0 1000px #fff inset;
    }
    .card input:disabled {
      background: #f8fafc !important;
      color: #94a3b8 !important;
      -webkit-text-fill-color: #94a3b8;
      box-shadow: 0 0 0 1000px #f8fafc inset;
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
  readonly initials = signal(this.auth.currentUser()?.name.slice(0, 2).toUpperCase() ?? 'SM');
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly preferredLanguage = signal<'th' | 'en'>('th');
  readonly profileForm = this.fb.nonNullable.group({
    name: [this.auth.currentUser()?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(10), Validators.pattern(/^0\d{9}$/)]]
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

  nameError(): string {
    const errors = this.profileForm.controls.name.errors;
    if (errors?.['required']) return 'validation.required';
    return 'validation.maxlength';
  }
}
