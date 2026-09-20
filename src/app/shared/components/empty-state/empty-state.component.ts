import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `<section class="empty-state">
    <span class="pi" [class]="'pi ' + icon()"></span>
    <h3>{{ title() }}</h3>
    <p>{{ message() }}</p>
    @if (actionLabel()) {
      <button type="button" (click)="action.emit()">{{ actionLabel() }}</button>
    }
  </section>`,
  styles: `
    .empty-state {
      display: grid;
      justify-items: center;
      gap: 0.5rem;
      padding: 3rem 1rem;
      text-align: center;
      color: var(--color-text-secondary);
    }
    .empty-state > .pi {
      font-size: 2.5rem;
      color: var(--color-text-muted);
    }
    h3,
    p {
      margin: 0;
    }
    h3 {
      color: var(--color-text-primary);
    }
    button {
      margin-top: 0.5rem;
      border: 0;
      border-radius: 0.7rem;
      padding: 0.65rem 1rem;
      color: #fff;
      background: #2563eb;
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  readonly icon = input('pi-inbox');
  readonly title = input('');
  readonly message = input('');
  readonly actionLabel = input('');
  readonly action = output<void>();
}
