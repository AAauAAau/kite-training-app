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

// Aktiviert sich, sobald content/en.ts und content/fr.ts befüllt sind (Spec-Phasen 5–6):
// jede Übungs-ID hat einen en/fr-Namen (oder steht in einer bewussten Fallback-Allowlist),
// alle Templates, Mobility-Checklisten und Board-Off-Stufen sind vollständig übersetzt.
describe.todo('content/en and content/fr are complete against the seed');
