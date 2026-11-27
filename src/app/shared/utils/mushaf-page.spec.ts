import { DtoAyah, DtoPage } from '@shared/schema/response/quran';
import { hizbLabel, juzName, layoutPage, quarterLabel, spreadStart } from './mushaf-page';

/**
 * An ayah for the tests.
 *
 * @param id the id
 * @param surah the surah
 * @param number the number in the surah
 * @param text the text
 * @param basmala the basmala's words in front of the text
 * @returns the ayah
 */
function ayah(id: number, surah: number, number: number, text: string, basmala = 0): DtoAyah {
  return { id, surahNumber: surah, number, text, basmalaWordCount: basmala, page: 9, juz: 1, hizb: 1, hizbQuarter: 1, sajdah: null };
}

const SOURCE = { code: 'X', name: 'X', licence: 'X', sourceUrl: 'X', sha256: 'X', obtainedOn: '2026-11-26' };

/** The printed page built from positions (client guide §3) — `P1-W2`. */
describe('mushaf page layout', () => {
  const page: DtoPage = {
    page: 9,
    ayahs: [ayah(10, 1, 6, 'a b c'), ayah(11, 2, 1, 'B1 B2 B3 B4 x y ۛ', 4), ayah(12, 2, 2, 'p q')],
    lines: [
      { line: 1, kind: 'TEXT', surahNumber: null, firstAyahId: 10, firstWord: 0, lastAyahId: 10, lastWord: 2 },
      { line: 2, kind: 'SURAH_HEADER', surahNumber: 2, firstAyahId: null, firstWord: null, lastAyahId: null, lastWord: null },
      { line: 3, kind: 'BASMALA', surahNumber: 2, firstAyahId: null, firstWord: null, lastAyahId: null, lastWord: null },
      { line: 4, kind: 'TEXT', surahNumber: null, firstAyahId: 11, firstWord: 4, lastAyahId: 12, lastWord: 0 },
      { line: 5, kind: 'TEXT', surahNumber: null, firstAyahId: 12, firstWord: 1, lastAyahId: 12, lastWord: 1 },
    ],
    rubAyahIds: [12],
    textSource: SOURCE,
    layoutSource: SOURCE,
  };

  it('takes every word from the ayahs, as written, and the number after an ayah’s last word', () => {
    const lines = layoutPage(page);
    expect(lines[0]).toEqual({
      kind: 'text',
      line: 1,
      segments: [
        { kind: 'words', ayah: page.ayahs[0], text: 'a b c', units: ['a', 'b', 'c'] },
        { kind: 'end', ayah: page.ayahs[0] },
      ],
      quarter: null,
      glyphs: null,
    });
    expect(lines[1]).toEqual({ kind: 'header', line: 2, surah: 2 });
  });

  it('draws the basmala from the surah’s own ayah 1 and leaves it out of the text line', () => {
    const lines = layoutPage(page);
    expect(lines[2]).toEqual({ kind: 'basmala', line: 3, surah: 2, text: 'B1 B2 B3 B4', glyphs: null });
    const four = lines[3];
    expect(four.kind === 'text' && four.segments.map((s) => (s.kind === 'words' ? s.text : s.kind))).toEqual([
      'x y ۛ',
      'end',
      'rub',
      'p',
    ]);
  });

  it('draws a pause mark attached to its word, as printed, and keeps the words as received', () => {
    const four = layoutPage(page)[3];
    const first = four.kind === 'text' ? four.segments[0] : null;
    expect(first?.kind === 'words' && first.units).toEqual(['x', 'yۛ']);
    expect(first?.kind === 'words' && first.text).toBe('x y ۛ');
    // every character but the space before the mark is drawn, in order
    expect(first?.kind === 'words' && first.units.join('')).toBe('x y ۛ'.replaceAll(' ', ''));
    expect(four.kind === 'text' && four.quarter).toBe(1);
  });

  it('groups the King Fahd glyphs of a line by ayah, an ayah’s number possibly opening the next line', () => {
    const withGlyphs: DtoPage = {
      ...page,
      qcf: {
        lines: [
          { line: 1, glyphs: [{ glyph: 'g1', ayahId: 10, end: false }, { glyph: 'g2', ayahId: 10, end: false }] },
          {
            line: 4,
            glyphs: [
              { glyph: 'e6', ayahId: 10, end: true },
              { glyph: 'g3', ayahId: 11, end: false },
              { glyph: 'e1', ayahId: 11, end: true },
              { glyph: 'g4', ayahId: 12, end: false },
            ],
          },
        ],
        basmala: 'b1 b2',
        credit: 'Quran fonts provided by Quran Foundation',
        creditUrl: 'https://quran.foundation/',
      },
    };
    const lines = layoutPage(withGlyphs);
    expect(lines[0].kind === 'text' && lines[0].glyphs).toEqual([{ ayah: page.ayahs[0], words: ['g1', 'g2'], end: null }]);
    expect(lines[2].kind === 'basmala' && lines[2].glyphs).toBe('b1 b2');
    expect(lines[3].kind === 'text' && lines[3].glyphs).toEqual([
      { ayah: page.ayahs[0], words: [], end: 'e6' },
      { ayah: page.ayahs[1], words: ['g3'], end: 'e1' },
      { ayah: page.ayahs[2], words: ['g4'], end: null },
    ]);
    // the words copied and searched stay the Tanzil text
    expect(lines[3].kind === 'text' && lines[3].segments[0]).toEqual({ kind: 'words', ayah: page.ayahs[1], text: 'x y ۛ', units: ['x', 'yۛ'] });
  });

  it('names the juz and the quarter as the printed page does', () => {
    expect(juzName(1)).toBe('الجزء الأول');
    expect(juzName(26)).toBe('الجزء السادس والعشرون');
    expect(juzName(30)).toBe('الجزء الثلاثون');
    expect(quarterLabel(206)).toEqual({ words: 'ربع الحزب', hizb: '٥٢' });
    expect(quarterLabel(237)).toEqual({ words: 'الحزب', hizb: '٦٠' });
  });

  it('puts the quarter sign only before the ayah’s first word', () => {
    const five = layoutPage(page)[4];
    expect(five.kind === 'text' && five.segments.map((s) => s.kind)).toEqual(['words', 'end']);
  });

  it('writes the hizb quarter as the printed header and pairs the pages as an open mushaf', () => {
    expect(hizbLabel(217)).toBe('الحزب ٥٥');
    expect(hizbLabel(218)).toBe('¼ الحزب ٥٥');
    expect(hizbLabel(220)).toBe('¾ الحزب ٥٥');
    expect(spreadStart(545)).toBe(545);
    expect(spreadStart(546)).toBe(545);
    expect(spreadStart(1)).toBe(1);
  });
});
