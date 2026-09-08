import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { providePrimeNG } from 'primeng/config';

const AppTheme = definePreset(Aura, {
  components: {
    dialog: {
      root: {
        borderRadius: '1.25rem',
        background: 'var(--color-surface)',
        borderColor: 'var(--border-color)',
        color: 'var(--color-text-primary)',
        shadow: '0 24px 48px rgba(15, 23, 42, 0.18)'
      },
      title: {
        fontSize: 'var(--font-size-modal-title)'
      }
    }
  }
});

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { apiResponseInterceptor } from './core/interceptors/api-response.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        loadingInterceptor,
        errorInterceptor,
        apiResponseInterceptor,
        mockApiInterceptor
      ])
    ),
    providePrimeNG({ theme: { preset: AppTheme, options: { darkModeSelector: '.dark' } } }),
    provideTranslateService({
      fallbackLang: 'th',
      loader: provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' })
    })
  ]
};
