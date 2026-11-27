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
      { path: 'quran', loadComponent: () => import('@component/quran/quran-index').then((m) => m.QuranIndexComponent) },
      { path: 'quran/page/:page', loadComponent: () => import('@component/quran/mushaf').then((m) => m.MushafComponent) },
      { path: 'quran/:surah', loadComponent: () => import('@component/quran/reader').then((m) => m.ReaderComponent) },
      { path: 'search', loadComponent: () => import('@component/search/search').then((m) => m.SearchComponent) },
      {
        path: 'recitation',
        loadComponent: () => import('@component/recitation/recitation').then((m) => m.RecitationComponent),
      },
      { path: 'radio', loadComponent: () => import('@component/radio/radio').then((m) => m.RadioComponent) },
      {
        path: 'hadith',
        loadComponent: () => import('@component/hadith/hadith-categories').then((m) => m.HadithCategoriesComponent),
      },
      {
        path: 'hadith/:id',
        loadComponent: () => import('@component/hadith/hadith-detail').then((m) => m.HadithDetailComponent),
      },
      { path: 'sources', loadComponent: () => import('@component/sources/sources').then((m) => m.SourcesComponent) },
      { path: 'prayer', loadComponent: () => import('@component/prayer/prayer').then((m) => m.PrayerComponent) },
      { path: 'qibla', loadComponent: () => import('@component/qibla/qibla').then((m) => m.QiblaComponent) },
      { path: 'hijri', loadComponent: () => import('@component/hijri/hijri').then((m) => m.HijriComponent) },
      { path: 'hifz', loadComponent: () => import('@component/hifz/hifz').then((m) => m.HifzComponent) },
      { path: 'khatma', loadComponent: () => import('@component/khatma/khatma').then((m) => m.KhatmaComponent) },
      { path: 'notes', loadComponent: () => import('@component/notes/notes').then((m) => m.NotesComponent) },
      { path: 'tracker', loadComponent: () => import('@component/tracker/tracker').then((m) => m.TrackerComponent) },
      { path: 'kids', loadComponent: () => import('@component/kids/kids').then((m) => m.KidsComponent) },
      { path: 'zakat', loadComponent: () => import('@component/zakat/zakat').then((m) => m.ZakatComponent) },
      { path: 'settings', loadComponent: () => import('@component/settings/settings').then((m) => m.SettingsComponent) },
      { path: 'privacy', loadComponent: () => import('@component/privacy/privacy').then((m) => m.PrivacyComponent) },
      { path: '**', component: NotFoundComponent },
    ],
  },
  { path: '**', component: NotFoundComponent, resolve: { lang: firstLaunchResolver } },
];
