import { create } from 'zustand';
import { db, importBackup, seedDatabase } from './db';
import { defaultSettings } from './data/seed';
import { addDays, localDate } from './logic/date';
import type { Exercise, Feel, Session, Settings } from './types';

interface AppState {
  ready: boolean;
  sessions: Session[];
  exercises: Exercise[];
  settings: Settings;
  initialize: () => Promise<void>;
  addSession: (session: Session) => Promise<void>;
  updateSession: (id: string, patch: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  setFeel: (id: string, feel: Feel) => Promise<void>;
  addBodyweight: (kg: number, date?: string) => Promise<void>;
  dismissDeload: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  restoreBackup: (data: unknown) => Promise<void>;
}

async function readAll() {
  const [sessions, exercises, settings] = await Promise.all([
    db.sessions.orderBy('date').reverse().toArray(),
    db.exercises.toArray(),
    db.settings.get('settings')
  ]);
  return { sessions, exercises, settings: settings ?? defaultSettings };
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  sessions: [],
  exercises: [],
  settings: defaultSettings,
  initialize: async () => {
    await seedDatabase();
    set({ ...(await readAll()), ready: true });
  },
  addSession: async (session) => {
    await db.sessions.add(session);
    set({ sessions: [session, ...get().sessions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt) });
  },
  updateSession: async (id, patch) => {
    await db.sessions.update(id, patch);
    set({ sessions: get().sessions.map((session) => session.id === id ? { ...session, ...patch } : session) });
  },
  deleteSession: async (id) => {
    await db.sessions.delete(id);
    set({ sessions: get().sessions.filter((session) => session.id !== id) });
  },
  setFeel: async (id, feel) => get().updateSession(id, { feel }),
  addBodyweight: async (kg, date = localDate()) => {
    const current = get().settings;
    const bodyweightLog = [...current.bodyweightLog.filter((entry) => entry.date !== date), { date, kg }]
      .sort((a, b) => a.date.localeCompare(b.date));
    const settings = { ...current, bodyweightLog };
    await db.settings.put(settings);
    set({ settings });
  },
  dismissDeload: async () => {
    const settings = { ...get().settings, deloadDismissedUntil: addDays(localDate(), 7) };
    await db.settings.put(settings);
    set({ settings });
  },
  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    await db.settings.put(settings);
    set({ settings });
  },
  restoreBackup: async (data) => {
    await importBackup(data);
    set(await readAll());
  }
}));
