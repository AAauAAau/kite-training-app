import { describe, expect, it } from 'vitest';
import type { Exercise, Session, Settings } from '../types';
import { autoregulatedKg, comebackState, deloadDue, lastLoggedSet, nextTarget, rollingLoad7d, schedule, sessionLoad, sprintWeek, startingTarget, strengthWarnings, weeklyStrengthWarning } from './training';

const exercise: Exercise = { id: 'deadlift', name: 'Deadlift', category: 'strength', metric: 'weight_reps', incrementKg: 2.5 };
const settings = { loadThreshold7d: 10 } as Settings;

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(), date: '2026-08-25', type: 'A', entries: [], createdAt: 1, ...overrides
  };
}

describe('sessionLoad', () => {
  it.each([
    ['A', 2], ['B', 2], ['SPRINT', 2], ['RINGS', 1.5], ['KB', 1.5], ['PADEL', 1.5], ['BOARD_OFF', 1], ['MOBILITY', 0], ['OTHER', 1.5]
  ] as const)('%s = %s', (type, load) => expect(sessionLoad(session({ type }))).toBe(load));
  it.each([['chill', 1], ['normal', 1.5], ['hard', 2]] as const)('KITE %s = %s', (intensity, load) =>
    expect(sessionLoad(session({ type: 'KITE', intensity }))).toBe(load));
  it('does not derive kite load from wind strength', () => {
    expect(sessionLoad(session({ type: 'KITE', intensity: 'chill', kite: { wind: 'stark' } }))).toBe(1);
    expect(sessionLoad(session({ type: 'KITE', intensity: 'hard', kite: { wind: 'leicht' } }))).toBe(2);
  });
  it.each([['chill', 1], ['normal', 1.5], ['hard', 2]] as const)('RINGS %s = %s', (intensity, load) =>
    expect(sessionLoad(session({ type: 'RINGS', intensity }))).toBe(load));
  it('keeps old RINGS sessions at 1.5', () => expect(sessionLoad(session({ type: 'RINGS' }))).toBe(1.5));
  it('uses the manually selected load for other activities', () => expect(sessionLoad(session({ type: 'OTHER', manualLoad: 2.5 }))).toBe(2.5));
  it('does not add load for an attached hip routine', () => {
    expect(sessionLoad(session({ type: 'KITE', intensity: 'normal', mobilityDone: ['hip-flexor-stretch', 'hip-glute-bridge'] }))).toBe(1.5);
  });
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

  it('counts multiple kite sessions on the same day', () => {
    const sessions = [
      session({ date: '2026-08-25', type: 'KITE', intensity: 'chill' }),
      session({ date: '2026-08-25', type: 'KITE', intensity: 'hard' })
    ];
    expect(rollingLoad7d(sessions, '2026-08-25')).toBe(3);
  });

  it('recomputes after a session date is edited', () => {
    const original = session({ date: '2026-08-18', type: 'KITE', intensity: 'hard' });
    expect(rollingLoad7d([original], '2026-08-25')).toBe(0);
    expect(rollingLoad7d([{ ...original, date: '2026-08-25' }], '2026-08-25')).toBe(2);
  });
});

