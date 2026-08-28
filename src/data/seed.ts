import type { BoardOffStage, Exercise, MobilityChecklistTemplate, SessionTemplate, Settings } from '../types';

const exerciseList: Exercise[] = [
  { id: 'trap-bar-deadlift', name: 'Trap-Bar Deadlift', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, restSec: 180 },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true },
  { id: 'bench-or-ohp', name: 'Bankdrücken / Schulterdrücken', category: 'strength', metric: 'weight_reps', incrementKg: 2.5 },
  { id: 'nordic-negative', name: 'Nordic Curl negativ', category: 'strength', metric: 'time', timer: { mode: 'pace', defaultSec: 4 } },
  { id: 'suitcase-carry', name: 'Suitcase Carry (einseitig) · 40 m', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true },
  { id: 'weighted-pullup', name: 'Klimmzüge mit Zusatzgewicht', category: 'strength', metric: 'weight_reps', incrementKg: 2.5 },
  { id: 'front-squat-or-stepdown', name: 'Front Squat / Box Step-down', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, timer: { mode: 'pace', defaultSec: 4 } },
  { id: 'barbell-row', name: 'Langhantelrudern', category: 'strength', metric: 'weight_reps', incrementKg: 2.5 },
  { id: 'single-leg-rdl', name: 'Single-Leg RDL', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true },
  { id: 'pallof-press', name: 'Pallof Press', category: 'strength', metric: 'reps', perSide: true },
  { id: 'copenhagen-plank', name: 'Copenhagen Plank', category: 'strength', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 20 } },
  { id: 'back-extension-45', name: 'Back Extension 45°', category: 'strength', metric: 'reps', incrementKg: 0 },
  { id: 'bird-dog', name: 'Bird Dog', category: 'strength', metric: 'reps', perSide: true },
  { id: 'side-plank', name: 'Side Plank', category: 'strength', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 45 } },
  { id: 'ring-pullup', name: 'Ring-Klimmzüge', category: 'rings', metric: 'reps' },
  { id: 'ring-dips', name: 'Ring Dips', category: 'rings', metric: 'reps' },
  { id: 'ring-rollout', name: 'Ring Rollout', category: 'rings', metric: 'reps' },
  { id: 'front-lever', name: 'Front-Lever-Progression', category: 'rings', metric: 'time', timer: { mode: 'countup' } },
  { id: 'kb-swing', name: 'KB Swing einarmig', category: 'strength', metric: 'weight_reps', incrementKg: 4, perSide: true },
  { id: 'kb-clean-press', name: 'KB Clean & Press einarmig', category: 'strength', metric: 'weight_reps', incrementKg: 2, perSide: true },
  { id: 'kb-windmill', name: 'KB Windmill', category: 'strength', metric: 'weight_reps', incrementKg: 2, perSide: true },
  { id: 'sprint', name: 'Sprint', category: 'sprint', metric: 'distance', timer: { mode: 'countup' } },
  { id: 'couch-stretch', name: 'Couch Stretch · 2×90 s je Seite', category: 'mobility', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 90 }, restSec: 0 },
  { id: 't-spine', name: 'T-Spine Extension / Open Book · 10 Wdh.', category: 'mobility', metric: 'reps' },
  { id: 'knee-to-wall', name: 'Knee-to-Wall · 2×15 je Seite', category: 'mobility', metric: 'reps', perSide: true },
  { id: 'neck-isometric', name: 'Nacken-Isometrie · 4 Richtungen je 10 s', category: 'mobility', metric: 'time', timer: { mode: 'countdown', defaultSec: 10 }, restSec: 0 },
  { id: 'down-dog', name: 'Downward-Facing Dog', category: 'mobility', metric: 'time', timer: { mode: 'countdown', defaultSec: 30 }, restSec: 0 },
  { id: 'boardoff-seated', name: 'Board rein · raus · rein', category: 'boardoff', metric: 'reps' },
  { id: 'boardoff-tail-grab', name: 'Hängend · Tail Grab', category: 'boardoff', metric: 'reps' },
  { id: 'boardoff-one-footer', name: 'One-Footer · 2 s halten', category: 'boardoff', metric: 'reps', perSide: true },
  { id: 'boardoff-full', name: 'Voller Board-Off hängend', category: 'boardoff', metric: 'reps' },
  { id: 'boardoff-timed', name: 'Kompletter Zyklus · Ziel < 3 s', category: 'boardoff', metric: 'time', timer: { mode: 'countup' } },
  { id: 'toes-to-bar', name: 'Toes-to-Bar', category: 'boardoff', metric: 'reps' },
  { id: 'dead-hang', name: 'Dead Hang', category: 'boardoff', metric: 'time', timer: { mode: 'countup' } },
  { id: 'hollow-body-hold', name: 'Hollow Body Hold', category: 'boardoff', metric: 'time', timer: { mode: 'countdown', defaultSec: 30 } }
];

