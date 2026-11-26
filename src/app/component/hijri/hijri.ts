import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { addDays, HIJRI_ADJUSTMENTS, hijriDay, HijriService } from '@shared/service/hijri.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber } from '@shared/utils/quran-text';

/** One day in the month's grid. */
interface GridDay {
  /** The Gregorian date. */
  readonly date: Date;
  /** The Hijri day of the month. */
  readonly hijri: number;
  /** Whether it is today. */
  readonly today: boolean;
}

/**
 * The Hijri calendar (F27): the current Hijri month in the Umm al-Qura calendar of the platform (the browser's own
 * calendar data — nothing calculated by us), each day with its Gregorian date, with the visitor's adjustment of −2 … +2
 * days to match the country's announcement (the author, 2026-11-20), and the time where the visitor is.
 */
@Component({
  selector: 'tj-hijri',
  imports: [TranslatePipe],
  templateUrl: './hijri.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HijriComponent {
  /** The Hijri date and its adjustment. */
  protected readonly hijri = inject(HijriService);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The adjustments offered. */
  protected readonly adjustments = HIJRI_ADJUSTMENTS;

  /** The current moment — in the browser only. */
  protected readonly now = signal<Date | null>(null);

  /** The interface language's code. */
  private readonly lang = computed(() => this.settings.preferences().lang);

  /** Today in the Hijri calendar, written out. */
  protected readonly todayText = computed(() => {
    const now = this.now();
    return now ? this.hijri.format(now, this.lang()) : '';
  });

  /** The time where the visitor is. */
  protected readonly time = computed(() => {
    const now = this.now();
    return now ? new Intl.DateTimeFormat(this.lang(), { hour: 'numeric', minute: '2-digit', weekday: 'long' }).format(now) : '';
  });

  /** The month's name and year, in the interface language. */
  protected readonly monthTitle = computed(() => {
    const now = this.now();
    return now
      ? new Intl.DateTimeFormat(`${this.lang()}-u-ca-islamic-umalqura`, { month: 'long', year: 'numeric' }).format(addDays(now, this.hijri.adjustment()))
      : '';
  });

  /** The short weekday names in the interface language, Sunday first (2026-11-22 was a Sunday). */
  protected readonly weekdays = computed(() => {
    const sunday = new Date(2026, 10, 22);
    return Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(this.lang(), { weekday: 'short' }).format(addDays(sunday, i)));
  });

  /** The days of the current Hijri month, with blanks before the first so it starts on its weekday. */
  protected readonly grid = computed<(GridDay | null)[]>(() => {
    const now = this.now();
    if (!now) {
      return [];
    }
    const adjust = this.hijri.adjustment();
    const shifted = addDays(now, adjust);
    const today = hijriDay(shifted);
    const first = addDays(now, -(today.day - 1));
    const days: GridDay[] = [];
    for (let i = 0; i < 31; i++) {
      const date = addDays(first, i);
      const h = hijriDay(addDays(date, adjust));
      if (h.month !== today.month) {
        break;
      }
      days.push({ date, hijri: h.day, today: h.day === today.day });
    }
    return [...Array.from({ length: first.getDay() }, () => null), ...days];
  });

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
   * A number in the interface language.
   *
   * @param n the number
   * @returns the number, formatted
   */
  protected num(n: number): string {
    return localNumber(n, this.lang());
  }

  /**
   * A Gregorian day and month, short.
   *
   * @param d the date
   * @returns e.g. «22 نوفمبر»
   */
  protected gregorian(d: Date): string {
    return new Intl.DateTimeFormat(this.lang(), { day: 'numeric', month: 'short' }).format(d);
  }

  /**
   * An adjustment written with its sign.
   *
   * @param n the adjustment
   * @returns e.g. «+1»
   */
  protected signed(n: number): string {
    return new Intl.NumberFormat(this.lang(), { signDisplay: 'exceptZero' }).format(n);
  }
}
