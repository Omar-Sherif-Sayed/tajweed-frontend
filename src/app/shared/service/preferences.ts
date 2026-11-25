import { DEFAULT_DIRECTION, DIRECTIONS } from '@shared/constants/directions';
import { languageOf } from '@shared/constants/languages';

/**
 * What the visitor chose on the first launch: the language, the colour direction and day or night. Kept in **one
 * functional cookie** (the author, 2026-11-26) — never sent anywhere but our own web server, never used for tracking —
 * so the server renders the next visit in the visitor's language and colours.
 */
export interface Preferences {
  /** The language code. */
  readonly lang: string;
  /** The colour direction's id. */
  readonly direction: string;
  /** Whether the night theme is chosen. */
  readonly night: boolean;
}

/** The cookie's name. */
export const PREFERENCES_COOKIE = 'tajweed_prefs';

/** How long the cookie is kept: a year. */
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/**
 * Reads the preferences from a `Cookie` header or `document.cookie`.
 *
 * @param cookies the cookies as one string (`a=1; b=2`)
 * @returns the preferences, or `null` when there are none or they are not valid
 */
export function readPreferences(cookies: string | null | undefined): Preferences | null {
  const raw = (cookies ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(PREFERENCES_COOKIE + '='));
  if (!raw) {
    return null;
  }
  const [lang, direction, night] = decodeURIComponent(raw.slice(PREFERENCES_COOKIE.length + 1)).split('.');
  if (!languageOf(lang) || !DIRECTIONS.some((d) => d.id === direction) || (night !== '0' && night !== '1')) {
    return null;
  }
  return { lang: languageOf(lang)!.code, direction, night: night === '1' };
}

/**
 * The cookie that keeps the preferences.
 *
 * @param prefs the preferences
 * @returns the `document.cookie` assignment: the value, the whole site, a year, sent to our own site only
 */
export function preferencesCookie(prefs: Preferences): string {
  const value = `${prefs.lang}.${prefs.direction}.${prefs.night ? 1 : 0}`;
  return `${PREFERENCES_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

/** The preferences before the visitor chooses. */
export const DEFAULT_PREFERENCES: Preferences = { lang: 'ar', direction: DEFAULT_DIRECTION, night: false };
