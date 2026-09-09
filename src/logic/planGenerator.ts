// Plan-Generator — deterministische Krafttemplates aus dem Trainingsprofil.
// Fachliche Grundlage: docs/training/plan-generator.md
// Feature-Spec: docs/features/plan-generator.md
//
// Reines Modul: gleiche Eingabe → tief-gleiche Ausgabe. Kein Gewicht in Kilogramm
// (das besitzt nextTarget/Autoregulation), keine Wochenplanung (das ist schedule()).
// Ohne Profil (oder mit skipped) liefert activeTemplates die Seed-Templates
// bit-identisch zurück.

import { templates as seedTemplates } from '../data/seed';
import type {
  Equipment,
  EquipmentAccess,
  Exercise,
  KiteDiscipline,
  MovementPattern,
  SeasonMode,
  Session,
  SessionTemplate,
  Settings,
  TemplateExercise,
  TrainingProfile
} from '../types';
import { addDays, localDate } from './date';

// ---------------------------------------------------------------------------
// Saison-Modus (Roadmap-Punkt 5, hier aufgegangen)
// ---------------------------------------------------------------------------

export const SEASON_WINDOW_DAYS = 14;
export const SEASON_MAINTAIN_ENTER = 4; // build → maintain ab so vielen Kite-Tagen im Fenster
export const SEASON_MAINTAIN_EXIT = 1; // maintain → build erst bei so wenigen

/**
 * Aufbau vs. Erhaltung, abgeleitet aus der geloggten Kite-Frequenz. Läuft iterativ
 * vom ersten Kite-Tag (Startmodus 'build') tageweise bis `date` und wendet die
 * Hysterese an — rein und deterministisch, kein persistierter Zustand.
 * Ohne Kite-Historie → 'build'.
 */
export function seasonMode(sessions: Session[], date: string = localDate()): SeasonMode {
  const kiteDates = sessions
    .filter((session) => session.type === 'KITE' && session.date <= date)
    .map((session) => session.date)
    .sort();
  if (!kiteDates.length) return 'build';

  let mode: SeasonMode = 'build';
  for (let day = kiteDates[0]; day <= date; day = addDays(day, 1)) {
    const windowStart = addDays(day, -(SEASON_WINDOW_DAYS - 1));
    const count = kiteDates.filter((d) => d >= windowStart && d <= day).length;
    if (mode === 'build' && count >= SEASON_MAINTAIN_ENTER) mode = 'maintain';
    else if (mode === 'maintain' && count <= SEASON_MAINTAIN_EXIT) mode = 'build';
  }
  return mode;
}

/** preferGentle-Schalter des Profils. Gekapselt für die Tests und die UI. */
export function gentleBias(profile: Pick<TrainingProfile, 'preferGentle'>): boolean {
  return profile.preferGentle === true;
}

// ---------------------------------------------------------------------------
// Skelette je Tagezahl
// ---------------------------------------------------------------------------

type SlotRole = 'primary' | 'accessory';
type RepProfileName = 'strength' | 'power' | 'endurance' | 'isometric';

interface PatternSlot {
  pattern: MovementPattern;
  role: SlotRole;
  sets: number;
  reps?: number;
  sec?: number;
  tempoNote?: string;
  prefer?: string[]; // Übungs-IDs, die für diesen Slot zuerst versucht werden
}

interface DaySkeleton {
  type: Extract<SessionTemplate['type'], 'A' | 'B' | 'D' | 'KB'>;
  title: string;
  subtitle: string;
  slots: PatternSlot[];
}

const CARRY_METERS = 40;

const DAY_1: DaySkeleton = {
  type: 'A',
  title: 'Ganzkörper',
  subtitle: 'Kraft · 45–60 min',
  slots: [
    { pattern: 'hinge', role: 'primary', sets: 4 },
    { pattern: 'squat', role: 'primary', sets: 4 },
    { pattern: 'pull-h', role: 'primary', sets: 4 },
    { pattern: 'push-h', role: 'accessory', sets: 3 },
    { pattern: 'single-leg', role: 'accessory', sets: 3 },
    { pattern: 'core-anti-rot', role: 'accessory', sets: 3 }
  ]
};

const DAY_A: DaySkeleton = {
  type: 'A',
  title: 'Tag A',
  subtitle: 'Push / Beine · 50–60 min',
  slots: [
    { pattern: 'hinge', role: 'primary', sets: 4 },
    { pattern: 'single-leg', role: 'accessory', sets: 3 },
    { pattern: 'push-h', role: 'primary', sets: 4 },
    { pattern: 'hamstring-curl', role: 'accessory', sets: 3 },
    { pattern: 'carry', role: 'accessory', sets: 3, reps: CARRY_METERS }
  ]
};

