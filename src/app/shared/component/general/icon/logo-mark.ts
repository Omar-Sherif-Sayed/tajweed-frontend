import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LOGO } from './logo';

/** The logo of design 3 — an arc of light over the horizon — in the theme's ink and dot colours. */
@Component({
  selector: 'tj-logo-mark',
  template: '',
  host: { '[innerHTML]': 'svg', role: 'img', 'aria-hidden': 'true', class: 'inline-block text-ink [&>svg]:size-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoMarkComponent {
  /** The logo's SVG, our own generated file. */
  protected readonly svg: SafeHtml = inject(DomSanitizer).bypassSecurityTrustHtml(LOGO);
}
