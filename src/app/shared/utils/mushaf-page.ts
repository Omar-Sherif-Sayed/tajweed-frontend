import { DtoAyah, DtoPage } from '@shared/schema/response/quran';

/** A run of one ayah's glyphs on a line, in the page's QCF V1 font. */
export interface GlyphRun {
  /** The ayah. */
  readonly ayah: DtoAyah;
  /** Its word glyphs on the line, in order. */
  readonly words: readonly string[];
  /** The glyph of its number, when the number stands on this line; otherwise `null`. */
  readonly end: string | null;
}

/** A piece of a text line: some words of one ayah, the ayah's number after its last word, or the quarter sign. */
export type Segment =
  | {
      /** Words of an ayah. */
      readonly kind: 'words';
      /** The ayah they belong to. */
      readonly ayah: DtoAyah;
      /** The words, joined by single spaces exactly as they stand in the ayah's text. */
      readonly text: string;
      /**
       * The same words grouped for drawing: a word with the pause marks or the sajdah sign written after it, drawn
       * attached to the word as the printed mushaf has them (the author, 2026-11-27: «خليها زي المصحف بالظبط»). Tanzil
       * writes such a mark as a word of its own after a space; only that space is not drawn — every letter and mark is,
       * in order. `text` keeps the words exactly as received (copy, search).
       */
      readonly units: readonly string[];
    }
  | {
      /** The ayah's number, after its last word. */
      readonly kind: 'end';
      /** The ayah. */
      readonly ayah: DtoAyah;
    }
  | {
      /** The quarter sign ۞, before the first word of the ayah that starts a hizb quarter. */
      readonly kind: 'rub';
      /** The ayah it stands before. */
      readonly ayah: DtoAyah;
    };

/** A line of a page as the reader draws it. */
export type PageLine =
  | {
      /** A surah header. */
      readonly kind: 'header';
      /** The line, 1 – 15. */
      readonly line: number;
      /** The surah. */
      readonly surah: number;
    }
  | {
      /** The basmala, drawn from the surah's ayah 1 — its own first words. */
      readonly kind: 'basmala';
      /** The line, 1 – 15. */
      readonly line: number;
      /** The surah. */
      readonly surah: number;
      /** The basmala's words, as they stand in the ayah's text. */
      readonly text: string;
      /** The basmala's glyphs in the page-1 QCF V1 font, when the page has them. */
      readonly glyphs: string | null;
    }
  | {
      /** A run of the text. */
      readonly kind: 'text';
      /** The line, 1 – 15. */
      readonly line: number;
      /** Its pieces, in reading order. */
      readonly segments: readonly Segment[];
      /** The hizb quarter that starts on this line (its ۞), for the label in the margin; otherwise `null`. */
      readonly quarter: number | null;
      /**
       * The same line as the King Fahd print draws it (QCF V1 glyphs), when the page has them: an ayah's number may
       * stand at the start of the next line, as printed. Otherwise `null`.
       */
      readonly glyphs: readonly GlyphRun[] | null;
    };

/**
 * Lays out a page from the backend's answer (client guide §3): every text line is the words its positions name, taken
 * from the ayahs' text split at single spaces and joined back with single spaces — the same characters in the same
 * order, nothing changed (AGENTS.md §6.1); the ayah's number after its last word; ۞ before an ayah the page lists in
 * `rubAyahIds`.
 *
 * @param page the backend's page
 * @returns its lines
 */
export function layoutPage(page: DtoPage): PageLine[] {
  const byId = new Map(page.ayahs.map((a) => [a.id, a]));
  const words = new Map(page.ayahs.map((a) => [a.id, a.text.split(' ')]));
  const rub = new Set(page.rubAyahIds ?? []);
  const firstWord = (a: DtoAyah): number => a.basmalaWordCount;
  // In QCF V1 an ayah's number can open the next line (566 lines, as printed) — never the next page, so its ayah is
  // always on the page.
  const glyphLines = glyphRuns(page, byId);

  // A backend older than 1.7.0 sends no lines: nothing to draw (the page says the server cannot be reached).
  return (page.lines ?? []).map((l): PageLine => {
    if (l.kind === 'SURAH_HEADER') {
      return { kind: 'header', line: l.line, surah: l.surahNumber! };
    }
    if (l.kind === 'BASMALA') {
      const first = page.ayahs.find((a) => a.surahNumber === l.surahNumber && a.number === 1);
      const text = first ? words.get(first.id)!.slice(0, first.basmalaWordCount).join(' ') : '';
      return { kind: 'basmala', line: l.line, surah: l.surahNumber!, text, glyphs: page.qcf?.basmala || null };
    }
    const segments: Segment[] = [];
    for (let id = l.firstAyahId!; id <= l.lastAyahId!; id++) {
      const ayah = byId.get(id);
      const list = words.get(id);
      if (!ayah || !list) {
        throw new Error(`page ${page.page}: ayah ${id} is not on the page`);
      }
      const from = id === l.firstAyahId ? l.firstWord! : firstWord(ayah);
      const to = id === l.lastAyahId ? l.lastWord! : list.length - 1;
      if (from === firstWord(ayah) && rub.has(id)) {
        segments.push({ kind: 'rub', ayah });
      }
      const run = list.slice(from, to + 1);
      segments.push({ kind: 'words', ayah, text: run.join(' '), units: units(run) });
      if (to === list.length - 1) {
        segments.push({ kind: 'end', ayah });
      }
    }
    const rubSegment = segments.find((s) => s.kind === 'rub');
    return {
      kind: 'text',
      line: l.line,
      segments,
      quarter: rubSegment ? rubSegment.ayah.hizbQuarter : null,
      glyphs: glyphLines.get(l.line) ?? null,
    };
  });
}