describe('deloadDue', () => {
  it('triggers after three wrecked sessions in sequence', () => {
    const sessions = [1, 2, 3].map((createdAt) => session({ createdAt, feel: 'wrecked' }));
    expect(deloadDue(sessions, settings, '2026-08-25').due).toBe(true);
  });
  it('triggers above the configured rolling load threshold', () => {
    const sessions = ['19', '20', '21', '22', '23', '24'].map((day) => session({ date: `2026-08-${day}`, type: 'KITE', intensity: 'hard' }));
    expect(deloadDue(sessions, settings, '2026-08-25').reason).toContain('12.0');
  });
  it('does not trigger at the exact threshold', () => {
    const sessions = [1, 2, 3, 4, 5].map((createdAt) => session({ createdAt, feel: 'good' }));
    expect(deloadDue(sessions, settings, '2026-08-25').due).toBe(false);
  });
  it('lets a backfilled session interrupt a wrecked sequence chronologically', () => {
    const sessions = [
      session({ date: '2026-08-23', feel: 'wrecked', createdAt: 1 }),
      session({ date: '2026-08-25', feel: 'wrecked', createdAt: 2 }),
      session({ date: '2026-08-26', feel: 'wrecked', createdAt: 3 }),
      session({ date: '2026-08-24', feel: 'good', createdAt: 99 })
    ];
    expect(deloadDue(sessions, { loadThreshold7d: 99 }, '2026-08-26').due).toBe(false);
  });
  it('lets a backfilled session establish a wrecked sequence chronologically', () => {
    const sessions = [
      session({ date: '2026-08-22', feel: 'good', createdAt: 1 }),
      session({ date: '2026-08-24', feel: 'wrecked', createdAt: 2 }),
      session({ date: '2026-08-25', feel: 'wrecked', createdAt: 3 }),
      session({ date: '2026-08-23', feel: 'wrecked', createdAt: 99 })
    ];
    expect(deloadDue(sessions, { loadThreshold7d: 99 }, '2026-08-25').reason).toContain('Drei Einheiten');
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
  it('never proposes added weight when progression is disabled', () => {
    const endurance: Exercise = { ...exercise, id: 'back-extension', incrementKg: 0 };
    const sessions = [session({ entries: [{ exerciseId: endurance.id, sets: [{ kg: 10, reps: 15 }] }] })];
    expect(nextTarget(endurance.id, sessions, [endurance])).toBeNull();
  });
  it('uses the latest training date instead of the latest insertion', () => {
    const sessions = [
      session({ date: '2026-08-27', createdAt: 1, entries: [{ exerciseId: 'deadlift', sets: [{ kg: 110, successful: true }] }] }),
      session({ date: '2026-08-24', createdAt: 99, entries: [{ exerciseId: 'deadlift', sets: [{ kg: 100, successful: true }] }] })
    ];
    expect(nextTarget('deadlift', sessions, [exercise])?.kg).toBe(112.5);
    expect(lastLoggedSet('deadlift', sessions)?.kg).toBe(110);
  });
  it('does not use createdAt to reorder sessions sharing a date', () => {
    const sessions = [
      session({ createdAt: 99, entries: [{ exerciseId: 'deadlift', sets: [{ kg: 100, successful: true }] }] }),
      session({ createdAt: 1, entries: [{ exerciseId: 'deadlift', sets: [{ kg: 110, successful: true }] }] })
    ];
    expect(nextTarget('deadlift', sessions, [exercise])?.kg).toBe(112.5);
  });
});

describe('comebackState', () => {
  it('is inactive without any strength history', () => {
    expect(comebackState([], '2026-08-25')).toMatchObject({ active: false, daysSinceLast: null });
  });
  it('is inactive after a short break', () => {
    const sessions = [session({ date: '2026-08-11', type: 'A' })];
    expect(comebackState(sessions, '2026-08-25')).toMatchObject({ active: false, daysSinceLast: 14 });
  });
  it('stays inactive at exactly 21 days', () => {
    const sessions = [session({ date: '2026-08-04', type: 'A' })];
    expect(comebackState(sessions, '2026-08-25').active).toBe(false);
  });
  it('activates past 21 days and reports the week count', () => {
    const sessions = [session({ date: '2026-08-03', type: 'B' })];
    const state = comebackState(sessions, '2026-08-25');
    expect(state).toMatchObject({ active: true, daysSinceLast: 22, factor: 0.8 });
    expect(state.reason).toContain('3 Wochen');
  });
  it('ignores kite and sprint sessions in the gap', () => {
    const sessions = [
      session({ date: '2026-08-01', type: 'A' }),
      session({ date: '2026-08-20', type: 'KITE', intensity: 'hard' }),
      session({ date: '2026-08-22', type: 'SPRINT' })
    ];
    expect(comebackState(sessions, '2026-08-25').active).toBe(true);
  });
  it('uses the passed session date, not insertion order', () => {
    const sessions = [
      session({ date: '2026-07-01', type: 'A', createdAt: 1 }),
      session({ date: '2026-08-24', type: 'A', createdAt: 99 })
    ];
    expect(comebackState(sessions, '2026-07-15').active).toBe(false);
    expect(comebackState(sessions, '2026-08-25').active).toBe(false);
  });
});

describe('startingTarget', () => {
  it('matches nextTarget when there is no break', () => {
    const sessions = [session({ date: '2026-08-24', entries: [{ exerciseId: 'deadlift', sets: [{ kg: 100, reps: 5, successful: true }] }] })];
    expect(startingTarget('deadlift', sessions, [exercise], '2026-08-25')?.kg).toBe(102.5);
  });
  it('reduces to a rounded share of the last working weight after a break', () => {
    const sessions = [session({ date: '2026-07-20', entries: [{ exerciseId: 'deadlift', sets: [{ kg: 100, reps: 5, successful: true }] }] })];
    const start = startingTarget('deadlift', sessions, [exercise], '2026-08-25');
    expect(start?.kg).toBe(80);
    expect(start?.successful).toBeUndefined();
  });
  it('ignores failed attempts when picking the weight to reduce', () => {
    const sessions = [
      session({ date: '2026-07-18', entries: [{ exerciseId: 'deadlift', sets: [{ kg: 100, successful: true }] }] }),
      session({ date: '2026-07-19', entries: [{ exerciseId: 'deadlift', sets: [{ kg: 102.5, successful: false }, { kg: 102.5, successful: false }] }] })
    ];
    expect(startingTarget('deadlift', sessions, [exercise], '2026-08-25')?.kg).toBe(80);
  });
  it('rounds to the exercise increment', () => {
    const swing: Exercise = { id: 'kb-swing', name: 'KB Swing', category: 'strength', metric: 'weight_reps', incrementKg: 4 };
    const sessions = [session({ date: '2026-07-20', entries: [{ exerciseId: 'kb-swing', sets: [{ kg: 30, successful: true }] }] })];
    expect(startingTarget('kb-swing', sessions, [swing], '2026-08-25')?.kg).toBe(24);
  });
  it('returns null for a non-progressing exercise even during a break', () => {
    const endurance: Exercise = { ...exercise, id: 'back-extension', incrementKg: 0 };
    const sessions = [session({ date: '2026-07-20', entries: [{ exerciseId: endurance.id, sets: [{ kg: 10, reps: 15 }] }] })];
    expect(startingTarget(endurance.id, sessions, [endurance], '2026-08-25')).toBeNull();
  });
});

describe('autoregulatedKg', () => {
  const swing: Exercise = { id: 'kb-swing', name: 'KB Swing', category: 'strength', metric: 'weight_reps', incrementKg: 4 };
  it('leaves the weight untouched for "ok"', () => {
    expect(autoregulatedKg(120, 'ok', exercise)).toBe(120);
  });
  it('shifts by ~7.5% rounded to the increment', () => {
    expect(autoregulatedKg(120, 'easy', exercise)).toBe(130);
    expect(autoregulatedKg(120, 'hard', exercise)).toBe(110);
  });
  it('rounds to a coarse increment', () => {
    expect(autoregulatedKg(32, 'easy', swing)).toBe(36);
    expect(autoregulatedKg(32, 'hard', swing)).toBe(28);
  });
  it('can round back to the base weight when the load is very light', () => {
    expect(autoregulatedKg(8, 'easy', swing)).toBe(8);
    expect(autoregulatedKg(8, 'hard', swing)).toBe(8);
  });
});

describe('sprintWeek', () => {
  it('is derived from completed sprint sessions and caps at week 6', () => {
    expect(sprintWeek([])).toBe(1);
    expect(sprintWeek(Array.from({ length: 9 }, () => session({ type: 'SPRINT' })))).toBe(6);
  });
});

describe('training warnings', () => {
  it('warns for Tag A on the day after a hard kite session', () => {
    const sessions = [session({ date: '2026-08-24', type: 'KITE', intensity: 'hard' })];
    expect(strengthWarnings('A', '2026-08-25', sessions)[0]).toContain('Rücken ist von gestern');
    expect(strengthWarnings('B', '2026-08-25', sessions)).toEqual([]);
  });

  it('flags a KB-only strength week', () => {
    expect(weeklyStrengthWarning('2026-08-25', [session({ type: 'KB' })])).toContain('keine schwere Beinarbeit');
    expect(weeklyStrengthWarning('2026-08-25', [session({ type: 'KB' }), session({ type: 'A' })])).toBeNull();
  });
});

describe('schedule', () => {
  const scheduleSettings = { ...settings, hamburgDays: [2, 3, 4] };

  it('plans exactly one rings-or-KB slot', () => {
    const plan = schedule('2026-08-24', [], scheduleSettings);
    expect(plan.filter((item) => item.type === 'RINGS' || item.type === 'KB')).toHaveLength(1);
  });

  it('keeps one circuit slot even when every weekday is configured for Hamburg', () => {
    const plan = schedule('2026-08-24', [], { ...scheduleSettings, hamburgDays: [0, 1, 2, 3, 4, 5, 6] });
    expect(plan.filter((item) => item.type === 'RINGS' || item.type === 'KB')).toHaveLength(1);
  });

  it('turns the shared slot into KB when KB was logged that week', () => {
    const plan = schedule('2026-08-24', [session({ date: '2026-08-24', type: 'KB' })], scheduleSettings);
    expect(plan.filter((item) => item.type === 'RINGS' || item.type === 'KB').map((item) => item.type)).toEqual(['KB']);
  });

  it('places the shared slot using the latest training date, not insertion order', () => {
    const plan = schedule('2026-08-24', [
      session({ date: '2026-08-27', type: 'RINGS', createdAt: 1 }),
      session({ date: '2026-08-24', type: 'KB', createdAt: 99 })
    ], scheduleSettings);
    expect(plan.find((item) => item.type === 'RINGS' || item.type === 'KB')).toMatchObject({ date: '2026-08-27', type: 'RINGS' });
  });
});
