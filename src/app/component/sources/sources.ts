import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { WEB_FONTS, WEB_LIBRARIES } from '@shared/constants/web-credits';
import { AppInfoService } from '@shared/service/integration/appinfo/appinfo.service';
import { SettingsService } from '@shared/service/settings.service';

/**
 * Sources (F17): every content source the backend serves, with its licence, link, checksum and date
 * (`/v1/content-version`), then the website's own fonts and software libraries with their licences. The audio
 * sources are credited on the player, HadeethEnc and the Quran Foundation on their screens.
 */
@Component({
  selector: 'tj-sources',
  imports: [TranslatePipe],
  templateUrl: './sources.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourcesComponent {
  /** The backend's sources. */
  private readonly appInfo = inject(AppInfoService);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The content sources. */
  protected readonly content = injectQuery(() => ({
    queryKey: ['content-version', this.settings.preferences().lang],
    queryFn: () => this.appInfo.getContentVersion(),
  }));

  /** The website's fonts. */
  protected readonly fonts = WEB_FONTS;

  /** The website's libraries. */
  protected readonly libraries = WEB_LIBRARIES;
}
