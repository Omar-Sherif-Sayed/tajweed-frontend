import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from './icons';

/**
 * One of design 3's icons (`tools/sync-design.mjs`), drawn inline with `currentColor`, so it takes the colour of the
 * text around it. Decorative: hidden from screen readers (the button or label beside it carries the meaning).
 */
@Component({
  selector: 'tj-icon',
  template: '',
  host: { '[innerHTML]': 'svg()', 'aria-hidden': 'true', class: 'inline-block size-5 shrink-0 [&>svg]:size-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  /** The icon's name (`globe`, `down`, `search`, `sun`, `moon` …). */
  readonly name = input.required<string>();

  /** Marks our own, generated SVG as safe — it never holds user input. */
  private readonly sanitizer = inject(DomSanitizer);

  /** The icon's SVG. */
  protected readonly svg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()] ?? ''),
  );
}
