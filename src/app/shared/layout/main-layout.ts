import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguagePickerComponent } from '@shared/component/business/language-picker/language-picker';
import { IconComponent } from '@shared/component/general/icon/icon';
import { LogoMarkComponent } from '@shared/component/general/icon/logo-mark';
import { PlayerBarComponent } from '@shared/component/business/player-bar/player-bar';
import { languageOf } from '@shared/constants/languages';
import { PlayerService } from '@shared/service/audio/player.service';
import { SettingsService } from '@shared/service/settings.service';

/** The sections in the navigation, in order: the path under `/<lang>/` and the text key. */
const LINKS = [
  { path: '', key: 'nav.home' },
  { path: 'quran', key: 'nav.quran' },
  { path: 'recitation', key: 'nav.recitation' },
  { path: 'radio', key: 'nav.radio' },
  { path: 'prayer', key: 'nav.prayer' },
  { path: 'qibla', key: 'nav.qibla' },
  { path: 'hijri', key: 'nav.hijri' },
  { path: 'hadith', key: 'nav.hadith' },
  { path: 'hifz', key: 'nav.hifz' },
  { path: 'khatma', key: 'nav.khatma' },
  { path: 'sources', key: 'nav.sources' },
  { path: 'settings', key: 'nav.settings' },
  { path: 'about', key: 'nav.about' },
] as const;

/**
 * The frame of every page under `/<lang>/…`: the brand, search, the language button, the sections, and the player bar
 * (one player for the whole application — it keeps playing from page to page). Changing the language opens the same
 * page in the other language (its own URL) and remembers the choice.
 */
@Component({
  selector: 'tj-main-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    LanguagePickerComponent,
    IconComponent,
    LogoMarkComponent,
    PlayerBarComponent,
  ],
  templateUrl: './main-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  /** The visitor's language and appearance. */
  protected readonly settings = inject(SettingsService);

  /** The player, for the space its bar takes. */
  protected readonly player = inject(PlayerService);

  /** The sections in the navigation. */
  protected readonly links = LINKS;

  /** Opens the page in another language. */
  private readonly router = inject(Router);

  /** The visitor's own language, first in the list. */
  protected readonly suggested = this.settings.suggested();

  /** Whether the language list is open. */
  protected readonly pickerOpen = signal(false);

  /** The language of the page. */
  protected readonly language = computed(() => languageOf(this.settings.preferences().lang)!);

  /**
   * Opens the current page in the chosen language and remembers it.
   *
   * @param code the language
   */
  protected async chooseLanguage(code: string): Promise<void> {
    this.pickerOpen.set(false);
    const rest = this.router.url.split('/').slice(2).join('/');
    await this.router.navigateByUrl(`/${code}/${rest}`);
    this.settings.save();
  }
}