const youtubeQueries: Record<string, string> = {
  'trap-bar-deadlift': 'trap bar deadlift proper form',
  'bulgarian-split-squat': 'bulgarian split squat proper form',
  'bench-or-ohp': 'bench press overhead press proper form',
  'nordic-negative': 'nordic curl negative proper form',
  'suitcase-carry': 'suitcase carry proper form',
  'weighted-pullup': 'weighted pull up proper form',
  'front-squat-or-stepdown': 'front squat box step down proper form',
  'barbell-row': 'barbell row proper form',
  'single-leg-rdl': 'single leg romanian deadlift proper form',
  'pallof-press': 'pallof press proper form',
  'copenhagen-plank': 'copenhagen plank proper form',
  'back-extension-45': '45 degree back extension bodyweight proper form',
  'bird-dog': 'bird dog proper form',
  'side-plank': 'side plank proper form',
  'ring-pullup': 'gymnastic rings pull up proper form',
  'ring-dips': 'ring dips proper form',
  'ring-rollout': 'ring rollout proper form',
  'front-lever': 'front lever progression tutorial',
  'kb-swing': 'kettlebell swing proper form',
  'kb-clean-press': 'single arm kettlebell clean and press proper form',
  'kb-windmill': 'kettlebell windmill proper form',
  sprint: 'sprint running technique acceleration',
  'couch-stretch': 'couch stretch proper form',
  't-spine': 'open book thoracic spine mobility',
  'knee-to-wall': 'knee to wall ankle mobility',
  'neck-isometric': 'neck isometric exercises four directions',
  'down-dog': 'downward facing dog proper form',
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
    type: 'A', title: 'Tag A', subtitle: 'Gym · Beine / Push · 50–60 min',
    exercises: [
      { exerciseId: 'trap-bar-deadlift', sets: 4, defaultReps: 5 },
      { exerciseId: 'bulgarian-split-squat', sets: 3, defaultReps: 8 },
      { exerciseId: 'bench-or-ohp', sets: 3, defaultReps: 7 },
      { exerciseId: 'nordic-negative', sets: 3, defaultSec: 4, note: '5 Negative, Ziel 4 s exzentrisch' },
      { exerciseId: 'suitcase-carry', sets: 3, defaultReps: 40, note: '40 m je Seite · gleiche Zeit, zusätzlich Anti-Lateralflexion' }
    ]
  },
  {
    type: 'B', title: 'Tag B', subtitle: 'Gym · Zug / Landung · 50–60 min',
    exercises: [
      { exerciseId: 'weighted-pullup', sets: 4, defaultReps: 5 },
      { exerciseId: 'front-squat-or-stepdown', sets: 4, defaultReps: 5, note: 'Step-down: 3×6/Seite, 3–4 s exzentrisch' },
      { exerciseId: 'barbell-row', sets: 3, defaultReps: 8 },
      { exerciseId: 'single-leg-rdl', sets: 3, defaultReps: 8 },
      { exerciseId: 'pallof-press', sets: 3, defaultReps: 10 },
      { exerciseId: 'copenhagen-plank', sets: 3, defaultSec: 20 },
      { exerciseId: 'back-extension-45', sets: 3, defaultReps: 12, note: '12–15 · nur Körpergewicht, oben kurz halten' },
      { exerciseId: 'bird-dog', sets: 3, defaultReps: 8 },
      { exerciseId: 'side-plank', sets: 3, defaultSec: 45, note: '30–45 s je Seite' }
    ]
  },
  {
    type: 'RINGS', title: 'Ringe-Circuit', subtitle: 'Zuhause · Oberkörper / Core',
    exercises: [
      { exerciseId: 'ring-pullup', sets: 4, defaultReps: 6 },
      { exerciseId: 'ring-dips', sets: 4, defaultReps: 6 },
      { exerciseId: 'ring-rollout', sets: 3, defaultReps: 8 },
      { exerciseId: 'front-lever', sets: 3, defaultSec: 10 }
    ]
  },
  {
    type: 'KB', title: 'KB-Circuit', subtitle: 'Flensburg / Reise · Alternative zum Ringe-Tag',
    exercises: [
      { exerciseId: 'kb-swing', sets: 5, defaultReps: 10 },
      { exerciseId: 'kb-clean-press', sets: 4, defaultReps: 5, note: 'Explosiv: niedrige Reps, sauberer Lockout' },
      { exerciseId: 'kb-windmill', sets: 3, defaultReps: 5, note: 'Leicht starten · Technik vor Gewicht' }
    ]
  }
];

