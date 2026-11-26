import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PrayerSettings } from '@shared/service/prayer/prayer-settings.service';

/**
 * The visitor's place, for the prayer times and the Qibla: «use my location» (the browser asks the visitor), or the
 * latitude and longitude typed. Kept on the device; never sent anywhere (AGENTS.md §8.5).
 */
@Component({
  selector: 'tj-place-form',
  imports: [TranslatePipe],
  template: `
    <div class="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-surface p-3 text-sm">
      <button type="button" class="rounded-full bg-primary px-4 py-1.5 text-onprimary" (click)="prayer.locate()">
        {{ 'prayer.useLocation' | translate }}
      </button>
      <form class="flex flex-wrap items-end gap-2" (submit)="$event.preventDefault(); save()">
        <label class="block">
          <span class="block text-xs text-muted">{{ 'prayer.latitude' | translate }}</span>
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            dir="ltr"
            class="w-28 rounded-lg border border-border bg-surface px-2 py-1"
            [value]="lat()"
            (input)="lat.set($any($event.target).value)"
          />
        </label>
        <label class="block">
          <span class="block text-xs text-muted">{{ 'prayer.longitude' | translate }}</span>
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            dir="ltr"
            class="w-28 rounded-lg border border-border bg-surface px-2 py-1"
            [value]="lng()"
            (input)="lng.set($any($event.target).value)"
          />
        </label>
        <button type="submit" class="rounded-full border border-border px-3 py-1">{{ 'quran.go' | translate }}</button>
      </form>
      @if (prayer.problem() || !prayer.place()) {
        <p class="w-full text-xs text-muted" role="status">{{ 'prayer.noLocation' | translate }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceFormComponent {
  /** The place and settings. */
  protected readonly prayer = inject(PrayerSettings);

  /** The latitude typed. */
  protected readonly lat = signal(String(this.prayer.place()?.lat ?? ''));

  /** The longitude typed. */
  protected readonly lng = signal(String(this.prayer.place()?.lng ?? ''));

  /** Shows the place found by «use my location» in the two boxes. */
  constructor() {
    effect(() => {
      const place = this.prayer.place();
      if (place) {
        this.lat.set(String(place.lat));
        this.lng.set(String(place.lng));
      }
    });
  }

  /** Uses the typed place, when it is a valid one. */
  protected save(): void {
    const lat = Number(this.lat());
    const lng = Number(this.lng());
    if (this.lat() !== '' && this.lng() !== '' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      this.prayer.setPlace({ lat, lng });
    }
  }
}
