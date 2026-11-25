import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguagePickerComponent } from '@shared/component/business/language-picker/language-picker';
import { IconComponent } from '@shared/component/general/icon/icon';
import { LogoMarkComponent } from '@shared/component/general/icon/logo-mark';
import { languageOf } from '@shared/constants/languages';
import { SettingsService } from '@shared/service/settings.service';

/**
 * The frame of every page under `/<lang>/…`: the brand, the navigation and the language button. Changing the language
 * opens the same page in the other language (its own URL) and remembers the choice.
 */
@Component({
  selector: 'tj-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguagePickerComponent, IconComponent, LogoMarkComponent],
  templateUrl: './main-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  /** The visitor's language and appearance. */
  protected readonly settings = inject(SettingsService);

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
