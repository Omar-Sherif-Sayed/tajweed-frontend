import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HadithService } from '@shared/service/integration/hadith/hadith.service';
import { SettingsService } from '@shared/service/settings.service';
import { reportLink } from '@shared/utils/quran-text';

/**
 * One hadith (F13) — everything as HadeethEnc publishes it, nothing shortened or reworded: the text, who reported it,
 * the grade (never apart from the hadith), the explanation, the benefits, the word meanings and the reference; the
 * Arabic always, and the visitor's language beside it when HadeethEnc publishes it (otherwise the Arabic with a note —
 * AGENTS.md §6.10); HadeethEnc named with a link to the hadith's page (their condition).
 */
@Component({
  selector: 'tj-hadith-detail',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './hadith-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HadithDetailComponent {
  /** The hadith's id, from the route (`/hadith/:id`). */
  readonly id = input.required<string>();

  /** The encyclopedia. */
  private readonly hadith = inject(HadithService);

  /** The interface language. */
  protected readonly settings = inject(SettingsService);

  /** The hadith. */
  protected readonly data = injectQuery(() => ({
    queryKey: ['hadith', Number(this.id()), this.settings.preferences().lang],
    queryFn: () => this.hadith.getHadith(Number(this.id())),
    staleTime: 60 * 60 * 1000,
  }));

  /** The texts to show: the Arabic, then the translation when there is one. */
  protected readonly texts = computed(() => {
    const d = this.data.data();
    return d ? [d.arabic, ...(d.translation ? [d.translation] : [])] : [];
  });

  /** Whether a translation was expected but HadeethEnc has none in this language. */
  protected readonly arabicOnly = computed(() => this.settings.preferences().lang !== 'ar' && !!this.data.data() && !this.data.data()!.translation);

  /** The link that reports a mistake in this hadith. */
  protected readonly report = computed(() => reportLink(`Hadith ${this.id()}`));

  /** The interface language's code. */
  protected readonly lang = computed(() => this.settings.preferences().lang);
}