export const mobilityChecklists: MobilityChecklistTemplate[] = [
  {
    variant: 'pre-session', title: 'Pre-Session', durationMin: 5,
    items: [
      { id: 'warmup-cardio', label: '5 min locker Bike, Rudergerät oder Laufband' },
      { id: 'warmup-movement', label: '10 Squats ohne Gewicht + 10 Hip Hinges' },
      { id: 'warmup-ramp', label: '2–4 steigende Aufwärmsätze der ersten Übung' }
    ]
  },
  {
    variant: 'morning', title: 'Morgenroutine', durationMin: 7,
    items: [
      { id: 'morning-cat-cow', label: 'Cat-Cow · 10 Wdh. langsam', purpose: 'Wirbelsäule unbelastet mobilisieren' },
      { id: 'morning-down-dog', label: 'Downward-Facing Dog · 30 s + 5× Pedalieren', purpose: 'Waden, Sprunggelenk, Schulterflexion' },
      { id: 'morning-worlds-greatest', label: "World's Greatest Stretch · 5 je Seite", purpose: 'Hüftbeuger und BWS-Rotation' },
      { id: 'morning-hip-flexor', label: 'Half-Kneeling Hip Flexor Stretch · 45 s je Seite', purpose: 'Trapez-Gegenspieler' },
      { id: 'morning-knee-wall', label: 'Knee-to-Wall · 10 je Seite', purpose: 'Dorsalflexion für Landungen' },
      { id: 'morning-glute-bridge', label: 'Glute Bridge · 15 Wdh.', purpose: 'Gesäß rückenschonend aktivieren' }
    ]
  },
  {
    variant: 'hip', title: 'Post-Session-Hüftroutine', durationMin: 8,
    items: [
      {
        id: 'hip-flexor-stretch', label: 'Half-Kneeling Hip Flexor Stretch', dose: '2×45 s je Seite', timerSec: 45,
        cue: 'Gesäß der hinteren Seite aktiv anspannen',
        cueDetail: 'Becken nach hinten kippen — sonst wird der untere Rücken gedehnt statt der Hüftbeuger'
      },
      {
        id: 'hip-90-90-switch', label: '90/90 Hip Switch', dose: '10 Wechsel langsam',
        purpose: 'Innen- und Außenrotation'
      },
      {
        id: 'hip-glute-bridge', label: 'Glute Bridge', dose: '2×15, oben 2 s halten',
        purpose: 'Aktivieren nach dem Dehnen — die neue Position muss gehalten werden können'
      },
      {
        id: 'hip-copenhagen-plank', label: 'Copenhagen Plank', dose: '2×20–30 s je Seite', timerSec: 20,
        purpose: 'Auf Knien als Regression'
      },
      {
        id: 'hip-airplane', label: 'Standing Hip Airplane', dose: '5 je Seite',
        purpose: 'Balance + Rotationskontrolle'
      }
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
  hamburgDays: [2, 3, 4],
  timerAudioEnabled: true,
  kiteFocusTags: [
    'Board Off', 'Megaloop', 'Kiteloop', 'Handle Pass', 'Late Backroll', 'Front Roll',
    'Double Loop', 'Landings', 'Downloop-Transition', 'Freestyle', 'Nur Cruisen'
  ]
};
