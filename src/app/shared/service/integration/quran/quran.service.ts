import { inject, Injectable } from '@angular/core';
import { DtoJuz, DtoPage, DtoQuranSearch, DtoSurah, DtoSurahAyahs } from '@shared/schema/response/quran';
import { ApiClient } from '../api';

/** The backend's `quran` area. The text is shown exactly as received (AGENTS.md §6.1). */
@Injectable({ providedIn: 'root' })
export class QuranService {
  /** The backend. */
  private readonly api = inject(ApiClient);

  /**
   * The 114 surahs: names, Makki / Madani, ayahs, first page — the index.
   *
   * @returns the surahs, in mushaf order
   */
  getSurahs(): Promise<DtoSurah[]> {
    return this.api.get<DtoSurah[]>('/v1/surahs');
  }

  /**
   * The 30 juz with their first ayah and page.
   *
   * @returns the juz, in order
   */
  getJuzs(): Promise<DtoJuz[]> {
    return this.api.get<DtoJuz[]>('/v1/juzs');
  }

  /**
   * A surah with its ayahs.
   *
   * @param surah the surah's number, 1 – 114
   * @returns the surah, its ayahs and the text's source
   */
  getSurahAyahs(surah: number): Promise<DtoSurahAyahs> {
    return this.api.get<DtoSurahAyahs>(`/v1/surahs/${surah}/ayahs`);
  }

  /**
   * The ayahs that start on a page of the Madinah mushaf.
   *
   * @param page the page, 1 – 604
   * @returns the page
   */
  getPage(page: number): Promise<DtoPage> {
    return this.api.get<DtoPage>(`/v1/pages/${page}`);
  }

  /**
   * Searches the Quran (F16): words with or without tashkeel, a surah's name or number, a reference such as `2:255`.
   *
   * @param q what the visitor typed
   * @param page the page of hits, from 0
   * @param size the page size
   * @returns the answer
   */
  search(q: string, page = 0, size = 20): Promise<DtoQuranSearch> {
    const params = new URLSearchParams({ q, page: String(page), size: String(size) });
    return this.api.get<DtoQuranSearch>(`/v1/quran-search?${params}`);
  }
}
