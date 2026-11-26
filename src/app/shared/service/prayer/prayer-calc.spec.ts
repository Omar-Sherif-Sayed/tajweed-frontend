import { FALLBACK_METHOD, methodForTimeZone, nextPrayer, parametersFor, prayerTimes, qiblaBearing } from './prayer-calc';

/** The prayer-time rules (F8, F10, `P2-D1`). */
describe('prayer calculation', () => {
  it('takes the method of the country of the time zone, or the fallback — and says which', () => {
    expect(methodForTimeZone('Africa/Cairo')).toEqual({ id: 'Egypt', fallback: false });
    expect(methodForTimeZone('Asia/Riyadh')).toEqual({ id: 'UmmAlQura', fallback: false });
    expect(methodForTimeZone('Asia/Kuala_Lumpur')).toEqual({ id: 'Malaysia', fallback: false });
    expect(methodForTimeZone('Asia/Tokyo')).toEqual({ id: FALLBACK_METHOD, fallback: true });
    expect(methodForTimeZone(undefined).fallback).toBe(true);
  });

  it('builds a method from the data file, not from the library presets', () => {
    const malaysia = parametersFor('Malaysia', 'standard', { lat: 3.14, lng: 101.69 });
    expect(malaysia.fajrAngle).toBe(18);
    expect(malaysia.ishaAngle).toBe(18);
    expect(malaysia.methodAdjustments.dhuhr).toBe(3);
    const egypt = parametersFor('Egypt', 'standard', { lat: 30.04, lng: 31.24 });
    expect(egypt.methodAdjustments.dhuhr).toBe(0);
    const ummAlQura = parametersFor('UmmAlQura', 'hanafi', { lat: 21.42, lng: 39.83 });
    expect(ummAlQura.ishaInterval).toBe(90);
  });

  it('gives the times of a day in order, Isha 90 minutes after Maghrib in Umm al-Qura', () => {
    const t = prayerTimes({ lat: 21.4225, lng: 39.8262 }, new Date(2026, 10, 26), 'UmmAlQura', 'standard');
    const order = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map((d) => d.getTime());
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect((t.isha.getTime() - t.maghrib.getTime()) / 60_000).toBe(90);
  });

  it('finds the next prayer, skipping sunrise, and tomorrow’s Fajr after Isha', () => {
    const t = prayerTimes({ lat: 30.0444, lng: 31.2357 }, new Date(2026, 10, 26), 'Egypt', 'standard');
    const tomorrow = new Date(t.fajr.getTime() + 24 * 3600_000);
    expect(nextPrayer(t, tomorrow, new Date(t.fajr.getTime() + 60_000)).name).toBe('dhuhr');
    expect(nextPrayer(t, tomorrow, new Date(t.isha.getTime() + 60_000))).toEqual({ name: 'fajr', time: tomorrow });
  });

  it('gives the Qibla bearing along the great circle', () => {
    expect(qiblaBearing({ lat: 40.7128, lng: -74.0059 })).toBeCloseTo(58.48, 1);
    expect(qiblaBearing({ lat: 30.0444, lng: 31.2357 })).toBeCloseTo(136.1, 0);
  });
});
