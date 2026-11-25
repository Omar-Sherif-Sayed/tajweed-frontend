import { DOCUMENT } from '@angular/common';
import { inject, REQUEST } from '@angular/core';
import { CanMatchFn, ResolveFn, Route, UrlSegment } from '@angular/router';
import { LANGUAGES, languageOf } from '@shared/constants/languages';
import { SettingsService } from '@shared/service/settings.service';

/**
 * Matches a path whose first segment is one of the 22 language codes (`/ar/…`, `/en/…`) — the language of the page is
 * in its URL (the author, 2026-11-26), so each language is rendered and indexed on its own.
 *
 * @param _route the route
 * @param segments the URL's segments
 * @returns whether the first segment is a language code
 */
export const languageMatch: CanMatchFn = (_route: Route, segments: UrlSegment[]) =>
  segments.length > 0 && LANGUAGES.some((l) => l.code === segments[0].path);

/**
 * Applies the URL's language and the visitor's appearance before the page renders (on the server too), and lists the
 * page in every language for search engines (`hreflang`).
 *
 * @param route the matched route, holding `:lang`
 * @returns the language code
 */
export const languageResolver: ResolveFn<string> = async (route) => {
  const settings = inject(SettingsService);
  const document = inject(DOCUMENT);
  const request = inject(REQUEST, { optional: true });
  const code = languageOf(route.paramMap.get('lang'))!.code;
  const prefs = settings.preferences();
  settings.useAppearance(prefs.direction, prefs.night);
  await settings.useLanguage(code);
  writeAlternates(document, request);
  return code;
};

/**
 * Applies the suggested (or saved) language and appearance on the first launch (`/`).
 *
 * @returns the language code
 */
export const firstLaunchResolver: ResolveFn<string> = async () => {
  const settings = inject(SettingsService);
  const prefs = settings.preferences();
  settings.useAppearance(prefs.direction, prefs.night);
  await settings.useLanguage(prefs.lang);
  return prefs.lang;
};

/**
 * Writes `<link rel="alternate" hreflang>` for the 22 versions of the current page, plus `x-default` (the first
 * launch).
 *
 * @param document the page
 * @param request the incoming request on the server, giving the site's address; `null` in the browser
 */
function writeAlternates(document: Document, request: Request | null): void {
  const url = new URL(request?.url ?? document.location?.href ?? 'http://localhost/');
  const rest = url.pathname.split('/').slice(2).join('/');
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => l.remove());
  const add = (hreflang: string, path: string): void => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', `${url.origin}${path}`);
    document.head.appendChild(link);
  };
  for (const l of LANGUAGES) {
    add(l.code, `/${l.code}/${rest}`);
  }
  add('x-default', '/');
}
