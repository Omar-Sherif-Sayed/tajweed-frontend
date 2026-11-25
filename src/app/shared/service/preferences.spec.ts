import { preferencesCookie, readPreferences } from './preferences';

describe('preferences cookie', () => {
  it('keeps the language, the direction and day or night, for a year, on our own site only', () => {
    const cookie = preferencesCookie({ lang: 'ur', direction: 'mountains', night: true });
    expect(cookie).toBe('tajweed_prefs=ur.mountains.1; Path=/; Max-Age=31536000; SameSite=Lax');
    expect(readPreferences('other=1; ' + cookie.split(';')[0])).toEqual({ lang: 'ur', direction: 'mountains', night: true });
  });

  it('refuses a cookie that is not ours or not valid: a first visit, not an error', () => {
    expect(readPreferences(undefined)).toBeNull();
    expect(readPreferences('tajweed_prefs=xx.suhuf.0')).toBeNull();
    expect(readPreferences('tajweed_prefs=ar.unknown.0')).toBeNull();
    expect(readPreferences('tajweed_prefs=ar.suhuf.2')).toBeNull();
  });
});
