import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { DEFAULT_LANGUAGE } from '@shared/constants/languages';
import { BundledTranslateLoader } from '@shared/service/translate-loader';
import { routes } from './app.routes';

/**
 * The application's providers, for the browser and (merged in `app.config.server.ts`) the server: zoneless change
 * detection (Angular's default), the router with component input binding, hydration of the server-rendered page, the
 * HTTP client on `fetch` (its answers travel from the server to the browser with the page), TanStack Query, and the
 * translations of the 22 languages.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 2 } } })),
    provideTranslateService({ loader: provideTranslateLoader(BundledTranslateLoader), fallbackLang: DEFAULT_LANGUAGE }),
  ],
};
