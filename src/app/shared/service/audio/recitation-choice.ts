import { inject, Injectable, signal } from '@angular/core';
import { LocalStore } from '@shared/service/local-store';

/** The recitation used before the visitor chooses one: Muhammad Siddiq al-Minshawi, murattal, Hafs (id 1). */
export const DEFAULT_RECITATION = 1;

/** The recitation the visitor chose in the reciter picker (F3), kept on the device. */
@Injectable({ providedIn: 'root' })
export class RecitationChoice {
  /** The browser's storage. */
  private readonly store = inject(LocalStore);

  /** The chosen recitation's id. */
  readonly id = signal<number>(this.store.read('recitation', DEFAULT_RECITATION));

  /**
   * Chooses a recitation.
   *
   * @param id the recitation's id
   */
  choose(id: number): void {
    this.id.set(id);
    this.store.write('recitation', id);
  }
}
