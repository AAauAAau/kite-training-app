import { afterEach, describe, expect, it } from 'vitest';
import { messages as de } from './de';
import { messages as en } from './en';
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
    // fr is still an empty catalog (Spec-Phase 6) → every key falls back to de.
    setLang('fr');
    expect(t('nav.today')).toBe(de['nav.today']);
    expect(t('settings.title')).toBe(de['settings.title']);
  });

  it('uses the English catalog once it is populated', () => {
    setLang('en');
    expect(t('nav.today')).toBe('Today');
    expect(t('settings.title')).toBe('Settings');
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

describe('catalog completeness', () => {
  const deKeys = Object.keys(de).sort();

  it('en exposes exactly the same keys as de', () => {
    expect(Object.keys(en).sort()).toEqual(deKeys);
  });

  it('en keeps every interpolation placeholder from de', () => {
    const placeholders = (value: string) => (value.match(/\{(\w+)\}/g) ?? []).sort();
    for (const key of deKeys) {
      expect(placeholders((en as Record<string, string>)[key])).toEqual(placeholders((de as Record<string, string>)[key]));
    }
  });
});

// Aktiviert sich, sobald fr.ts befüllt ist (Spec-Phase 6).
describe.todo('fr exposes exactly the same keys as de');
