import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PlaceFormComponent } from '@shared/component/business/place-form/place-form';
import { METHOD_IDS, methodSource, nextPrayer, prayerTimes, lastThirdOfNight, TIME_NAMES } from '@shared/service/prayer/prayer-calc';
import { PrayerSettings } from '@shared/service/prayer/prayer-settings.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber } from '@shared/utils/quran-text';

/**
 * Prayer times (F8) and the last third of the night (F36), calculated on the device with the Adhan library from the
 * visitor's place — never sent to the backend (AGENTS.md §8.5). The method is the country's official one where it
 * has been read from its timetable (`P2-D1`), otherwise the Muslim World League's and the screen says so; the visitor
 * can choose another method and the Asr school. The adhan (F9) waits for the muezzins' recordings.
 */
@Component({
  selector: 'tj-prayer',
  imports: [TranslatePipe, PlaceFormComponent],
  templateUrl: './prayer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrayerComponent {
  /** The place and settings. */
  protected readonly prayer = inject(PrayerSettings);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The methods, for the picker. */
  protected readonly methods = METHOD_IDS;

  /** The names of the times. */
  protected readonly names = TIME_NAMES;

  /** The current moment — in the browser only (the server's clock and time zone are never shown). */
  protected readonly now = signal<Date | null>(null);

  /** Today's times, at the place. */
  protected readonly today = computed(() => {
    const now = this.now();
    const place = this.prayer.place();
    return now && place ? prayerTimes(place, now, this.prayer.method(), this.prayer.school()) : null;
  });

  /** The next prayer, and how long until it. */
  protected readonly next = computed(() => {
    const now = this.now();
    const today = this.today();
    const place = this.prayer.place();
    if (!now || !today || !place) {
      return null;
    }
    const tomorrow = prayerTimes(place, new Date(now.getTime() + 86_400_000), this.prayer.method(), this.prayer.school());
    const n = nextPrayer(today, tomorrow.fajr, now);
    const minutes = Math.max(0, Math.round((n.time.getTime() - now.getTime()) / 60_000));
    return { name: n.name, h: Math.floor(minutes / 60), m: minutes % 60 };
  });

  /** The last third of tonight: from today's Maghrib to tomorrow's Fajr. */
  protected readonly lastThird = computed(() => {
    const now = this.now();
    const place = this.prayer.place();
    const today = this.today();
    if (!now || !place || !today) {
      return null;
    }
    const tomorrow = prayerTimes(place, new Date(now.getTime() + 86_400_000), this.prayer.method(), this.prayer.school());
    return {
      starts: lastThirdOfNight(place, now, this.prayer.method(), this.prayer.school()),
      maghrib: today.maghrib,
      fajr: tomorrow.fajr,
    };
  });

  /** The source of the method in use. */
  protected readonly source = computed(() => methodSource(this.prayer.method()));

  /** Starts the clock in the browser. */
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      this.now.set(new Date());
      const timer = setInterval(() => this.now.set(new Date()), 30_000);
      destroy.onDestroy(() => clearInterval(timer));
    });
  }

  /**
   * A time of day in the interface language.
   *
   * @param d the moment
   * @returns e.g. «٤:٥٢ م»
   */
  protected time(d: Date): string {
    return new Intl.DateTimeFormat(this.settings.preferences().lang, { hour: 'numeric', minute: '2-digit' }).format(d);
  }

  /**
   * A number in the interface language.
   *
   * @param n the number
   * @returns the number, formatted
   */
  protected num(n: number): string {
    return localNumber(n, this.settings.preferences().lang);
  }

  /**
   * Chooses the method from the picker (an empty value = the country's default).
   *
   * @param value the picker's value
   */
  protected chooseMethod(value: string): void {
    this.prayer.chooseMethod(value === '' ? null : value);
  }
}
