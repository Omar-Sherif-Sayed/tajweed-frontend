import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { IconComponent } from '@shared/component/general/icon/icon';
import { LogoMarkComponent } from '@shared/component/general/icon/logo-mark';
import { HijriService } from '@shared/service/hijri.service';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { ReadingService } from '@shared/service/reading.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber, surahName } from '@shared/utils/quran-text';

/** The sections built so far, in design 3's order: the path under `/<lang>/`, the text key and the icon. */
const TILES = [
  { path: 'quran', key: 'nav.quran', icon: 'book' },
  { path: 'search', key: 'nav.search', icon: 'search' },
  { path: 'recitation', key: 'nav.recitation', icon: 'ear' },
  { path: 'radio', key: 'nav.radio', icon: 'radio' },
  { path: 'prayer', key: 'nav.prayer', icon: 'shadow' },
  { path: 'qibla', key: 'nav.qibla', icon: 'kaaba' },
  { path: 'hijri', key: 'nav.hijri', icon: 'ex-cal' },
  { path: 'hadith', key: 'nav.hadith', icon: 'qalam' },
  { path: 'hifz', key: 'nav.hifz', icon: 'd3-hifz' },
  { path: 'khatma', key: 'nav.khatma', icon: 'book' },
  { path: 'notes', key: 'nav.notes', icon: 'mark' },
  { path: 'tracker', key: 'nav.tracker', icon: 'sun' },
  { path: 'kids', key: 'nav.kids', icon: 'ear' },
  { path: 'zakat', key: 'nav.zakat', icon: 'sheet' },
  { path: 'sources', key: 'nav.sources', icon: 'sheet' },
  { path: 'settings', key: 'nav.settings', icon: 'dots' },
] as const;

/**
 * The home page: the Hijri date and the time at the top (F27 — the author, 2026-11-20), «continue reading» from the
 * position kept on the device, and the sections built so far; the others appear as their screens are built.
 */
@Component({
  selector: 'tj-home',
  imports: [TranslatePipe, IconComponent, LogoMarkComponent, RouterLink],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  /** The interface language. */
  protected readonly settings = inject(SettingsService);

  /** The reading position. */
  protected readonly reading = inject(ReadingService);

  /** The Hijri date. */
  private readonly hijri = inject(HijriService);

  /** The surahs' names. */
  private readonly quran = inject(QuranService);

  /** The sections. */
  protected readonly tiles = TILES;

  /** The current time — set in the browser only, so the server's clock and time zone are never shown. */
  protected readonly now = signal<Date | null>(null);

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

  /** The surahs, for the name of the reading position. */
  private readonly surahs = injectQuery(() => ({
    queryKey: ['surahs', this.lang()],
    queryFn: () => this.quran.getSurahs(),
    staleTime: Infinity,
    enabled: this.reading.position() !== null,
  }));

  /** The Hijri date, in the interface language. */
  protected readonly hijriDate = computed(() => {
    const now = this.now();
    return now ? this.hijri.format(now, this.lang()) : '';
  });

  /** The time where the visitor is. */
  protected readonly time = computed(() => {
    const now = this.now();
    return now ? new Intl.DateTimeFormat(this.lang(), { hour: 'numeric', minute: '2-digit' }).format(now) : '';
  });

  /** «Al-Baqarah 255» — where the visitor stopped. */
  protected readonly position = computed(() => {
    const p = this.reading.position();
    const s = this.surahs.data()?.find((x) => x.number === p?.surah);
    return p && s ? `${surahName(s, this.lang())} ${localNumber(p.ayah, this.lang())}` : null;
  });

  /** Starts the clock in the browser, every minute's change. */
  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      if (!browser) {
        return;
      }
      this.now.set(new Date());
      const timer = setInterval(() => this.now.set(new Date()), 15_000);
      destroy.onDestroy(() => clearInterval(timer));
    });
  }
}
