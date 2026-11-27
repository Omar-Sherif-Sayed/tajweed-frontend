import { daysBetween, memorisedAyahs, nextPortion, nextReview, parseSettingsFile, portions } from './study';

/** The study tools' arithmetic — F30, F31, F47. */
describe('study tools', () => {
  it('shares the 604 pages out over the khatma’s days, every page once', () => {
    const thirty = portions(30);
    expect(thirty.length).toBe(30);
    expect(thirty[0]).toEqual({ index: 0, from: 1, to: 20 });
    expect(thirty[29].to).toBe(604);
    for (let i = 1; i < thirty.length; i++) {
      expect(thirty[i].from).toBe(thirty[i - 1].to + 1);
    }
    expect(portions(1)).toEqual([{ index: 0, from: 1, to: 604 }]);
  });

  it('gives the next portion not yet read, and none when the khatma is finished', () => {
    expect(nextPortion(30, 0)?.index).toBe(0);
    expect(nextPortion(30, 20)?.index).toBe(1);
    expect(nextPortion(30, 604)).toBeNull();
  });

  it('schedules the reviews of a range today, after 1, 3 and 7 days', () => {
    const r = { surah: 67, from: 1, to: 5, learned: '2026-11-27', reviews: 0 };
    expect(nextReview(r)).toBe('2026-11-27');
    expect(nextReview({ ...r, reviews: 2 })).toBe('2026-11-30');
    expect(nextReview({ ...r, reviews: 3 })).toBe('2026-12-04');
    expect(nextReview({ ...r, reviews: 4 })).toBeNull();
    expect(daysBetween('2026-11-27', '2026-12-04')).toBe(7);
  });

  it('counts each memorised ayah once', () => {
    expect(
      memorisedAyahs([
        { surah: 1, from: 1, to: 7, learned: '2026-11-27', reviews: 0 },
        { surah: 1, from: 5, to: 7, learned: '2026-11-27', reviews: 0 },
      ]),
    ).toBe(7);
  });

  it('reads only a Tajweed settings file', () => {
    expect(parseSettingsFile('{"app":"tajweed","version":1,"saved":"x","data":{"notes":{}}}')?.data).toEqual({ notes: {} });
    expect(parseSettingsFile('{"app":"other","version":1,"data":{}}')).toBeNull();
    expect(parseSettingsFile('not json')).toBeNull();
  });
});
