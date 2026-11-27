import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { DtoAyah, DtoPage, DtoSurah } from '@shared/schema/response/quran';
import { PlayerService } from '@shared/service/audio/player.service';
import { QcfFontsService } from '@shared/service/qcf-fonts.service';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { ReadingService } from '@shared/service/reading.service';
import { SettingsService } from '@shared/service/settings.service';
import { juzName, layoutPage, PageLine, quarterLabel, QuarterLabel, spreadStart } from '@shared/utils/mushaf-page';
import { localNumber, mushafNumber, reportLink, surahName } from '@shared/utils/quran-text';
import { AyahActionsComponent } from './ayah-actions';

/** One page of the spread, ready to draw. */
interface DrawnPage {
  /** The page number. */
  readonly page: number;
  /** Its lines, or `null` while it loads. */
  readonly lines: PageLine[] | null;
  /** The backend's answer. */
  readonly data: DtoPage | undefined;
}

/** The ayah whose actions are open, with its surah. */
interface OpenAyah {
  /** The ayah. */
  readonly ayah: DtoAyah;
  /** Its surah. */
  readonly surah: DtoSurah;
}

/**
 * The mushaf as printed (F2, design 3 «8 · Web — the reader on a computer, two pages like an open mushaf»): the
 * Madinah mushaf of 1405H page by page — the same 15 lines, the same words on every line, the surah bands with
 * «ترتيبها» and «آياتها», the basmala, ۞ where the printed copy has it, the page's surah, juz and hizb at the top and
 * its number at the bottom. On a computer two pages face each other, the odd page on the right; on a phone one page.
 * The letter shapes are the King Fahd Complex's: each page in its own QCF V1 font from the Quran Foundation (the
 * author, 2026-11-27), the surah names in their surah-names font, the basmala in the page-1 font; until a page's
 * font has loaded, or when the backend has no glyphs, the page is the Tanzil text exactly as received (AGENTS.md
 * §6.1) in Amiri Quran. Each line is justified to the page's width, and a line too long for the page is drawn a
 * little smaller. Beside the pages: the surahs of the juz. Tapping an ayah opens its actions.
 */