const DAY_B: DaySkeleton = {
  type: 'B',
  title: 'Tag B',
  subtitle: 'Zug / Landung · 50–60 min',
  slots: [
    { pattern: 'pull-v', role: 'primary', sets: 4 },
    { pattern: 'squat', role: 'primary', sets: 4 },
    { pattern: 'pull-h', role: 'accessory', sets: 3 },
    { pattern: 'hinge', role: 'accessory', sets: 3, prefer: ['single-leg-rdl', 'bodyweight-single-leg-rdl'] },
    { pattern: 'core-anti-rot', role: 'accessory', sets: 3 },
    { pattern: 'core-anti-ext', role: 'accessory', sets: 3 }
  ]
};

const DAY_KB: DaySkeleton = {
  type: 'KB',
  title: 'Circuit',
  subtitle: 'Explosiv · 30–40 min',
  slots: [
    { pattern: 'hinge', role: 'primary', sets: 5, tempoNote: 'explosiv aus der Hüfte, jede Wdh. neu' },
    { pattern: 'push-v', role: 'accessory', sets: 4, tempoNote: 'explosiv, sauberer Lockout' },
    { pattern: 'core-anti-lat', role: 'accessory', sets: 3 }
  ]
};

const DAY_D: DaySkeleton = {
  type: 'D',
  title: 'Tag D',
  subtitle: 'Beine / Rumpf II · 45–55 min',
  slots: [
    { pattern: 'single-leg', role: 'primary', sets: 4 },
    { pattern: 'pull-h', role: 'accessory', sets: 3 },
    { pattern: 'carry', role: 'accessory', sets: 3, reps: CARRY_METERS },
    { pattern: 'core-anti-ext', role: 'accessory', sets: 3 }
  ]
};

export const SKELETONS: Record<1 | 2 | 3 | 4, DaySkeleton[]> = {
  1: [DAY_1],
  2: [DAY_A, DAY_B],
  3: [DAY_A, DAY_B, DAY_KB],
  4: [DAY_A, DAY_B, DAY_KB, DAY_D]
};

// ---------------------------------------------------------------------------
// Dosierung
// ---------------------------------------------------------------------------

const EXPLOSIVE_PATTERNS: MovementPattern[] = ['squat', 'hinge', 'single-leg'];
const CIRCUIT_REPS = 4;
const MAINTAIN_MIN_SETS = 2;

/** Basis-Wiederholungen/-Sekunden je repProfile. carry-Slots sind ausgenommen. */
const REP_PROFILE: Record<RepProfileName, {
  primary: { reps?: number; sec?: number };
  accessory: { reps?: number; sec?: number };
  explosiveTempo?: string;
}> = {
  strength: { primary: { reps: 5 }, accessory: { reps: 8 } },
  power: { primary: { reps: 3 }, accessory: { reps: 5 }, explosiveTempo: 'explosiv hoch, 2 s exzentrisch' },
  endurance: { primary: { reps: 12 }, accessory: { reps: 15 } },
  // holds entstehen über die slotOverrides + exercisePrefer der Disziplin, nicht global
  isometric: { primary: { reps: 6 }, accessory: { reps: 10 } }
};

interface SlotOverride {
  pattern: MovementPattern;
  role?: SlotRole;
  sets?: number;
  reps?: number;
  sec?: number;
  tempoNote?: string;
}

interface DisciplineProfile {
  emphasis: MovementPattern[]; // 1–3, erstes = höchste Priorität
  repProfile: RepProfileName;
  eccentricPatterns: MovementPattern[]; // leer = kein Tempo-Fokus
  eccentricTempo: string;
  slotOverrides: SlotOverride[];
  exercisePrefer?: Partial<Record<MovementPattern, string[]>>;
}

