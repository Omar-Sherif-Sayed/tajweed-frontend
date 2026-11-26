import { DtoContentSource } from './appinfo';

/** A surah (`DtoSurah`). */
export interface DtoSurah {
  /** Its number, 1 – 114. */
  readonly number: number;
  /** Its Arabic name. */
  readonly nameAr: string;
  /** Its transliterated name. */
  readonly nameTransliteration: string;
  /** Its English name. */
  readonly nameEn: string;
  /** Makki or Madani. */
  readonly revelationType: 'MECCAN' | 'MEDINAN';
  /** Its place in the order of revelation. */
  readonly revelationOrder: number;
  /** How many ayahs. */
  readonly ayahCount: number;
  /** The page of the Madinah mushaf it starts on. */
  readonly startPage: number;
}

/** An ayah (`DtoAyah`). `text` is shown exactly as received — never trimmed or changed (AGENTS.md §6.1). */
export interface DtoAyah {
  /** Its id, 1 – 6,236. */
  readonly id: number;
  /** Its surah. */
  readonly surahNumber: number;
  /** Its number in the surah. */
  readonly number: number;
  /** The Uthmani text, exactly as Tanzil writes it. */
  readonly text: string;
  /** 4 when the text begins with the basmala, otherwise 0. */
  readonly basmalaWordCount: number;
  /** Its page. */
  readonly page: number;
  /** Its juz. */
  readonly juz: number;
  /** Its hizb. */
  readonly hizb: number;
  /** Its hizb quarter. */
  readonly hizbQuarter: number;
  /** Its sajdah, if any. */
  readonly sajdah: string | null;
}

/** A surah with its ayahs (`GET /v1/surahs/{n}/ayahs` — `DtoSurahAyahs`). */
export interface DtoSurahAyahs {
  /** The surah. */
  readonly surah: DtoSurah;
  /** Its ayahs, in order. */
  readonly ayahs: readonly DtoAyah[];
  /** The text's source — shown on every Quran screen (Tanzil's licence). */
  readonly textSource: DtoContentSource;
}

/** A juz (`GET /v1/juzs` — `DtoJuz`). */
export interface DtoJuz {
  /** Its number, 1 – 30. */
  readonly number: number;
  /** The surah it starts in. */
  readonly startSurahNumber: number;
  /** The ayah it starts at. */
  readonly startAyahNumber: number;
  /** The page it starts on. */
  readonly startPage: number;
}

/** What a line of the printed mushaf holds (`MushafLineKind`). */
export type MushafLineKind = 'SURAH_HEADER' | 'BASMALA' | 'TEXT';

/**
 * A line of the printed Madinah mushaf, 1405H (`DtoMushafLine`). A text line is the words from `firstWord` of
 * `firstAyahId` to `lastWord` of `lastAyahId`, both included: the ayahs' `text` split at single spaces, counted from 0.
 */
export interface DtoMushafLine {
  /** The line, 1 – 15. */
  readonly line: number;
  /** What it holds. */
  readonly kind: MushafLineKind;
  /** The surah of a header or a basmala. */
  readonly surahNumber: number | null;
  /** A text line's first ayah (`DtoAyah.id`). */
  readonly firstAyahId: number | null;
  /** Its first word, from 0. */
  readonly firstWord: number | null;
  /** A text line's last ayah. */
  readonly lastAyahId: number | null;
  /** Its last word, from 0. */
  readonly lastWord: number | null;
}

/**
 * A page of the Madinah mushaf (`GET /v1/pages/{p}` — `DtoPage`): its ayahs (every page begins with a new ayah, so
 * all of them start on it) and its lines as printed.
 */
export interface DtoPage {
  /** Its number, 1 – 604. */
  readonly page: number;
  /** The ayahs on it, in order. */
  readonly ayahs: readonly DtoAyah[];
  /** Its lines, top to bottom (15; 8 on pages 1 and 2). */
  readonly lines: readonly DtoMushafLine[];
  /** The ayahs before which the printed page draws ۞. */
  readonly rubAyahIds: readonly number[];
  /** The text's source. */
  readonly textSource: DtoContentSource;
  /** The source of the line breaks (DigitalKhatt, MIT). */
  readonly layoutSource: DtoContentSource;
}

/** One ayah found by the search (`DtoSearchHit`). */
export interface DtoSearchHit {
  /** The ayah. */
  readonly ayah: DtoAyah;
  /**
   * The indexes (from 0) of the space-separated words of `ayah.text` that matched; **empty = the whole ayah** (the two
   * spellings split words differently in some ayahs — client guide §4).
   */
  readonly matchedWords: readonly number[];
}

/** How many ayahs of a surah matched (`DtoSurahCount`). */
export interface DtoSurahCount {
  /** The surah. */
  readonly surahNumber: number;
  /** How many of its ayahs matched. */
  readonly count: number;
}

/** The answer of the Quran search (`GET /v1/quran-search` — `DtoQuranSearch`, F16). */
export interface DtoQuranSearch {
  /** The query as received. */
  readonly query: string;
  /** Whether the query had tashkeel (then the marks had to agree). */
  readonly withTashkeel: boolean;
  /** The ayah a reference names (`2:255`), if any. */
  readonly ayah: DtoAyah | null;
  /** The surahs a name or number names. */
  readonly surahs: readonly DtoSurah[];
  /** How many ayahs contain the words. */
  readonly total: number;
  /** The page of hits, from 0. */
  readonly page: number;
  /** The page size. */
  readonly size: number;
  /** The ayahs of this page, in mushaf order. */
  readonly hits: readonly DtoSearchHit[];
  /** The matches counted by surah. */
  readonly countsBySurah: readonly DtoSurahCount[];
  /** The displayed text's source. */
  readonly textSource: DtoContentSource;
  /** The search text's sources. */
  readonly searchSources: readonly DtoContentSource[];
}
