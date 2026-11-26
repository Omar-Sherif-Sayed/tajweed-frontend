import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { DtoAyah, DtoSurah } from '@shared/schema/response/quran';
import { PlayerService } from '@shared/service/audio/player.service';
import { RecitationChoice } from '@shared/service/audio/recitation-choice';
import { ReciterService } from '@shared/service/integration/reciter/reciter.service';
import { TafsirService } from '@shared/service/integration/tafsir/tafsir.service';
import { MARKER_COLOURS, ReadingService } from '@shared/service/reading.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber, reportLink, surahName } from '@shared/utils/quran-text';

/**
 * The actions on an ayah or a range (F26) and its markers (F25), in a sheet over the reader: a marker colour (a tint
 * over the ayah and its number — the author, 2026-11-20), copy the ayah with its reference, listen to it or to a range
 * («from … to», with repeat) in the chosen recitation, and read all its tafsirs (F5) as the backend has synced them,
 * with the Quran Foundation's credit. The virtue (F29) waits for its hadith edition.
 */
@Component({
  selector: 'tj-ayah-actions',
  imports: [TranslatePipe],
  templateUrl: './ayah-actions.html',
  host: { '(document:keydown.escape)': 'closed.emit()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AyahActionsComponent {
  /** The surah. */
  readonly surah = input.required<DtoSurah>();

  /** The ayah. */
  readonly ayah = input.required<DtoAyah>();

  /** Emitted when the sheet is closed. */
  readonly closed = output<void>();

  /** The markers. */
  protected readonly reading = inject(ReadingService);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The player. */
  private readonly player = inject(PlayerService);

  /** The chosen recitation. */
  private readonly choice = inject(RecitationChoice);

  /** The recitations. */
  private readonly reciters = inject(ReciterService);

  /** The tafsirs. */
  private readonly tafsirService = inject(TafsirService);

  /** The marker colours. */
  protected readonly colours = MARKER_COLOURS;

  /** The last ayah of the range to listen to. */
  protected readonly to = signal<number | null>(null);

  /** How many times the range is played. */
  protected readonly repeat = signal(1);

  /** Whether the tafsirs are shown. */
  protected readonly showTafsirs = signal(false);

  /** Whether the ayah was just copied. */
  protected readonly copied = signal(false);

  /** The chosen recitation (to know whether a range can be played). */
  protected readonly recitation = injectQuery(() => ({
    queryKey: ['recitation', this.choice.id()],
    queryFn: () => this.reciters.getRecitation(this.choice.id()),
    staleTime: 60 * 60 * 1000,
  }));

  /** Every tafsir of the ayah, loaded when asked for. */
  protected readonly tafsirs = injectQuery(() => ({
    queryKey: ['tafsirs', this.ayah().surahNumber, this.ayah().number],
    queryFn: () => this.tafsirService.getAyahTafsirs(this.ayah().surahNumber, this.ayah().number),
    enabled: this.showTafsirs(),
  }));

  /** The range's last ayah, defaulting to the ayah itself. */
  protected readonly last = computed(() => Math.max(this.ayah().number, Math.min(this.surah().ayahCount, this.to() ?? this.ayah().number)));

  /** Whether the chosen recitation can play part of a surah (ayah files, or a surah file with timings). */
  protected readonly canRange = computed(() => {
    const r = this.recitation.data();
    return !r || r.recitation.hasTimings || r.sources.some((s) => s.kind === 'AYAH_FILE');
  });

  /** The ayah's reference, e.g. «البقرة 255», in the interface language's digits. */
  protected readonly reference = computed(() => `${surahName(this.surah(), this.settings.preferences().lang)} ${this.num(this.ayah().number)}`);

  /** The ayah numbers after this one, for «to ayah». */
  protected readonly following = computed(() =>
    Array.from({ length: this.surah().ayahCount - this.ayah().number + 1 }, (_, i) => this.ayah().number + i),
  );

  /** The link that reports a mistake in this ayah. */
  protected readonly report = computed(() => reportLink(`Quran ${this.ayah().surahNumber}:${this.ayah().number}`));

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
   * Puts a marker of a colour on the ayah, or removes it.
   *
   * @param id the colour, or `null`
   */
  protected mark(id: string | null): void {
    this.reading.setMarker(this.ayah().surahNumber, this.ayah().number, id);
  }

  /** Copies the ayah — its text exactly as received — with its reference. */
  protected async copy(): Promise<void> {
    const a = this.ayah();
    await navigator.clipboard?.writeText(`${a.text} [${this.surah().nameAr} ${a.surahNumber}:${a.number}]`);
    this.copied.set(true);
  }

  /** Plays the ayah or the range in the chosen recitation, with repeat. */
  protected async listen(): Promise<void> {
    const recitation = this.recitation.data() ?? (await this.reciters.getRecitation(this.choice.id()));
    const a = this.ayah();
    if (this.canRange()) {
      await this.player.playRecitation({
        recitation,
        surah: a.surahNumber,
        mode: 'range',
        from: a.number,
        to: this.last(),
        repeat: this.repeat(),
      });
    } else {
      await this.player.playRecitation({ recitation, surah: a.surahNumber, mode: 'surah', repeat: this.repeat() });
    }
    this.closed.emit();
  }
}
