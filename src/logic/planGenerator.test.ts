import { describe, expect, it } from 'vitest';
import { exercises, templates } from '../data/seed';
import type { EquipmentAccess, KiteDiscipline, Session, TrainingProfile } from '../types';
import {
  DISCIPLINE_PROFILES,
  SEASON_MAINTAIN_ENTER,
  SKELETONS,
  activeTemplates,
  gentleBias,
  generateTemplates,
  seasonMode
} from './planGenerator';

const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
const patternOf = (id: string) => byId.get(id)?.pattern;

const kite = (...dates: string[]): Session[] =>
  dates.map((date, index) => ({ id: `k${index}`, date, type: 'KITE' as const, entries: [], createdAt: 0 }));

const profile = (over: Partial<TrainingProfile> = {}): TrainingProfile => ({
  equipment: 'gym',
  daysPerWeek: 2,
  discipline: 'big-air',
  createdAt: 0,
  ...over
});

const ALL_DISCIPLINES: KiteDiscipline[] = ['big-air', 'freestyle', 'wave', 'foil', 'wing'];
const ALL_TIERS: EquipmentAccess[] = ['gym', 'kettlebell', 'rings', 'none'];
const TIER_EQUIPMENT: Record<EquipmentAccess, string[]> = {
  gym: ['barbell', 'dumbbell', 'kettlebell', 'machine', 'bodyweight', 'band', 'rings'],
  kettlebell: ['kettlebell', 'bodyweight', 'band'],
  rings: ['rings', 'bodyweight', 'band'],
  none: ['bodyweight', 'band']
};

function expectedSlotCount(discipline: KiteDiscipline, skeleton: (typeof SKELETONS)[1][number]): number {
  const present = new Set(skeleton.slots.map((slot) => slot.pattern));
  const adds = skeleton.type !== 'KB' && DISCIPLINE_PROFILES[discipline].emphasis.some((pattern) => !present.has(pattern));
  return skeleton.slots.length + (adds ? 1 : 0);
}

describe('seasonMode', () => {
  it('is build without any kite history', () => {
    expect(seasonMode([], '2026-07-01')).toBe('build');
    expect(seasonMode(kite('2026-07-10'), '2026-07-01')).toBe('build'); // date before the first kite day
  });

  it('enters maintain once the window reaches the enter threshold', () => {
    const sessions = kite('2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04');
    expect(SEASON_MAINTAIN_ENTER).toBe(4);
    expect(seasonMode(sessions, '2026-06-03')).toBe('build'); // only 3 in window
    expect(seasonMode(sessions, '2026-06-04')).toBe('maintain'); // 4 in window
  });

  it('holds maintain through the hysteresis band and only exits at the exit threshold', () => {
    const sessions = kite(
      '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', // → maintain
      '2026-06-12', '2026-06-15' // 2–3 kite days in the rolling window: neither enter nor exit
    );
    expect(seasonMode(sessions, '2026-06-16')).toBe('maintain');
    // 14+ days after the last kite day the window is empty → back to build
    expect(seasonMode(sessions, '2026-07-05')).toBe('build');
  });

  it('never enters maintain on a series that stays below the threshold', () => {
    const sessions = kite('2026-06-01', '2026-06-05', '2026-06-09'); // max 3 in any 14-day window
    for (const date of ['2026-06-09', '2026-06-12', '2026-06-20']) {
      expect(seasonMode(sessions, date)).toBe('build');
    }
  });

  it('counts the 14-day window inclusively at its edge', () => {
    expect(seasonMode(kite('2026-06-01', '2026-06-02', '2026-06-03', '2026-06-14'), '2026-06-14')).toBe('maintain');
    expect(seasonMode(kite('2026-06-01', '2026-06-02', '2026-06-03', '2026-06-15'), '2026-06-15')).toBe('build');
  });

  it('is deterministic across repeated runs despite the day-by-day iteration', () => {
    const sessions = kite('2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-20');
    const first = seasonMode(sessions, '2026-06-25');
    const second = seasonMode([...sessions].reverse(), '2026-06-25');
    expect(first).toBe(second);
  });
});

