import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { SettingsService } from '@shared/service/settings.service';
import { StudyService } from '@shared/service/study.service';
import { localNumber, surahName } from '@shared/utils/quran-text';

/** A note as listed. */
interface ListedNote {
  /** The surah. */
  readonly surah: number;
  /** The ayah. */
  readonly ayah: number;
  /** The note. */
  readonly text: string;
}

/**
 * My notes (F32, design 3): the visitor's private notes on ayahs, in the mushaf's order, each opening its surah at the
 * ayah. A note is written from the ayah's actions (tap an ayah). Kept on the device only.
 */
@Component({
  selector: 'tj-notes',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './notes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesComponent {
  /** The notes. */
  protected readonly study = inject(StudyService);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The surahs' names. */
  private readonly quran = inject(QuranService);

  /** The surahs. */
  private readonly surahs = injectQuery(() => ({
    queryKey: ['surahs', this.settings.preferences().lang],
    queryFn: () => this.quran.getSurahs(),
    staleTime: Infinity,
  }));

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

  /** The notes, in the mushaf's order. */
  protected readonly list = computed<ListedNote[]>(() =>
    Object.entries(this.study.notes())
      .map(([key, text]) => {
        const [surah, ayah] = key.split(':').map(Number);
        return { surah, ayah, text };
      })
      .sort((a, b) => a.surah - b.surah || a.ayah - b.ayah),
  );

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
