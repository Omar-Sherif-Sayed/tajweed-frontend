import { inject, Injectable, signal } from '@angular/core';
import { LocalStore } from './local-store';

/** Where the visitor stopped reading. */
export interface ReadingPosition {
  /** The surah. */
  readonly surah: number;
  /** The ayah. */
  readonly ayah: number;
  /** The mushaf page, when it was read as printed pages. */
  readonly page?: number;
}

/** A marker colour (F25): its id (also its interface text key `markers.<id>`) and its colour. */
export interface MarkerColour {
  /** The id. */
  readonly id: string;
  /** The colour, as CSS. */
  readonly colour: string;
}

/**
 * The marker colours (F25). The look (the author, 2026-11-20): a light tint over the ayah and its number, the number in
 * the marker's colour; the Quran text keeps one colour.
 */
export const MARKER_COLOURS: readonly MarkerColour[] = [
  { id: 'review', colour: '#C0392B' },
  { id: 'memorise', colour: '#2E7D4F' },
  { id: 'reflect', colour: '#2F5DA8' },
];

/** The reader's text sizes, in rem. */
export const TEXT_SIZES = [1.25, 1.5, 1.75, 2.1, 2.5] as const;

/**
 * What the reader keeps on the device: the last position, the text size and the ayah markers — never sent anywhere
 * (AGENTS.md §2, privacy policy §2).
 */
@Injectable({ providedIn: 'root' })
export class ReadingService {
  /** The browser's storage. */
  private readonly store = inject(LocalStore);

  /** Where the visitor stopped, or `null`. */
  readonly position = signal<ReadingPosition | null>(this.store.read<ReadingPosition | null>('position', null));

  /** The index of the text size in {@link TEXT_SIZES}. */
  readonly textSize = signal<number>(this.store.read('textSize', 1));

  /** The markers: `surah:ayah` → a marker colour's id. */
  readonly markers = signal<Readonly<Record<string, string>>>(this.store.read('markers', {}));

  /**
   * Remembers where the visitor is reading.
   *
   * @param surah the surah
   * @param ayah the ayah
   * @param page the mushaf page, when it is read as printed pages
   */
  savePosition(surah: number, ayah: number, page?: number): void {
    const current = this.position();
    if (current?.surah === surah && current.ayah === ayah && current.page === page) {
      return;
    }
    const next: ReadingPosition = page ? { surah, ayah, page } : { surah, ayah };
    this.position.set(next);
    this.store.write('position', next);
  }

  /**
   * Makes the text larger or smaller.
   *
   * @param step +1 or −1
   */
  changeTextSize(step: number): void {
    const next = Math.min(TEXT_SIZES.length - 1, Math.max(0, this.textSize() + step));
    this.textSize.set(next);
    this.store.write('textSize', next);
  }

  /**
   * Puts a marker on an ayah, or removes it.
   *
   * @param surah the surah
   * @param ayah the ayah
   * @param colourId a marker colour's id, or `null` to remove the marker
   */
  setMarker(surah: number, ayah: number, colourId: string | null): void {
    const next = { ...this.markers() };
    if (colourId) {
      next[`${surah}:${ayah}`] = colourId;
    } else {
      delete next[`${surah}:${ayah}`];
    }
    this.markers.set(next);
    this.store.write('markers', next);
  }

  /**
   * The colour of an ayah's marker.
   *
   * @param surah the surah
   * @param ayah the ayah
   * @returns the colour, or `undefined` when it has none
   */
  markerColour(surah: number, ayah: number): string | undefined {
    const id = this.markers()[`${surah}:${ayah}`];
    return MARKER_COLOURS.find((m) => m.id === id)?.colour;
  }
}
