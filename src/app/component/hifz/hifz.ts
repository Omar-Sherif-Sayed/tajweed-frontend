import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { DtoAyah } from '@shared/schema/response/quran';
import { PlayerService } from '@shared/service/audio/player.service';
import { RecitationChoice } from '@shared/service/audio/recitation-choice';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { ReciterService } from '@shared/service/integration/reciter/reciter.service';
import { SettingsService } from '@shared/service/settings.service';
import { StudyService } from '@shared/service/study.service';
import { units } from '@shared/utils/mushaf-page';
import { localNumber, mushafNumber, surahName } from '@shared/utils/quran-text';
import { dayKey, memorisedAyahs, nextReview, QURAN_AYAHS } from '@shared/utils/study';

/** An ayah of the range as drawn: its words grouped with their marks, and its number. */
interface DrawnAyah {
  /** The ayah. */
  readonly ayah: DtoAyah;
  /** Its words (a word with the pause marks after it), the basmala's words left out of an ayah 1. */
  readonly words: readonly string[];
}

/**
 * Memorisation (F30, design 3): choose a range of a surah, listen to it with repeat in the chosen recitation, hide its
 * words to test yourself (tap a hidden word to show it), and keep the ranges you memorised with a review schedule —
 * today, after 1, 3 and 7 days. The words are the Tanzil text as received (AGENTS.md §6.1); hiding only covers them.
 * Everything is kept on the device; no reminder.
 */
@Component({
  selector: 'tj-hifz',
  imports: [TranslatePipe],
  templateUrl: './hifz.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HifzComponent {
  /** The Quran's surahs and ayahs. */
  private readonly quran = inject(QuranService);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The memorised ranges. */
  protected readonly study = inject(StudyService);

  /** The player. */
  private readonly player = inject(PlayerService);

  /** The chosen recitation. */
  private readonly choice = inject(RecitationChoice);

  /** The recitations. */
  private readonly reciters = inject(ReciterService);

  /** The surah being memorised. */
  protected readonly surah = signal(67);

  /** The range's first ayah. */
  protected readonly from = signal(1);

  /** The range's last ayah. */
  protected readonly to = signal(5);

  /** How many times the range is played. */
  protected readonly repeat = signal(3);

  /** Whether the words are hidden. */
  protected readonly hidden = signal(false);

  /** The hidden words shown again: `ayahId:index`. */
  protected readonly revealed = signal<ReadonlySet<string>>(new Set());

  /** Today, in the browser only (the review dates depend on the visitor's day). */
  protected readonly today = signal<string | null>(null);

  /** The surahs. */
  protected readonly surahs = injectQuery(() => ({
    queryKey: ['surahs', this.settings.preferences().lang],
    queryFn: () => this.quran.getSurahs(),
    staleTime: Infinity,
  }));

  /** The surah's ayahs. */
  protected readonly ayahs = injectQuery(() => ({
    queryKey: ['surah', this.surah()],
    queryFn: () => this.quran.getSurahAyahs(this.surah()),
    staleTime: Infinity,
  }));

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

  /** The surah's number of ayahs. */
  protected readonly count = computed(() => this.surahs.data()?.find((s) => s.number === this.surah())?.ayahCount ?? 1);

  /** The range's ayahs, ready to draw. */
  protected readonly range = computed<DrawnAyah[]>(() =>
    (this.ayahs.data()?.ayahs ?? [])
      .filter((a) => a.number >= this.from() && a.number <= this.to())
      .map((a) => ({ ayah: a, words: units(a.text.split(' ').slice(a.basmalaWordCount)) })),
  );

  /** The memorised ayahs, counted once each. */
  protected readonly memorised = computed(() => memorisedAyahs(this.study.hifz()));

  /** The total of the Quran's ayahs. */
  protected readonly total = QURAN_AYAHS;

  /** Sets today once the page is in the browser. */
  constructor() {
    afterNextRender(() => this.today.set(dayKey(new Date())));
  }

  /**
   * Chooses the surah; the range becomes its first five ayahs.
   *
   * @param value the surah's number, from the list
   */
  protected chooseSurah(value: string): void {
    this.surah.set(Number(value));
    this.from.set(1);
    this.to.set(Math.min(5, this.surahs.data()?.find((s) => s.number === Number(value))?.ayahCount ?? 5));
    this.revealed.set(new Set());
  }

  /**
   * Sets an end of the range, kept inside the surah and in order.
   *
   * @param end which end
   * @param value the ayah, as typed
   */
  protected setEnd(end: 'from' | 'to', value: string): void {
    const n = Math.min(this.count(), Math.max(1, Math.round(Number(value) || 1)));
    if (end === 'from') {
      this.from.set(n);
      this.to.set(Math.max(n, this.to()));
    } else {
      this.to.set(n);
      this.from.set(Math.min(n, this.from()));
    }
    this.revealed.set(new Set());
  }

  /**
   * Shows a hidden word.
   *
   * @param key `ayahId:index`
   */
  protected reveal(key: string): void {
    this.revealed.update((s) => new Set(s).add(key));
  }

  /** Hides or shows the words. */
  protected toggleHidden(): void {
    this.hidden.update((h) => !h);
    this.revealed.set(new Set());
  }

  /** Plays the range in the chosen recitation, repeated. */
  protected async listen(): Promise<void> {
    const recitation = await this.reciters.getRecitation(this.choice.id());
    await this.player.playRecitation({ recitation, surah: this.surah(), mode: 'range', from: this.from(), to: this.to(), repeat: this.repeat() });
  }

  /** Keeps the range as memorised; its reviews start today. */
  protected keep(): void {
    this.study.addRange(this.surah(), this.from(), this.to());
  }

  /**
   * A range's next review, written in the interface language.
   *
   * @param index the range's place in the list
   * @returns the date, or `null` when its schedule is done
   */
  protected due(index: number): string | null {
    const r = this.study.hifz()[index];
    const d = r ? nextReview(r) : null;
    return d ? new Intl.DateTimeFormat(this.lang(), { day: 'numeric', month: 'long' }).format(new Date(`${d}T12:00:00`)) : null;
  }

  /**
   * Whether a range's review is due today or late.
   *
   * @param index the range's place in the list
   * @returns `true` when due
   */
  protected isDue(index: number): boolean {
    const r = this.study.hifz()[index];
    const d = r ? nextReview(r) : null;
    const today = this.today();
    return !!d && !!today && d <= today;
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
   * A number as the mushaf writes it, for the ayah's marker.
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
}
