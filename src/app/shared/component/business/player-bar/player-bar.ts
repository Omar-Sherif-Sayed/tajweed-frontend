import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { IconComponent } from '@shared/component/general/icon/icon';
import { PlayerService } from '@shared/service/audio/player.service';
import { QuranService } from '@shared/service/integration/quran/quran.service';
import { SettingsService } from '@shared/service/settings.service';
import { localNumber, surahName } from '@shared/utils/quran-text';

/**
 * The player bar at the bottom of every page (F3, F7, F11): what is playing — the surah and ayah with the reciter and
 * his riwayah, or the station — its controls, «جارٍ إعادة الاتصال…» while the player reconnects, «listening only» for a
 * riwayah other than Hafs, and the sources' credits (client guide §5 rule 7).
 */
@Component({
  selector: 'tj-player-bar',
  imports: [TranslatePipe, IconComponent, RouterLink],
  templateUrl: './player-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBarComponent {
  /** The player. */
  protected readonly player = inject(PlayerService);

  /** The surahs' names. */
  private readonly quran = inject(QuranService);

  /** The interface language. */
  protected readonly settings = inject(SettingsService);

  /** The surahs, for their names. */
  private readonly surahs = injectQuery(() => ({
    queryKey: ['surahs', this.settings.preferences().lang],
    queryFn: () => this.quran.getSurahs(),
    staleTime: Infinity,
    enabled: this.player.active(),
  }));

  /** Arabic for the reciter's and station's names in Arabic-script languages, English otherwise. */
  protected readonly arabicNames = computed(() => ['ar', 'ur', 'fa', 'ps'].includes(this.settings.preferences().lang));

  /** The title of what is playing. */
  protected readonly title = computed(() => {
    const now = this.player.now();
    if (!now) {
      return '';
    }
    if (now.kind === 'radio') {
      return this.arabicNames() ? now.station.nameAr : now.station.nameEn;
    }
    const surah = this.surahs.data()?.find((s) => s.number === now.surah);
    const name = surah ? surahName(surah, this.settings.preferences().lang) : String(now.surah);
    return now.ayah ? `${name} ${localNumber(now.ayah, this.settings.preferences().lang)}` : name;
  });

  /** The reciter's name and the recitation's riwayah (always said — the author, 2026-11-22). */
  protected readonly subtitle = computed(() => {
    const now = this.player.now();
    if (!now) {
      return '';
    }
    if (now.kind === 'radio') {
      return now.station.riwayah ? (this.arabicNames() ? now.station.riwayah.nameAr : now.station.riwayah.nameEn) : '';
    }
    const r = now.recitation;
    return this.arabicNames()
      ? `${r.reciterNameAr} · ${r.recitation.riwayah.nameAr}`
      : `${r.reciterNameEn} · ${r.recitation.riwayah.nameEn}`;
  });

  /** The credits of the sources (mp3quran, EveryAyah). */
  protected readonly credits = computed(() => {
    const now = this.player.now();
    return now?.kind === 'recitation' ? now.recitation.credits : [];
  });

  /** Whether the recitation is listening only (not Hafs — AGENTS.md §6.7). */
  protected readonly listeningOnly = computed(() => {
    const now = this.player.now();
    return now?.kind === 'recitation' && now.recitation.recitation.listeningOnly;
  });

  /** Whether «next surah» applies. */
  protected readonly canSkip = computed(() => {
    const now = this.player.now();
    return now?.kind === 'recitation' && now.mode !== 'range';
  });
}
