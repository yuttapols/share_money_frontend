import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly translate = inject(TranslateService);
  private readonly theme = inject(ThemeService);

  constructor() {
    const language = localStorage.getItem('lang') === 'en' ? 'en' : 'th';
    this.translate.use(language);
    document.documentElement.lang = language;
  }
}
