import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { IconComponent } from '@shared/component/general/icon/icon';
import { DtoRadioStation } from '@shared/schema/response/radio';
import { PlayerService } from '@shared/service/audio/player.service';
import { ReciterService } from '@shared/service/integration/reciter/reciter.service';
import { SettingsService } from '@shared/service/settings.service';

/**
 * Quran radio (F7): the stations the backend checks every day — recitation only (the author, 2026-11-22) — played
 * straight from their streams on the resilient player (F11): the next stream on an error, without limit, at the live
 * point. A station's riwayah is shown only when the channel names it.
 */
@Component({
  selector: 'tj-radio',
  imports: [TranslatePipe, IconComponent],
  templateUrl: './radio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioComponent {
  /** The catalogue. */
  private readonly reciters = inject(ReciterService);

  /** The player. */
  protected readonly player = inject(PlayerService);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** The stations. */
  protected readonly radios = injectQuery(() => ({
    queryKey: ['radios', this.settings.preferences().lang],
    queryFn: () => this.reciters.getRadios(),
    staleTime: 60 * 60 * 1000,
  }));

  /** The filter typed. */
  protected readonly filter = signal('');

  /** Whether names are shown in Arabic. */
  protected readonly arabic = computed(() => ['ar', 'ur', 'fa', 'ps'].includes(this.settings.preferences().lang));

  /** The stations that match the filter (by their Arabic or English name). */
  protected readonly stations = computed(() => {
    const q = this.filter().trim().toLowerCase();
    const all = this.radios.data()?.stations ?? [];
    return q ? all.filter((s) => s.nameAr.includes(q) || s.nameEn.toLowerCase().includes(q)) : all;
  });

  /** The station playing, if any. */
  protected readonly playingId = computed(() => {
    const now = this.player.now();
    return now?.kind === 'radio' ? now.station.id : null;
  });

  /**
   * Plays a station, or stops it when it is playing.
   *
   * @param station the station
   */
  protected toggle(station: DtoRadioStation): void {
    if (this.playingId() === station.id) {
      this.player.stop();
    } else {
      this.player.playRadio(station);
    }
  }
}
