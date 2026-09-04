import { describe, expect, it } from 'vitest';
import { boardOffLevels, exercises, mobilityChecklists, templates } from '../data/seed';
import { localizeBoardOffLevel, localizeExercise, localizeMobility, localizeTemplate } from './localize';

const tagA = templates.find((template) => template.type === 'A')!;
const level1 = boardOffLevels.find((level) => level.level === 1)!;
const hip = mobilityChecklists.find((template) => template.variant === 'hip')!;

describe('localize (de = identity)', () => {
  it('returns the very same exercise object for de', () => {
    expect(localizeExercise(exercises[0], 'de')).toBe(exercises[0]);
  });

  it('returns the very same template, mobility and board-off objects for de', () => {
    expect(localizeTemplate(tagA, 'de')).toBe(tagA);
    expect(localizeMobility(hip, 'de')).toBe(hip);
    expect(localizeBoardOffLevel(level1, 'de')).toBe(level1);
  });
});

describe('localize (missing catalog falls back to the German seed)', () => {
  it('keeps the German exercise name when no translation exists', () => {
    const trapBar = exercises.find((exercise) => exercise.id === 'trap-bar-deadlift')!;
    expect(localizeExercise(trapBar, 'fr').name).toBe(trapBar.name);
  });

  it('preserves the board-off level structure and only touches text fields', () => {
    const localized = localizeBoardOffLevel(level1, 'fr');
    expect(localized.slots).toHaveLength(4);
    expect(localized.slots.map((slot) => slot.sets)).toEqual(level1.slots.map((slot) => slot.sets));
    expect(localized.slots.map((slot) => slot.needsRig)).toEqual(level1.slots.map((slot) => slot.needsRig));
    expect(localized.slots.map((slot) => slot.rigFreeAlternative?.exerciseId))
      .toEqual(level1.slots.map((slot) => slot.rigFreeAlternative?.exerciseId));
    // No French catalog yet → deep-equal to the German original.
    expect(localized).toEqual(level1);
  });

  it('keeps the template structure and German notes without a catalog', () => {
    const localized = localizeTemplate(tagA, 'fr');
    expect(localized.exercises.map((item) => item.exerciseId)).toEqual(tagA.exercises.map((item) => item.exerciseId));
    expect(localized).toEqual(tagA);
  });
});

// Aktiviert sich, sobald content/fr.ts befüllt ist (Spec-Phase 6).
describe.todo('localize (fr catalog translates label/gate/mistake/regression)');
