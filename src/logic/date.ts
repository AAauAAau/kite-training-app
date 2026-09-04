import type { Session } from '../types';

export function localDate(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function isLoggableDate(isoDate: string, today = localDate()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || isoDate > today) return false;
  const parsed = new Date(`${isoDate}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && localDate(parsed) === isoDate;
}

export function isBackfilledSession(session: Pick<Session, 'date' | 'createdAt'>): boolean {
  return session.date < localDate(new Date(session.createdAt));
}

export function addDays(isoDate: string, amount: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localDate(date);
}

export function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  const from = new Date(`${fromIsoDate}T12:00:00`).getTime();
  const to = new Date(`${toIsoDate}T12:00:00`).getTime();
  return Math.round((to - from) / 86_400_000);
}

export function startOfWeek(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const distance = (date.getDay() + 6) % 7;
  return addDays(isoDate, -distance);
}

export function formatShortDate(isoDate: string, locale = 'de-DE'): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })
    .format(new Date(`${isoDate}T12:00:00`));
}

/** Kurze Wochentagsnamen Montag→Sonntag in der übergebenen Locale (für die Gym-Tage-Auswahl). */
export function weekdayLabels(locale = 'de-DE'): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // 2024-01-01 ist ein Montag.
  return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(Date.UTC(2024, 0, 1 + index))));
}
