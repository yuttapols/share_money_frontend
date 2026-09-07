import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AppInputComponent), multi: true }],
  template: `
    <label [for]="inputId()"
      >{{ label() }}
      @if (required()) {
        <b>*</b>
      }
    </label>
    <div class="field" [class.field--invalid]="error()">
      @if (icon()) {
        <span class="pi" [class]="'pi ' + icon()"></span>
      }
      <input
        [id]="inputId()"
        [type]="type()"
        [value]="value()"
        [attr.maxlength]="maxLength()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        (input)="update($event)"
        (blur)="touch()"
      />
    </div>
    @if (error()) {
      <small role="alert">{{ error() }}</small>
    }
  `,
  styles: `
    label {
      display: block;
      margin: 0 0 0.4rem;
      color: #334155;
      font-size: 0.86rem;
      font-weight: 650;
    }
    label b {
      color: #dc2626;
    }
    .field {
      min-height: 2.8rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      border: 1px solid #d9e0e9;
      border-radius: 0.7rem;
      padding: 0 0.8rem;
      background: #fff;
    }
    .field:focus-within {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .field--invalid {
      border-color: #dc2626;
    }
    .field .pi {
      color: #94a3b8;
    }
    .field input {
      flex: 1;
      min-width: 0;
      border: 0;
      outline: 0;
      background: transparent;
      font: inherit;
    }
    .field input:disabled {
      cursor: not-allowed;
      color: #64748b;
    }
    small {
      display: block;
      margin-top: 0.35rem;
      color: #dc2626;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppInputComponent implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'password' | 'email' | 'tel'>('text');
  readonly placeholder = input('');
  readonly icon = input('');
  readonly required = input(false);
  readonly maxLength = input(50);
  readonly error = input('');
  readonly value = signal('');
  readonly disabled = signal(false);
  private onChange = (_value: string) => {};
  private onTouched = () => {};
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(callback: (value: string) => void): void {
    this.onChange = callback;
  }
  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }
  update(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }
  touch(): void {
    this.onTouched();
  }
}
