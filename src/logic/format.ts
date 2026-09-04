import type { Lang } from '../types';

/** BCP-47-Locale je App-Sprache. Für `Intl.*` und `formatShortDate`. */
const locales: Record<Lang, string> = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR' };

export function localeFor(lang: Lang): string {
  return locales[lang];
}

/** Gewicht in der aktiven Locale (Dezimaltrennzeichen, Tausenderpunkt). */
export function formatKg(n: number, lang: Lang): string {
  return new Intl.NumberFormat(locales[lang], { maximumFractionDigits: 2 }).format(n);
}

/** Distanz in Metern, ganzzahlig, in der aktiven Locale. */
export function formatDistance(m: number, lang: Lang): string {
  return new Intl.NumberFormat(locales[lang], { maximumFractionDigits: 0 }).format(m);
}

/** Lastpunkte — immer mit einer Nachkommastelle, in der aktiven Locale. */
export function formatLoad(n: number, lang: Lang): string {
  return new Intl.NumberFormat(locales[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
}

/** Zahl mit fester Nachkommastellenzahl in der aktiven Locale (z. B. Sprintzeiten). */
export function formatFixed(n: number, lang: Lang, digits: number): string {
  return new Intl.NumberFormat(locales[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** Dezimaleingabe tolerant parsen — Komma und Punkt werden akzeptiert. */
export function parseDecimal(input: string): number {
  return Number(input.replace(',', '.'));
}
