import { describe, expect, it } from 'vitest';
import type { Session } from '../types';
import { kiteSeasonStats } from './kite';

function kite(overrides: Partial<Session> = {}): Session {
  return { id: crypto.randomUUID(), date: '2026-08-25', type: 'KITE', entries: [], createdAt: 1, ...overrides };
}

describe('kiteSeasonStats', () => {
  it('counts optional kite details for the requested season and keeps missing data visible', () => {
    const stats = kiteSeasonStats([
      kite({ kite: { wind: 'stark', board: 'twintip', focus: ['Kiteloop', 'Landings'] } }),
      kite({ date: '2026-07-10', kite: { wind: 'stark', board: 'foil', focus: ['Kiteloop'] } }),
      kite({ date: '2026-06-10' }),
      kite({ date: '2025-06-10', kite: { wind: 'leicht' } }),
      kite({ type: 'PADEL', kite: { wind: 'mittel' } })
    ], '2026');

    expect(stats.sessions).toBe(3);
    expect(stats.wind).toEqual({ leicht: 0, mittel: 0, stark: 2 });
    expect(stats.windUnknown).toBe(1);
    expect(stats.board).toEqual({ twintip: 1, foil: 1, directional: 0 });
    expect(stats.boardUnknown).toBe(1);
    expect(stats.focus).toEqual([{ tag: 'Kiteloop', count: 2 }, { tag: 'Landings', count: 1 }]);
    expect(stats.focusUnknown).toBe(1);
  });
});