export const DISCIPLINE_PROFILES: Record<KiteDiscipline, DisciplineProfile> = {
  'big-air': {
    emphasis: ['hinge', 'single-leg', 'hamstring-curl'],
    repProfile: 'strength',
    eccentricPatterns: ['squat', 'single-leg', 'hamstring-curl'],
    eccentricTempo: '3–4 s exzentrisch senken, unten nicht ablegen',
    slotOverrides: [
      { pattern: 'hamstring-curl', role: 'accessory', sets: 4, reps: 6, tempoNote: '3–4 s exzentrisch' },
      { pattern: 'squat', role: 'primary', reps: 5, tempoNote: '3–4 s exzentrisch, explosiv hoch' },
      { pattern: 'single-leg', role: 'primary', reps: 6, tempoNote: '3–4 s exzentrisch' }
    ]
  },
  freestyle: {
    emphasis: ['single-leg', 'squat', 'core-anti-rot'],
    repProfile: 'power',
    eccentricPatterns: ['squat', 'single-leg'],
    eccentricTempo: '3 s exzentrisch, dann explosiv hoch',
    slotOverrides: [
      { pattern: 'squat', role: 'primary', reps: 3, tempoNote: '3 s exzentrisch, explosiv hoch' },
      { pattern: 'single-leg', role: 'primary', reps: 4, tempoNote: '3 s exzentrisch, explosiv hoch' },
      { pattern: 'core-anti-rot', role: 'accessory', reps: 8, tempoNote: 'zügig-reaktiv, kein Zeitlupentempo' }
    ]
  },
  wave: {
    emphasis: ['pull-h', 'single-leg', 'core-anti-lat'],
    repProfile: 'endurance',
    eccentricPatterns: ['single-leg'],
    eccentricTempo: '2 s exzentrisch kontrolliert',
    slotOverrides: [
      { pattern: 'single-leg', role: 'primary', reps: 12, tempoNote: '2 s exzentrisch' },
      { pattern: 'carry', reps: 60 },
      { pattern: 'core-anti-lat', role: 'accessory', sec: 40 }
    ]
  },
  foil: {
    emphasis: ['squat', 'single-leg', 'core-anti-ext'],
    repProfile: 'isometric',
    eccentricPatterns: [],
    eccentricTempo: '',
    slotOverrides: [
      { pattern: 'squat', sec: 40, tempoNote: 'statisch, Rumpf fest' },
      { pattern: 'core-anti-ext', sec: 40, tempoNote: 'LWS flach, Rippen unten' },
      { pattern: 'single-leg', reps: 10, tempoNote: '2 s Pause unten, langsam' },
      { pattern: 'hinge', role: 'primary', reps: 5, tempoNote: 'explosiv — Anfahr-Pump' }
    ],
    exercisePrefer: { squat: ['wall-sit'], 'core-anti-ext': ['hollow-body-hold-strength'] }
  },
  wing: {
    emphasis: ['pull-h', 'carry', 'core-anti-rot'],
    repProfile: 'endurance',
    eccentricPatterns: [],
    eccentricTempo: '',
    slotOverrides: [
      { pattern: 'pull-h', role: 'primary', reps: 15, tempoNote: 'oben 1 s halten, Schulterblätter zusammen' },
      { pattern: 'carry', reps: 50, tempoNote: 'aufrecht, Rippen unten' },
      { pattern: 'core-anti-rot', role: 'accessory', reps: 12, tempoNote: 'oben 1 s halten, ruhig gegen den Zug' }
    ]
  }
};

// ---------------------------------------------------------------------------
// Übungsauswahl je Muster
// ---------------------------------------------------------------------------

/** Standard-Präferenz je Muster (kräftigste/gängigste Variante zuerst). */
const PATTERN_POOL: Record<MovementPattern, string[]> = {
  hinge: [
    'trap-bar-deadlift', 'romanian-deadlift', 'kb-swing', 'kb-deadlift', 'single-leg-rdl',
    'hip-thrust', 'back-extension-45', 'bodyweight-single-leg-rdl', 'band-pull-through'
  ],
  squat: ['front-squat-or-stepdown', 'back-squat', 'goblet-squat', 'leg-press', 'bodyweight-squat', 'wall-sit'],
  'single-leg': [
    'bulgarian-split-squat', 'reverse-lunge', 'dumbbell-step-up', 'bodyweight-split-squat',
    'pistol-squat', 'ring-split-squat'
  ],
  'push-h': ['bench-or-ohp', 'db-bench-press', 'machine-chest-press', 'weighted-pushup', 'ring-pushup'],
  'push-v': ['push-press', 'kb-clean-press', 'db-shoulder-press', 'pike-pushup', 'ring-dips'],
  'pull-v': ['weighted-pullup', 'pullup', 'lat-pulldown', 'assisted-pullup', 'band-pulldown', 'ring-pullup'],
  'pull-h': ['barbell-row', 'seal-row', 'db-row', 'inverted-row', 'ring-row'],
  carry: ['suitcase-carry', 'farmers-carry', 'front-rack-carry', 'waiter-carry', 'backpack-carry'],
  'core-anti-rot': ['pallof-press', 'bird-dog', 'dead-bug', 'plank-shoulder-tap'],
  'core-anti-lat': ['copenhagen-plank', 'side-plank', 'suitcase-hold', 'side-plank-row', 'kb-windmill'],
  'core-anti-ext': ['ab-wheel', 'hollow-body-hold-strength', 'ring-rollout', 'front-lever'],
  'hamstring-curl': ['nordic-negative', 'machine-leg-curl', 'slider-leg-curl', 'glute-ham-raise', 'ring-hamstring-curl']
};

