import { describe, expect, it } from 'vitest';
import { exercises, templates } from '../data/seed';
import type { Exercise } from '../types';
import { alternativesFor, groupByEquipment } from './substitution';

const fixture: Exercise[] = [
  { id: 'a', name: 'Zebra', category: 'strength', metric: 'weight_reps', pattern: 'hinge', equipment: 'barbell' },
  { id: 'b', name: 'Alpha', category: 'strength', metric: 'weight_reps', pattern: 'hinge', equipment: 'dumbbell' },
  { id: 'c', name: 'Mango', category: 'strength', metric: 'weight_reps', pattern: 'hinge', equipment: 'kettlebell' },
  { id: 'd', name: 'Delta', category: 'strength', metric: 'weight_reps', pattern: 'squat', equipment: 'barbell' },
  { id: 'e', name: 'Echo', category: 'strength', metric: 'reps', equipment: 'bodyweight' }
];

describe('alternativesFor', () => {
  it('returns only exercises with the same movement pattern', () => {
    expect(alternativesFor('a', fixture).map((exercise) => exercise.id)).toEqual(['b', 'c']);
  });

  it('never includes the source exercise itself', () => {
    expect(alternativesFor('a', fixture).some((exercise) => exercise.id === 'a')).toBe(false);
  });

  it('excludes exercises already used in the session', () => {
    expect(alternativesFor('a', fixture, ['b']).map((exercise) => exercise.id)).toEqual(['c']);
  });

  it('sorts alternatives alphabetically by name', () => {
    expect(alternativesFor('c', fixture).map((exercise) => exercise.name)).toEqual(['Alpha', 'Zebra']);
  });

  it('returns an empty list for an unknown id or an exercise without a pattern', () => {
    expect(alternativesFor('missing', fixture)).toEqual([]);
    expect(alternativesFor('e', fixture)).toEqual([]);
  });
});

describe('groupByEquipment', () => {
  it('groups in a fixed equipment order and drops empty groups', () => {
    const groups = groupByEquipment(alternativesFor('a', fixture));
    expect(groups.map((group) => group.equipment)).toEqual(['dumbbell', 'kettlebell']);
    expect(groups.flatMap((group) => group.items).map((exercise) => exercise.id)).toEqual(['b', 'c']);
  });
});

describe('seed data supports substitution', () => {
  const strength = exercises.filter((exercise) => exercise.category === 'strength');
  const templatedStrengthIds = [...new Set(templates.flatMap((template) => template.exercises.map((item) => item.exerciseId)))]
    .filter((id) => exercises.find((exercise) => exercise.id === id)?.category === 'strength');

  it('gives every strength exercise a pattern and an equipment', () => {
    expect(strength.filter((exercise) => !exercise.pattern || !exercise.equipment)).toEqual([]);
  });

  it('offers at least two alternatives for every templated strength exercise', () => {
    for (const id of templatedStrengthIds) {
      expect(alternativesFor(id, exercises).length).toBeGreaterThanOrEqual(2);
    }
  });
});
