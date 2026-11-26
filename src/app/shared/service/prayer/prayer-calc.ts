import { CalculationParameters, Coordinates, HighLatitudeRule, Madhab, PrayerTimes, Qibla, SunnahTimes } from 'adhan';
import METHODS from '@shared/constants/prayer-methods.json';

/** A method's id in `prayer-methods.json` (`MWL`, `UmmAlQura`, `Egypt` …). */
export type MethodId = string;

/** The Asr school: the majority's shadow factor 1, or the Hanafi school's 2. */
export type AsrSchool = 'standard' | 'hanafi';

/** A place, in degrees. */
export interface Place {
  /** Latitude, −90 … 90. */
  readonly lat: number;
  /** Longitude, −180 … 180. */
  readonly lng: number;
}

/** The five prayers and sunrise of one day, and the last third of its night. */
export interface DayTimes {
  /** Fajr. */
  readonly fajr: Date;
  /** Sunrise. */
  readonly sunrise: Date;
  /** Dhuhr. */
  readonly dhuhr: Date;
  /** Asr. */
  readonly asr: Date;
  /** Maghrib. */
  readonly maghrib: Date;
  /** Isha. */
  readonly isha: Date;
}

/** The names of the times, in order. */
export const TIME_NAMES = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

/** The data of one method. */
interface MethodData {
  /** The sun's depression at Fajr. */
  readonly fajrAngle: number;
  /** The sun's depression at Isha (when there is no interval). */
  readonly ishaAngle?: number;
  /** Isha as minutes after Maghrib. */
  readonly ishaInterval?: number;
  /** Minutes added to each time. */
  readonly adjustments: Readonly<Record<string, number>>;
  /** Where the method was read. */
  readonly source: string;
}

/** The shared data file's shape. */
interface MethodsFile {
  /** The method used where no official one has been read. */
  readonly fallback: MethodId;
  /** The methods by id. */
  readonly methods: Readonly<Record<MethodId, MethodData>>;
  /** Country code → method. */
  readonly countries: Readonly<Record<string, MethodId>>;
  /** IANA time zone → country code. */
  readonly timeZones: Readonly<Record<string, string>>;
}

/** The default method of a place, and whether it is the fallback. */
export interface DefaultMethod {
  /** The method. */
  readonly id: MethodId;
  /** Whether no official method is known there (the screen says so). */
  readonly fallback: boolean;
}

/** The next prayer. */
export interface NextPrayer {
  /** Its name. */
  readonly name: (typeof TIME_NAMES)[number];
  /** Its time. */
  readonly time: Date;
}

/** The methods, from the shared data file (tajweed-docs `docs/data-sources/prayer-methods.json`). */
const DATA = METHODS as unknown as MethodsFile;

/** Every method's id, in the data's order. */
export const METHOD_IDS: readonly MethodId[] = Object.keys(DATA.methods);

/** The method used where no official one has been read (Muslim World League). */
export const FALLBACK_METHOD: MethodId = DATA.fallback;

/**
 * The default method for a time zone: its country's official method, or the fallback (and the screen says so).
 *
 * @param timeZone the device's IANA time zone, e.g. `Africa/Cairo`
 * @returns the method, and whether it is the fallback
 */
export function methodForTimeZone(timeZone: string | undefined): DefaultMethod {
  const country = timeZone ? DATA.timeZones[timeZone] : undefined;
  const id = country ? DATA.countries[country] : undefined;
  return id ? { id, fallback: false } : { id: DATA.fallback, fallback: true };
}

/**
 * Where a method was read.
 *
 * @param id the method
 * @returns its source, as the data file names it
 */
export function methodSource(id: MethodId): string {
  return DATA.methods[id]?.source ?? '';
}

/**
 * The calculation parameters of a method, built from the data file's values (not the library's presets).
 *
 * @param id the method
 * @param school the Asr school
 * @param place the place, for the high-latitude rule
 * @returns the parameters
 */
export function parametersFor(id: MethodId, school: AsrSchool, place: Place): CalculationParameters {
  const m = DATA.methods[id] ?? DATA.methods[DATA.fallback];
  const params = new CalculationParameters('Other', m.fajrAngle, m.ishaAngle ?? 0, m.ishaInterval ?? 0);
  params.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, ...m.adjustments };
  params.madhab = school === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.recommended(new Coordinates(place.lat, place.lng));
  return params;
}

/**
 * The prayer times of a day at a place, calculated on the device (F8).
 *
 * @param place the place
 * @param date the day
 * @param id the method
 * @param school the Asr school
 * @returns the times
 */
export function prayerTimes(place: Place, date: Date, id: MethodId, school: AsrSchool): DayTimes {
  const t = new PrayerTimes(new Coordinates(place.lat, place.lng), date, parametersFor(id, school, place));
  return { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
}

/**
 * The beginning of the last third of the night that follows a day's Maghrib, up to the next Fajr (F36).
 *
 * @param place the place
 * @param date the day whose Maghrib begins the night
 * @param id the method
 * @param school the Asr school
 * @returns the moment
 */
export function lastThirdOfNight(place: Place, date: Date, id: MethodId, school: AsrSchool): Date {
  const t = new PrayerTimes(new Coordinates(place.lat, place.lng), date, parametersFor(id, school, place));
  return new SunnahTimes(t).lastThirdOfTheNight;
}

/**
 * The direction of the Qibla from a place (F10): degrees clockwise from true north, along the great circle to the
 * Kaaba.
 *
 * @param place the place
 * @returns the bearing, 0 … 360
 */
export function qiblaBearing(place: Place): number {
  return Qibla(new Coordinates(place.lat, place.lng));
}

/**
 * The next prayer after a moment (sunrise is not a prayer).
 *
 * @param today today's times
 * @param tomorrowFajr tomorrow's Fajr
 * @param now the moment
 * @returns the prayer's name and time
 */
export function nextPrayer(today: DayTimes, tomorrowFajr: Date, now: Date): NextPrayer {
  for (const name of TIME_NAMES) {
    if (name !== 'sunrise' && today[name] > now) {
      return { name, time: today[name] };
    }
  }
  return { name: 'fajr', time: tomorrowFajr };
}
