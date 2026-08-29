import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly translate = inject(TranslateService);

  constructor() {
    const language = localStorage.getItem('lang') === 'en' ? 'en' : 'th';
    this.translate.use(language);
    document.documentElement.lang = language;
  }
}
