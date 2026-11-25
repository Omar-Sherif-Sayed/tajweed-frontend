/**
 * A language of the product (AGENTS.md §8.9): adding one is a data change here plus its `src/i18n/<code>.json`, never a
 * change of screens.
 */
export interface Language {
  /** The code used in the URL (`/de/…`), in `Accept-Language` and in the translation file's name. */
  readonly code: string;
  /** The language's name in its own script, as the picker shows it. */
  readonly nativeName: string;
  /** Its name in English, so it can be found by searching in English. */
  readonly nameEn: string;
  /** Its name in Arabic, so it can be found by searching in Arabic. */
  readonly nameAr: string;
  /** The direction of its script. */
  readonly dir: 'rtl' | 'ltr';
  /** The interface font of its script (self-hosted, `styles.scss`), with fallbacks. */
  readonly font: string;
}

/** Inter covers Latin and Cyrillic. */
const LATIN = "'Inter', system-ui, sans-serif";

/** The 22 languages, all available from the first release (the author, 2026-11-19), in the product's order. */
export const LANGUAGES: readonly Language[] = [
  { code: 'ar', nativeName: 'العربية', nameEn: 'Arabic', nameAr: 'العربية', dir: 'rtl', font: "'IBM Plex Sans Arabic', system-ui, sans-serif" },
  { code: 'en', nativeName: 'English', nameEn: 'English', nameAr: 'الإنجليزية', dir: 'ltr', font: LATIN },
  { code: 'ru', nativeName: 'Русский', nameEn: 'Russian', nameAr: 'الروسية', dir: 'ltr', font: LATIN },
  { code: 'es', nativeName: 'Español', nameEn: 'Spanish', nameAr: 'الإسبانية', dir: 'ltr', font: LATIN },
  { code: 'de', nativeName: 'Deutsch', nameEn: 'German', nameAr: 'الألمانية', dir: 'ltr', font: LATIN },
  { code: 'it', nativeName: 'Italiano', nameEn: 'Italian', nameAr: 'الإيطالية', dir: 'ltr', font: LATIN },
  { code: 'fr', nativeName: 'Français', nameEn: 'French', nameAr: 'الفرنسية', dir: 'ltr', font: LATIN },
  { code: 'ur', nativeName: 'اردو', nameEn: 'Urdu', nameAr: 'الأردية', dir: 'rtl', font: "'Noto Nastaliq Urdu', serif" },
  { code: 'hi', nativeName: 'हिन्दी', nameEn: 'Hindi', nameAr: 'الهندية', dir: 'ltr', font: "'Noto Sans Devanagari', 'Inter', sans-serif" },
  { code: 'ko', nativeName: '한국어', nameEn: 'Korean', nameAr: 'الكورية', dir: 'ltr', font: "'Noto Sans KR', 'Inter', sans-serif" },
  { code: 'id', nativeName: 'Bahasa Indonesia', nameEn: 'Indonesian', nameAr: 'الإندونيسية', dir: 'ltr', font: LATIN },
  { code: 'ja', nativeName: '日本語', nameEn: 'Japanese', nameAr: 'اليابانية', dir: 'ltr', font: "'Noto Sans JP', 'Inter', sans-serif" },
  { code: 'zh', nativeName: '中文', nameEn: 'Chinese', nameAr: 'الصينية', dir: 'ltr', font: "'Noto Sans SC', 'Inter', sans-serif" },
  { code: 'tr', nativeName: 'Türkçe', nameEn: 'Turkish', nameAr: 'التركية', dir: 'ltr', font: LATIN },
  { code: 'bn', nativeName: 'বাংলা', nameEn: 'Bengali', nameAr: 'البنغالية', dir: 'ltr', font: "'Noto Sans Bengali', 'Inter', sans-serif" },
  { code: 'fa', nativeName: 'فارسی', nameEn: 'Persian', nameAr: 'الفارسية', dir: 'rtl', font: "'Vazirmatn', sans-serif" },
  { code: 'ms', nativeName: 'Bahasa Melayu', nameEn: 'Malay', nameAr: 'الملايوية', dir: 'ltr', font: LATIN },
  { code: 'sw', nativeName: 'Kiswahili', nameEn: 'Swahili', nameAr: 'السواحلية', dir: 'ltr', font: LATIN },
  { code: 'ha', nativeName: 'Hausa', nameEn: 'Hausa', nameAr: 'الهوسا', dir: 'ltr', font: LATIN },
  { code: 'pt', nativeName: 'Português', nameEn: 'Portuguese', nameAr: 'البرتغالية', dir: 'ltr', font: LATIN },
  { code: 'ps', nativeName: 'پښتو', nameEn: 'Pashto', nameAr: 'البشتو', dir: 'rtl', font: "'Noto Naskh Arabic', serif" },
  { code: 'uz', nativeName: 'Oʻzbekcha', nameEn: 'Uzbek', nameAr: 'الأوزبكية', dir: 'ltr', font: LATIN },
];

/** Arabic: the default, the language of a request that names none of ours (as the backend's). */
export const DEFAULT_LANGUAGE = 'ar';

/**
 * The language with this code.
 *
 * @param code a language code, perhaps with a region (`zh-CN`) or in another case
 * @returns the language, or `undefined` when it is not one of the 22
 */
export function languageOf(code: string | null | undefined): Language | undefined {
  const base = (code ?? '').toLowerCase().split(/[-_]/)[0];
  return LANGUAGES.find((l) => l.code === base);
}

/**
 * The first of the visitor's preferred languages that is one of ours (`Accept-Language` on the server,
 * `navigator.languages` in the browser), or Arabic.
 *
 * @param preferred the preferred language tags, best first
 * @returns the language to suggest
 */
export function suggestLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const lang = languageOf(tag);
    if (lang) {
      return lang;
    }
  }
  return languageOf(DEFAULT_LANGUAGE)!;
}

/**
 * The tags of an `Accept-Language` header, best first.
 *
 * @param header the header, e.g. `de-DE,de;q=0.9,en;q=0.8`
 * @returns the tags in order of their weight
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  return (header ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.trim(), q: q ? Number(q.slice(2)) : 1 };
    })
    .filter((x) => x.tag && x.tag !== '*' && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q)
    .map((x) => x.tag);
}
