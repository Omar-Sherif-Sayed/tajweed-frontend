import { DtoCredit } from './credit';

/** A word and its meaning, as HadeethEnc gives it (`DtoWordMeaning`). */
export interface DtoWordMeaning {
  /** The word. */
  readonly word: string;
  /** Its meaning. */
  readonly meaning: string;
}

/** A hadith in one language (`DtoHadithText`) — shown whole, as received (HadeethEnc's condition and ours). */
export interface DtoHadithText {
  /** Its language. */
  readonly language: string;
  /** Its title. */
  readonly title: string;
  /** The hadith. */
  readonly hadeeth: string;
  /** What comes before it, if anything. */
  readonly hadeethIntro: string | null;
  /** Who reported it. */
  readonly attribution: string | null;
  /** Its grade — never shown apart from the hadith. */
  readonly grade: string | null;
  /** Its explanation. */
  readonly explanation: string | null;
  /** Its benefits. */
  readonly hints: readonly string[];
  /** Word meanings. */
  readonly wordsMeanings: readonly DtoWordMeaning[];
  /** Its reference. */
  readonly reference: string | null;
}

/** A hadith (`GET /v1/hadiths/{id}` — `DtoHadith`). */
export interface DtoHadith {
  /** Its id on HadeethEnc. */
  readonly id: number;
  /** The Arabic, always. */
  readonly arabic: DtoHadithText;
  /** The request's language, when HadeethEnc publishes it. */
  readonly translation: DtoHadithText | null;
  /** Its categories. */
  readonly categoryIds: readonly number[];
  /** Its page on HadeethEnc — linked on every hadith screen (their condition). */
  readonly sourceUrl: string;
  /** «موسوعة الأحاديث النبوية — HadeethEnc.com». */
  readonly credit: DtoCredit;
}

/** A category (`DtoHadithCategory`) — a tree through `parentId`. */
export interface DtoHadithCategory {
  /** Its id. */
  readonly id: number;
  /** Its parent, or `null`. */
  readonly parentId: number | null;
  /** Its title. */
  readonly title: string;
  /** The title's language. */
  readonly titleLanguage: string;
  /** How many hadiths. */
  readonly hadithCount: number;
}

/** The categories (`GET /v1/hadith-categories` — `DtoHadithCategories`). */
export interface DtoHadithCategories {
  /** The categories. */
  readonly categories: readonly DtoHadithCategory[];
  /** The credit. */
  readonly credit: DtoCredit;
}

/** A hadith in a list (`DtoHadithSummary`). */
export interface DtoHadithSummary {
  /** Its id. */
  readonly id: number;
  /** Its title. */
  readonly title: string;
  /** The title's language. */
  readonly titleLanguage: string;
}

/** A page of a category's hadiths (`DtoHadithPage`). */
export interface DtoHadithPage {
  /** The category. */
  readonly categoryId: number;
  /** The hadiths. */
  readonly hadiths: readonly DtoHadithSummary[];
  /** The page, from 0. */
  readonly page: number;
  /** The page size. */
  readonly size: number;
  /** How many in all. */
  readonly total: number;
  /** The credit. */
  readonly credit: DtoCredit;
}