/** A glyph run while it is being built. */
interface BuildingRun {
  /** The ayah. */
  readonly ayah: DtoAyah;
  /** Its word glyphs so far. */
  readonly words: string[];
  /** Its number's glyph, once met. */
  end: string | null;
}

/**
 * Groups each QCF V1 line's glyphs into runs of one ayah: its words, then its number when it stands on the line.
 *
 * @param page the backend's page
 * @param byId the page's ayahs by id (and the ayah before the page, for a number at the top)
 * @returns the runs of every text line, by line
 */
function glyphRuns(page: DtoPage, byId: ReadonlyMap<number, DtoAyah>): Map<number, GlyphRun[]> {
  const out = new Map<number, GlyphRun[]>();
  for (const l of page.qcf?.lines ?? []) {
    const runs: BuildingRun[] = [];
    for (const g of l.glyphs) {
      const ayah = byId.get(g.ayahId);
      if (!ayah) {
        return new Map();
      }
      let run = runs.at(-1);
      if (!run || run.ayah.id !== g.ayahId || run.end !== null) {
        run = { ayah, words: [], end: null };
        runs.push(run);
      }
      if (g.end) {
        run.end = g.glyph;
      } else {
        run.words.push(g.glyph);
      }
    }
    out.set(l.line, runs);
  }
  return out;
}

/** A word with at least one letter; the others are marks (pause marks, the sajdah sign). */
const LETTER = /\p{L}/u;

/**
 * Groups words for drawing: each word with the mark-only words that follow it, attached to it (the space Tanzil writes
 * before such a mark is not drawn; every character of the words and marks is, in order).
 *
 * @param words the words, in order
 * @returns the groups
 */
export function units(words: readonly string[]): string[] {
  const out: string[] = [];
  for (const w of words) {
    if (out.length > 0 && !LETTER.test(w)) {
      out[out.length - 1] += w;
    } else {
      out.push(w);
    }
  }
  return out;
}

/** The hizb quarter written as the printed page heads it: «الحزب ٥٥», «¼ الحزب ٥٥», «½ …», «¾ …». */
const QUARTER_MARKS = ['', '¼ ', '½ ', '¾ '] as const;

/**
 * The hizb and the quarter of a hizb-quarter number, as the page header writes them (Arabic-Indic digits).
 *
 * @param hizbQuarter 1 – 240
 * @returns e.g. «¼ الحزب ٥٥»
 */
export function hizbLabel(hizbQuarter: number): string {
  const hizb = Math.ceil(hizbQuarter / 4);
  return `${QUARTER_MARKS[(hizbQuarter - 1) % 4]}الحزب ${hizb.toLocaleString('ar-EG')}`;
}

/** The thirty juz as the printed page heads them: «الجزء الأول» … «الجزء الثلاثون». */
const JUZ_NAMES = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر', 'الثامن عشر',
  'التاسع عشر', 'العشرون', 'الحادي والعشرون', 'الثاني والعشرون', 'الثالث والعشرون', 'الرابع والعشرون',
  'الخامس والعشرون', 'السادس والعشرون', 'السابع والعشرون', 'الثامن والعشرون', 'التاسع والعشرون', 'الثلاثون',
] as const;

/**
 * A juz written as the printed page heads it.
 *
 * @param juz 1 – 30
 * @returns e.g. «الجزء الأول»
 */
export function juzName(juz: number): string {
  return `الجزء ${JUZ_NAMES[juz - 1] ?? juz.toLocaleString('ar-EG')}`;
}

/** The parts of a hizb as the margin of the printed page names them where a quarter starts. */
const QUARTER_NAMES = ['الحزب', 'ربع الحزب', 'نصف الحزب', 'ثلاثة أرباع الحزب'] as const;

/** The margin label of a hizb quarter: its words and its hizb's number. */
export interface QuarterLabel {
  /** «الحزب», «ربع الحزب», «نصف الحزب» or «ثلاثة أرباع الحزب». */
  readonly words: string;
  /** The hizb's number in Arabic-Indic digits. */
  readonly hizb: string;
}

/**
 * The label the printed page puts in the margin beside the ۞ of a hizb quarter.
 *
 * @param hizbQuarter 1 – 240
 * @returns its words and its hizb number, e.g. {words: «ربع الحزب», hizb: «٥٢»}
 */
export function quarterLabel(hizbQuarter: number): QuarterLabel {
  return { words: QUARTER_NAMES[(hizbQuarter - 1) % 4], hizb: Math.ceil(hizbQuarter / 4).toLocaleString('ar-EG') };
}

/**
 * The first page of the two-page spread that shows a page, as an open mushaf: the odd page on the right, the even
 * page on the left (pages 1 – 2, 3 – 4 … 545 – 546).
 *
 * @param page any page, 1 – 604
 * @returns the spread's right-hand (odd) page
 */
export function spreadStart(page: number): number {
  return page % 2 === 1 ? page : page - 1;
}
