import { Injectable } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { from, Observable } from 'rxjs';

/**
 * Loads a language's interface texts from `src/i18n/<code>.json`, bundled as a separate chunk per language. No HTTP
 * request: the server and the browser load the same files the same way (SSR renders the page already translated).
 */
@Injectable()
export class BundledTranslateLoader implements TranslateLoader {
  /**
   * The texts of one language.
   *
   * @param lang the language code (one of the 22 — the routes allow no other)
   * @returns the texts
   */
  getTranslation(lang: string): Observable<TranslationObject> {
    return from(import(`../../../i18n/${lang}.json`).then((m) => m.default as TranslationObject));
  }
}
