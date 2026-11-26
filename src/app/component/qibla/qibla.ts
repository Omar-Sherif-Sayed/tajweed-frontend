import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PlaceFormComponent } from '@shared/component/business/place-form/place-form';
import { qiblaBearing } from '@shared/service/prayer/prayer-calc';
import { PrayerSettings } from '@shared/service/prayer/prayer-settings.service';
import { SettingsService } from '@shared/service/settings.service';

/**
 * The Qibla (F10): the bearing from the visitor's place to the Kaaba along the great circle, calculated on the device.
 * On a computer there is no compass, so the direction is shown in degrees from north on a fixed rose (AGENTS.md §8.5).
 */
@Component({
  selector: 'tj-qibla',
  imports: [TranslatePipe, PlaceFormComponent],
  templateUrl: './qibla.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QiblaComponent {
  /** The place. */
  protected readonly prayer = inject(PrayerSettings);

  /** The interface language. */
  private readonly settings = inject(SettingsService);

  /** Set after the page is shown in the browser (the place is kept in the browser). */
  protected readonly ready = signal(false);

  /** The bearing, in degrees from north. */
  protected readonly bearing = computed(() => {
    const place = this.prayer.place();
    return place ? qiblaBearing(place) : null;
  });

  /** The bearing written in the interface language, to a tenth of a degree. */
  protected readonly degrees = computed(() => {
    const b = this.bearing();
    return b === null ? '' : new Intl.NumberFormat(this.settings.preferences().lang, { maximumFractionDigits: 1 }).format(b);
  });

  /** Shows the page's content in the browser. */
  constructor() {
    afterNextRender(() => this.ready.set(true));
  }
}