/** Bei preferGentle nach vorn gezogene Varianten (docs/training/plan-generator.md §6). */
export const GENTLE_FIRST: Partial<Record<MovementPattern, string[]>> = {
  squat: ['goblet-squat', 'leg-press'],
  hinge: ['trap-bar-deadlift', 'kb-deadlift', 'hip-thrust'],
  'single-leg': ['dumbbell-step-up', 'reverse-lunge'],
  'push-h': ['db-bench-press', 'machine-chest-press'],
  'push-v': ['db-shoulder-press', 'kb-clean-press'],
  'pull-v': ['assisted-pullup', 'lat-pulldown'],
  'hamstring-curl': ['machine-leg-curl', 'slider-leg-curl']
};

const EQUIPMENT_TIERS: Record<EquipmentAccess, Equipment[]> = {
  gym: ['barbell', 'dumbbell', 'kettlebell', 'machine', 'bodyweight', 'band', 'rings'],
  kettlebell: ['kettlebell', 'bodyweight', 'band'],
  rings: ['rings', 'bodyweight', 'band'],
  none: ['bodyweight', 'band']
};

function orderedPool(
  slot: PatternSlot,
  dp: DisciplineProfile,
  preferGentle: boolean
): string[] {
  const base = PATTERN_POOL[slot.pattern] ?? [];
  const front: string[] = [];
  const push = (ids: string[] | undefined) => {
    for (const id of ids ?? []) if (base.includes(id) && !front.includes(id)) front.push(id);
  };
  push(slot.prefer);
  push(dp.exercisePrefer?.[slot.pattern]);
  if (preferGentle) push(GENTLE_FIRST[slot.pattern]);
  return [...front, ...base.filter((id) => !front.includes(id))];
}

