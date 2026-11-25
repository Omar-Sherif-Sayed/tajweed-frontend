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
