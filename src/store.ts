import { create } from 'zustand';
import { db, importBackup, seedDatabase } from './db';
import { defaultSettings } from './data/seed';
import { addDays, isLoggableDate, localDate } from './logic/date';
import type { ActiveTimer, Exercise, Feel, Session, Settings } from './types';

interface AppState {
  ready: boolean;
  sessions: Session[];
  exercises: Exercise[];
  settings: Settings;
  activeTimer: ActiveTimer | null;
  initialize: () => Promise<void>;
  addSession: (session: Session) => Promise<void>;
  updateSession: (id: string, patch: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  setFeel: (id: string, feel: Feel) => Promise<void>;
  addBodyweight: (kg: number, date?: string) => Promise<void>;
  dismissDeload: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  restoreBackup: (data: unknown) => Promise<void>;
  startTimer: (timer: Omit<ActiveTimer, 'id' | 'startedAt'>) => Promise<void>;
  stopTimer: () => Promise<number | null>;
}

async function readAll() {
  const [sessions, exercises, settings, activeTimer] = await Promise.all([
    db.sessions.orderBy('date').reverse().toArray(),
    db.exercises.toArray(),
    db.settings.get('settings'),
    db.activeTimers.get('active')
  ]);
  return { sessions, exercises, settings: { ...defaultSettings, ...settings }, activeTimer: activeTimer ?? null };
}

function assertLoggableDate(date: string): void {
  if (!isLoggableDate(date)) throw new Error('Sessions können nicht in der Zukunft liegen.');
}

function byDateDescending(a: Session, b: Session): number {
  return b.date.localeCompare(a.date);
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  sessions: [],
  exercises: [],
  settings: defaultSettings,
  activeTimer: null,
  initialize: async () => {
    await seedDatabase();
    set({ ...(await readAll()), ready: true });
  },
  addSession: async (session) => {
    assertLoggableDate(session.date);
    await db.sessions.add(session);
    set({ sessions: [session, ...get().sessions].sort(byDateDescending) });
  },
  updateSession: async (id, patch) => {
    if (patch.date !== undefined) assertLoggableDate(patch.date);
    await db.sessions.update(id, patch);
    set({ sessions: get().sessions.map((session) => session.id === id ? { ...session, ...patch } : session).sort(byDateDescending) });
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
    await seedDatabase();
    set(await readAll());
  },
  startTimer: async (timer) => {
    const activeTimer: ActiveTimer = { ...timer, id: 'active', startedAt: Date.now() };
    await db.activeTimers.put(activeTimer);
    set({ activeTimer });
  },
  stopTimer: async () => {
    const timer = get().activeTimer;
    if (!timer) return null;
    const elapsed = Math.max(0, Math.round((Date.now() - timer.startedAt) / 10) / 100);
    await db.activeTimers.delete('active');
    set({ activeTimer: null });
    return elapsed;
  }
}));
