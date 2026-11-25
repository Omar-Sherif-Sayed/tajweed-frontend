import { inject, Injectable } from '@angular/core';
import { DtoAppInfo, DtoContentVersion } from '@shared/schema/response/appinfo';
import { ApiClient } from '../api';

/** The backend's `appinfo` and `source` areas: `/v1/app-info`, `/v1/content-version`. */
@Injectable({ providedIn: 'root' })
export class AppInfoService {
  /** The backend. */
  private readonly api = inject(ApiClient);

  /**
   * Facts about the application: its name, author, API version, languages.
   *
   * @returns the answer
   */
  getAppInfo(): Promise<DtoAppInfo> {
    return this.api.get<DtoAppInfo>('/v1/app-info');
  }

  /**
   * The content's fingerprint and every source with its licence and checksum (F17).
   *
   * @returns the answer
   */
  getContentVersion(): Promise<DtoContentVersion> {
    return this.api.get<DtoContentVersion>('/v1/content-version');
  }
}
