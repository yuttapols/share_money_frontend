import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `<button
    [type]="type()"
    class="app-button"
    [class.app-button--secondary]="variant() === 'secondary'"
    [disabled]="disabled() || loading()"
    (click)="pressed.emit()"
  >
    @if (loading()) {
      <span class="pi pi-spin pi-spinner"></span>
    } @else if (icon()) {
      <span [class]="'pi ' + icon()"></span>
    }
    <span><ng-content /></span>
  </button>`,
  styles: `
    .app-button {
      min-height: 2.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      border: 0;
      border-radius: 0.75rem;
      padding: 0.65rem 1.1rem;
      background: #2563eb;
      color: #fff;
      font: inherit;
      font-weight: 650;
      cursor: pointer;
      transition:
        transform 0.15s,
        box-shadow 0.15s,
        background 0.15s;
    }
    .app-button:hover:not(:disabled) {
      background: #1d4ed8;
      box-shadow: 0 8px 18px rgba(37, 99, 235, 0.24);
      transform: translateY(-1px);
    }
    .app-button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    .app-button--secondary {
      background: var(--color-surface-muted);
      color: var(--color-text-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppButtonComponent {
  readonly type = input<'button' | 'submit'>('button');
  readonly variant = input<'primary' | 'secondary'>('primary');
  readonly icon = input('');
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
