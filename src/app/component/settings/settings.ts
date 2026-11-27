import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguagePickerComponent } from '@shared/component/business/language-picker/language-picker';
import { DIRECTIONS } from '@shared/constants/directions';
import { languageOf } from '@shared/constants/languages';
import { LocalStore } from '@shared/service/local-store';
import { Preferences } from '@shared/service/preferences';
import { SettingsService } from '@shared/service/settings.service';
import { dayKey, parseSettingsFile, SettingsFile } from '@shared/utils/study';

/** The key, inside a settings file, of the language and appearance (kept in a cookie, not in the browser's storage). */
const PREFERENCES_KEY = '_preferences';

/**
 * Settings (design 3): the language, the colour direction with day or night, links to the prayer-time method and the
 * Hijri adjustment, and the settings file (F47) — save everything the device keeps (settings, markers, notes, progress)
 * to a file and load it on another device; there are no accounts. The file never leaves the visitor's hands.
 */
@Component({
  selector: 'tj-settings',
  imports: [TranslatePipe, RouterLink, LanguagePickerComponent],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  /** The language and appearance. */
  protected readonly settings = inject(SettingsService);

  /** The browser's storage. */
  private readonly store = inject(LocalStore);

  /** Opens another page. */
  private readonly router = inject(Router);

  /** The document, for the download and the reload. */
  private readonly document = inject(DOCUMENT);

  /** The colour directions. */
  protected readonly directions = DIRECTIONS;

  /** Whether the language list is open. */
  protected readonly pickerOpen = signal(false);

  /** What loading a file gave: `loaded`, `bad`, or nothing yet. */
  protected readonly fileResult = signal<'loaded' | 'bad' | null>(null);

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

  /** The current language's own name. */
  protected readonly languageName = computed(() => languageOf(this.lang())?.nativeName ?? this.lang());

  /**
   * Switches the language: the same page under the new language.
   *
   * @param code the language's code
   */
  protected async chooseLanguage(code: string): Promise<void> {
    this.pickerOpen.set(false);
    await this.router.navigateByUrl(`/${code}/settings`);
  }

  /** Saves everything the device keeps to a file the visitor downloads. */
  protected save(): void {
    const file: SettingsFile = {
      app: 'tajweed',
      version: 1,
      saved: new Date().toISOString(),
      data: { ...this.store.readAll(), [PREFERENCES_KEY]: this.settings.preferences() },
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' }));
    const a = this.document.createElement('a');
    a.href = url;
    a.download = `tajweed-settings-${dayKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Loads a settings file: replaces what the device keeps, then reloads the page so every screen reads it.
   *
   * @param input the file field
   */
  protected async load(input: HTMLInputElement): Promise<void> {
    const text = await input.files?.[0]?.text();
    input.value = '';
    const file = text ? parseSettingsFile(text) : null;
    if (!file) {
      this.fileResult.set('bad');
      return;
    }
    const { [PREFERENCES_KEY]: prefs, ...data } = file.data as Record<string, unknown>;
    this.store.replaceAll(data);
    const p = prefs as Partial<Preferences> | undefined;
    if (p && typeof p.direction === 'string' && typeof p.night === 'boolean' && DIRECTIONS.some((d) => d.id === p.direction)) {
      this.settings.useAppearance(p.direction, p.night);
      this.settings.save();
    }
    this.fileResult.set('loaded');
    const lang = p && typeof p.lang === 'string' && languageOf(p.lang) ? p.lang : this.lang();
    this.document.location.assign(`/${lang}/settings`);
  }
}
