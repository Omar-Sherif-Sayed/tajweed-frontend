import { DtoAyah, DtoPage } from '@shared/schema/response/quran';

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
       * The same words grouped for drawing: a word with the pause marks or the sajdah sign written after it (Tanzil
       * writes them as words of their own), so a justified line never pulls a mark away from its word. Joined by single
       * spaces they are `text` again — a display layer only.
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
    }
  | {
      /** A run of the text. */
      readonly kind: 'text';
      /** The line, 1 – 15. */
      readonly line: number;
      /** Its pieces, in reading order. */
      readonly segments: readonly Segment[];
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

  // A backend older than 1.7.0 sends no lines: nothing to draw (the page says the server cannot be reached).
  return (page.lines ?? []).map((l): PageLine => {
    if (l.kind === 'SURAH_HEADER') {
      return { kind: 'header', line: l.line, surah: l.surahNumber! };
    }
    if (l.kind === 'BASMALA') {
      const first = page.ayahs.find((a) => a.surahNumber === l.surahNumber && a.number === 1);
      const text = first ? words.get(first.id)!.slice(0, first.basmalaWordCount).join(' ') : '';
      return { kind: 'basmala', line: l.line, surah: l.surahNumber!, text };
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
    return { kind: 'text', line: l.line, segments };
  });
}

/** A word with at least one letter; the others are marks (pause marks, the sajdah sign). */
const LETTER = /\p{L}/u;

/**
 * Groups words for drawing: each word with the mark-only words that follow it.
 *
 * @param words the words, in order
 * @returns the groups, each joined by single spaces
 */
export function units(words: readonly string[]): string[] {
  const out: string[] = [];
  for (const w of words) {
    if (out.length > 0 && !LETTER.test(w)) {
      out[out.length - 1] += ` ${w}`;
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
