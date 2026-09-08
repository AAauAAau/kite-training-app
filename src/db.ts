import Dexie, { type EntityTable } from 'dexie';
import { defaultSettings, exercises as seedExercises } from './data/seed';
import { isLoggableDate } from './logic/date';
import { migrateSettings } from './logic/migrateSettings';
import type { ActiveTimer, BackupData, Exercise, Session, Settings } from './types';

class KiteDatabase extends Dexie {
  sessions!: EntityTable<Session, 'id'>;
  exercises!: EntityTable<Exercise, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  activeTimers!: EntityTable<ActiveTimer, 'id'>;

  constructor() {
    super('kite-strength-tracker');
    this.version(1).stores({
      sessions: 'id, date, type, createdAt',
      exercises: 'id, category',
      settings: 'id'
    });
    this.version(2).stores({
      sessions: 'id, date, type, createdAt',
      exercises: 'id, category',
      settings: 'id',
      activeTimers: 'id'
    });
    // v3: hamburgDays → gymDays. Kein Index-/Struktur-Wechsel, nur die Settings-Zeile
    // wird an Ort und Stelle bereinigt. `migrateSettings()` in `store.readAll()` und
    // `importBackup()` fängt DBs/Backups ab, die dieses Upgrade nie gesehen haben.
    this.version(3).stores({
      sessions: 'id, date, type, createdAt',
      exercises: 'id, category',
      settings: 'id',
      activeTimers: 'id'
    }).upgrade(async (tx) => {
      const settings = await tx.table('settings').get('settings');
      if (settings && Array.isArray((settings as Record<string, unknown>).hamburgDays)) {
        const legacy = settings as Record<string, unknown>;
        legacy.gymDays ??= legacy.hamburgDays;
        delete legacy.hamburgDays;
        await tx.table('settings').put(legacy);
      }
    });
  }
}

export const db = new KiteDatabase();

export async function seedDatabase(): Promise<void> {
  await db.transaction('rw', db.exercises, db.settings, async () => {
    await db.exercises.bulkPut(seedExercises);
    if (!(await db.settings.get('settings'))) await db.settings.add(defaultSettings);
  });
}

export async function exportBackup(): Promise<BackupData> {
  const settings = migrateSettings(await db.settings.get('settings'));
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: await db.sessions.toArray(),
    exercises: await db.exercises.toArray(),
    settings
  };
}

function isBackupData(value: unknown): value is BackupData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BackupData>;
  return candidate.version === 1 && Array.isArray(candidate.sessions) &&
    candidate.sessions.every((session) => isLoggableDate(session.date)) &&
    Array.isArray(candidate.exercises) && Boolean(candidate.settings);
}

export async function importBackup(value: unknown): Promise<void> {
  if (!isBackupData(value)) throw new Error('Die Datei ist kein gültiges Kite-Strength-Backup.');
  await db.transaction('rw', db.sessions, db.exercises, db.settings, async () => {
    await Promise.all([db.sessions.clear(), db.exercises.clear(), db.settings.clear()]);
    await db.sessions.bulkAdd(value.sessions);
    await db.exercises.bulkAdd(value.exercises);
    await db.settings.add(migrateSettings(value.settings));
  });
}
