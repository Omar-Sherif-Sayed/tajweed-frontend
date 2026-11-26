import { inject, Injectable } from '@angular/core';
import { DtoHadith, DtoHadithCategories, DtoHadithPage } from '@shared/schema/response/hadith';
import { ApiClient } from '../api';

/** The backend's `hadith` area (F13): HadeethEnc's encyclopedia, used with its written permission of 2026-11-22. */
@Injectable({ providedIn: 'root' })
export class HadithService {
  /** The backend. */
  private readonly api = inject(ApiClient);

  /**
   * The categories, as a tree through `parentId`.
   *
   * @returns the categories and the credit
   */
  getCategories(): Promise<DtoHadithCategories> {
    return this.api.get<DtoHadithCategories>('/v1/hadith-categories');
  }

  /**
   * The hadiths of a category and its sub-categories.
   *
   * @param id the category
   * @param page the page, from 0
   * @param size the page size
   * @returns the page
   */
  getCategoryHadiths(id: number, page = 0, size = 20): Promise<DtoHadithPage> {
    return this.api.get<DtoHadithPage>(`/v1/hadith-categories/${id}/hadiths?page=${page}&size=${size}`);
  }

  /**
   * One hadith, in Arabic and in the request's language when HadeethEnc publishes it.
   *
   * @param id the hadith
   * @returns the hadith
   */
  getHadith(id: number): Promise<DtoHadith> {
    return this.api.get<DtoHadith>(`/v1/hadiths/${id}`);
  }
}
