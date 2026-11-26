import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { DtoAyah } from '@shared/schema/response/quran';
import { PlayerService } from '@shared/service/audio/player.service';
import { RecitationChoice } from '@shared/service/audio/recitation-choice';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { ReciterService } from '@shared/service/integration/reciter/reciter.service';
import { ReadingService, TEXT_SIZES } from '@shared/service/reading.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber, mushafNumber, reportLink, splitBasmala, surahName } from '@shared/utils/quran-text';
import { AyahActionsComponent } from './ayah-actions';

/** One ayah as the reader draws it. */
interface ReaderAyah {
  /** The ayah. */
  readonly ayah: DtoAyah;
  /** The text to draw — the ayah's text, without the basmala when the basmala is drawn as the heading. */
  readonly text: string;
  /** The page, when this ayah is the first of the surah on it. */
  readonly pageMark: number | null;
  /** The juz, when it starts at this ayah. */
  readonly juzMark: number | null;
}

/**
 * The reader by surah (F2): the surah's ayahs from the backend, **drawn exactly as received** (AGENTS.md §6.1) in Amiri
 * Quran, one colour; the basmala as a heading taken from the first ayah's own first words (client guide §3); page and
 * juz marks beside the text; the text size; the last position kept on the device; the playing ayah highlighted (a
 * display layer, never for a riwayah other than Hafs — §6.7); the ayah markers (F25). Tapping an ayah opens its
 * actions (F26). ⚠ The page view as printed waits for the line data (`P0-12`) and the page fonts (letter 01c).
 */
@Component({
  selector: 'tj-reader',
  imports: [TranslatePipe, RouterLink, AyahActionsComponent],
  templateUrl: './reader.html',
  host: { '(window:scroll)': 'onScroll()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReaderComponent {
  /** The surah, from the route (`/quran/:surah`). */
  readonly surah = input.required<string>();

  /** The ayah to open at, from the query (`?ayah=`). */
  readonly ayah = input<string>();

  /** The Quran text. */
  private readonly quran = inject(QuranService);

  /** The interface language. */
  protected readonly settings = inject(SettingsService);

  /** The position, text size and markers. */
  protected readonly reading = inject(ReadingService);

  /** The player, for the playing ayah. */
  protected readonly player = inject(PlayerService);

  /** The chosen recitation. */
  private readonly choice = inject(RecitationChoice);

  /** The recitations. */
  private readonly reciters = inject(ReciterService);

  /** The page. */
  private readonly document = inject(DOCUMENT);

  /** Whether this runs in the browser. */
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The surah's number. */
  protected readonly number = computed(() => {
    const n = Number(this.surah());
    return Number.isInteger(n) && n >= 1 && n <= 114 ? n : 1;
  });

  /** The surah with its ayahs. */
  protected readonly data = injectQuery(() => ({
    queryKey: ['surah-ayahs', this.number()],
    queryFn: () => this.quran.getSurahAyahs(this.number()),
    staleTime: Infinity,
  }));

  /** The surahs, for the names of the previous and next ones. */
  protected readonly surahs = injectQuery(() => ({
    queryKey: ['surahs', this.settings.preferences().lang],
    queryFn: () => this.quran.getSurahs(),
    staleTime: Infinity,
  }));

  /** The basmala heading, when the surah's first ayah begins with it. */
  protected readonly basmala = computed(() => {
    const first = this.data.data()?.ayahs[0];
    return first ? splitBasmala(first.text, first.basmalaWordCount).basmala : null;
  });

  /** The ayahs as the reader draws them. */
  protected readonly ayahs = computed<ReaderAyah[]>(() => {
    const ayahs = this.data.data()?.ayahs ?? [];
    return ayahs.map((a, i) => {
      const prev = ayahs[i - 1];
      return {
        ayah: a,
        text: i === 0 ? splitBasmala(a.text, a.basmalaWordCount).rest : a.text,
        pageMark: !prev || prev.page !== a.page ? a.page : null,
        juzMark: prev && prev.juz !== a.juz ? a.juz : null,
      };
    });
  });

  /** The ayah whose actions are open, or `null`. */
  protected readonly selected = signal<DtoAyah | null>(null);

  /** The text size, in rem. */
  protected readonly textSize = computed(() => TEXT_SIZES[this.reading.textSize()]);

  /** The playing ayah of this surah, when the player follows the text (Hafs only). */
  protected readonly playingAyah = computed(() => {
    const now = this.player.now();
    return now?.kind === 'recitation' && !now.recitation.recitation.listeningOnly && now.surah === this.number() ? now.ayah : null;
  });

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

  /** The link that reports a mistake in this surah. */
  protected readonly report = computed(() => reportLink(`Quran ${this.number()}`));

  /** When the position was last saved, so scrolling saves it at most twice a second. */
  private lastSave = 0;

  /** Opens at the requested ayah once the text is drawn, and remembers it. */
  constructor() {
    effect(() => {
      const target = Number(this.ayah() ?? 0);
      if (!this.browser || !this.data.data()) {
        return;
      }
      if (target > 1) {
        this.reading.savePosition(this.number(), target);
        setTimeout(() => this.document.getElementById(`ayah-${target}`)?.scrollIntoView({ block: 'center' }));
      } else {
        this.reading.savePosition(this.number(), 1);
      }
    });
    effect(() => {
      const playing = this.playingAyah();
      if (this.browser && playing) {
        setTimeout(() => this.document.getElementById(`ayah-${playing}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
      }
    });
  }

  /**
   * A surah's name in the interface language.
   *
   * @param n the surah
   * @returns its name
   */
  protected nameOf(n: number): string {
    const s = this.surahs.data()?.find((x) => x.number === n);
    return s ? surahName(s, this.lang()) : localNumber(n, this.lang());
  }

  /**
   * The ayah number as printed.
   *
   * @param n the number
   * @returns the digits
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
   * The tint of an ayah's marker (F25): a light wash of the marker's colour.
   *
   * @param a the ayah
   * @returns the CSS colour, or `null`
   */
  protected tint(a: DtoAyah): string | null {
    const colour = this.reading.markerColour(a.surahNumber, a.number);
    return colour ? `${colour}26` : null;
  }

  /**
   * The colour of an ayah's number: the marker's colour, when it has one.
   *
   * @param a the ayah
   * @returns the CSS colour, or `null`
   */
  protected numberColour(a: DtoAyah): string | null {
    return this.reading.markerColour(a.surahNumber, a.number) ?? null;
  }

  /** Plays the whole surah in the chosen recitation. */
  protected async listen(): Promise<void> {
    const recitation = await this.reciters.getRecitation(this.choice.id());
    await this.player.playRecitation({ recitation, surah: this.number(), mode: 'surah' });
  }

  /** Remembers the first ayah on the screen as the reading position. */
  protected onScroll(): void {
    const now = Date.now();
    if (!this.browser || now - this.lastSave < 500) {
      return;
    }
    this.lastSave = now;
    for (const el of Array.from(this.document.querySelectorAll<HTMLElement>('[data-ayah]'))) {
      if (el.getBoundingClientRect().bottom > 120) {
        this.reading.savePosition(this.number(), Number(el.dataset['ayah']));
        return;
      }
    }
  }
}
