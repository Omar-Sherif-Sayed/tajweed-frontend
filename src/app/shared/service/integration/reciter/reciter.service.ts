import { inject, Injectable } from '@angular/core';
import { DtoRadios } from '@shared/schema/response/radio';
import { DtoRecitation, DtoReciter, DtoSurahTimings } from '@shared/schema/response/reciter';
import { ApiClient } from '../api';

/** The backend's `reciter` and `radio` areas (F3, F4, F7, F11). */
@Injectable({ providedIn: 'root' })
export class ReciterService {
  /** The backend. */
  private readonly api = inject(ApiClient);

  /**
   * The reciter picker: every reciter with his recitations, Hafs first.
   *
   * @returns the reciters
   */
  getReciters(): Promise<DtoReciter[]> {
    return this.api.get<DtoReciter[]>('/v1/reciters');
  }

  /**
   * What a player needs: the surahs, the sources in order, the credits.
   *
   * @param id the recitation
   * @returns the recitation
   */
  getRecitation(id: number): Promise<DtoRecitation> {
    return this.api.get<DtoRecitation>(`/v1/recitations/${id}`);
  }

  /**
   * The ayah timings of a surah file.
   *
   * @param id the recitation
   * @param surah the surah
   * @returns the timings
   */
  getTimings(id: number, surah: number): Promise<DtoSurahTimings> {
    return this.api.get<DtoSurahTimings>(`/v1/recitations/${id}/surahs/${surah}/timings`);
  }

  /**
   * The Quran radio stations.
   *
   * @returns the stations and their credits
   */
  getRadios(): Promise<DtoRadios> {
    return this.api.get<DtoRadios>('/v1/radios');
  }
}
