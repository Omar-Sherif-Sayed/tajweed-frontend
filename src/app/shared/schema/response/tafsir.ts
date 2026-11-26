import { DtoCredit } from './credit';

/** A tafsir book (`DtoTafsir`). */
export interface DtoTafsir {
  /** Its id (the Quran Foundation's resource id). */
  readonly id: number;
  /** Its Arabic name. */
  readonly nameAr: string;
  /** Its English name. */
  readonly nameEn: string;
  /** Its author, in Arabic. */
  readonly authorAr: string;
  /** Its author, in English. */
  readonly authorEn: string;
  /** Its language. */
  readonly language: string;
}

/** One tafsir's text for an ayah (`DtoAyahTafsir`). A text may cover several ayahs: `from` … `to` (`surah:ayah`). */
export interface DtoAyahTafsir {
  /** The book. */
  readonly tafsir: DtoTafsir;
  /** The first ayah it covers. */
  readonly from: string;
  /** The last ayah it covers. */
  readonly to: string;
  /** HTML as the Quran Foundation sends it: its markup rendered, its words never edited (client guide §8). */
  readonly text: string;
}

/** Every tafsir of an ayah (`GET /v1/surahs/{n}/ayahs/{a}/tafsirs` — `DtoAyahTafsirs`). */
export interface DtoAyahTafsirs {
  /** The surah. */
  readonly surah: number;
  /** The ayah. */
  readonly ayah: number;
  /** The tafsirs, in order. */
  readonly tafsirs: readonly DtoAyahTafsir[];
  /** «Quran data provided by Quran Foundation» — their terms. */
  readonly credit: DtoCredit;
}
