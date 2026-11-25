import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { LanguagePickerComponent } from '@shared/component/business/language-picker/language-picker';
import { ButtonComponent } from '@shared/component/general/button/button';
import { IconComponent } from '@shared/component/general/icon/icon';
import { LogoMarkComponent } from '@shared/component/general/icon/logo-mark';
import { DIRECTIONS } from '@shared/constants/directions';
import { LANGUAGES, languageOf } from '@shared/constants/languages';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { SettingsService } from '@shared/service/settings.service';

/**
 * The first launch (F1, F18 — design 3's first screen, «one screen»): the language from the searchable list of 22,
 * the colour direction with its landscape, day or night, an example of Al-Fatihah in the chosen colours, and «Start».
 * The choice is saved in the one functional cookie, and the visitor is taken to the home page in their language.
 */
@Component({
  selector: 'tj-first-launch',
  imports: [TranslatePipe, LanguagePickerComponent, ButtonComponent, IconComponent, LogoMarkComponent],
  templateUrl: './first-launch.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FirstLaunchComponent {
  /** The visitor's language and appearance. */
  protected readonly settings = inject(SettingsService);

  /** Moves to the home page after «Start». */
  private readonly router = inject(Router);

  /** The backend's Quran text. */
  private readonly quran = inject(QuranService);

  /** The colour directions of design 3. */
  protected readonly directions = DIRECTIONS;

  /** How many languages there are, for the language button. */
  protected readonly languageCount = LANGUAGES.length;

  /** The visitor's own language, first in the list. */
  protected readonly suggested = this.settings.suggested();

  /** Whether the language list is open. */
  protected readonly pickerOpen = signal(false);

  /** The language in use. */
  protected readonly language = computed(() => languageOf(this.settings.preferences().lang)!);

  /** Al-Fatihah for the example, from the backend — the text exactly as received (AGENTS.md §6.1). */
  protected readonly fatihah = injectQuery(() => ({
    queryKey: ['surah-ayahs', 1],
    queryFn: () => this.quran.getSurahAyahs(1),
    staleTime: Infinity,
  }));

  /**
   * Switches the interface to the chosen language and closes the list.
   *
   * @param code the language
   */
  protected async chooseLanguage(code: string): Promise<void> {
    this.pickerOpen.set(false);
    await this.settings.useLanguage(code);
  }

  /**
   * Shows a colour direction.
   *
   * @param id the direction
   */
  protected chooseDirection(id: string): void {
    this.settings.useAppearance(id, this.settings.preferences().night);
  }

  /** Switches between day and night. */
  protected toggleNight(): void {
    const p = this.settings.preferences();
    this.settings.useAppearance(p.direction, !p.night);
  }

  /**
   * The landscape of a direction in the current day or night theme.
   *
   * @param id the direction
   * @returns its address under `public/landscapes`
   */
  protected landscape(id: string): string {
    return `/landscapes/${id}-${this.settings.preferences().night ? 'night' : 'day'}.svg`;
  }

  /**
   * An ayah number in Arabic-Indic digits, as the mushaf writes it.
   *
   * @param n the number
   * @returns the digits
   */
  protected arabicNumber(n: number): string {
    return n.toLocaleString('ar-EG', { useGrouping: false });
  }

  /** Saves the choice and opens the home page in the chosen language. */
  protected async start(): Promise<void> {
    this.settings.save();
    await this.router.navigate(['/', this.settings.preferences().lang]);
  }
}
