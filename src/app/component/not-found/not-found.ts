import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RESPONSE_INIT } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SettingsService } from '@shared/service/settings.service';

/** A page that does not exist: answered with status 404 by the server, with a link home. */
@Component({
  selector: 'tj-not-found',
  imports: [TranslatePipe, RouterLink],
  template: `
    <p class="mt-6 text-lg">{{ 'notFound.title' | translate }}</p>
    <a [routerLink]="['/', settings.preferences().lang]" class="mt-3 inline-block underline">{{ 'nav.home' | translate }}</a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  /** The visitor's language, for the link home. */
  protected readonly settings = inject(SettingsService);

  /** Sets the server's answer to 404 (nothing in the browser). */
  constructor() {
    const response = inject(RESPONSE_INIT, { optional: true });
    if (response) {
      response.status = 404;
    }
  }
}
