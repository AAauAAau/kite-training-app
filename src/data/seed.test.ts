import { describe, expect, it } from 'vitest';
import { exercises, mobilityChecklists, templates } from './seed';

describe('training seed', () => {
  it('contains A, B, rings and KB templates', () => {
    expect(templates.map((template) => template.type)).toEqual(['A', 'B', 'RINGS', 'KB']);
  });

  it('prescribes the KB circuit exactly and replaces the bilateral carry', () => {
    const kb = templates.find((template) => template.type === 'KB')!;
    expect(kb.exercises.map(({ exerciseId, sets, defaultReps }) => [exerciseId, sets, defaultReps])).toEqual([
      ['kb-swing', 5, 10], ['kb-clean-press', 4, 5], ['kb-windmill', 3, 5]
    ]);
    const tagA = templates.find((template) => template.type === 'A')!;
    expect(tagA.exercises.some((item) => item.exerciseId === 'suitcase-carry')).toBe(true);
    expect(exercises.find((exercise) => exercise.id === 'suitcase-carry')?.perSide).toBe(true);
    expect(exercises.some((exercise) => exercise.id === 'farmers-carry')).toBe(false);
  });

  it('keeps lower-back endurance unweighted and both distinct plank patterns', () => {
    expect(exercises.find((exercise) => exercise.id === 'back-extension-45')?.incrementKg).toBe(0);
    const tagB = templates.find((template) => template.type === 'B')!;
    expect(tagB.exercises.map((item) => item.exerciseId)).toEqual(expect.arrayContaining(['side-plank', 'copenhagen-plank']));
  });

  it('contains no spinal-flexion blacklist exercise', () => {
    const names = exercises.map((exercise) => exercise.name.toLowerCase()).join(' ');
    expect(names).not.toMatch(/sit[- ]?ups?|crunch|russian twist/);
  });

  it('gives every time exercise a timer mode', () => {
    expect(exercises.filter((exercise) => exercise.metric === 'time' && !exercise.timer)).toEqual([]);
  });

  it('provides a count-up stopwatch for every sprint set', () => {
    expect(exercises.find((exercise) => exercise.id === 'sprint')?.timer?.mode).toBe('countup');
  });

  it('defines the morning routine as a seven-minute checklist', () => {
    const morning = mobilityChecklists.find((template) => template.variant === 'morning');
    expect(morning?.durationMin).toBe(7);
    expect(morning?.items).toHaveLength(6);
  });
});