describe('gentleBias', () => {
  it('is true only when preferGentle is explicitly set', () => {
    expect(gentleBias({ preferGentle: true })).toBe(true);
    expect(gentleBias({ preferGentle: false })).toBe(false);
    expect(gentleBias({})).toBe(false);
  });
});

describe('generateTemplates — structure', () => {
  it('is deterministic', () => {
    const p = profile({ daysPerWeek: 4, discipline: 'freestyle', preferGentle: true });
    expect(generateTemplates(p, 'build', exercises)).toEqual(generateTemplates(p, 'build', exercises));
  });

  it('produces one template per training day', () => {
    expect(generateTemplates(profile({ daysPerWeek: 1 }), 'build', exercises)).toHaveLength(1);
    expect(generateTemplates(profile({ daysPerWeek: 2 }), 'build', exercises).map((t) => t.type)).toEqual(['A', 'B']);
    expect(generateTemplates(profile({ daysPerWeek: 3 }), 'build', exercises).map((t) => t.type)).toEqual(['A', 'B', 'KB']);
    expect(generateTemplates(profile({ daysPerWeek: 4 }), 'build', exercises).map((t) => t.type)).toEqual(['A', 'B', 'KB', 'D']);
  });

  it('covers the four main lifts plus single-leg and core on the one-day plan', () => {
    const [day] = generateTemplates(profile({ daysPerWeek: 1 }), 'build', exercises);
    const patterns = day.exercises.map((entry) => patternOf(entry.exerciseId));
    expect(patterns).toEqual(expect.arrayContaining(['hinge', 'squat', 'pull-h', 'push-h', 'single-leg', 'core-anti-rot']));
  });

  it('never repeats a movement pattern within one template', () => {
    for (const discipline of ALL_DISCIPLINES) {
      for (const daysPerWeek of [1, 2, 3, 4] as const) {
        for (const t of generateTemplates(profile({ discipline, daysPerWeek }), 'build', exercises)) {
          const patterns = t.exercises.map((entry) => patternOf(entry.exerciseId));
          expect(new Set(patterns).size, `${discipline}/${daysPerWeek}/${t.type}`).toBe(patterns.length);
        }
      }
    }
  });

  it('fills every skeleton slot on every discipline × tier — no dropped slots', () => {
    for (const discipline of ALL_DISCIPLINES) {
      for (const daysPerWeek of [1, 2, 3, 4] as const) {
        for (const tier of ALL_TIERS) {
          const generated = generateTemplates(profile({ discipline, daysPerWeek, equipment: tier }), 'build', exercises);
          generated.forEach((t, index) => {
            const skeleton = SKELETONS[daysPerWeek][index];
            expect(t.exercises.length, `${discipline}/${daysPerWeek}/${tier}/${t.type}`).toBe(
              expectedSlotCount(discipline, skeleton)
            );
          });
        }
      }
    }
  });

  it('respects the equipment tier of every resolved exercise', () => {
    for (const tier of ALL_TIERS) {
      for (const t of generateTemplates(profile({ equipment: tier, daysPerWeek: 4 }), 'build', exercises)) {
        for (const entry of t.exercises) {
          expect(TIER_EQUIPMENT[tier], `${tier}/${entry.exerciseId}`).toContain(byId.get(entry.exerciseId)?.equipment);
        }
      }
    }
  });
});

describe('generateTemplates — preferGentle', () => {
  it('pulls the joint-sparing squat to the front and never the barbell default', () => {
    const gentle = generateTemplates(profile({ preferGentle: true }), 'build', exercises);
    const bIds = gentle[1].exercises.map((entry) => entry.exerciseId);
    expect(bIds).toContain('goblet-squat');
    expect(bIds).not.toContain('front-squat-or-stepdown');
  });

  it('keeps the barbell default without the toggle', () => {
    const standard = generateTemplates(profile(), 'build', exercises);
    expect(standard[1].exercises.map((entry) => entry.exerciseId)).toContain('front-squat-or-stepdown');
  });
});

