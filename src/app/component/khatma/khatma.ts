import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SettingsService } from '@shared/service/settings.service';
import { StudyService } from '@shared/service/study.service';
import { localNumber } from '@shared/utils/quran-text';
import { MUSHAF_PAGES, nextPortion, portions } from '@shared/utils/study';

/**
 * The khatma and the daily portion (F31, design 3): choose in how many days to read the whole mushaf; the 604 printed
 * pages are shared out evenly, today's portion opens in the printed pages, and the progress is the pages read. Kept on
 * the device; no reminder (the only notification is the adhan).
 */
@Component({
  selector: 'tj-khatma',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './khatma.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KhatmaComponent {
  /** The khatma. */
  protected readonly study = inject(StudyService);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The choices of days. */
  protected readonly choices = [7, 10, 15, 20, 30, 40, 60];

  /** The days chosen before starting. */
  protected readonly days = signal(30);

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

  /** The portion to read next, or `null` when the khatma is finished. */
  protected readonly portion = computed(() => {
    const k = this.study.khatma();
    return k ? nextPortion(k.days, k.readThrough) : null;
  });

  /** The share of the mushaf read, in percent. */
  protected readonly percent = computed(() => Math.round(((this.study.khatma()?.readThrough ?? 0) / MUSHAF_PAGES) * 100));

  /** The number of portions read. */
  protected readonly portionsRead = computed(() => {
    const k = this.study.khatma();
    return k ? portions(k.days).filter((p) => p.to <= k.readThrough).length : 0;
  });

  /**
   * A number in the interface language.
   *
   * @param n the number
   * @returns the number, formatted
   */
  protected num(n: number): string {
    return localNumber(n, this.lang());
  }
}
