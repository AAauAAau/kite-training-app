import type { BoardOffStage, Exercise, SessionTemplate, Settings } from '../types';

const exerciseList: Exercise[] = [
  { id: 'trap-bar-deadlift', name: 'Trap-Bar Deadlift', category: 'strength', metric: 'weight_reps', incrementKg: 2.5 },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true },
  { id: 'bench-or-ohp', name: 'Bankdrücken / Schulterdrücken', category: 'strength', metric: 'weight_reps', incrementKg: 2.5 },
  { id: 'nordic-negative', name: 'Nordic Curl negativ', category: 'strength', metric: 'time' },
  { id: 'farmers-carry', name: "Farmer's Carry · 40 m", category: 'strength', metric: 'weight_reps', incrementKg: 2.5 },
  { id: 'weighted-pullup', name: 'Klimmzüge mit Zusatzgewicht', category: 'strength', metric: 'weight_reps', incrementKg: 2.5 },
  { id: 'front-squat-or-stepdown', name: 'Front Squat / Box Step-down', category: 'strength', metric: 'weight_reps', incrementKg: 2.5 },
  { id: 'barbell-row', name: 'Langhantelrudern', category: 'strength', metric: 'weight_reps', incrementKg: 2.5 },
  { id: 'single-leg-rdl', name: 'Single-Leg RDL', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true },
  { id: 'pallof-press', name: 'Pallof Press', category: 'strength', metric: 'reps', perSide: true },
  { id: 'copenhagen-plank', name: 'Copenhagen Plank', category: 'strength', metric: 'time', perSide: true },
  { id: 'ring-pullup', name: 'Ring-Klimmzüge', category: 'rings', metric: 'reps' },
  { id: 'ring-dips', name: 'Ring Dips', category: 'rings', metric: 'reps' },
  { id: 'ring-rollout', name: 'Ring Rollout', category: 'rings', metric: 'reps' },
  { id: 'front-lever', name: 'Front-Lever-Progression', category: 'rings', metric: 'time' },
  { id: 'kb-swing', name: 'KB Swing', category: 'rings', metric: 'weight_reps', incrementKg: 4 },
  { id: 'sprint', name: 'Sprint', category: 'sprint', metric: 'distance' },
  { id: 'couch-stretch', name: 'Couch Stretch · 2×90 s je Seite', category: 'mobility', metric: 'time', perSide: true },
  { id: 't-spine', name: 'T-Spine Extension / Open Book · 10 Wdh.', category: 'mobility', metric: 'reps' },
  { id: 'knee-to-wall', name: 'Knee-to-Wall · 2×15 je Seite', category: 'mobility', metric: 'reps', perSide: true },
  { id: 'neck-isometric', name: 'Nacken-Isometrie · 4 Richtungen je 10 s', category: 'mobility', metric: 'time' },
  { id: 'boardoff-seated', name: 'Board rein · raus · rein', category: 'boardoff', metric: 'reps' },
  { id: 'boardoff-tail-grab', name: 'Hängend · Tail Grab', category: 'boardoff', metric: 'reps' },
  { id: 'boardoff-one-footer', name: 'One-Footer · 2 s halten', category: 'boardoff', metric: 'reps', perSide: true },
  { id: 'boardoff-full', name: 'Voller Board-Off hängend', category: 'boardoff', metric: 'reps' },
  { id: 'boardoff-timed', name: 'Kompletter Zyklus · Ziel < 3 s', category: 'boardoff', metric: 'time' },
  { id: 'toes-to-bar', name: 'Toes-to-Bar', category: 'boardoff', metric: 'reps' },
  { id: 'dead-hang', name: 'Dead Hang', category: 'boardoff', metric: 'time' },
  { id: 'hollow-body-hold', name: 'Hollow Body Hold', category: 'boardoff', metric: 'time' }
];

const youtubeQueries: Record<string, string> = {
  'trap-bar-deadlift': 'trap bar deadlift proper form',
  'bulgarian-split-squat': 'bulgarian split squat proper form',
  'bench-or-ohp': 'bench press overhead press proper form',
  'nordic-negative': 'nordic curl negative proper form',
  'farmers-carry': 'farmers carry proper form',
  'weighted-pullup': 'weighted pull up proper form',
  'front-squat-or-stepdown': 'front squat box step down proper form',
  'barbell-row': 'barbell row proper form',
  'single-leg-rdl': 'single leg romanian deadlift proper form',
  'pallof-press': 'pallof press proper form',
  'copenhagen-plank': 'copenhagen plank proper form',
  'ring-pullup': 'gymnastic rings pull up proper form',
  'ring-dips': 'ring dips proper form',
  'ring-rollout': 'ring rollout proper form',
  'front-lever': 'front lever progression tutorial',
  'kb-swing': 'kettlebell swing proper form',
  sprint: 'sprint running technique acceleration',
  'couch-stretch': 'couch stretch proper form',
  't-spine': 'open book thoracic spine mobility',
  'knee-to-wall': 'knee to wall ankle mobility',
  'neck-isometric': 'neck isometric exercises four directions',
  'boardoff-seated': 'kiteboarding board off tutorial',
  'boardoff-tail-grab': 'kiteboarding tail grab board off tutorial',
  'boardoff-one-footer': 'kiteboarding one footer tutorial',
  'boardoff-full': 'kiteboarding board off tutorial',
  'boardoff-timed': 'kiteboarding board off tutorial',
  'toes-to-bar': 'toes to bar proper form',
  'dead-hang': 'dead hang proper form',
  'hollow-body-hold': 'hollow body hold proper form'
};

