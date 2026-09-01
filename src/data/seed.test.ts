import { describe, expect, it } from 'vitest';
import { exercises, mobilityChecklists, templates } from './seed';

describe('training seed', () => {
  it('contains A, B, rings and KB templates', () => {
    expect(templates.map((template) => template.type)).toEqual(['A', 'B', 'RINGS', 'KB']);
  });

  it('prescribes the KB circuit exactly and keeps the bilateral carry out of the templates', () => {
    const kb = templates.find((template) => template.type === 'KB')!;
    expect(kb.exercises.map(({ exerciseId, sets, defaultReps }) => [exerciseId, sets, defaultReps])).toEqual([
      ['kb-swing', 5, 10], ['kb-clean-press', 4, 5], ['kb-windmill', 3, 5]
    ]);
    const tagA = templates.find((template) => template.type === 'A')!;
    expect(tagA.exercises.some((item) => item.exerciseId === 'suitcase-carry')).toBe(true);
    expect(exercises.find((exercise) => exercise.id === 'suitcase-carry')?.perSide).toBe(true);
    // farmers-carry darf als Substitutions-Option existieren, aber in keinem Template stehen
    expect(exercises.find((exercise) => exercise.id === 'farmers-carry')?.pattern).toBe('carry');
    expect(templates.flatMap((template) => template.exercises).some((item) => item.exerciseId === 'farmers-carry')).toBe(false);
  });

  it('gives every strength template exercise a movement pattern', () => {
    const templated = [...new Set(templates.flatMap((template) => template.exercises.map((item) => item.exerciseId)))]
      .map((id) => exercises.find((exercise) => exercise.id === id))
      .filter((exercise) => exercise?.category === 'strength');
    expect(templated.filter((exercise) => !exercise?.pattern)).toEqual([]);
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
    expect(morning?.items.find((item) => item.id === 'morning-hip-flexor')?.timerSec).toBe(45);
  });

  it('provides a timer for every exercise and checklist item that prescribes seconds', () => {
    const mentionsSeconds = (value?: string) => /\d+(?:[–-]\d+)?\s*s\b/i.test(value ?? '');
    expect(exercises.filter((exercise) => mentionsSeconds(exercise.name) && !exercise.timer)).toEqual([]);
    expect(mobilityChecklists.flatMap((template) => template.items).filter((item) =>
      (mentionsSeconds(item.label) || mentionsSeconds(item.dose)) && !item.timerSec
    )).toEqual([]);
  });

  it('defines the post-session hip routine in opening-to-stability order', () => {
    const hip = mobilityChecklists.find((template) => template.variant === 'hip');
    expect(hip?.durationMin).toBe(8);
    expect(hip?.items.map((item) => item.label)).toEqual([
      'Half-Kneeling Hip Flexor Stretch',
      '90/90 Hip Switch',
      'Glute Bridge',
      'Copenhagen Plank',
      'Standing Hip Airplane'
    ]);
    expect(hip?.items.map((item) => item.dose)).toEqual([
      '2×45 s je Seite', '10 Wechsel langsam', '2×15, oben 2 s halten', '2×20–30 s je Seite', '5 je Seite'
    ]);
    expect(hip?.items.map((item) => item.timerSec)).toEqual([45, undefined, 2, 20, undefined]);
    expect(hip?.items[0].cue).toBe('Gesäß der hinteren Seite aktiv anspannen');
    expect(hip?.items[0].cueDetail).toContain('untere Rücken');
    expect(hip?.items.slice(1).map((item) => item.purpose)).toEqual([
      'Innen- und Außenrotation',
      'Aktivieren nach dem Dehnen — die neue Position muss gehalten werden können',
      'Auf Knien als Regression',
      'Balance + Rotationskontrolle'
    ]);
  });
});
