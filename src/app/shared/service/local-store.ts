import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

/** The prefix of every key this application writes, so its entries are easy to tell apart. */
const PREFIX = 'tajweed.';

/**
 * The browser's storage for what the visitor keeps on the device (AGENTS.md §2: no accounts — the reading position,
 * markers, reader and prayer settings). Never sent anywhere. On the server, and when the browser refuses storage (a
 * private window, blocked site data), reads give the fallback and writes do nothing: every screen works without it.
 */
@Injectable({ providedIn: 'root' })
export class LocalStore {
  /** Whether this runs in the browser. */
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Reads a value.
   *
   * @param key the key, without the prefix
   * @param fallback what to return when there is nothing (or storage is unavailable)
   * @typeParam T the value's type
   * @returns the value
   */
  read<T>(key: string, fallback: T): T {
    if (!this.browser) {
      return fallback;
    }
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  /**
   * Writes a value.
   *
   * @param key the key, without the prefix
   * @param value the value (JSON)
   */
  write(key: string, value: unknown): void {
    if (!this.browser) {
      return;
    }
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage refused (private window, quota): the setting lives for this visit only.
    }
  }

  /**
   * Every value this application keeps, for the settings file (F47).
   *
   * @returns key (without the prefix) → value
   */
  readAll(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (!this.browser) {
      return out;
    }
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PREFIX)) {
          out[key.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(key) ?? 'null');
        }
      }
    } catch {
      // Storage refused: an empty file.
    }
    return out;
  }

  /**
   * Replaces every value with those of a settings file (F47).
   *
   * @param data key (without the prefix) → value
   */
  replaceAll(data: Readonly<Record<string, unknown>>): void {
    if (!this.browser) {
      return;
    }
    try {
      for (const key of Object.keys(this.readAll())) {
        localStorage.removeItem(PREFIX + key);
      }
    } catch {
      // Storage refused: nothing to remove.
    }
    for (const [key, value] of Object.entries(data)) {
      this.write(key, value);
    }
  }
}
