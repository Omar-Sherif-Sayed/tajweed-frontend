import { inject, Injectable } from '@angular/core';
import { DtoAyahTafsirs } from '@shared/schema/response/tafsir';
import { ApiClient } from '../api';

/** The backend's `tafsir` area (F5, F26): the Quran Foundation's tafsirs, synced by the backend. */
@Injectable({ providedIn: 'root' })
export class TafsirService {
  /** The backend. */
  private readonly api = inject(ApiClient);

  /**
   * Every tafsir of an ayah — «read all its tafsirs» (F26).
   *
   * @param surah the surah
   * @param ayah the ayah
   * @returns the tafsirs and the credit
   */
  getAyahTafsirs(surah: number, ayah: number): Promise<DtoAyahTafsirs> {
    return this.api.get<DtoAyahTafsirs>(`/v1/surahs/${surah}/ayahs/${ayah}/tafsirs`);
  }
}
