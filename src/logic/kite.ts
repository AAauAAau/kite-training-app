import type { KiteBoard, KiteWind, Session } from '../types';

export interface KiteSeasonStats {
  sessions: number;
  wind: Record<KiteWind, number>;
  windUnknown: number;
  board: Record<KiteBoard, number>;
  boardUnknown: number;
  focus: { tag: string; count: number }[];
  focusUnknown: number;
}

export function kiteSeasonStats(sessions: Session[], year: string): KiteSeasonStats {
  const kiteSessions = sessions.filter((session) => session.type === 'KITE' && session.date.startsWith(`${year}-`));
  const wind: Record<KiteWind, number> = { leicht: 0, mittel: 0, stark: 0 };
  const board: Record<KiteBoard, number> = { twintip: 0, foil: 0, directional: 0 };
  const focusCounts = new Map<string, number>();
  let windUnknown = 0;
  let boardUnknown = 0;
  let focusUnknown = 0;

  kiteSessions.forEach((session) => {
    if (session.kite?.wind) wind[session.kite.wind] += 1;
    else windUnknown += 1;
    if (session.kite?.board) board[session.kite.board] += 1;
    else boardUnknown += 1;
    if (session.kite?.focus?.length) {
      new Set(session.kite.focus).forEach((tag) => focusCounts.set(tag, (focusCounts.get(tag) ?? 0) + 1));
    } else {
      focusUnknown += 1;
    }
  });

  return {
    sessions: kiteSessions.length,
    wind,
    windUnknown,
    board,
    boardUnknown,
    focus: [...focusCounts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'de')),
    focusUnknown
  };
}
