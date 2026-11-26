import { inject, Injectable, signal } from '@angular/core';
import { LocalStore } from './local-store';

/** The adjustments the visitor can choose (F27 — the author, 2026-11-20: −2 … +2 days). */
export const HIJRI_ADJUSTMENTS = [-2, -1, 0, 1, 2] as const;

/** One day of the Hijri calendar. */
export interface HijriDay {
  /** The day of the month. */
  readonly day: number;
  /** The month, 1 – 12. */
  readonly month: number;
  /** The year. */
  readonly year: number;
}

/**
 * Moves a date by whole days.
 *
 * @param date the date
 * @param days how many days (negative for earlier)
 * @returns a new date
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * The Hijri day of a date in the Umm al-Qura calendar, as the browser's own calendar data gives it (Intl, CLDR) —
 * nothing calculated by us.
 *
 * @param date the date
 * @returns the Hijri day
 */
export function hijriDay(date: Date): HijriDay {
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(date);
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value.replace(/\D/g, ''));
  return { day: get('day'), month: get('month'), year: get('year') };
}

/**
 * The Hijri date (F27): the Umm al-Qura calendar of the platform, with the visitor's adjustment of −2 … +2 days to
 * match the country's announcement, kept on the device.
 */
@Injectable({ providedIn: 'root' })
export class HijriService {
  /** The browser's storage. */
  private readonly store = inject(LocalStore);

  /** The adjustment, in days. */
  readonly adjustment = signal<number>(this.store.read('hijriAdjust', 0));

  /**
   * Sets the adjustment.
   *
   * @param days −2 … +2
   */
  setAdjustment(days: number): void {
    this.adjustment.set(days);
    this.store.write('hijriAdjust', days);
  }

  /**
   * A date written in the Hijri calendar, in the interface language, with the adjustment.
   *
   * @param date the Gregorian date
   * @param lang the interface language
   * @returns e.g. «٢٥ جمادى الآخرة ١٤٤٨ هـ»
   */
  format(date: Date, lang: string): string {
    return new Intl.DateTimeFormat(`${lang}-u-ca-islamic-umalqura`, { day: 'numeric', month: 'long', year: 'numeric' }).format(
      addDays(date, this.adjustment()),
    );
  }
}
