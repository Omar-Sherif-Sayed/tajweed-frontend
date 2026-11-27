import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SettingsService } from '@shared/service/settings.service';
import { DAY_ITEMS, StudyService } from '@shared/service/study.service';
import { dayKey } from '@shared/utils/study';

/** A day of the week shown. */
interface ShownDay {
  /** Its key. */
  readonly key: string;
  /** Its name in the interface language. */
  readonly label: string;
}

/**
 * The prayer and fasting tracker (F37, design 3): the five prayers and the fast of the last seven days, ticked by the
 * visitor — private, kept on the device only; no reminder.
 */
@Component({
  selector: 'tj-tracker',
  imports: [TranslatePipe],
  templateUrl: './tracker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackerComponent {
  /** The record. */
  protected readonly study = inject(StudyService);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The items of a day: the five prayers, then the fast. */
  protected readonly items = DAY_ITEMS;

  /** Today, in the browser only (the days depend on the visitor's own day). */
  private readonly now = signal<Date | null>(null);

  /** The last seven days, today first. */
  protected readonly days = computed<ShownDay[]>(() => {
    const now = this.now();
    if (!now) {
      return [];
    }
    const fmt = new Intl.DateTimeFormat(this.settings.preferences().lang, { weekday: 'short', day: 'numeric' });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return { key: dayKey(d), label: fmt.format(d) };
    });
  });

  /** Sets today once the page is in the browser. */
  constructor() {
    afterNextRender(() => this.now.set(new Date()));
  }

  /**
   * The text key of an item.
   *
   * @param item the prayer or the fast
   * @returns its key
   */
  protected label(item: string): string {
    return item === 'fast' ? 'tracker.fast' : `prayer.${item}`;
  }
}
