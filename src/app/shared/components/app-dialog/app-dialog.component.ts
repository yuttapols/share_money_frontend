import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  effect,
  input,
  output,
  viewChild
} from '@angular/core';

let nextDialogId = 0;

@Component({
  selector: 'app-dialog',
  template: `
    @if (visible()) {
      <div class="app-dialog-mask">
        <div
          #panel
          class="app-dialog-panel"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="title() ? titleId : null"
          [style.width]="width()"
          tabindex="-1"
        >
          <header class="app-dialog-header">
            <h2 [id]="titleId" class="app-dialog-title">{{ title() }}</h2>
            <button type="button" class="app-dialog-close" (click)="close()" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </header>
          <div class="app-dialog-content"><ng-content /></div>
        </div>
      </div>
    }
  `,
  styles: `
    .app-dialog-mask {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(15, 23, 42, 0.5);
    }
    .app-dialog-panel {
      display: flex;
      flex-direction: column;
      max-width: calc(100vw - 2rem);
      max-height: calc(100vh - 2rem);
      border-radius: 1.25rem;
      border: var(--border-width) solid var(--border-color);
      background: var(--color-surface);
      color: var(--color-text-primary);
      box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
      outline: none;
    }
    .app-dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem 1.25rem 0;
    }
    .app-dialog-title {
      margin: 0;
      font-size: var(--font-size-modal-title);
      font-weight: 700;
    }
    .app-dialog-close {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 1.4rem;
      line-height: 1;
      cursor: pointer;
    }
    .app-dialog-close:hover {
      background: var(--color-surface-muted);
      color: var(--color-text-primary);
    }
    .app-dialog-content {
      overflow-y: auto;
      padding: 1.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppDialogComponent {
  readonly title = input('');
  readonly visible = input(false);
  readonly width = input('32rem');
  readonly visibleChange = output<boolean>();
  readonly titleId = `app-dialog-title-${nextDialogId++}`;
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect(() => {
      if (this.visible()) this.panel()?.nativeElement.focus();
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) this.close();
  }

  close(): void {
    this.visibleChange.emit(false);
  }
}
