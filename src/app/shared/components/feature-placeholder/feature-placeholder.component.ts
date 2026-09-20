import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="placeholder">
      <span class="pi pi-hammer"></span>
      <h2>{{ 'common.inDevelopment' | translate }}</h2>
      <p>{{ 'common.inDevelopmentDescription' | translate }}</p>
    </section>
  `,
  styles: `
    .placeholder {
      min-height: 20rem;
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 0.7rem;
      padding: 2rem;
      border: var(--border-width) solid var(--border-color);
      border-radius: 1rem;
      background: var(--color-surface);
      text-align: center;
    }
    .placeholder > .pi {
      width: 3.5rem;
      height: 3.5rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: #f3e8ff;
      color: #7c3aed;
      font-size: 1.4rem;
    }
    .placeholder h2,
    .placeholder p {
      margin: 0;
    }
    .placeholder h2 {
      color: var(--color-text-primary);
    }
    .placeholder p {
      max-width: 30rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturePlaceholderComponent {}
