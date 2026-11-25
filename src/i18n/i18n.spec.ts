import { LANGUAGES } from '@shared/constants/languages';
import { DIRECTIONS } from '@shared/constants/directions';
import ar from './ar.json';
import bn from './bn.json';
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fa from './fa.json';
import fr from './fr.json';
import ha from './ha.json';
import hi from './hi.json';
import id from './id.json';
import it_ from './it.json';
import ja from './ja.json';
import ko from './ko.json';
import ms from './ms.json';
import ps from './ps.json';
import pt from './pt.json';
import ru from './ru.json';
import sw from './sw.json';
import tr from './tr.json';
import ur from './ur.json';
import uz from './uz.json';
import zh from './zh.json';

const FILES: Record<string, object> = {
  ar, bn, de, en, es, fa, fr, ha, hi, id, it: it_, ja, ko, ms, ps, pt, ru, sw, tr, ur, uz, zh,
};

/** Every key of a nested texts object, as `a.b.c`. */
function keys(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('interface texts', () => {
  it('exist for each of the 22 languages, and for no other', () => {
    expect(Object.keys(FILES).sort()).toEqual(LANGUAGES.map((l) => l.code).sort());
  });

  it('have the same keys in every language, and no empty text (only the Arabic draft note is empty)', () => {
    const reference = keys(ar).sort();
    for (const [code, file] of Object.entries(FILES)) {
      expect(keys(file).sort(), code).toEqual(reference);
      for (const key of keys(file)) {
        const value = key.split('.').reduce<unknown>((n, k) => (n as Record<string, unknown>)[k], file);
        if (!(code === 'ar' && key === 'firstLaunch.draft')) {
          expect(String(value).trim(), `${code}: ${key}`).not.toBe('');
        }
      }
    }
  });

  it('name every colour direction of design 3', () => {
    for (const d of DIRECTIONS) {
      expect(keys(en)).toContain(`directions.${d.id}`);
    }
    expect(DIRECTIONS).toHaveLength(28);
    expect(DIRECTIONS.filter((d) => d.highContrast).map((d) => d.id)).toEqual(['mountains']);
  });

  it('keep the language count as a parameter in every language', () => {
    for (const [code, file] of Object.entries(FILES)) {
      expect((file as { firstLaunch: { nLanguages: string } }).firstLaunch.nLanguages, code).toContain('{{n}}');
    }
  });
});
