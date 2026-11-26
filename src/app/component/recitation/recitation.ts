import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { DtoRecitationSummary } from '@shared/schema/response/reciter';
import { PlayerService, RecitationMode } from '@shared/service/audio/player.service';
import { RecitationChoice } from '@shared/service/audio/recitation-choice';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { ReciterService } from '@shared/service/integration/reciter/reciter.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber, surahName } from '@shared/utils/quran-text';

/** The languages that show the reciters' Arabic names (the others show their English names). */
const ARABIC_NAMES = ['ar', 'ur', 'fa', 'ps'];

/**
 * Recitation (F3, F4): the reciter picker — every reciter with his recitations, the riwayah always said, «listening
 * only» for a riwayah other than Hafs, an incomplete recitation's surah count (client guide §5 rules 1–2) — and the
 * modes: one surah, a range of ayahs (where ayah files or timings exist), or to the end of the Quran and again from
 * Al-Fatihah, forever; with repeat. Streaming only: no source allows downloading yet (F28).
 */
@Component({
  selector: 'tj-recitation',
  imports: [TranslatePipe],
  templateUrl: './recitation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecitationComponent {
  /** The catalogue. */
  private readonly reciters = inject(ReciterService);

  /** The surahs. */
  private readonly quran = inject(QuranService);

  /** The player. */
  private readonly player = inject(PlayerService);

  /** The chosen recitation. */
  protected readonly choice = inject(RecitationChoice);

  /** The interface language. */
  protected readonly settings = inject(SettingsService);

  /** The reciters. */
  protected readonly list = injectQuery(() => ({
    queryKey: ['reciters', this.settings.preferences().lang],
    queryFn: () => this.reciters.getReciters(),
    staleTime: 60 * 60 * 1000,
  }));

  /** The chosen recitation, with its surahs and sources. */
  protected readonly recitation = injectQuery(() => ({
    queryKey: ['recitation', this.choice.id()],
    queryFn: () => this.reciters.getRecitation(this.choice.id()),
    staleTime: 60 * 60 * 1000,
  }));

  /** The surahs, for names and ayah counts. */
  protected readonly surahs = injectQuery(() => ({
    queryKey: ['surahs', this.settings.preferences().lang],
    queryFn: () => this.quran.getSurahs(),
    staleTime: Infinity,
  }));

  /** The mode. */
  protected readonly mode = signal<RecitationMode>('surah');

  /** The surah. */
  protected readonly surah = signal(1);

  /** The first ayah (range and endless). */
  protected readonly from = signal(1);

  /** The last ayah (range). */
  protected readonly to = signal<number | null>(null);

  /** How many times. */
  protected readonly repeat = signal(1);

  /** Whether names are shown in Arabic. */
  protected readonly arabic = computed(() => ARABIC_NAMES.includes(this.settings.preferences().lang));

  /** Whether the chosen recitation can play part of a surah. */
  protected readonly canRange = computed(() => {
    const r = this.recitation.data();
    return !!r && (r.recitation.hasTimings || r.sources.some((s) => s.kind === 'AYAH_FILE'));
  });

  /** The chosen surah's ayah count. */
  protected readonly ayahCount = computed(() => this.surahs.data()?.find((s) => s.number === this.surah())?.ayahCount ?? 7);

  /** The ayah numbers of the chosen surah. */
  protected readonly ayahNumbers = computed(() => Array.from({ length: this.ayahCount() }, (_, i) => i + 1));

  /**
   * The label of a recitation: its style when known, otherwise its own label (client guide §5 rule 2).
   *
   * @param r the recitation
   * @returns the text key or the label
   */
  protected styleOf(r: DtoRecitationSummary): string | null {
    return r.style ? `player.${r.style}` : null;
  }

  /**
   * A surah's name in the interface language.
   *
   * @param n the surah
   * @returns its name
   */
  protected nameOf(n: number): string {
    const s = this.surahs.data()?.find((x) => x.number === n);
    return s ? surahName(s, this.settings.preferences().lang) : String(n);
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
   * Chooses a recitation; keeps the surah when it has it.
   *
   * @param id the recitation
   */
  protected choose(id: number): void {
    this.choice.choose(id);
  }

  /**
   * Chooses a surah.
   *
   * @param n the surah
   */
  protected chooseSurah(n: number): void {
    this.surah.set(n);
    this.from.set(1);
    this.to.set(null);
  }

  /** Plays with the chosen mode. */
  protected async play(): Promise<void> {
    const recitation = this.recitation.data();
    if (!recitation) {
      return;
    }
    const surah = recitation.surahs.includes(this.surah()) ? this.surah() : recitation.surahs[0];
    const mode = this.canRange() ? this.mode() : this.mode() === 'range' ? 'surah' : this.mode();
    await this.player.playRecitation({
      recitation,
      surah,
      mode,
      from: this.canRange() ? this.from() : 1,
      to: this.to() ?? this.ayahCount(),
      repeat: this.repeat(),
    });
  }
}
