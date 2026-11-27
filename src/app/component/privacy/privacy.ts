import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PRIVACY_POLICY } from '@shared/constants/privacy-policy';
import { SettingsService } from '@shared/service/settings.service';

/**
 * The privacy policy (RT-04, F15): the text of `tajweed-docs/docs/legal/privacy-policy.md` (copied by
 * `tools/sync-design.mjs`, never written here) — in Arabic for Arabic, in English for every other language, with a note
 * saying it is published in those two languages. It is still a draft until the first release.
 */
@Component({
  selector: 'tj-privacy',
  imports: [TranslatePipe],
  templateUrl: './privacy.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {
  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** Whether the policy is shown in Arabic. */
  protected readonly arabic = computed(() => this.settings.preferences().lang === 'ar');

  /** The policy's blocks in the language shown. */
  protected readonly blocks = computed(() => (this.arabic() ? PRIVACY_POLICY.ar : PRIVACY_POLICY.en));
}
