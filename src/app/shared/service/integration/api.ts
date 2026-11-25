import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environment/environment';
import { BaseResponse } from '@shared/schema/response/general';
import { SettingsService } from '@shared/service/settings.service';

/**
 * Calls the backend (`tajweed-backend/docs/api/client-guide.md`): `GET` only, `Accept-Language` from the visitor's
 * language, the envelope's `data` returned. During SSR the answers travel to the browser with the page (Angular's HTTP
 * transfer cache), so the browser does not ask again.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  /** Angular's HTTP client. */
  private readonly http = inject(HttpClient);

  /** The visitor's language. */
  private readonly settings = inject(SettingsService);

  /**
   * One `GET`.
   *
   * @param path the path under the backend's address, e.g. `/v1/app-info`
   * @typeParam T the type of `data`
   * @returns the answer's `data`
   */
  get<T>(path: string): Promise<T> {
    const headers = new HttpHeaders({ 'Accept-Language': this.settings.preferences().lang });
    return firstValueFrom(this.http.get<BaseResponse<T>>(environment.apiUrl + path, { headers })).then((r) => r.data);
  }
}
