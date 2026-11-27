import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { DtoRecitationSummary } from '@shared/schema/response/reciter';
import { PlayerService } from '@shared/service/audio/player.service';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { ReciterService } from '@shared/service/integration/reciter/reciter.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber, surahName } from '@shared/utils/quran-text';

/** The first surah of the short surahs shown to children: an-Naba', the first of the thirtieth juz. */
const FIRST_SHORT_SURAH = 78;

/** The Arabic letters, in their order. */
const LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];

/**
 * Kids (F41, design 3): the short surahs of the thirtieth juz, each heard in a muallim recitation — the reciter reads
 * and leaves time to repeat after him (F4: al-Husary, al-Minshawi or Ayman Suwayd, as the catalogue has them complete)
 * — and the Arabic letters in their order. No picture of a person; no recording of the letters until one has a named
 * source.
 */
@Component({
  selector: 'tj-kids',
  imports: [TranslatePipe],
  templateUrl: './kids.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KidsComponent {
  /** The surahs. */
  private readonly quran = inject(QuranService);

  /** The recitations. */
  private readonly reciters = inject(ReciterService);

  /** The player. */
  private readonly player = inject(PlayerService);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The letters. */
  protected readonly letters = LETTERS;

  /** The chosen muallim recitation's id. */
  protected readonly chosen = signal<number | null>(null);

  /** The surahs. */
  private readonly surahs = injectQuery(() => ({
    queryKey: ['surahs', this.settings.preferences().lang],
    queryFn: () => this.quran.getSurahs(),
    staleTime: Infinity,
  }));

  /** The reciters. */
  private readonly catalogue = injectQuery(() => ({
    queryKey: ['reciters'],
    queryFn: () => this.reciters.getReciters(),
    staleTime: Infinity,
  }));

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

  /** The short surahs, in the mushaf's order. */
  protected readonly short = computed(() => (this.surahs.data() ?? []).filter((s) => s.number >= FIRST_SHORT_SURAH));

  /** The complete muallim recitations in Hafs, with their reciter's name. */
  protected readonly muallim = computed(() =>
    (this.catalogue.data() ?? []).flatMap((r) =>
      r.recitations
        .filter((x: DtoRecitationSummary) => x.style === 'MUALLIM' && x.complete && !x.listeningOnly)
        .map((x) => ({ id: x.id, name: this.lang() === 'ar' ? r.nameAr : r.nameEn })),
    ),
  );

  /** The muallim recitation used: the visitor's choice, or the first. */
  protected readonly current = computed(() => this.chosen() ?? this.muallim()[0]?.id ?? null);

  /**
   * Plays a surah in the muallim recitation.
   *
   * @param surah the surah
   */
  protected async listen(surah: number): Promise<void> {
    const id = this.current();
    if (id !== null) {
      await this.player.playRecitation({ recitation: await this.reciters.getRecitation(id), surah, mode: 'surah' });
    }
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
   * A number in the interface language.
   *
   * @param n the number
   * @returns the number, formatted
   */
  protected num(n: number): string {
    return localNumber(n, this.lang());
  }
}
