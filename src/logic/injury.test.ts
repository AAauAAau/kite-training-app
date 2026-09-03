import { describe, expect, it } from 'vitest';
import { boardOffLevels, exercises, templates } from '../data/seed';
import type { Exercise, Injury, Settings } from '../types';
import {
  applyInjuryToSlots,
  injurySafeAlternative,
  injuryState,
  isContraindicated
} from './injury';

const withInjuries = (injuries: Injury[]) => ({ injuries }) as Pick<Settings, 'injuries'>;
const slots = (type: 'A' | 'B' | 'KB') =>
  templates.find((template) => template.type === type)!.exercises.map((item) => ({ exerciseId: item.exerciseId }));

describe('injuryState', () => {
  it('returns empty state without injuries', () => {
    expect(injuryState({}, '2026-09-02')).toEqual({ blockedRegions: [], expired: [] });
    expect(injuryState(withInjuries([]), '2026-09-02')).toEqual({ blockedRegions: [], expired: [] });
  });

  it('blocks a region while the injury runs', () => {
    const state = injuryState(withInjuries([{ region: 'knee', since: '2026-08-20', until: '2026-09-10' }]), '2026-09-02');
    expect(state.blockedRegions).toEqual(['knee']);
    expect(state.expired).toEqual([]);
  });

  it('keeps filtering past the end date but flags the injury as expired', () => {
    const injury: Injury = { region: 'knee', since: '2026-08-01', until: '2026-08-20' };
    const state = injuryState(withInjuries([injury]), '2026-09-02');
    expect(state.blockedRegions).toEqual(['knee']);
    expect(state.expired).toEqual([injury]);
  });

  it('treats the end date itself as still active (inclusive)', () => {
    const state = injuryState(withInjuries([{ region: 'shoulder', since: '2026-08-01', until: '2026-09-02' }]), '2026-09-02');
    expect(state.blockedRegions).toEqual(['shoulder']);
    expect(state.expired).toEqual([]);
  });

  it('ignores an injury whose start is after the session date', () => {
    const state = injuryState(withInjuries([{ region: 'ribs', since: '2026-09-05', until: '2026-09-19' }]), '2026-09-02');
    expect(state).toEqual({ blockedRegions: [], expired: [] });
  });

  it('deduplicates regions across overlapping injuries', () => {
    const state = injuryState(withInjuries([
      { region: 'lower-back', since: '2026-08-01', until: '2026-08-15' },
      { region: 'lower-back', since: '2026-08-20', until: '2026-09-20' }
    ]), '2026-09-02');
    expect(state.blockedRegions).toEqual(['lower-back']);
    expect(state.expired.map((injury) => injury.until)).toEqual(['2026-08-15']);
  });
});

describe('isContraindicated', () => {
  it('is true only when strains and blocked regions overlap', () => {
    const squat: Exercise = { id: 's', name: 'S', category: 'strength', metric: 'weight_reps', strains: ['knee', 'lower-back'] };
    expect(isContraindicated(squat, ['knee'])).toBe(true);
    expect(isContraindicated(squat, ['shoulder'])).toBe(false);
  });

  it('is false for an exercise without strains', () => {
    const carry: Exercise = { id: 'c', name: 'C', category: 'strength', metric: 'weight_reps' };
    expect(isContraindicated(carry, ['lower-back'])).toBe(false);
  });
});

describe('injurySafeAlternative', () => {
  it('returns the first same-pattern exercise that avoids the blocked region', () => {
    // front-squat-or-stepdown → squat; back-squat still strains lower-back, goblet-squat does not
    const alternative = injurySafeAlternative('front-squat-or-stepdown', exercises, ['lower-back']);
    expect(alternative?.id).toBe('goblet-squat');
  });

  it('never returns the source or an already used exercise', () => {
    const alternative = injurySafeAlternative('barbell-row', exercises, ['lower-back'], ['seal-row']);
    expect(alternative?.id).toBe('inverted-row');
  });

  it('returns null when every alternative strains the blocked region', () => {
    expect(injurySafeAlternative('bulgarian-split-squat', exercises, ['knee'])).toBeNull();
  });

  it('returns null for an exercise without a movement pattern', () => {
    expect(injurySafeAlternative('bo-hang-hold', exercises, ['ribs'])).toBeNull();
  });
});

describe('applyInjuryToSlots', () => {
  it('leaves the slots untouched when nothing is blocked', () => {
    const input = slots('B');
    expect(applyInjuryToSlots(input, exercises, [])).toEqual({
      exerciseIds: input.map((slot) => slot.exerciseId),
      swaps: [],
      dropped: []
    });
  });

  it('swaps the spine-loaded lifts on Tag B for a lower-back injury', () => {
    const result = applyInjuryToSlots(slots('B'), exercises, ['lower-back']);
    expect(result.swaps).toEqual([
      { from: 'front-squat-or-stepdown', to: 'goblet-squat' },
      { from: 'barbell-row', to: 'seal-row' },
      { from: 'single-leg-rdl', to: 'hip-thrust' }
    ]);
    // only one safe hinge alternative exists, so the endurance back extension drops out
    expect(result.dropped).toEqual(['back-extension-45']);
    expect(result.exerciseIds).not.toContain('back-extension-45');
  });

  it('drops the knee work on Tag A when no knee-sparing alternative exists', () => {
    const result = applyInjuryToSlots(slots('A'), exercises, ['knee']);
    expect(result.swaps).toEqual([]);
    expect(result.dropped).toEqual(['bulgarian-split-squat', 'nordic-negative']);
    expect(result.exerciseIds).toEqual(['trap-bar-deadlift', 'bench-or-ohp', 'suitcase-carry']);
  });

  it('never assigns the same alternative to two blocked slots of one pattern', () => {
    const result = applyInjuryToSlots(slots('B'), exercises, ['lower-back']);
    const targets = result.swaps.map((swap) => swap.to);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('drops every trapeze-hang slot of a board-off level for a ribs injury', () => {
    const level1 = boardOffLevels.find((level) => level.level === 1)!;
    const result = applyInjuryToSlots(level1.slots.map((slot) => ({ exerciseId: slot.exerciseId })), exercises, ['ribs']);
    expect(result.swaps).toEqual([]);
    expect(result.dropped).toEqual(['bo-hang-tap', 'bo-hang-knee-raise', 'bo-dead-hang']);
    expect(result.exerciseIds).toEqual(['bo-deadbug-kb']);
  });
});