export const exercises: Exercise[] = exerciseList.map((exercise) => ({
  ...exercise,
  youtubeQuery: youtubeQueries[exercise.id]
}));

export const templates: SessionTemplate[] = [
  {
    type: 'A', title: 'Tag A', subtitle: 'Beine / Push · 50–60 min',
    exercises: [
      { exerciseId: 'trap-bar-deadlift', sets: 4, defaultReps: 5 },
      { exerciseId: 'bulgarian-split-squat', sets: 3, defaultReps: 8 },
      { exerciseId: 'bench-or-ohp', sets: 3, defaultReps: 7 },
      { exerciseId: 'nordic-negative', sets: 3, defaultSec: 4, note: '5 Negative, Ziel 4 s exzentrisch' },
      { exerciseId: 'farmers-carry', sets: 3, defaultReps: 40, note: 'Wiederholungsfeld = Meter' }
    ]
  },
  {
    type: 'B', title: 'Tag B', subtitle: 'Zug / Landung · 50–60 min',
    exercises: [
      { exerciseId: 'weighted-pullup', sets: 4, defaultReps: 5 },
      { exerciseId: 'front-squat-or-stepdown', sets: 4, defaultReps: 5, note: 'Step-down: 3×6/Seite, 3–4 s exzentrisch' },
      { exerciseId: 'barbell-row', sets: 3, defaultReps: 8 },
      { exerciseId: 'single-leg-rdl', sets: 3, defaultReps: 8 },
      { exerciseId: 'pallof-press', sets: 3, defaultReps: 10 },
      { exerciseId: 'copenhagen-plank', sets: 3, defaultSec: 20 }
    ]
  }
];

export const mobilityItems = exercises.filter((exercise) => exercise.category === 'mobility');

export const boardOffStages: BoardOffStage[] = [
  {
    level: 0,
    title: 'Sitzend',
    summary: 'Board rein, raus, rein · 50+ Wiederholungen',
    template: {
      type: 'BOARD_OFF', title: 'Stufe 0 · Sitzend', subtitle: 'Muskelgedächtnis und Fehlwinkel',
      exercises: [{ exerciseId: 'boardoff-seated', sets: 5, defaultReps: 10, note: 'Board verdrehen, schief ansetzen, seitlich kippen. Vorderer Fuß zuerst.' }]
    }
  },
  {
    level: 1,
    title: 'Tail Grab',
    summary: 'Hängend · halten und lösen · 3×8',
    template: {
      type: 'BOARD_OFF', title: 'Stufe 1 · Tail Grab', subtitle: 'Knie anziehen · Tail sicher greifen',
      exercises: [
        { exerciseId: 'boardoff-tail-grab', sets: 3, defaultReps: 8, note: 'Hintere Heelside-Kante an Finne und Rail greifen.' },
        { exerciseId: 'dead-hang', sets: 3, defaultSec: 30 }
      ]
    }
  },
  {
    level: 2,
    title: 'One-Footer',
    summary: 'Hinterer Fuß raus · 2 s halten · 3×6 je Seite',
    template: {
      type: 'BOARD_OFF', title: 'Stufe 2 · One-Footer', subtitle: 'Einhändig hängen · kontrolliert zurück',
      exercises: [
        { exerciseId: 'boardoff-one-footer', sets: 3, defaultReps: 6, defaultSec: 2 },
        { exerciseId: 'hollow-body-hold', sets: 3, defaultSec: 30 }
      ]
    }
  },
  {
    level: 3,
    title: 'Voller Board-Off',
    summary: 'Beide Füße raus · Board ausrichten · 3×5',
    template: {
      type: 'BOARD_OFF', title: 'Stufe 3 · Voller Board-Off', subtitle: 'Erst beidhändig, später einhändig',
      exercises: [
        { exerciseId: 'boardoff-full', sets: 3, defaultReps: 5, note: 'Vorderer Fuß zuerst rein, dann der hintere.' },
        { exerciseId: 'toes-to-bar', sets: 3, defaultReps: 8 }
      ]
    }
  },
  {
    level: 4,
    title: 'Unter Zeitdruck',
    summary: 'Kompletter Zyklus unter 3 Sekunden',
    template: {
      type: 'BOARD_OFF', title: 'Stufe 4 · Unter Zeitdruck', subtitle: 'Fehlwinkel · Tail Flip · um den Körper',
      exercises: [
        { exerciseId: 'boardoff-timed', sets: 6, defaultSec: 3, note: 'Danach verdreht starten und Varianten einbauen.' },
        { exerciseId: 'toes-to-bar', sets: 3, defaultReps: 8 },
        { exerciseId: 'dead-hang', sets: 3, defaultSec: 45 }
      ]
    }
  }
];

export const defaultSettings: Settings = {
  id: 'settings',
  bodyweightLog: [],
  loadThreshold7d: 10,
  hamburgDays: [2, 3, 4]
};