function resolveSlot(
  slot: PatternSlot,
  dp: DisciplineProfile,
  allowed: Equipment[],
  preferGentle: boolean,
  used: Set<string>,
  byId: Map<string, Exercise>
): Exercise | null {
  for (const id of orderedPool(slot, dp, preferGentle)) {
    const exercise = byId.get(id);
    if (exercise?.equipment && allowed.includes(exercise.equipment) && !used.has(id)) return exercise;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Slot → Dosierung → TemplateExercise
// ---------------------------------------------------------------------------

function applyDosage(slot: PatternSlot, skeleton: DaySkeleton, dp: DisciplineProfile): PatternSlot {
  const circuitFixed = skeleton.type === 'KB' && slot.tempoNote !== undefined;
  const out: PatternSlot = { ...slot };
  const rp = REP_PROFILE[dp.repProfile];
  const roleDose = slot.role === 'primary' ? rp.primary : rp.accessory;

  if (slot.pattern !== 'carry') {
    if (roleDose.reps !== undefined) {
      out.reps = roleDose.reps;
      out.sec = undefined;
    } else if (roleDose.sec !== undefined) {
      out.sec = roleDose.sec;
      out.reps = undefined;
    }
  }

  if (rp.explosiveTempo && slot.role === 'primary' && EXPLOSIVE_PATTERNS.includes(slot.pattern) && out.tempoNote === undefined) {
    out.tempoNote = rp.explosiveTempo;
  }
  if (dp.eccentricPatterns.includes(slot.pattern) && out.tempoNote === undefined) {
    out.tempoNote = dp.eccentricTempo;
  }

  for (const override of dp.slotOverrides) {
    if (override.pattern !== slot.pattern) continue;
    if (override.role && override.role !== slot.role) continue;
    if (override.sets !== undefined) out.sets = override.sets;
    if (override.reps !== undefined) {
      out.reps = override.reps;
      out.sec = undefined;
    }
    if (override.sec !== undefined) {
      out.sec = override.sec;
      out.reps = undefined;
    }
    if (override.tempoNote !== undefined) out.tempoNote = override.tempoNote;
  }

  if (circuitFixed) {
    out.sets = slot.sets;
    out.reps = CIRCUIT_REPS;
    out.sec = undefined;
    out.tempoNote = slot.tempoNote;
  }
  return out;
}

/** maintain: −1 Primärsatz (min. 2), Exzentrik-Tempo weg (außer power), letzten Accessory-Slot streichen. */
function applyMaintain(slots: PatternSlot[], dp: DisciplineProfile): PatternSlot[] {
  const dropEccentric = dp.repProfile !== 'power';
  const scaled = slots.map((slot) => {
    const out = { ...slot };
    if (out.role === 'primary') out.sets = Math.max(MAINTAIN_MIN_SETS, out.sets - 1);
    if (dropEccentric && dp.eccentricPatterns.includes(out.pattern)) out.tempoNote = undefined;
    return out;
  });
  const lastAccessory = scaled.map((slot) => slot.role).lastIndexOf('accessory');
  if (lastAccessory !== -1) scaled.splice(lastAccessory, 1);
  return scaled;
}

function toTemplateExercise(slot: PatternSlot, exercise: Exercise): TemplateExercise {
  const entry: TemplateExercise = { exerciseId: exercise.id, sets: slot.sets };
  if (slot.pattern === 'carry') {
    entry.defaultReps = slot.reps ?? CARRY_METERS;
  } else if (exercise.metric === 'time') {
    entry.defaultSec = slot.sec ?? (slot.reps !== undefined ? slot.reps * 3 : 30);
  } else {
    entry.defaultReps = slot.reps ?? (slot.sec !== undefined ? Math.round(slot.sec / 4) : 8);
  }
  if (slot.tempoNote) entry.note = slot.tempoNote;
  return entry;
}

// ---------------------------------------------------------------------------
// Öffentliche API
// ---------------------------------------------------------------------------

/**
 * Deterministische Krafttemplates aus Profil + Saison + Übungspool.
 * Gleiche Eingabe → `toEqual`-gleiche Ausgabe.
 */
export function generateTemplates(
  profile: TrainingProfile,
  season: SeasonMode,
  exercises: Exercise[]
): SessionTemplate[] {
  const dp = DISCIPLINE_PROFILES[profile.discipline ?? 'big-air'];
  const allowed = EQUIPMENT_TIERS[profile.equipment ?? 'gym'];
  const preferGentle = gentleBias(profile);
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  return SKELETONS[profile.daysPerWeek ?? 2].map((skeleton) => {
    let slots: PatternSlot[] = skeleton.slots.map((slot) => ({ ...slot }));

    // Disziplin-Betonung: ein Accessory-Slot des ersten emphasis-Musters, das am
    // Tag noch nicht vorkommt. Nicht für den Circuit.
    if (skeleton.type !== 'KB') {
      const present = new Set(slots.map((slot) => slot.pattern));
      const extra = dp.emphasis.find((pattern) => !present.has(pattern));
      if (extra) slots.push({ pattern: extra, role: 'accessory', sets: 3 });
    }

    slots = slots.map((slot) => applyDosage(slot, skeleton, dp));
    if (season === 'maintain') slots = applyMaintain(slots, dp);

    const used = new Set<string>();
    const exercisesOut: TemplateExercise[] = [];
    for (const slot of slots) {
      const exercise = resolveSlot(slot, dp, allowed, preferGentle, used, byId);
      if (!exercise) continue; // Slot ohne passendes Gerät — mit den Skeletten oben tritt das nicht ein
      used.add(exercise.id);
      exercisesOut.push(toTemplateExercise(slot, exercise));
    }

    return { type: skeleton.type, title: skeleton.title, subtitle: skeleton.subtitle, exercises: exercisesOut };
  });
}

/**
 * Bindeglied für die UI: Profil vorhanden und nicht skipped → generieren, sonst Seed.
 * Saison: `profile.seasonAdjust === false` → immer 'build', sonst aus der Kite-Frequenz.
 */
export function activeTemplates(
  settings: Pick<Settings, 'trainingProfile'>,
  sessions: Session[],
  exercises: Exercise[],
  date: string = localDate()
): SessionTemplate[] {
  const profile = settings.trainingProfile;
  if (!profile || profile.skipped || !profile.equipment || !profile.daysPerWeek || !profile.discipline) {
    return seedTemplates;
  }
  const season = profile.seasonAdjust === false ? 'build' : seasonMode(sessions, date);
  return generateTemplates(profile, season, exercises);
}
