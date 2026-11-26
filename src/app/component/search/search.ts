import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectInfiniteQuery, injectQuery } from '@tanstack/angular-query-experimental';
import { DtoSearchHit } from '@shared/schema/response/quran';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber, mushafNumber, surahName } from '@shared/utils/quran-text';

/** One word of a found ayah, and whether it matched. */
interface Word {
  /** The word, as in the ayah's text. */
  readonly text: string;
  /** Whether it is tinted. */
  readonly matched: boolean;
}

/**
 * Quran search (F16, AGENTS.md §8.1): one box for a word with or without tashkeel, a surah's name or number, or an ayah
 * number such as `2:255`. The backend searches a separate search text; the displayed text is never changed — the
 * matched words are tinted as a display layer (the whole ayah when the two spellings split words differently).
 */
@Component({
  selector: 'tj-search',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  /** The query, from the URL (`?q=`), so a search can be shared and bookmarked. */
  readonly q = input<string>();

  /** The search. */
  private readonly quran = inject(QuranService);

  /** The interface language. */
  protected readonly settings = inject(SettingsService);

  /** Puts the query in the URL. */
  private readonly router = inject(Router);

  /** What is typed in the box. */
  protected readonly typed = signal('');

  /** The query searched. */
  protected readonly query = computed(() => (this.q() ?? '').trim());

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

  /** The answers, page after page. */
  protected readonly results = injectInfiniteQuery(() => ({
    queryKey: ['search', this.query(), this.lang()],
    queryFn: ({ pageParam }) => this.quran.search(this.query(), pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (last) => ((last.page + 1) * last.size < last.total ? last.page + 1 : undefined),
    enabled: this.query().length > 0,
  }));

  /** The surahs, for their names. */
  private readonly surahs = injectQuery(() => ({
    queryKey: ['surahs', this.lang()],
    queryFn: () => this.quran.getSurahs(),
    staleTime: Infinity,
  }));

  /** The first page's answer (the ayah named and the surahs named are on it). */
  protected readonly first = computed(() => this.results.data()?.pages[0] ?? null);

  /** Every hit so far, in mushaf order. */
  protected readonly hits = computed<DtoSearchHit[]>(() => this.results.data()?.pages.flatMap((p) => [...p.hits]) ?? []);

  /** Puts the typed query in the URL, which runs the search. */
  protected async submit(): Promise<void> {
    const q = this.typed().trim() || this.query();
    await this.router.navigate(['/', this.lang(), 'search'], { queryParams: { q: q || null } });
  }

  /**
   * The words of a found ayah, each with whether it matched (an empty list of matches tints the whole ayah).
   *
   * @param hit the hit
   * @returns the words
   */
  protected words(hit: DtoSearchHit): Word[] {
    const all = hit.matchedWords.length === 0;
    return hit.ayah.text.split(' ').map((text, i) => ({ text, matched: all || hit.matchedWords.includes(i) }));
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
   * How many ayahs of a surah matched.
   *
   * @param n the surah
   * @returns the count
   */
  protected countIn(n: number): number {
    return this.first()?.countsBySurah.find((c) => c.surahNumber === n)?.count ?? 0;
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
   * The ayah number as printed.
   *
   * @param n the number
   * @returns the digits
   */
  protected mushaf(n: number): string {
    return mushafNumber(n);
  }
}
