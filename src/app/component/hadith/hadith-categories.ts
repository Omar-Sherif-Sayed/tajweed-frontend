import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectInfiniteQuery, injectQuery } from '@tanstack/angular-query-experimental';
import { HadithService } from '@shared/service/integration/hadith/hadith.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber } from '@shared/utils/quran-text';

/**
 * Hadith (F13) — HadeethEnc's categories as a tree, and the hadiths of a category (`/hadith?category=`). Every screen
 * names HadeethEnc and links to it (their condition of 2026-11-22). The full collections and every scholar's ruling
 * come later (sunnah.com, Dorar — waiting for their keys).
 */
@Component({
  selector: 'tj-hadith-categories',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './hadith-categories.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HadithCategoriesComponent {
  /** The category opened, from the URL (`?category=`). */
  readonly category = input<string>();

  /** The encyclopedia. */
  private readonly hadith = inject(HadithService);

  /** The interface language. */
  protected readonly settings = inject(SettingsService);

  /** The categories. */
  protected readonly categories = injectQuery(() => ({
    queryKey: ['hadith-categories', this.settings.preferences().lang],
    queryFn: () => this.hadith.getCategories(),
    staleTime: 60 * 60 * 1000,
  }));

  /** The category opened. */
  protected readonly openId = computed(() => {
    const n = Number(this.category());
    return Number.isInteger(n) && n > 0 ? n : null;
  });

  /** The hadiths of the category opened, page after page. */
  protected readonly hadiths = injectInfiniteQuery(() => ({
    queryKey: ['hadith-list', this.openId(), this.settings.preferences().lang],
    queryFn: ({ pageParam }) => this.hadith.getCategoryHadiths(this.openId()!, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => ((last.page + 1) * last.size < last.total ? last.page + 1 : undefined),
    enabled: this.openId() !== null,
  }));

  /** The category opened, with its title. */
  protected readonly open = computed(() => this.categories.data()?.categories.find((c) => c.id === this.openId()) ?? null);

  /** The categories under the one opened (or the top ones). */
  protected readonly children = computed(() =>
    (this.categories.data()?.categories ?? []).filter((c) => (c.parentId ?? null) === this.openId()),
  );

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);

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
