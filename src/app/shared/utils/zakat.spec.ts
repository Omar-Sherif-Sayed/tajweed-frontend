import { egyptNisab, saudiNisab, zakatOn } from './zakat';

/** The Zakat calculator's arithmetic — F42. */
describe('zakat', () => {
  it('reckons the Egyptian nisab on 85 grams of 21-carat gold', () => {
    expect(egyptNisab(4000)).toBe(340_000);
    expect(egyptNisab(null)).toBeNull();
    expect(egyptNisab(0)).toBeNull();
  });

  it('takes the lower of the gold and the silver nisab for the Saudi bodies, and needs both prices', () => {
    expect(saudiNisab(300, 3)).toBe(1785);
    expect(saudiNisab(10, 3)).toBe(850);
    expect(saudiNisab(300, null)).toBeNull();
    expect(saudiNisab(null, 3)).toBeNull();
  });

  it('owes a quarter of a tenth at the nisab or above, and nothing below it', () => {
    expect(zakatOn(340_000, 340_000)).toEqual({ nisab: 340_000, due: 8500 });
    expect(zakatOn(100, 340_000)).toEqual({ nisab: 340_000, due: 0 });
    expect(zakatOn(null, 340_000)).toEqual({ nisab: 340_000, due: 0 });
    expect(zakatOn(1_000_000, null)).toEqual({ nisab: null, due: null });
  });
});
