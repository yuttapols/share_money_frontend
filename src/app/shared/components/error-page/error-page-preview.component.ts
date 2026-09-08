import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-error-page-preview',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="preview">
      <h2>{{ 'errorPage.previewTitle' | translate }}</h2>
      <p>{{ 'errorPage.previewDescription' | translate }}</p>
      <div class="links">
        @for (code of codes; track code) {
          <a [routerLink]="['/error', code]">{{ code }}</a>
        }
      </div>
    </section>
  `,
  styles: `
    .preview {
      border: var(--border-width) solid var(--border-color);
      border-radius: 1rem;
      background: var(--color-surface);
      padding: 2rem;
      text-align: center;
    }
    .preview h2 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 1.05rem;
    }
    .preview p {
      margin: 0.4rem 0 0;
      color: var(--color-text-secondary);
    }
    .links {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .links a {
      border-radius: 0.75rem;
      padding: 0.65rem 1.4rem;
      border: var(--border-width) solid var(--border-color);
      background: var(--color-surface);
      color: var(--color-text-primary);
      font-weight: 700;
      text-decoration: none;
    }
    .links a:hover {
      border-color: #7c3aed;
      color: #6d28d9;
      background: #faf5ff;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorPagePreviewComponent {
  readonly codes = [403, 404, 429, 500];
}
