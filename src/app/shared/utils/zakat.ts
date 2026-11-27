/**
 * The Zakat calculator's arithmetic (F42) — money and savings only. Each fatwa body's nisab is computed as that body
 * states it (tajweed-docs `docs/data-sources/candidates-2026-11-27.md` §1.1); the app never mixes or chooses between them.
 */

/** Zakat on money that has reached the nisab and been held a full Hijri year: a quarter of a tenth. */
export const ZAKAT_RATE = 0.025;

/** Dar al-Ifta al-Misriyyah: the nisab is the value of 85 grams of 21-carat gold (fatwas 6203 and 8426). */
export const EGYPT_GOLD21_GRAMS = 85;

/**
 * Saudi Arabia (the Permanent Committee, 13/444, and the Council of Senior Scholars): the nisab of money is the lower
 * of the two nisabs — in grams 85 of pure gold and 595 of pure silver (Ibn Uthaymeen and the seminars on contemporary
 * zakat issues, as cited by Dorar's Fiqh Encyclopedia).
 */
export const SAUDI_GOLD24_GRAMS = 85;

/** The silver nisab in grams of pure silver — see {@link SAUDI_GOLD24_GRAMS}. */
export const SAUDI_SILVER_GRAMS = 595;

/** The outcome for one body. */
export interface ZakatOutcome {
  /** The nisab in the visitor's currency, or `null` when a price it needs is missing. */
  readonly nisab: number | null;
  /** The zakat due: `0` below the nisab, `null` when the nisab is unknown. */
  readonly due: number | null;
}

/**
 * A price typed by the visitor, kept only when it is a positive number.
 *
 * @param value the price
 * @returns the price, or `null`
 */
function price(value: number | null): number | null {
  return value !== null && Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * The nisab as Dar al-Ifta al-Misriyyah states it.
 *
 * @param gold21 the price of one gram of 21-carat gold
 * @returns the nisab, or `null` without the price
 */
export function egyptNisab(gold21: number | null): number | null {
  const p = price(gold21);
  return p === null ? null : EGYPT_GOLD21_GRAMS * p;
}

/**
 * The nisab of money as the Saudi bodies state it: the lower of the gold and the silver nisab. Both prices are needed,
 * since which one is lower depends on them.
 *
 * @param gold24 the price of one gram of pure gold
 * @param silver the price of one gram of pure silver
 * @returns the nisab, or `null` without both prices
 */
export function saudiNisab(gold24: number | null, silver: number | null): number | null {
  const g = price(gold24);
  const s = price(silver);
  return g === null || s === null ? null : Math.min(SAUDI_GOLD24_GRAMS * g, SAUDI_SILVER_GRAMS * s);
}

/**
 * The zakat due on an amount of money against a nisab.
 *
 * @param amount the money and savings
 * @param nisab the nisab, or `null`
 * @returns the outcome
 */
export function zakatOn(amount: number | null, nisab: number | null): ZakatOutcome {
  if (nisab === null) {
    return { nisab: null, due: null };
  }
  const a = amount !== null && Number.isFinite(amount) && amount > 0 ? amount : 0;
  return { nisab, due: a >= nisab ? a * ZAKAT_RATE : 0 };
}
