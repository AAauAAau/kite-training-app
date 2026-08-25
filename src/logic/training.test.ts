import { describe, expect, it } from 'vitest';
import type { Exercise, Session, Settings } from '../types';
import { deloadDue, nextTarget, rollingLoad7d, sessionLoad, sprintWeek } from './training';

const exercise: Exercise = { id: 'deadlift', name: 'Deadlift', category: 'strength', metric: 'weight_reps', incrementKg: 2.5 };
const settings = { loadThreshold7d: 10 } as Settings;

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(), date: '2026-08-25', type: 'A', entries: [], createdAt: 1, ...overrides
  };
}

describe('sessionLoad', () => {
  it.each([
    ['A', 2], ['B', 2], ['SPRINT', 2], ['RINGS', 1.5], ['KB', 1.5], ['PADEL', 1.5], ['BOARD_OFF', 1], ['MOBILITY', 0]
  ] as const)('%s = %s', (type, load) => expect(sessionLoad(session({ type }))).toBe(load));
  it.each([['chill', 1], ['normal', 2], ['hard', 3]] as const)('KITE %s = %s', (intensity, load) =>
    expect(sessionLoad(session({ type: 'KITE', intensity }))).toBe(load));
  it.each([['chill', 1], ['normal', 1.5], ['hard', 2]] as const)('RINGS %s = %s', (intensity, load) =>
    expect(sessionLoad(session({ type: 'RINGS', intensity }))).toBe(load));
  it('keeps old RINGS sessions at 1.5', () => expect(sessionLoad(session({ type: 'RINGS' }))).toBe(1.5));
});

describe('rollingLoad7d', () => {
  it('includes the selected day and six preceding days only', () => {
    const sessions = [
      session({ date: '2026-08-18', type: 'KITE', intensity: 'hard' }),
      session({ date: '2026-08-20', type: 'RINGS' }),
      session({ date: '2026-08-25', type: 'A' }),
      session({ date: '2026-08-26', type: 'A' })
    ];
    expect(rollingLoad7d(sessions, '2026-08-25')).toBe(3.5);
  });
});

describe('deloadDue', () => {
  it('triggers after three wrecked sessions in sequence', () => {
    const sessions = [1, 2, 3].map((createdAt) => session({ createdAt, feel: 'wrecked' }));
    expect(deloadDue(sessions, settings, '2026-08-25').due).toBe(true);
  });
  it('triggers above the configured rolling load threshold', () => {
    const sessions = [1, 2, 3, 4].map((day) => session({ date: `2026-08-2${day}`, type: 'KITE', intensity: 'hard' }));
    expect(deloadDue(sessions, settings, '2026-08-25').reason).toContain('12.0');
  });
  it('does not trigger at the exact threshold', () => {
    const sessions = [1, 2, 3, 4, 5].map((createdAt) => session({ createdAt, feel: 'good' }));
    expect(deloadDue(sessions, settings, '2026-08-25').due).toBe(false);
  });
});

describe('nextTarget', () => {
  it('returns null without history', () => expect(nextTarget('deadlift', [], [exercise])).toBeNull());
  it('adds the configured increment to the last successful weight', () => {
    const sessions = [session({ entries: [{ exerciseId: 'deadlift', sets: [{ kg: 100, reps: 5, successful: true }] }] })];
    expect(nextTarget('deadlift', sessions, [exercise])?.kg).toBe(102.5);
  });
  it('resets to rounded 90% after two consecutive failures', () => {
    const sessions = [
      session({ date: '2026-08-20', entries: [{ exerciseId: 'deadlift', sets: [{ kg: 100, successful: true }] }] }),
      session({ date: '2026-08-21', entries: [{ exerciseId: 'deadlift', sets: [{ kg: 102.5, successful: false }] }] }),
      session({ date: '2026-08-22', entries: [{ exerciseId: 'deadlift', sets: [{ kg: 102.5, successful: false }] }] })
    ];
    expect(nextTarget('deadlift', sessions, [exercise])?.kg).toBe(90);
  });
});

describe('sprintWeek', () => {
  it('is derived from completed sprint sessions and caps at week 6', () => {
    expect(sprintWeek([])).toBe(1);
    expect(sprintWeek(Array.from({ length: 9 }, () => session({ type: 'SPRINT' })))).toBe(6);
  });
});