@Component({
  selector: 'tj-mushaf',
  imports: [TranslatePipe, RouterLink, AyahActionsComponent, NgTemplateOutlet],
  templateUrl: './mushaf.html',
  styleUrl: './mushaf.scss',
  host: { '(document:keydown)': 'onKey($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MushafComponent {
  /** The page, from the route (`/quran/page/:page`). */
  readonly page = input.required<string>();

  /** The Quran's pages and surahs. */
  private readonly quran = inject(QuranService);

  /** The interface language and appearance. */
  protected readonly settings = inject(SettingsService);

  /** The position and the markers. */
  protected readonly reading = inject(ReadingService);

  /** The King Fahd QCF V1 fonts. */
  protected readonly fonts = inject(QcfFontsService);

  /** The player, for the playing ayah. */
  private readonly player = inject(PlayerService);

  /** Opens another page. */
  private readonly router = inject(Router);

  /** The document, for the keyboard and the line fitting. */
  private readonly document = inject(DOCUMENT);

  /** Whether this runs in the browser. */
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The spread, whose lines are fitted to the page width after each render. */
  private readonly spread = viewChild<ElementRef<HTMLElement>>('spread');

  /** The page asked for, 1 – 604. */
  protected readonly current = computed(() => {
    const n = Number(this.page());
    return Number.isInteger(n) && n >= 1 && n <= 604 ? n : 1;
  });

  /** The right-hand (odd) page of the spread. */
  protected readonly right = computed(() => spreadStart(this.current()));

  /** The spread's right-hand page. */
  private readonly rightQuery = injectQuery(() => ({
    queryKey: ['page', this.right()],
    queryFn: () => this.quran.getPage(this.right()),
    staleTime: Infinity,
  }));

  /** The spread's left-hand page (none after 604). */
  private readonly leftQuery = injectQuery(() => ({
    queryKey: ['page', this.right() + 1],
    queryFn: () => this.quran.getPage(this.right() + 1),
    staleTime: Infinity,
    enabled: this.right() + 1 <= 604,
  }));

  /** The surahs: names, order, ayahs, first pages. */
  protected readonly surahs = injectQuery(() => ({
    queryKey: ['surahs', this.settings.preferences().lang],
    queryFn: () => this.quran.getSurahs(),
    staleTime: Infinity,
  }));

  /** Where the juz start. */
  private readonly juzs = injectQuery(() => ({
    queryKey: ['juzs'],
    queryFn: () => this.quran.getJuzs(),
    staleTime: Infinity,
  }));

  /** The two pages, right then left, laid out. */
  protected readonly pages = computed<DrawnPage[]>(() => {
    const out: DrawnPage[] = [];
    const right = this.rightQuery.data();
    out.push({ page: this.right(), lines: right ? layoutPage(right) : null, data: right });
    if (this.right() + 1 <= 604) {
      const left = this.leftQuery.data();
      out.push({ page: this.right() + 1, lines: left ? layoutPage(left) : null, data: left });
    }
    return out;
  });

  /** Whether a page failed to load, or came without its printed lines (a backend older than 1.7.0). */
  protected readonly failed = computed(
    () =>
      this.rightQuery.isError() ||
      this.leftQuery.isError() ||
      this.pages().some((p) => p.data !== undefined && (p.lines?.length ?? 0) === 0),
  );

  /** The juz of the page asked for. */
  protected readonly juz = computed(() => {
    const p = this.pages().find((x) => x.page === this.current())?.data;
    return p?.ayahs[0]?.juz ?? null;
  });

  /** The surahs that start in the juz, with their first pages — the list beside the pages. */
  protected readonly juzSurahs = computed(() => {
    const juz = this.juz();
    const juzs = this.juzs.data();
    const surahs = this.surahs.data();
    if (!juz || !juzs || !surahs) {
      return [];
    }
    const from = juzs[juz - 1].startPage;
    const to = juz < 30 ? juzs[juz].startPage : 605;
    return surahs.filter((s) => s.startPage >= from && s.startPage < to);
  });

  /** The surah being read: the one the current page's first ayah belongs to. */
  protected readonly currentSurah = computed(() => {
    const p = this.pages().find((x) => x.page === this.current())?.data;
    return p?.ayahs[0]?.surahNumber ?? null;
  });

  /** The ayah whose actions are open, with its surah. */
  protected readonly selected = signal<OpenAyah | null>(null);

  /** The landscape of the colour direction, beside the pages (design 3). */
  protected readonly landscape = computed(() => {
    const p = this.settings.preferences();
    return `/landscapes/${p.direction}-${p.night ? 'night' : 'day'}.svg`;
  });

  /** The playing ayah, when the player follows the text (Hafs only). */
  protected readonly playing = computed(() => {
    const now = this.player.now();
    return now?.kind === 'recitation' && !now.recitation.recitation.listeningOnly && now.ayah
      ? `${now.surah}:${now.ayah}`
      : null;
  });

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

  /** The link that reports a mistake on this page. */
  protected readonly report = computed(() => reportLink(`Mushaf page ${this.current()}`));

  /** Remembers the position, and fits the lines after each render. */
  constructor() {
    effect(() => {
      const first = this.pages().find((x) => x.page === this.current())?.data?.ayahs[0];
      if (this.browser && first) {
        this.reading.savePosition(first.surahNumber, first.number, this.current());
      }
    });
    effect(() => {
      for (const p of this.pages()) {
        if (this.browser && p.data?.qcf) {
          this.fonts.load(p.page);
        }
      }
    });
    afterRenderEffect(() => {
      this.pages();
      this.surahs.data();
      this.fonts.names();
      this.pages().forEach((p) => this.fonts.ready(p.page));
      this.fitLines();
    });
  }

  /**
   * Whether a page is drawn in the King Fahd QCF V1 glyphs: the backend has them and the page's font has loaded.
   *
   * @param p the drawn page
   * @returns `true` to draw the glyphs
   */
  protected qcf(p: DrawnPage): boolean {
    return !!p.data?.qcf && this.fonts.ready(p.page);
  }

  /**
   * A surah's number as the surah-names font reads it: three digits («004» draws An-Nisa).
   *
   * @param n the surah
   * @returns the zero-padded number
   */
  protected nameCode(n: number): string {
    return String(n).padStart(3, '0');
  }

  /**
   * A surah by number.
   *
   * @param n the surah
   * @returns the surah, once loaded
   */
  protected surah(n: number): DtoSurah | undefined {
    return this.surahs.data()?.find((s) => s.number === n);
  }

  /**
   * A surah's name in the interface language (the side list).
   *
   * @param n the surah
   * @returns its name
   */
  protected nameOf(n: number): string {
    const s = this.surah(n);
    return s ? surahName(s, this.lang()) : localNumber(n, this.lang());
  }

  /**
   * A number as the printed page writes it.
   *
   * @param n the number
   * @returns Arabic-Indic digits
   */
  protected mushaf(n: number): string {
    return mushafNumber(n);
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
   * The page header's juz, written out as the printed page has it: «الجزء الأول».
   *
   * @param data the page
   * @returns the text, from the page's first ayah
   */
  protected juzLabel(data: DtoPage): string {
    const a = data.ayahs[0];
    return a ? juzName(a.juz) : '';
  }

  /**
   * The margin label of a hizb quarter: «ربع الحزب ٥٢».
   *
   * @param hizbQuarter 1 – 240
   * @returns its words and number
   */
  protected quarter(hizbQuarter: number): QuarterLabel {
    return quarterLabel(hizbQuarter);
  }

  /**
   * The first ayah of a drawn page (for the opening pages' foot band).
   *
   * @param p the drawn page
   * @returns the ayah, once loaded
   */
  protected d0(p: DrawnPage): DtoAyah | undefined {
    return p.data?.ayahs[0];
  }

  /**
   * The tint of an ayah's marker (F25), or the playing ayah's highlight.
   *
   * @param a the ayah
   * @returns the CSS colour, or `null`
   */
  protected background(a: DtoAyah): string | null {
    if (this.playing() === `${a.surahNumber}:${a.number}`) {
      return 'var(--t-secondsoft)';
    }
    const colour = this.reading.markerColour(a.surahNumber, a.number);
    return colour ? `${colour}26` : null;
  }

  /**
   * The colour of an ayah's number: its marker's colour, when it has one.
   *
   * @param a the ayah
   * @returns the CSS colour, or `null`
   */
  protected numberColour(a: DtoAyah): string | null {
    return this.reading.markerColour(a.surahNumber, a.number) ?? null;
  }

  /**
   * Opens an ayah's actions.
   *
   * @param a the ayah
   */
  protected open(a: DtoAyah): void {
    const surah = this.surah(a.surahNumber);
    if (surah) {
      this.selected.set({ ayah: a, surah });
    }
  }

  /**
   * Turns the pages: forward is to the left, as in a printed mushaf.
   *
   * @param step pages to move (negative = back)
   */
  protected async turn(step: number): Promise<void> {
    const to = Math.min(604, Math.max(1, (Math.abs(step) === 2 ? this.right() : this.current()) + step));
    await this.router.navigate(['/', this.lang(), 'quran', 'page', to]);
  }

  /**
   * The arrow keys turn the pages: left is forward, right is back; two pages at a time when both are shown.
   *
   * @param event the key
   */
  protected onKey(event: KeyboardEvent): void {
    if (this.selected() || (event.target as HTMLElement | null)?.closest?.('input, select, textarea')) {
      return;
    }
    const wide = (this.document.defaultView?.innerWidth ?? 0) >= 1024 ? 2 : 1;
    if (event.key === 'ArrowLeft') {
      void this.turn(wide);
    } else if (event.key === 'ArrowRight') {
      void this.turn(-wide);
    }
  }

  /**
   * Keeps every printed line on one line: when a line is wider than the page, the whole page's letters are drawn a
   * little smaller — the same size on every line of a page, as printed.
   */
  private fitLines(): void {
    const root = this.spread()?.nativeElement;
    if (!this.browser || !root) {
      return;
    }
    for (const lines of Array.from(root.querySelectorAll<HTMLElement>('.mlines'))) {
      const fits = Array.from(lines.querySelectorAll<HTMLElement>('.fit'));
      fits.forEach((el) => (el.style.fontSize = ''));
      let scale = 1;
      for (const el of fits) {
        const box = el.parentElement!.clientWidth;
        if (el.scrollWidth > box && box > 0) {
          scale = Math.min(scale, box / el.scrollWidth);
        }
      }
      if (scale < 1) {
        const size = `${Math.floor(scale * 1000) / 1000}em`;
        fits.forEach((el) => (el.style.fontSize = size));
      }
    }
  }
}
