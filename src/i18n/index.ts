import type { Lang } from '../types';
import { messages as de } from './de';
import { messages as en } from './en';
import { messages as fr } from './fr';
import type { Messages, MessageKey } from './de';

export type { Messages, MessageKey } from './de';

/** Ein Message-Deskriptor: von `src/logic/` geliefert, von den Komponenten übersetzt. */
export interface MessageDescriptor {
  key: MessageKey;
  params?: Record<string, string | number>;
}

const catalogs: Record<Lang, Partial<Messages>> = { de, en, fr };
const supported: readonly Lang[] = ['de', 'en', 'fr'];

let activeLang: Lang = 'de';

/** Aktive Sprache setzen. Wird vom Store bei `initialize()` und `updateSettings` aufgerufen. */
export function setLang(lang: Lang): void {
  activeLang = lang;
}

export function getLang(): Lang {
  return activeLang;
}

/** Erste `navigator.languages`-Sprache mit Präfix `de`/`en`/`fr`, sonst `de`. Rein und testbar. */
export function detectLang(nav: readonly string[]): Lang {
  for (const entry of nav) {
    const prefix = entry.slice(0, 2).toLowerCase();
    if ((supported as readonly string[]).includes(prefix)) return prefix as Lang;
  }
  return 'de';
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

/**
 * Übersetzt `key` in die aktive Sprache. Fehlt der Eintrag in `en`/`fr`, wird der
 * deutsche String genutzt (plus `console.warn` im Dev-Build). `{param}` wird ersetzt,
 * unbekannte Platzhalter bleiben stehen.
 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const template = catalogs[activeLang][key];
  if (template === undefined) {
    if (activeLang !== 'de' && import.meta.env?.DEV) {
      console.warn(`[i18n] Kein ${activeLang}-Eintrag für "${key}" — deutscher Fallback.`);
    }
    return interpolate(de[key], params);
  }
  return interpolate(template, params);
}

/** Einfache Plural-Auswahl ohne ICU: `n === 1` → `one`, sonst `other`. `{n}` wird ersetzt. */
export function plural(n: number, forms: { one: string; other: string }): string {
  return (n === 1 ? forms.one : forms.other).replace(/\{n\}/g, String(n));
}
