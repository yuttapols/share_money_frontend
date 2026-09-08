import { ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
export const MENU_KEY_PATTERN = /^[a-z0-9_.]+$/;
export const THAI_PHONE_PATTERN = /^0\d{9}$/;
export const BANK_ACCOUNT_PATTERN = /^[0-9\-\s]+$/;

export function usernameValidators(maxLength = 50): ValidatorFn[] {
  return [Validators.required, Validators.maxLength(maxLength), Validators.pattern(USERNAME_PATTERN)];
}

export function passwordValidators(minLength = 6, maxLength = 100): ValidatorFn[] {
  return [Validators.required, Validators.minLength(minLength), Validators.maxLength(maxLength)];
}

export function menuKeyValidators(maxLength = 100): ValidatorFn[] {
  return [Validators.required, Validators.maxLength(maxLength), Validators.pattern(MENU_KEY_PATTERN)];
}

export function thaiPhoneValidators(): ValidatorFn[] {
  return [Validators.maxLength(10), Validators.pattern(THAI_PHONE_PATTERN)];
}

export function bankAccountValidators(maxLength = 30): ValidatorFn[] {
  return [Validators.required, Validators.maxLength(maxLength), Validators.pattern(BANK_ACCOUNT_PATTERN)];
}

export function currencyAmountValidators(min = 0.01, max = 9999999.99): ValidatorFn[] {
  return [Validators.required, Validators.min(min), Validators.max(max)];
}

export interface ValidationMessage {
  key: string;
  params?: Record<string, number>;
}

export function resolveValidationError(
  errors: ValidationErrors | null,
  patternKey = 'validation.pattern'
): ValidationMessage | null {
  if (!errors) return null;
  if (errors['required']) return { key: 'validation.required' };
  if (errors['pattern']) return { key: patternKey };
  if (errors['minlength']) return { key: 'validation.minlength', params: { min: errors['minlength'].requiredLength } };
  if (errors['maxlength']) return { key: 'validation.maxlength', params: { max: errors['maxlength'].requiredLength } };
  if (errors['min']) return { key: 'validation.min', params: { min: errors['min'].min } };
  if (errors['max']) return { key: 'validation.max', params: { max: errors['max'].max } };
  return null;
}
