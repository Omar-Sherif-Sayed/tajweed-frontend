import { languageOf } from '@shared/constants/languages';
import { DtoSurah } from '@shared/schema/response/quran';

/**
 * A surah's name in an interface language: the Arabic name for the languages written in Arabic script, Tanzil's
 * transliteration for the others (AGENTS.md §8.9 — until a named source of names per language exists).
 *
 * @param surah the surah
 * @param lang the interface language
 * @returns the name
 */
export function surahName(surah: Pick<DtoSurah, 'nameAr' | 'nameTransliteration'>, lang: string): string {
  return languageOf(lang)?.dir === 'rtl' ? surah.nameAr : surah.nameTransliteration;
}

/**
 * An ayah number as the mushaf prints it, in Arabic-Indic digits (٢٥٥) — in every interface language, like the
 * printed copy.
 *
 * @param n the number
 * @returns the digits
 */
export function mushafNumber(n: number): string {
  return n.toLocaleString('ar-EG', { useGrouping: false });
}

/**
 * A number in the interface language's own digits and format (AGENTS.md §8.9).
 *
 * @param n the number
 * @param lang the interface language
 * @returns the number, formatted
 */
export function localNumber(n: number, lang: string): string {
  return new Intl.NumberFormat(lang, { useGrouping: false }).format(n);
}

/** An ayah's text split into the basmala heading and the rest. */
export interface BasmalaSplit {
  /** The basmala's words, or `null` when the ayah does not begin with it. */
  readonly basmala: string | null;
  /** The rest of the text. */
  readonly rest: string;
}

/**
 * Splits an ayah's text into the basmala heading and the rest, when the ayah begins with it (client guide §3: the first
 * `basmalaWordCount` space-separated words; nothing else is touched).
 *
 * @param text the ayah's text, as received
 * @param basmalaWordCount 4 when the text begins with the basmala, otherwise 0
 * @returns the heading (or `null`) and the rest of the text
 */
export function splitBasmala(text: string, basmalaWordCount: number): BasmalaSplit {
  if (basmalaWordCount <= 0) {
    return { basmala: null, rest: text };
  }
  const words = text.split(' ');
  return { basmala: words.slice(0, basmalaWordCount).join(' '), rest: words.slice(basmalaWordCount).join(' ') };
}

/** Where mistakes are reported: the documentation repository's issues (AGENTS.md §1, §6.9). */
const ISSUES = 'https://github.com/Omar-Sherif-Sayed/tajweed-docs/issues/new';

/**
 * The link that opens a new GitHub issue about a mistake, its title naming the place (no personal data).
 *
 * @param where what the report is about, e.g. `Quran 2:255` or `Hadith 6208`
 * @returns the link
 */
export function reportLink(where: string): string {
  return `${ISSUES}?${new URLSearchParams({ title: `Mistake: ${where}` })}`;
}
