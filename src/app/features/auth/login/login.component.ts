import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { SweetAlertService } from '../../../shared/services/sweet-alert.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, AppButtonComponent],
  template: `
    <main class="login-page">
      <section class="login-visual">
        <div class="visual-content">
          <img
            class="login-logo"
            src="/assets/brand/sharemoney-login.png"
            width="300"
            height="100"
            [alt]="'app.name' | translate"
          />
          <p class="eyebrow">SMART PERSONAL FINANCE</p>
          <h1>
            <span>{{ 'login.heroLine1' | translate }}</span
            ><span>{{ 'login.heroLine2' | translate }}</span>
          </h1>
          <p>{{ 'login.heroDescription' | translate }}</p>
          <div class="trust">
            <span><i class="pi pi-shield"></i>{{ 'login.secure' | translate }}</span
            ><span><i class="pi pi-chart-line"></i>{{ 'login.clear' | translate }}</span>
          </div>
        </div>
      </section>
      <section class="login-panel">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <img
            class="mobile-logo"
            src="/assets/brand/sharemoney-header.png"
            width="200"
            height="60"
            [alt]="'app.name' | translate"
          />
          <p class="eyebrow">{{ 'login.welcome' | translate }}</p>
          <h2>{{ 'login.title' | translate }}</h2>
          <p class="subtitle">{{ 'login.subtitle' | translate }}</p>
          <label for="username">{{ 'auth.username' | translate }} <b>*</b></label>
          <div class="input-wrap" [class.input-wrap--invalid]="showError('username')">
            <span class="pi pi-user"></span
            ><input
              id="username"
              type="text"
              formControlName="username"
              maxlength="50"
              autocomplete="username"
              (input)="sanitizeUsername($event)"
              [attr.aria-invalid]="showError('username')"
              [placeholder]="'auth.usernamePlaceholder' | translate"
            />
          </div>
          @if (showError('username')) {
            <small class="field-error" role="alert">{{ usernameError() | translate: { max: 50 } }}</small>
          }
          <label for="password">{{ 'auth.password' | translate }} <b>*</b></label>
          <div class="input-wrap" [class.input-wrap--invalid]="showError('password')">
            <span class="pi pi-lock"></span
            ><input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              maxlength="100"
              autocomplete="current-password"
              [attr.aria-invalid]="showError('password')"
              [placeholder]="'auth.passwordPlaceholder' | translate"
            /><button type="button" (click)="togglePassword()" [attr.aria-label]="'auth.togglePassword' | translate">
              <span class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></span>
            </button>
          </div>
          @if (showError('password')) {
            <small class="field-error" role="alert">{{ passwordError() | translate: { min: 6, max: 100 } }}</small>
          }
          <label class="remember-option">
            <input type="checkbox" [checked]="rememberUsername()" (change)="toggleRememberUsername($event)" />
            <span>{{ 'auth.rememberUsername' | translate }}</span>
          </label>
          <app-button type="submit" [loading]="submitting()" [disabled]="form.invalid">{{
            'auth.login' | translate
          }}</app-button>
        </form>
      </section>
    </main>
  `,
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly rememberedUsernameKey = 'shareMoney.rememberedUsername';
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sweetAlert = inject(SweetAlertService);
  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly rememberUsername = signal(Boolean(localStorage.getItem(this.rememberedUsernameKey)));
  readonly form = this.fb.nonNullable.group({
    username: [
      localStorage.getItem(this.rememberedUsernameKey) ?? '',
      [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]
    ],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]]
  });
  showError(name: 'username' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }
  usernameError(): string {
    const errors = this.form.controls.username.errors;
    if (errors?.['required']) return 'validation.required';
    if (errors?.['maxlength']) return 'validation.maxlength';
    return 'validation.usernamePattern';
  }
  passwordError(): string {
    const errors = this.form.controls.password.errors;
    if (errors?.['required']) return 'validation.required';
    if (errors?.['minlength']) return 'validation.minlength';
    return 'validation.maxlength';
  }
  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  sanitizeUsername(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/[^a-zA-Z0-9._-]/g, '');
    if (input.value === sanitizedValue) return;
    input.value = sanitizedValue;
    this.form.controls.username.setValue(sanitizedValue);
  }

  toggleRememberUsername(event: Event): void {
    this.rememberUsername.set((event.target as HTMLInputElement).checked);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          if (this.rememberUsername())
            localStorage.setItem(this.rememberedUsernameKey, this.form.controls.username.value);
          else localStorage.removeItem(this.rememberedUsernameKey);
          this.sweetAlert.success('toast.loginSuccess');
          void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard');
        }
      });
  }
}
