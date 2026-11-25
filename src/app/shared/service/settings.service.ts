import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, REQUEST, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Language, languageOf, parseAcceptLanguage, suggestLanguage } from '@shared/constants/languages';
import { DEFAULT_PREFERENCES, Preferences, preferencesCookie, readPreferences } from './preferences';

/** The languages whose script has its own font stylesheet (`angular.json`: `font-<code>.css`, not injected). */
const FONT_SHEETS = ['ur', 'hi', 'bn', 'ko', 'ja', 'zh', 'fa', 'ps'];

/**
 * The visitor's language and appearance, on the server and in the browser alike: reads them from the cookie (or
 * suggests a language from `Accept-Language` / the browser), applies them to the page (`<html lang dir
 * data-direction data-night>`, the translations, the font) and, in the browser only, saves a new choice.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  /** The page, on the server as in the browser. */
  private readonly document = inject(DOCUMENT);

  /** The incoming request — on the server only. */
  private readonly request = inject(REQUEST, { optional: true });

  /** Whether this runs in the browser. */
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The translations. */
  private readonly translate = inject(TranslateService);

  /** The page's title, in the page's language. */
  private readonly title = inject(Title);

  /** What the cookie holds, or `null` on a first visit. */
  readonly saved = readPreferences(this.browser ? this.document.cookie : this.request?.headers.get('cookie'));

  /** The preferences in use. */
  readonly preferences = signal<Preferences>(this.saved ?? { ...DEFAULT_PREFERENCES, lang: this.suggested().code });

  /**
   * The language to suggest on a first visit: the first of the visitor's languages that is one of ours.
   *
   * @returns the language
   */
  suggested(): Language {
    const preferred = this.browser
      ? [...(this.document.defaultView?.navigator.languages ?? [])]
      : parseAcceptLanguage(this.request?.headers.get('accept-language'));
    return suggestLanguage(preferred);
  }

  /**
   * Switches the page to a language: its translations, `lang`, `dir` and font. Resolves when the translations are
   * loaded, so the server renders the page in that language.
   *
   * @param code the language code
   * @returns when it is applied
   */
  async useLanguage(code: string): Promise<void> {
    const lang = languageOf(code) ?? languageOf(DEFAULT_PREFERENCES.lang)!;
    await firstValueFrom(this.translate.use(lang.code));
    const html = this.document.documentElement;
    html.setAttribute('lang', lang.code);
    html.setAttribute('dir', lang.dir);
    html.style.setProperty('--app-font', lang.font);
    this.title.setTitle(`${this.translate.instant('app.name')} - ${this.translate.instant('app.tagline')}`);
    this.useFontSheet(lang.code);
    this.preferences.update((p) => ({ ...p, lang: lang.code }));
  }

  /**
   * Links the font stylesheet of a language whose script needs its own font (`font-<code>.css`, built from
   * `src/styles/fonts/<code>.css`), so the fonts of Urdu, Hindi, Chinese … load only when their language is used.
   * Written on the server too, so the stylesheet arrives with the page.
   *
   * @param code the language code
   */
  private useFontSheet(code: string): void {
    if (!FONT_SHEETS.includes(code)) {
      return;
    }
    const id = `font-sheet-${code}`;
    if (this.document.getElementById(id)) {
      return;
    }
    const link = this.document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `font-${code}.css`;
    this.document.head.appendChild(link);
  }

  /**
   * Shows a colour direction and day or night on the page.
   *
   * @param direction the direction's id
   * @param night whether the night theme is shown
   */
  useAppearance(direction: string, night: boolean): void {
    const html = this.document.documentElement;
    html.setAttribute('data-direction', direction);
    html.setAttribute('data-night', String(night));
    this.preferences.update((p) => ({ ...p, direction, night }));
  }

  /**
   * Saves the current preferences in the cookie — in the browser only (the server never writes it).
   */
  save(): void {
    if (this.browser) {
      this.document.cookie = preferencesCookie(this.preferences());
    }
  }
}
