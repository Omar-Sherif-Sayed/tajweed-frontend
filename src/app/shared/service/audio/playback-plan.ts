import { DtoAyahTiming } from '@shared/schema/response/reciter';

/** The longest wait between two tries (AGENTS.md §8.3: «a growing delay, capped, e.g. 30 s»). */
export const MAX_RETRY_DELAY_MS = 30_000;

/** How many times a source is tried in a row before the next one. */
export const TRIES_PER_SOURCE = 2;

/** Anything with a place in the order of sources and a health status. */
export interface Ordered {
  /** The order to try it in (1 first). */
  readonly priority: number;
  /** `FAILING` = three failed daily checks: tried last, never dropped (client guide §5 rule 5). */
  readonly status: 'OK' | 'FAILING' | null;
}

/**
 * The order to try sources in: by `priority`, the `FAILING` ones after the others — never dropped.
 *
 * @param sources the sources
 * @typeParam T the source's type
 * @returns a new array, in the order to try
 */
export function orderSources<T extends Ordered>(sources: readonly T[]): T[] {
  return [...sources].sort(
    (a, b) => Number(a.status === 'FAILING') - Number(b.status === 'FAILING') || a.priority - b.priority,
  );
}

/** What to do after a failure. */
export interface RetryStep {
  /** The index of the source to try, in the order of {@link orderSources}. */
  readonly sourceIndex: number;
  /** How long to wait before trying. */
  readonly delayMs: number;
}

/**
 * What to do after the `failures`-th failure in a row (AGENTS.md §8.3): the same source again, then the next one,
 * round and round **without limit**, waiting a little longer each time — 1 s, 2 s, 4 s … never more than 30 s.
 *
 * @param failures how many failures in a row so far (1 after the first)
 * @param sourceCount how many sources there are (at least 1)
 * @param firstIndex the source the playback started on
 * @returns the source to try and the wait
 */
export function retryStep(failures: number, sourceCount: number, firstIndex = 0): RetryStep {
  const n = Math.max(1, sourceCount);
  const sourceIndex = (firstIndex + Math.floor(failures / TRIES_PER_SOURCE)) % n;
  const delayMs = Math.min(MAX_RETRY_DELAY_MS, 1000 * 2 ** Math.min(failures - 1, 15));
  return { sourceIndex, delayMs };
}

/**
 * A file's address: `{surah}` and `{ayah}` written as three digits (client guide §5 rule 3: `2:255` → `002`, `255`).
 *
 * @param template the source's `urlTemplate`
 * @param surah the surah
 * @param ayah the ayah, for an `AYAH_FILE` source
 * @returns the address
 */
export function fillTemplate(template: string, surah: number, ayah?: number): string {
  const three = (n: number): string => String(n).padStart(3, '0');
  let url = template.replaceAll('{surah}', three(surah));
  if (ayah !== undefined) {
    url = url.replaceAll('{ayah}', three(ayah));
  }
  return url;
}

/**
 * The surah after this one, for «to the end, then from Al-Fatihah again» (F3): 114 is followed by 1, and a surah the
 * recitation does not have is skipped.
 *
 * @param surah the surah that ended
 * @param available the surahs the recitation has
 * @returns the next surah, or `null` when the recitation has none
 */
export function nextSurah(surah: number, available: readonly number[]): number | null {
  if (available.length === 0) {
    return null;
  }
  for (let step = 1; step <= 114; step++) {
    const candidate = ((surah - 1 + step) % 114) + 1;
    if (available.includes(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * The ayah being recited at a moment of a surah file.
 *
 * @param timings the surah's timings
 * @param ms the moment, in milliseconds
 * @returns the ayah (0 = before ayah 1), or `null` when the moment is outside every timing
 */
export function ayahAt(timings: readonly DtoAyahTiming[], ms: number): number | null {
  for (const t of timings) {
    if (ms >= t.startMs && ms < t.endMs) {
      return t.ayah;
    }
  }
  const last = timings.at(-1);
  return last && ms >= last.endMs ? last.ayah : null;
}
