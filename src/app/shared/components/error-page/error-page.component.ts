import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';

interface ErrorPageConfig {
  titleKey: string;
  descriptionKey: string;
}

const ERROR_PAGE_CONFIGS: Record<number, ErrorPageConfig> = {
  403: { titleKey: 'errorPage.forbiddenTitle', descriptionKey: 'errorPage.forbiddenDescription' },
  404: { titleKey: 'errorPage.notFoundTitle', descriptionKey: 'errorPage.notFoundDescription' },
  429: { titleKey: 'errorPage.tooManyRequestsTitle', descriptionKey: 'errorPage.tooManyRequestsDescription' },
  500: { titleKey: 'errorPage.serverErrorTitle', descriptionKey: 'errorPage.serverErrorDescription' }
};
const DEFAULT_CODE = 404;

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="error-page">
      <div class="sky"></div>
      <div class="ring--a ring"></div>
      <div class="ring--b ring"></div>
      <div class="planet"></div>
      <div class="content">
        <strong class="code">{{ code() }}</strong>
        <p class="eyebrow">{{ 'errorPage.eyebrow' | translate }}</p>
        <h1>{{ config().titleKey | translate }}</h1>
        <p class="description">{{ config().descriptionKey | translate }}</p>
        <div class="actions">
          <a routerLink="/dashboard">{{ 'errorPage.backToHome' | translate }}</a>
          <button type="button" (click)="goBack()">{{ 'errorPage.goBack' | translate }}</button>
        </div>
      </div>
    </section>
  `,
  styles: `
    .error-page {
      position: relative;
      min-height: 26rem;
      display: grid;
      place-content: center;
      overflow: hidden;
      border-radius: 1.5rem;
      background:
        radial-gradient(circle at 22% 20%, rgba(45, 212, 191, 0.28), transparent 32%),
        radial-gradient(circle at 82% 85%, rgba(124, 58, 237, 0.3), transparent 38%),
        linear-gradient(145deg, #0b1f3d, #123f70 55%, #0c5362);
    }
    .sky {
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(rgba(255, 255, 255, 0.55) 1px, transparent 1px),
        radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px);
      background-size:
        4rem 4rem,
        2.5rem 2.5rem;
      background-position:
        0 0,
        1.2rem 1.6rem;
      opacity: 0.5;
    }
    .ring {
      position: absolute;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 50%;
    }
    .ring--a {
      width: 22rem;
      height: 22rem;
      left: -8rem;
      bottom: -10rem;
    }
    .ring--b {
      width: 15rem;
      height: 15rem;
      right: -5rem;
      top: -6rem;
    }
    .planet {
      position: absolute;
      right: 12%;
      top: 18%;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 50%;
      background: radial-gradient(circle at 32% 30%, #5eead4, #0f766e 70%);
      box-shadow: 0 0 2.5rem rgba(94, 234, 212, 0.55);
      animation: float 5s ease-in-out infinite;
    }
    @keyframes float {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-0.9rem);
      }
    }
    .content {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 0.4rem;
      padding: 3.5rem 1.5rem;
      text-align: center;
    }
    .code {
      color: #fff;
      font-size: clamp(4rem, 10vw, 6.5rem);
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.04em;
      text-shadow: 0 0 2.5rem rgba(94, 234, 212, 0.45);
    }
    .eyebrow {
      margin: 0.5rem 0 0;
      color: #5eead4;
      font-size: 0.85rem;
      font-weight: 750;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .content h1 {
      margin: 0.35rem 0 0;
      color: #fff;
      font-size: 1.4rem;
    }
    .description {
      margin: 0;
      max-width: 26rem;
      color: #cbdff2;
      line-height: 1.6;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 1.4rem;
    }
    .actions a,
    .actions button {
      border-radius: 0.75rem;
      padding: 0.7rem 1.4rem;
      font: inherit;
      font-weight: 650;
      text-decoration: none;
      cursor: pointer;
      transition:
        transform 0.15s,
        background 0.15s,
        border-color 0.15s;
    }
    .actions a {
      border: 0;
      background: linear-gradient(135deg, #7c3aed, #ff167f);
      color: #fff;
    }
    .actions a:hover {
      transform: translateY(-1px);
    }
    .actions button {
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: transparent;
      color: #fff;
    }
    .actions button:hover {
      border-color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.08);
    }
    @media (prefers-reduced-motion: reduce) {
      .planet {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  readonly code = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('code')) || DEFAULT_CODE)), {
    initialValue: DEFAULT_CODE
  });
  readonly config = computed(() => ERROR_PAGE_CONFIGS[this.code()] ?? ERROR_PAGE_CONFIGS[DEFAULT_CODE]);

  goBack(): void {
    this.location.back();
  }
}
