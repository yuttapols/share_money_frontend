import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `<section class="error-state" role="alert">
    <span class="pi pi-exclamation-circle"></span>
    <div>
      <strong>{{ title() }}</strong>
      <p>{{ message() }}</p>
    </div>
    @if (retryLabel()) {
      <button type="button" (click)="retry.emit()"><span class="pi pi-refresh"></span>{{ retryLabel() }}</button>
    }
  </section>`,
  styles: `
    .error-state {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid #fecaca;
      border-radius: 0.75rem;
      background: #fef2f2;
      color: #991b1b;
    }
    p {
      margin: 0.2rem 0 0;
    }
    button {
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      font-weight: 650;
      cursor: pointer;
    }
    button .pi {
      margin-right: 0.4rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorStateComponent {
  readonly title = input('');
  readonly message = input('');
  readonly retryLabel = input('');
  readonly retry = output<void>();
}
