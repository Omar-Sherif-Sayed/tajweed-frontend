// The arithmetic of the study tools (F30, F31, F37, F47) — pure functions, tested in study.spec.ts. Nothing here
// touches the Quran text: it is counted in pages and ayahs only.

/** The pages of the Madinah mushaf. */
export const MUSHAF_PAGES = 604;

/** The ayahs of the Quran (Hafs, Kufan count). */
export const QURAN_AYAHS = 6236;

/** A portion of the khatma: its pages, both included. */
export interface Portion {
  /** Its index, from 0. */
  readonly index: number;
  /** Its first page. */
  readonly from: number;
  /** Its last page. */
  readonly to: number;
}

/**
 * The portions of a khatma of `days` days: the 604 pages shared out as evenly as whole pages allow.
 *
 * @param days 1 – 365
 * @returns one portion a day
 */
export function portions(days: number): Portion[] {
  const n = Math.max(1, Math.min(365, Math.round(days)));
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    from: Math.floor((i * MUSHAF_PAGES) / n) + 1,
    to: Math.floor(((i + 1) * MUSHAF_PAGES) / n),
  })).filter((p) => p.to >= p.from);
}

/**
 * The next portion to read: the first one not yet read through.
 *
 * @param days the khatma's days
 * @param readThrough the last page read (0 = none)
 * @returns the portion, or `null` when the khatma is finished
 */
export function nextPortion(days: number, readThrough: number): Portion | null {
  return portions(days).find((p) => p.to > readThrough) ?? null;
}

/**
 * A date as a day key, in the visitor's own time zone.
 *
 * @param d the date
 * @returns `YYYY-MM-DD`
 */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * The days between two day keys.
 *
 * @param from the first day
 * @param to the second day
 * @returns `to − from` in whole days
 */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** The review schedule of a memorised range, after the design: today, after 1 day, after 3 days, after 7 days. */
export const REVIEW_AFTER_DAYS = [0, 1, 3, 7] as const;

/** A memorised range (F30). */
export interface HifzRange {
  /** The surah. */
  readonly surah: number;
  /** The first ayah. */
  readonly from: number;
  /** The last ayah. */
  readonly to: number;
  /** The day it was memorised (`YYYY-MM-DD`). */
  readonly learned: string;
  /** How many of the scheduled reviews are done. */
  readonly reviews: number;
}

/**
 * When a range's next review is due.
 *
 * @param r the range
 * @returns the day key, or `null` when every review of the schedule is done
 */
export function nextReview(r: HifzRange): string | null {
  const after = REVIEW_AFTER_DAYS[r.reviews];
  if (after === undefined) {
    return null;
  }
  const d = new Date(`${r.learned}T12:00:00`);
  d.setDate(d.getDate() + after);
  return dayKey(d);
}

/**
 * How many different ayahs the ranges hold.
 *
 * @param ranges the memorised ranges
 * @returns the count of distinct ayahs
 */
export function memorisedAyahs(ranges: readonly HifzRange[]): number {
  const seen = new Set<string>();
  for (const r of ranges) {
    for (let a = r.from; a <= r.to; a++) {
      seen.add(`${r.surah}:${a}`);
    }
  }
  return seen.size;
}

/** The settings file (F47): what the device keeps, to load on another device — there are no accounts. */
export interface SettingsFile {
  /** Always `tajweed`. */
  readonly app: 'tajweed';
  /** The file's format. */
  readonly version: 1;
  /** When it was saved (ISO). */
  readonly saved: string;
  /** Every value the application keeps, by its key. */
  readonly data: Readonly<Record<string, unknown>>;
}

/**
 * Reads a settings file.
 *
 * @param text the file's text
 * @returns the file, or `null` when it is not a Tajweed settings file
 */
export function parseSettingsFile(text: string): SettingsFile | null {
  try {
    const f = JSON.parse(text) as Partial<SettingsFile>;
    if (f?.app !== 'tajweed' || f.version !== 1 || typeof f.data !== 'object' || f.data === null || Array.isArray(f.data)) {
      return null;
    }
    return f as SettingsFile;
  } catch {
    return null;
  }
}
