import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { LocalStore } from '@shared/service/local-store';
import { AsrSchool, MethodId, methodForTimeZone, Place } from './prayer-calc';

/** Why the location could not be read. */
export type LocationProblem = 'denied' | 'unavailable' | null;

/**
 * The visitor's place and prayer settings, on the device only (AGENTS.md §8.5: the location is never sent to the
 * backend): the place (from the browser's location, or typed), the method (the country's default from the device's
 * time zone, or chosen), the Asr school.
 */
@Injectable({ providedIn: 'root' })
export class PrayerSettings {
  /** The browser's storage. */
  private readonly store = inject(LocalStore);

  /** Whether this runs in the browser. */
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The place, or `null` until known. */
  readonly place = signal<Place | null>(this.store.read<Place | null>('place', null));

  /** The method chosen by the visitor, or `null` for the country's default. */
  readonly chosenMethod = signal<MethodId | null>(this.store.read<MethodId | null>('prayerMethod', null));

  /** The Asr school. */
  readonly school = signal<AsrSchool>(this.store.read<AsrSchool>('asrSchool', 'standard'));

  /** Why the location could not be read, if it could not. */
  readonly problem = signal<LocationProblem>(null);

  /** The country's default method, from the device's time zone (read on the device). */
  readonly defaultMethod = computed(() =>
    methodForTimeZone(this.browser ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined),
  );

  /** The method in use. */
  readonly method = computed<MethodId>(() => this.chosenMethod() ?? this.defaultMethod().id);

  /** Whether the method in use is the fallback because no official method is known (the screen says so). */
  readonly usingFallback = computed(() => this.chosenMethod() === null && this.defaultMethod().fallback);

  /** Asks the browser for the location (it asks the visitor); kept on the device. */
  locate(): void {
    const geo = this.browser ? navigator.geolocation : undefined;
    if (!geo) {
      this.problem.set('unavailable');
      return;
    }
    geo.getCurrentPosition(
      (pos) => this.setPlace({ lat: round(pos.coords.latitude), lng: round(pos.coords.longitude) }),
      (err) => this.problem.set(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 15_000 },
    );
  }

  /**
   * Sets the place.
   *
   * @param place the place
   */
  setPlace(place: Place): void {
    this.problem.set(null);
    this.place.set(place);
    this.store.write('place', place);
  }

  /**
   * Chooses a method, or the country's default.
   *
   * @param id the method, or `null`
   */
  chooseMethod(id: MethodId | null): void {
    this.chosenMethod.set(id);
    this.store.write('prayerMethod', id);
  }

  /**
   * Chooses the Asr school.
   *
   * @param school the school
   */
  chooseSchool(school: AsrSchool): void {
    this.school.set(school);
    this.store.write('asrSchool', school);
  }
}

/**
 * Rounds a coordinate to four decimals (about 11 m) — precise enough for prayer times and the Qibla.
 *
 * @param x the coordinate
 * @returns the rounded coordinate
 */
function round(x: number): number {
  return Math.round(x * 10_000) / 10_000;
}
