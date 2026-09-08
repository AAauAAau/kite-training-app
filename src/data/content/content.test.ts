import { describe, expect, it } from 'vitest';
import { boardOffLevels, exercises, mobilityChecklists, templates } from '../seed';
import { content as de } from './de';
import { content as en } from './en';
import { content as fr } from './fr';

const seedExerciseIds = new Set(exercises.map((exercise) => exercise.id));
const seedTemplateTypes = new Set(templates.map((template) => template.type));
const seedMobilityVariants = new Set(mobilityChecklists.map((checklist) => checklist.variant));
const seedBoardOffLevels = new Set(boardOffLevels.map((level) => String(level.level)));

describe('content/de mirrors the seed', () => {
  it('has an entry for every seed exercise, template, mobility checklist and board-off level', () => {
    expect(Object.keys(de.exercises).sort()).toEqual([...seedExerciseIds].sort());
    expect(new Set(Object.keys(de.templates))).toEqual(seedTemplateTypes);
    expect(new Set(Object.keys(de.mobility))).toEqual(seedMobilityVariants);
    expect(new Set(Object.keys(de.boardOff))).toEqual(seedBoardOffLevels);
  });
});

describe('content/en and content/fr reference only known ids', () => {
  it.each([['en', en], ['fr', fr]] as const)('%s never references an unknown seed id', (_lang, catalog) => {
    for (const id of Object.keys(catalog.exercises ?? {})) expect(seedExerciseIds.has(id)).toBe(true);
    for (const type of Object.keys(catalog.templates ?? {})) expect(seedTemplateTypes.has(type as never)).toBe(true);
    for (const variant of Object.keys(catalog.mobility ?? {})) expect(seedMobilityVariants.has(variant as never)).toBe(true);
    for (const level of Object.keys(catalog.boardOff ?? {})) expect(seedBoardOffLevels.has(level)).toBe(true);
  });
});

describe('content/en is complete against the seed', () => {
  const nonEmpty = (value: unknown) => typeof value === 'string' && value.length > 0;

  it('translates the name of every seed exercise', () => {
    const missing = exercises.filter((exercise) => !nonEmpty(en.exercises?.[exercise.id]?.name));
    expect(missing.map((exercise) => exercise.id)).toEqual([]);
  });

  it('translates every template title, subtitle and note', () => {
    for (const template of templates) {
      const entry = en.templates?.[template.type];
      expect(nonEmpty(entry?.title) && nonEmpty(entry?.subtitle)).toBe(true);
      for (const item of template.exercises) {
        if (item.note) expect(nonEmpty(entry?.notes?.[item.exerciseId])).toBe(true);
      }
    }
  });

  it('translates every mobility title, label and text field the seed defines', () => {
    for (const checklist of mobilityChecklists) {
      const entry = en.mobility?.[checklist.variant];
      expect(nonEmpty(entry?.title)).toBe(true);
      for (const item of checklist.items) {
        const translated = entry?.items?.[item.id];
        expect(nonEmpty(translated?.label)).toBe(true);
        for (const field of ['purpose', 'dose', 'cue', 'cueDetail'] as const) {
          if (item[field] !== undefined) expect(nonEmpty(translated?.[field])).toBe(true);
        }
      }
    }
  });

  it('translates every board-off label, gate, slot and rig-free alternative', () => {
    for (const level of boardOffLevels) {
      const entry = en.boardOff?.[String(level.level)];
      expect(nonEmpty(entry?.label) && nonEmpty(entry?.gate)).toBe(true);
      for (const slot of level.slots) {
        const translated = entry?.slots?.[slot.exerciseId];
        expect(nonEmpty(translated?.mistake) && nonEmpty(translated?.regression)).toBe(true);
        if (slot.rigFreeAlternative) {
          const rigFree = entry?.rigFree?.[slot.exerciseId];
          expect(nonEmpty(rigFree?.mistake) && nonEmpty(rigFree?.regression)).toBe(true);
        }
      }
    }
  });
});

// Aktiviert sich, sobald content/fr.ts befüllt ist (Spec-Phase 6).
describe.todo('content/fr is complete against the seed');
