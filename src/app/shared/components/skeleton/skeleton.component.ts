import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `<span
    class="skeleton"
    [class.skeleton--circle]="variant() === 'circle'"
    [style.width]="width()"
    [style.height]="height()"
  ></span>`,
  styles: `
    .skeleton {
      display: block;
      border-radius: 0.5rem;
      background: linear-gradient(90deg, #e8edf4 25%, #f8fafc 50%, #e8edf4 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .skeleton--circle {
      border-radius: 999px;
    }
    @keyframes shimmer {
      to {
        background-position: -200% 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonComponent {
  readonly variant = input<'line' | 'circle' | 'block'>('line');
  readonly width = input('100%');
  readonly height = input('1rem');
}
