import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type CardAccent = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <article class="card" [class]="'card--' + accent()">
      <div class="card__top">
        <span class="card__icon"><i class="pi" [class]="'pi ' + icon()"></i></span>
        @if (badge()) {
          <span class="card__badge">{{ badge() }}</span>
        }
      </div>
      <h3 class="card__title">{{ title() }}</h3>
      <p class="card__description">{{ description() }}</p>
      <div class="card__footer">
        @if (memberLabel()) {
          <div class="card__members">
            <div class="card__avatars">
              @for (avatar of avatars(); track $index) {
                <span class="card__avatar"></span>
              }
            </div>
            <span class="card__member-label">{{ memberLabel() }}</span>
          </div>
        }
        @if (buttonLabel()) {
          <button type="button" class="card__button" (click)="pressed.emit()">{{ buttonLabel() }}</button>
        }
      </div>
    </article>
  `,
  styles: `
    .card {
      position: relative;
      overflow: hidden;
      border-radius: 1.25rem;
      padding: 1.5rem;
      background: var(--color-surface);
      box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
      border: var(--border-width) solid var(--border-color);
      transition:
        transform 0.25s ease,
        box-shadow 0.25s ease,
        border-color 0.25s ease;
    }
    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.1);
      border-color: var(--card-accent, #2563eb);
    }
    .card--blue {
      --card-accent: #3b82f6;
    }
    .card--violet {
      --card-accent: #8b5cf6;
    }
    .card--emerald {
      --card-accent: #10b981;
    }
    .card--amber {
      --card-accent: #f59e0b;
    }
    .card--rose {
      --card-accent: #f43f5e;
    }
    .card__top {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .card__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.75rem;
      background: var(--card-accent, #2563eb);
      color: #fff;
      font-size: 1.15rem;
    }
    .card__badge {
      border-radius: 999px;
      padding: 0.3rem 0.65rem;
      background: color-mix(in srgb, var(--card-accent, #2563eb) 12%, white);
      color: var(--card-accent, #2563eb);
      font-size: 0.68rem;
      font-weight: 650;
    }
    .card__title {
      position: relative;
      margin: 0 0 0.5rem;
      color: var(--color-text-primary);
      font-size: var(--font-size-heading);
      font-weight: 700;
    }
    .card__description {
      position: relative;
      margin: 0 0 1.25rem;
      color: var(--color-text-secondary);
      font-size: var(--font-size-body);
      line-height: 1.55;
    }
    .card__footer {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .card__members {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .card__avatars {
      display: flex;
    }
    .card__avatar {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 999px;
      background: #cbd5e1;
      border: 2px solid #fff;
      margin-left: -0.5rem;
    }
    .card__avatar:first-child {
      margin-left: 0;
    }
    .card__member-label {
      color: var(--color-text-muted);
      font-size: 0.72rem;
    }
    .card__button {
      border: 0;
      border-radius: 0.7rem;
      padding: 0.55rem 1rem;
      background: var(--card-accent, #2563eb);
      color: #fff;
      font: inherit;
      font-size: var(--font-size-body);
      font-weight: 650;
      cursor: pointer;
      transition:
        transform 0.15s,
        filter 0.15s;
    }
    .card__button:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppCardComponent {
  readonly icon = input('pi-bolt');
  readonly badge = input('');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly memberLabel = input('');
  readonly avatarCount = input(3);
  readonly buttonLabel = input('');
  readonly accent = input<CardAccent>('blue');
  readonly pressed = output<void>();
  readonly avatars = computed(() => Array.from({ length: this.avatarCount() }));
}
