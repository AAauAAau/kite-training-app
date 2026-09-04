import { afterEach, describe, expect, it } from 'vitest';
import { messages as de } from './de';
import { detectLang, plural, setLang, t } from './index';

afterEach(() => setLang('de'));

describe('detectLang', () => {
  it('picks the first supported prefix', () => {
    expect(detectLang(['fr-CH', 'de'])).toBe('fr');
    expect(detectLang(['en-US'])).toBe('en');
  });

  it('falls back to de for unsupported or empty input', () => {
    expect(detectLang(['es'])).toBe('de');
    expect(detectLang([])).toBe('de');
  });
});

describe('t', () => {
  it('interpolates known params and leaves unknown placeholders untouched', () => {
    setLang('de');
    expect(t('comeback.reason', { weeks: 2, percent: 80 })).toContain('2 Wochen');
    expect(t('comeback.reason', { weeks: 2, percent: 80 })).toContain('80 %');
    expect(t('comeback.reason', { weeks: 2 })).toContain('{percent}');
  });

  it('ignores params that are not in the template', () => {
    setLang('de');
    expect(t('common.today', { foo: 'bar' })).toBe('Heute');
  });

  it('falls back to the German string when the active catalog has no entry', () => {
    setLang('en');
    expect(t('nav.today')).toBe(de['nav.today']);
    setLang('fr');
    expect(t('nav.today')).toBe(de['nav.today']);
  });
});

describe('plural', () => {
  it('selects one for n === 1 and other otherwise, interpolating {n}', () => {
    const forms = { one: '{n} Eintrag', other: '{n} Einträge' };
    expect(plural(1, forms)).toBe('1 Eintrag');
    expect(plural(0, forms)).toBe('0 Einträge');
    expect(plural(5, forms)).toBe('5 Einträge');
  });
});

// Aktiviert sich, sobald en.ts / fr.ts befüllt sind (Spec-Phasen 5–6).
describe.todo('en and fr expose exactly the same keys as de');
