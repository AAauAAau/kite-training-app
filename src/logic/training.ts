import type { Exercise, PlannedSession, Session, SetLog, Settings } from '../types';
import { addDays, localDate, startOfWeek } from './date.ts';

export const lowerBackWarning = 'Rücken ist von gestern vorbelastet — Gewicht runter oder Tag B vorziehen.';
export const kbWithoutStrengthWarning = 'Diese Woche keine schwere Beinarbeit — Pop und Landung kommen aus Tag A/B.';

export function sessionLoad(session: Session): number {
  switch (session.type) {
    case 'A': case 'B': case 'SPRINT': return 2;
    case 'RINGS': return session.intensity === 'hard' ? 2 : session.intensity === 'chill' ? 1 : 1.5;
    case 'KB': case 'PADEL': return 1.5;
    case 'BOARD_OFF': return 1;
    case 'OTHER': return Math.min(3, Math.max(0.5, session.manualLoad ?? 1.5));
    case 'KITE': return session.intensity === 'hard' ? 3 : session.intensity === 'chill' ? 1 : 2;
    case 'MOBILITY': return 0;
  }
}

export function rollingLoad7d(sessions: Session[], date: string): number {
  const firstDay = addDays(date, -6);
  return sessions
    .filter((session) => session.date >= firstDay && session.date <= date)
    .reduce((sum, session) => sum + sessionLoad(session), 0);
}

export function deloadDue(
  sessions: Session[],
  settings: Pick<Settings, 'loadThreshold7d'>,
  date = localDate()
): { due: boolean; reason: string } {
  const chronological = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const lastThree = chronological.slice(-3);
  if (lastThree.length === 3 && lastThree.every((session) => session.feel === 'wrecked')) {
    return { due: true, reason: 'Drei Einheiten in Folge fühlten sich komplett leer an.' };
  }
  const load = rollingLoad7d(sessions, date);
  if (load > settings.loadThreshold7d) {
    return { due: true, reason: `7-Tage-Last ${load.toFixed(1)} liegt über deinem Limit ${settings.loadThreshold7d}.` };
  }
  return { due: false, reason: '' };
}

export function sprintWeek(sessions: Session[]): number {
  return Math.min(6, sessions.filter((session) => session.type === 'SPRINT').length + 1);
}

export function sprintPrescription(week: number): { distance: number; intensity: string } {
  if (week <= 2) return { distance: 60, intensity: '~70 %' };
  if (week <= 4) return { distance: 40, intensity: '~85 %' };
  return { distance: 30, intensity: 'nahe max · 2–3 min Pause' };
}

function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

export function nextTarget(
  exerciseId: string,
  sessions: Session[],
  exercises: Exercise[]
): SetLog | null {
  const exercise = exercises.find((item) => item.id === exerciseId);
  if (exercise?.incrementKg === 0) return null;
  const increment = exercise?.incrementKg ?? 2.5;
  const attempts = [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .flatMap((session) => session.entries)
    .filter((entry) => entry.exerciseId === exerciseId)
    .flatMap((entry) => entry.sets)
    .filter((set): set is SetLog & { kg: number } => typeof set.kg === 'number');

  if (attempts.length === 0) return null;
  const successful = [...attempts].reverse().find((set) => set.successful !== false);
  if (!successful) return null;
  const twoFailures = attempts.length >= 2 && attempts.slice(-2).every((set) => set.successful === false);
  return {
    ...successful,
    kg: twoFailures
      ? roundToIncrement(successful.kg * 0.9, increment)
      : roundToIncrement(successful.kg + increment, increment),
    successful: true
  };
}

export function lastLoggedSet(exerciseId: string, sessions: Session[]): SetLog | null {
  const ordered = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  for (const session of ordered) {
    const entry = session.entries.find((item) => item.exerciseId === exerciseId);
    if (entry?.sets.length) return entry.sets.at(-1) ?? null;
  }
  return null;
}

export function sprintWarnings(date: string, sessions: Session[]): string[] {
  const warnings: string[] = [];
  if (sessions.some((session) => session.date === date && session.type === 'A')) {
    warnings.push('Am selben Tag ist bereits Tag A mit Kreuzheben geloggt.');
  }
  if (sessions.some((session) => session.date === addDays(date, -1) && session.type === 'KITE' && session.intensity === 'hard')) {
    warnings.push('Gestern war ein harter Kitetag. Hamstrings und Landebelastung sind noch frisch.');
  }
  return warnings;
}

export function strengthWarnings(type: Session['type'], date: string, sessions: Session[]): string[] {
  if (type !== 'A') return [];
  return sessions.some((session) =>
    session.date === addDays(date, -1) && session.type === 'KITE' && session.intensity === 'hard'
  ) ? [lowerBackWarning] : [];
}

export function weeklyStrengthWarning(date: string, sessions: Session[]): string | null {
  const firstDay = startOfWeek(date);
  const lastDay = addDays(firstDay, 6);
  const week = sessions.filter((session) => session.date >= firstDay && session.date <= lastDay);
  return week.some((session) => session.type === 'KB') &&
    !week.some((session) => session.type === 'A' || session.type === 'B')
    ? kbWithoutStrengthWarning
    : null;
}

export function schedule(weekStart: string, sessions: Session[], settings: Settings): PlannedSession[] {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const hamburgDates = days.filter((date) => settings.hamburgDays.includes(new Date(`${date}T12:00:00`).getDay()));
  const strengthDates = [hamburgDates[0], hamburgDates.at(-1)].filter((date, index, all): date is string =>
    Boolean(date) && all.indexOf(date) === index
  );
  const flensburgDates = days.filter((date) => !hamburgDates.includes(date));
  const homeDates = flensburgDates.length
    ? flensburgDates
    : days.filter((date) => !strengthDates.includes(date));
  const planned: Omit<PlannedSession, 'overriddenByKite' | 'completed'>[] = [];
  if (strengthDates[0]) planned.push({ date: strengthDates[0], type: 'A', location: 'Gym' });
  if (strengthDates[1]) planned.push({ date: strengthDates[1], type: 'B', location: 'Gym' });
  const flexDay = homeDates.find((date) => date > (strengthDates.at(-1) ?? weekStart)) ?? homeDates[0] ?? days.at(-1);
  const weekEnd = addDays(weekStart, 6);
  const loggedAlternative = sessions
    .filter((session) => session.date >= weekStart && session.date <= weekEnd && (session.type === 'KB' || session.type === 'RINGS'))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const circuitDay = loggedAlternative?.date ?? flexDay;
  if (circuitDay) planned.push({ date: circuitDay, type: loggedAlternative?.type === 'KB' ? 'KB' : 'RINGS', location: 'Zuhause' });
  const sprintDay = homeDates.find((date) => date !== circuitDay);
  if (sprintDay && sprintWeek(sessions) <= 6) planned.push({ date: sprintDay, type: 'SPRINT', location: 'Zuhause' });
  return planned
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      ...item,
      overriddenByKite: sessions.some((session) => session.date === item.date && session.type === 'KITE'),
      completed: sessions.some((session) => session.date === item.date && session.type === item.type)
    }));
}
