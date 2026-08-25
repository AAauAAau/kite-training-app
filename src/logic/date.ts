export function localDate(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, amount: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localDate(date);
}

export function startOfWeek(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const distance = (date.getDay() + 6) % 7;
  return addDays(isoDate, -distance);
}

export function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .format(new Date(`${isoDate}T12:00:00`));
}
