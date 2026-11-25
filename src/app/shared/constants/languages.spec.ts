import { LANGUAGES, languageOf, parseAcceptLanguage, suggestLanguage } from './languages';

describe('languages', () => {
  it('lists the 22 languages of the product, in its order, each once', () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual([
      'ar', 'en', 'ru', 'es', 'de', 'it', 'fr', 'ur', 'hi', 'ko', 'id',
      'ja', 'zh', 'tr', 'bn', 'fa', 'ms', 'sw', 'ha', 'pt', 'ps', 'uz',
    ]);
  });

  it('writes Arabic, Urdu, Persian and Pashto right to left, the others left to right', () => {
    expect(LANGUAGES.filter((l) => l.dir === 'rtl').map((l) => l.code)).toEqual(['ar', 'ur', 'fa', 'ps']);
  });

  it('ignores the region and the case of a code; an unknown code is not a language', () => {
    expect(languageOf('zh-CN')?.code).toBe('zh');
    expect(languageOf('PT_br')?.code).toBe('pt');
    expect(languageOf('xx')).toBeUndefined();
    expect(languageOf(null)).toBeUndefined();
  });

  it('reads Accept-Language by weight and suggests the first of ours, otherwise Arabic', () => {
    expect(parseAcceptLanguage('nl;q=0.9, de-DE;q=0.8, fr;q=0.95')).toEqual(['fr', 'nl', 'de-DE']);
    expect(suggestLanguage(parseAcceptLanguage('nl, de-DE;q=0.8')).code).toBe('de');
    expect(suggestLanguage(['nl', 'sv']).code).toBe('ar');
  });
});
