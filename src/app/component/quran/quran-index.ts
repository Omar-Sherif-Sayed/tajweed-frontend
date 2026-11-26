import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber, surahName } from '@shared/utils/quran-text';

/**
 * The index of the mushaf (F2, AGENTS.md §8.1): the 114 surahs with Makki / Madani, their ayahs and first page, the 30
 * juz with where they start, and «go to page». From the backend's `/v1/surahs` and `/v1/juzs` (Tanzil's metadata).
 */
@Component({
  selector: 'tj-quran-index',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './quran-index.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuranIndexComponent {
  /** The Quran's metadata. */
  private readonly quran = inject(QuranService);

  /** The interface language. */
  protected readonly settings = inject(SettingsService);

  /** Opens the reader. */
  private readonly router = inject(Router);

  /** The tab shown. */
  protected readonly tab = signal<'surahs' | 'juzs'>('surahs');

  /** The page typed in «go to page». */
  protected readonly pageInput = signal('');

  /** The surahs. */
  protected readonly surahs = injectQuery(() => ({
    queryKey: ['surahs', this.settings.preferences().lang],
    queryFn: () => this.quran.getSurahs(),
    staleTime: Infinity,
  }));

  /** The juz. */
  protected readonly juzs = injectQuery(() => ({
    queryKey: ['juzs'],
    queryFn: () => this.quran.getJuzs(),
    staleTime: Infinity,
    enabled: this.tab() === 'juzs',
  }));

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

  /**
   * A surah's name in the interface language.
   *
   * @param n the surah
   * @returns its name
   */
  protected nameOf(n: number): string {
    const s = this.surahs.data()?.find((x) => x.number === n);
    return s ? surahName(s, this.lang()) : String(n);
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

  /** Opens the typed page of the mushaf. */
  protected async goToPage(): Promise<void> {
    const page = Number(this.pageInput());
    if (Number.isInteger(page) && page >= 1 && page <= 604) {
      await this.router.navigate(['/', this.lang(), 'quran', 'page', page]);
    }
  }
}
