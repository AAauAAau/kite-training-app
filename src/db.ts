import Dexie, { type EntityTable } from 'dexie';
import { defaultSettings, exercises as seedExercises } from './data/seed';
import type { BackupData, Exercise, Session, Settings } from './types';

class KiteDatabase extends Dexie {
  sessions!: EntityTable<Session, 'id'>;
  exercises!: EntityTable<Exercise, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('kite-strength-tracker');
    this.version(1).stores({
      sessions: 'id, date, type, createdAt',
      exercises: 'id, category',
      settings: 'id'
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
  const settings = (await db.settings.get('settings')) ?? defaultSettings;
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
    Array.isArray(candidate.exercises) && Boolean(candidate.settings);
}

export async function importBackup(value: unknown): Promise<void> {
  if (!isBackupData(value)) throw new Error('Die Datei ist kein gültiges Kite-Strength-Backup.');
  await db.transaction('rw', db.sessions, db.exercises, db.settings, async () => {
    await Promise.all([db.sessions.clear(), db.exercises.clear(), db.settings.clear()]);
    await db.sessions.bulkAdd(value.sessions);
    await db.exercises.bulkAdd(value.exercises);
    await db.settings.add(value.settings);
  });
}
