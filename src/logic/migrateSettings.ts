import { defaultSettings } from '../data/seed';
import type { Settings } from '../types';

/**
 * Normalisiert persistierte Settings aus älteren App-Versionen: umbenannte Felder
 * werden übernommen, fehlende Felder aus `defaultSettings` aufgefüllt. Rein und
 * testbar — Aufrufer sind `store.readAll()` und `db.importBackup()`/`exportBackup()`.
 */
export function migrateSettings(raw: unknown): Settings {
  const source: Record<string, unknown> =
    raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : {};

  // hamburgDays → gymDays (Domain-neutraler Name für die Gym-Tage der Wochenplanung)
  if (Array.isArray(source.hamburgDays) && !Array.isArray(source.gymDays)) {
    source.gymDays = source.hamburgDays;
  }
  delete source.hamburgDays;

  return { ...defaultSettings, ...(source as Partial<Settings>) };
}
