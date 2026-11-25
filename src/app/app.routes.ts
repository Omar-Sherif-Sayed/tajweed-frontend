import { Routes } from '@angular/router';
import { FirstLaunchComponent } from '@component/onboarding/first-launch';
import { NotFoundComponent } from '@component/not-found/not-found';
import { MainLayoutComponent } from '@shared/layout/main-layout';
import { firstLaunchResolver, languageMatch, languageResolver } from '@shared/routing/language';

/**
 * The routes. `/` is the first launch (the server sends a returning visitor straight to `/<lang>/` — `server.ts`);
 * every other page lives under its language, `/<lang>/…`, one of the 22 (the author, 2026-11-26). Pages are loaded
 * lazily.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: FirstLaunchComponent, resolve: { lang: firstLaunchResolver } },
  {
    path: ':lang',
    canMatch: [languageMatch],
    resolve: { lang: languageResolver },
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('@component/home/home').then((m) => m.HomeComponent) },
      { path: 'about', loadComponent: () => import('@component/about/about').then((m) => m.AboutComponent) },
      { path: '**', component: NotFoundComponent },
    ],
  },
  { path: '**', component: NotFoundComponent, resolve: { lang: firstLaunchResolver } },
];
