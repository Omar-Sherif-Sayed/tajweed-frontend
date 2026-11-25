import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IconComponent } from '@shared/component/general/icon/icon';
import { Language, LANGUAGES } from '@shared/constants/languages';

/**
 * The searchable list of the 22 languages (F1 — design 3's sheet): the visitor's own language first, then all of
 * them; each in its own script, with its name in the interface language and «right to left» where it applies. A
 * language can be found by its own name, its Arabic name, its English name or its code.
 */
@Component({
  selector: 'tj-language-picker',
  imports: [TranslatePipe, IconComponent, NgTemplateOutlet],
  templateUrl: './language-picker.html',
  host: { '(keydown.escape)': 'closed.emit()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguagePickerComponent {
  /** The language in use. */
  readonly current = input.required<string>();

  /** The visitor's own language (from the browser or `Accept-Language`). */
  readonly suggested = input.required<Language>();

  /** Emitted with the chosen language's code. */
  readonly chosen = output<string>();

  /** Emitted when the list is closed without a choice. */
  readonly closed = output<void>();

  /** What is typed in the search box. */
  protected readonly query = signal('');

  /** The search box, focused when the list opens. */
  private readonly search = viewChild.required<ElementRef<HTMLInputElement>>('search');

  /** The languages that match the search. */
  protected readonly matches = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? LANGUAGES.filter((l) => [l.code, l.nativeName, l.nameEn, l.nameAr].some((n) => n.toLowerCase().includes(q)))
      : LANGUAGES;
  });

  /** Focuses the search box once the list is shown. */
  constructor() {
    afterNextRender(() => this.search().nativeElement.focus());
  }

  /**
   * A language's name in the interface language (the platform's own names — `Intl.DisplayNames`).
   *
   * @param code the language
   * @returns its name, or the code when the platform has none
   */
  protected nameIn(code: string): string {
    try {
      return new Intl.DisplayNames([this.current()], { type: 'language' }).of(code) ?? code;
    } catch {
      return code;
    }
  }

  /**
   * Reads the search box.
   *
   * @param event the input event
   */
  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
