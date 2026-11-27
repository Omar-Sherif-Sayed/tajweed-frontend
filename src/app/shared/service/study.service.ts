import { inject, Injectable, signal } from '@angular/core';
import { dayKey, HifzRange, REVIEW_AFTER_DAYS } from '@shared/utils/study';
import { LocalStore } from './local-store';

/** A khatma in progress (F31). */
export interface Khatma {
  /** In how many days. */
  readonly days: number;
  /** The day it started (`YYYY-MM-DD`). */
  readonly started: string;
  /** The last page read (0 = none). */
  readonly readThrough: number;
}

/** What was done on a day (F37): the five prayers and the fast. */
export interface DayRecord {
  /** Fajr. */
  readonly fajr?: boolean;
  /** Dhuhr. */
  readonly dhuhr?: boolean;
  /** Asr. */
  readonly asr?: boolean;
  /** Maghrib. */
  readonly maghrib?: boolean;
  /** Isha. */
  readonly isha?: boolean;
  /** The fast. */
  readonly fast?: boolean;
}

/** What a day record holds, as keys. */
export type DayItem = keyof DayRecord;

/** The day record's items, in order. */
export const DAY_ITEMS: readonly DayItem[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'fast'];

/**
 * The visitor's study tools, kept on the device only (AGENTS.md §2 — no accounts; privacy policy §2): memorised ranges
 * and their reviews (F30), the khatma (F31), notes on ayahs (F32), the prayer and fasting record (F37). No reminder of
 * any kind (the only notification is the adhan).
 */
@Injectable({ providedIn: 'root' })
export class StudyService {
  /** The browser's storage. */
  private readonly store = inject(LocalStore);

  /** The memorised ranges. */
  readonly hifz = signal<readonly HifzRange[]>(this.store.read('hifz', []));

  /** The khatma, or `null`. */
  readonly khatma = signal<Khatma | null>(this.store.read<Khatma | null>('khatma', null));

  /** The notes: `surah:ayah` → text. */
  readonly notes = signal<Readonly<Record<string, string>>>(this.store.read('notes', {}));

  /** The prayer and fasting record: day key → record. */
  readonly tracker = signal<Readonly<Record<string, DayRecord>>>(this.store.read('tracker', {}));

  /**
   * Adds a memorised range; its reviews start today.
   *
   * @param surah the surah
   * @param from the first ayah
   * @param to the last ayah
   */
  addRange(surah: number, from: number, to: number): void {
    const next = [...this.hifz(), { surah, from: Math.min(from, to), to: Math.max(from, to), learned: dayKey(new Date()), reviews: 0 }];
    this.hifz.set(next);
    this.store.write('hifz', next);
  }

  /**
   * Records a review of a range.
   *
   * @param index the range's place in the list
   */
  reviewed(index: number): void {
    const next = this.hifz().map((r, i) => (i === index ? { ...r, reviews: Math.min(REVIEW_AFTER_DAYS.length, r.reviews + 1) } : r));
    this.hifz.set(next);
    this.store.write('hifz', next);
  }

  /**
   * Removes a range.
   *
   * @param index the range's place in the list
   */
  removeRange(index: number): void {
    const next = this.hifz().filter((_, i) => i !== index);
    this.hifz.set(next);
    this.store.write('hifz', next);
  }

  /**
   * Starts a khatma.
   *
   * @param days in how many days
   */
  startKhatma(days: number): void {
    const k: Khatma = { days, started: dayKey(new Date()), readThrough: 0 };
    this.khatma.set(k);
    this.store.write('khatma', k);
  }

  /**
   * Records that the pages up to `page` are read.
   *
   * @param page the last page read
   */
  readKhatmaThrough(page: number): void {
    const k = this.khatma();
    if (k) {
      const next = { ...k, readThrough: Math.max(k.readThrough, page) };
      this.khatma.set(next);
      this.store.write('khatma', next);
    }
  }

  /** Ends the khatma. */
  endKhatma(): void {
    this.khatma.set(null);
    this.store.write('khatma', null);
  }

  /**
   * Saves a note on an ayah, or removes it when the text is empty.
   *
   * @param surah the surah
   * @param ayah the ayah
   * @param text the note
   */
  saveNote(surah: number, ayah: number, text: string): void {
    const next = { ...this.notes() };
    if (text.trim()) {
      next[`${surah}:${ayah}`] = text.trim();
    } else {
      delete next[`${surah}:${ayah}`];
    }
    this.notes.set(next);
    this.store.write('notes', next);
  }

  /**
   * Ticks or unticks an item of a day.
   *
   * @param day the day key
   * @param item the prayer or the fast
   */
  toggle(day: string, item: DayItem): void {
    const record = this.tracker()[day] ?? {};
    const next = { ...this.tracker(), [day]: { ...record, [item]: !record[item] } };
    this.tracker.set(next);
    this.store.write('tracker', next);
  }
}
