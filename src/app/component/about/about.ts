import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { AppInfoService } from '@shared/service/integration/appinfo/appinfo.service';
import { SettingsService } from '@shared/service/settings.service';

/**
 * About (F15) — today the first page that reads the backend: the application's name and author from
 * `/v1/app-info`, and every content source with its licence from `/v1/content-version` (the beginning of F17).
 */
@Component({
  selector: 'tj-about',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './about.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  /** The backend's application facts. */
  private readonly appInfo = inject(AppInfoService);

  /** The page's language, part of the query keys (the answers are in that language). */
  private readonly settings = inject(SettingsService);

  /** The application's facts. */
  protected readonly info = injectQuery(() => ({
    queryKey: ['app-info', this.settings.preferences().lang],
    queryFn: () => this.appInfo.getAppInfo(),
  }));

  /** The content sources. */
  protected readonly sources = injectQuery(() => ({
    queryKey: ['content-version', this.settings.preferences().lang],
    queryFn: () => this.appInfo.getContentVersion(),
  }));
}
