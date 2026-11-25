import { inject, Injectable } from '@angular/core';
import { DtoSurahAyahs } from '@shared/schema/response/quran';
import { ApiClient } from '../api';

/** The backend's `quran` area. The text is shown exactly as received (AGENTS.md §6.1). */
@Injectable({ providedIn: 'root' })
export class QuranService {
  /** The backend. */
  private readonly api = inject(ApiClient);

  /**
   * A surah with its ayahs.
   *
   * @param surah the surah's number, 1 – 114
   * @returns the surah, its ayahs and the text's source
   */
  getSurahAyahs(surah: number): Promise<DtoSurahAyahs> {
    return this.api.get<DtoSurahAyahs>(`/v1/surahs/${surah}/ayahs`);
  }
}
