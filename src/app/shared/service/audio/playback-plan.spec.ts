import { ayahAt, fillTemplate, MAX_RETRY_DELAY_MS, nextSurah, orderSources, retryStep } from './playback-plan';

/** The rules of resilient playback (AGENTS.md §8.3, client guide §5) — `P1-W8`. */
describe('playback plan', () => {
  it('tries the sources by priority, the failing ones last, never dropping one', () => {
    const order = orderSources([
      { priority: 1, status: 'FAILING' as const, id: 'a' },
      { priority: 3, status: 'OK' as const, id: 'c' },
      { priority: 2, status: null, id: 'b' },
    ]);
    expect(order.map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('retries the same source, then the next, round and round, without limit', () => {
    const sources = Array.from({ length: 10 }, (_, i) => retryStep(i + 1, 3).sourceIndex);
    expect(sources).toEqual([0, 1, 1, 2, 2, 0, 0, 1, 1, 2]);
    expect(retryStep(1_000, 3).sourceIndex).toBeLessThan(3);
  });

  it('waits a little longer each time, never more than 30 seconds', () => {
    expect([1, 2, 3, 4].map((f) => retryStep(f, 2).delayMs)).toEqual([1000, 2000, 4000, 8000]);
    expect(retryStep(6, 2).delayMs).toBe(MAX_RETRY_DELAY_MS);
    expect(retryStep(500, 2).delayMs).toBe(MAX_RETRY_DELAY_MS);
  });

  it('starts the rounds from the source the playback began on', () => {
    expect(retryStep(1, 3, 2).sourceIndex).toBe(2);
    expect(retryStep(2, 3, 2).sourceIndex).toBe(0);
  });

  it('writes the surah and the ayah as three digits', () => {
    expect(fillTemplate('https://x/{surah}.mp3', 2)).toBe('https://x/002.mp3');
    expect(fillTemplate('https://x/{surah}{ayah}.mp3', 2, 255)).toBe('https://x/002255.mp3');
  });

  it('crosses from surah 114 to Al-Fatihah in the endless mode, skipping missing surahs', () => {
    const all = Array.from({ length: 114 }, (_, i) => i + 1);
    expect(nextSurah(1, all)).toBe(2);
    expect(nextSurah(114, all)).toBe(1);
    expect(nextSurah(113, [1, 50, 113])).toBe(1);
    expect(nextSurah(1, [1, 50, 113])).toBe(50);
    expect(nextSurah(5, [])).toBeNull();
  });

  it('finds the ayah being recited from the timings', () => {
    const timings = [
      { ayah: 0, startMs: 0, endMs: 5000 },
      { ayah: 1, startMs: 5000, endMs: 9000 },
      { ayah: 2, startMs: 9000, endMs: 15000 },
    ];
    expect(ayahAt(timings, 100)).toBe(0);
    expect(ayahAt(timings, 5000)).toBe(1);
    expect(ayahAt(timings, 14999)).toBe(2);
    expect(ayahAt(timings, 20000)).toBe(2);
    expect(ayahAt([], 10)).toBeNull();
  });
});