describe('generateTemplates — discipline profiles', () => {
  it('big air marks the eccentric landing patterns with a tempo note', () => {
    const generated = generateTemplates(profile({ discipline: 'big-air', daysPerWeek: 2 }), 'build', exercises);
    const eccentric = generated.flatMap((t) => t.exercises).filter((entry) => entry.note?.includes('exzentrisch'));
    expect(eccentric.length).toBeGreaterThanOrEqual(2);
  });

  it('wave and wing drive the primary lifts into the endurance rep range', () => {
    for (const discipline of ['wave', 'wing'] as const) {
      const generated = generateTemplates(profile({ discipline, daysPerWeek: 2 }), 'build', exercises);
      expect(generated[0].exercises[0].defaultReps).toBeGreaterThanOrEqual(10);
      expect(generated[1].exercises[0].defaultReps).toBeGreaterThanOrEqual(10);
    }
  });

  it('foil produces at least one timed hold', () => {
    const generated = generateTemplates(profile({ discipline: 'foil', daysPerWeek: 2 }), 'build', exercises);
    expect(generated.flatMap((t) => t.exercises).some((entry) => entry.defaultSec !== undefined)).toBe(true);
    expect(generated.flatMap((t) => t.exercises).some((entry) => entry.exerciseId === 'wall-sit')).toBe(true);
  });

  it('freestyle adds the anti-rotation emphasis with a reactive tempo note', () => {
    const generated = generateTemplates(profile({ discipline: 'freestyle', daysPerWeek: 2 }), 'build', exercises);
    const antiRot = generated
      .flatMap((t) => t.exercises)
      .filter((entry) => patternOf(entry.exerciseId) === 'core-anti-rot');
    expect(antiRot.length).toBeGreaterThanOrEqual(1);
    expect(antiRot.some((entry) => entry.note?.includes('reaktiv'))).toBe(true);
  });

  it('the explosive circuit slots stay explosive regardless of discipline', () => {
    for (const discipline of ALL_DISCIPLINES) {
      const circuit = generateTemplates(profile({ discipline, daysPerWeek: 3 }), 'build', exercises)[2];
      expect(circuit.type).toBe('KB');
      expect(circuit.exercises[0].note).toContain('explosiv');
      expect(circuit.exercises[0].defaultReps).toBe(4);
    }
  });
});

describe('generateTemplates — season reduction', () => {
  it('drops one primary set and the last accessory slot per day in maintain', () => {
    const p = profile({ discipline: 'big-air', daysPerWeek: 2 });
    const build = generateTemplates(p, 'build', exercises);
    const maintain = generateTemplates(p, 'maintain', exercises);

    build.forEach((day, index) => {
      expect(maintain[index].exercises.length).toBe(day.exercises.length - 1);
      expect(maintain[index].exercises[0].sets).toBe(day.exercises[0].sets - 1); // day starts on a primary lift
    });
  });

  it('keeps every primary at two sets or more', () => {
    const maintain = generateTemplates(profile({ daysPerWeek: 4 }), 'maintain', exercises);
    for (const day of maintain) {
      for (const entry of day.exercises) expect(entry.sets).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('activeTemplates', () => {
  it('returns the seed templates unchanged without a profile', () => {
    expect(activeTemplates({}, [], exercises)).toBe(templates);
  });

  it('returns the seed templates for a skipped onboarding', () => {
    const settings = { trainingProfile: { skipped: true, createdAt: 0 } };
    expect(activeTemplates(settings, [], exercises)).toEqual(templates);
  });

  it('generates from the profile when one is set', () => {
    const settings = { trainingProfile: profile({ daysPerWeek: 3 }) };
    expect(activeTemplates(settings, [], exercises).map((t) => t.type)).toEqual(['A', 'B', 'KB']);
  });

  it('ignores the kite frequency when seasonAdjust is false', () => {
    const heavyKite = kite('2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06');
    const on = { trainingProfile: profile({ daysPerWeek: 2 }) };
    const off = { trainingProfile: profile({ daysPerWeek: 2, seasonAdjust: false }) };
    const date = '2026-06-06';
    // seasonAdjust on → maintain (fewer exercises); off → build
    expect(activeTemplates(off, heavyKite, exercises, date)[0].exercises.length)
      .toBeGreaterThan(activeTemplates(on, heavyKite, exercises, date)[0].exercises.length);
  });
});
