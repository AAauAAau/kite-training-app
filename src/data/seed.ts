import type { BoardOffLevel, Exercise, MobilityChecklistTemplate, SessionTemplate, Settings } from '../types';

const exerciseList: Exercise[] = [
  { id: 'trap-bar-deadlift', name: 'Trap-Bar Deadlift', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, restSec: 180, pattern: 'hinge', equipment: 'barbell' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true, pattern: 'single-leg', equipment: 'dumbbell' },
  { id: 'bench-or-ohp', name: 'Bankdrücken / Schulterdrücken', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, pattern: 'push-h', equipment: 'barbell' },
  { id: 'nordic-negative', name: 'Nordic Curl negativ', category: 'strength', metric: 'time', timer: { mode: 'pace', defaultSec: 4 }, pattern: 'hamstring-curl', equipment: 'bodyweight' },
  { id: 'suitcase-carry', name: 'Suitcase Carry (einseitig) · 40 m', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true, pattern: 'carry', equipment: 'dumbbell' },
  { id: 'weighted-pullup', name: 'Klimmzüge mit Zusatzgewicht', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, pattern: 'pull-v', equipment: 'bodyweight' },
  { id: 'front-squat-or-stepdown', name: 'Front Squat / Box Step-down', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, timer: { mode: 'pace', defaultSec: 4 }, pattern: 'squat', equipment: 'barbell' },
  { id: 'barbell-row', name: 'Langhantelrudern', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, pattern: 'pull-h', equipment: 'barbell' },
  { id: 'single-leg-rdl', name: 'Single-Leg RDL', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true, pattern: 'hinge', equipment: 'dumbbell' },
  { id: 'pallof-press', name: 'Pallof Press', category: 'strength', metric: 'reps', perSide: true, pattern: 'core-anti-rot', equipment: 'band' },
  { id: 'copenhagen-plank', name: 'Copenhagen Plank', category: 'strength', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 20 }, pattern: 'core-anti-lat', equipment: 'bodyweight' },
  { id: 'back-extension-45', name: 'Back Extension 45°', category: 'strength', metric: 'reps', incrementKg: 0, pattern: 'hinge', equipment: 'bodyweight' },
  { id: 'bird-dog', name: 'Bird Dog', category: 'strength', metric: 'reps', perSide: true, pattern: 'core-anti-rot', equipment: 'bodyweight' },
  { id: 'side-plank', name: 'Side Plank', category: 'strength', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 45 }, pattern: 'core-anti-lat', equipment: 'bodyweight' },
  { id: 'kb-swing', name: 'KB Swing einarmig', category: 'strength', metric: 'weight_reps', incrementKg: 4, perSide: true, pattern: 'hinge', equipment: 'kettlebell' },
  { id: 'kb-clean-press', name: 'KB Clean & Press einarmig', category: 'strength', metric: 'weight_reps', incrementKg: 2, perSide: true, pattern: 'push-v', equipment: 'kettlebell' },
  { id: 'kb-windmill', name: 'KB Windmill', category: 'strength', metric: 'weight_reps', incrementKg: 2, perSide: true, pattern: 'core-anti-lat', equipment: 'kettlebell' },
  // Substitutions-Pool · in keinem Template referenziert, nur als Übungs-Ersatz wählbar
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, pattern: 'hinge', equipment: 'barbell' },
  { id: 'hip-thrust', name: 'Hip Thrust', category: 'strength', metric: 'weight_reps', incrementKg: 5, pattern: 'hinge', equipment: 'barbell' },
  { id: 'kb-deadlift', name: 'Kettlebell Deadlift', category: 'strength', metric: 'weight_reps', incrementKg: 4, pattern: 'hinge', equipment: 'kettlebell' },
  { id: 'back-squat', name: 'Back Squat', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, pattern: 'squat', equipment: 'barbell' },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'strength', metric: 'weight_reps', incrementKg: 4, pattern: 'squat', equipment: 'kettlebell' },
  { id: 'leg-press', name: 'Beinpresse', category: 'strength', metric: 'weight_reps', incrementKg: 5, pattern: 'squat', equipment: 'machine' },
  { id: 'reverse-lunge', name: 'Ausfallschritt rückwärts', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true, pattern: 'single-leg', equipment: 'dumbbell' },
  { id: 'dumbbell-step-up', name: 'Step-up', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true, pattern: 'single-leg', equipment: 'dumbbell' },
  { id: 'pistol-squat', name: 'Pistol Squat', category: 'strength', metric: 'reps', perSide: true, pattern: 'single-leg', equipment: 'bodyweight' },
  { id: 'db-bench-press', name: 'Kurzhantel-Bankdrücken', category: 'strength', metric: 'weight_reps', incrementKg: 2, pattern: 'push-h', equipment: 'dumbbell' },
  { id: 'machine-chest-press', name: 'Brustpresse (Maschine)', category: 'strength', metric: 'weight_reps', incrementKg: 5, pattern: 'push-h', equipment: 'machine' },
  { id: 'weighted-pushup', name: 'Liegestütz mit Zusatzgewicht', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, pattern: 'push-h', equipment: 'bodyweight' },
  { id: 'db-shoulder-press', name: 'Kurzhantel-Schulterdrücken', category: 'strength', metric: 'weight_reps', incrementKg: 2, pattern: 'push-v', equipment: 'dumbbell' },
  { id: 'push-press', name: 'Push Press', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, pattern: 'push-v', equipment: 'barbell' },
  { id: 'pike-pushup', name: 'Pike Push-up', category: 'strength', metric: 'reps', pattern: 'push-v', equipment: 'bodyweight' },
  { id: 'pullup', name: 'Klimmzüge', category: 'strength', metric: 'reps', pattern: 'pull-v', equipment: 'bodyweight' },
  { id: 'lat-pulldown', name: 'Latzug', category: 'strength', metric: 'weight_reps', incrementKg: 5, pattern: 'pull-v', equipment: 'machine' },
  { id: 'assisted-pullup', name: 'Klimmzug assistiert (Maschine)', category: 'strength', metric: 'weight_reps', incrementKg: 5, pattern: 'pull-v', equipment: 'machine' },
  { id: 'seal-row', name: 'Seal Row', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, pattern: 'pull-h', equipment: 'barbell' },
  { id: 'db-row', name: 'Kurzhantelrudern', category: 'strength', metric: 'weight_reps', incrementKg: 2.5, perSide: true, pattern: 'pull-h', equipment: 'dumbbell' },
  { id: 'inverted-row', name: 'Inverted Row', category: 'strength', metric: 'reps', pattern: 'pull-h', equipment: 'bodyweight' },
  { id: 'farmers-carry', name: "Farmer's Carry · 40 m", category: 'strength', metric: 'weight_reps', incrementKg: 2.5, pattern: 'carry', equipment: 'dumbbell' },
  { id: 'front-rack-carry', name: 'Front-Rack Carry (einseitig) · 40 m', category: 'strength', metric: 'weight_reps', incrementKg: 4, perSide: true, pattern: 'carry', equipment: 'kettlebell' },
  { id: 'waiter-carry', name: 'Waiter Carry (einseitig) · 40 m', category: 'strength', metric: 'weight_reps', incrementKg: 2, perSide: true, pattern: 'carry', equipment: 'kettlebell' },
  { id: 'dead-bug', name: 'Dead Bug', category: 'strength', metric: 'reps', perSide: true, pattern: 'core-anti-rot', equipment: 'bodyweight' },
  { id: 'plank-shoulder-tap', name: 'Plank Shoulder Tap', category: 'strength', metric: 'reps', perSide: true, pattern: 'core-anti-rot', equipment: 'bodyweight' },
  { id: 'suitcase-hold', name: 'Suitcase Hold (einseitig)', category: 'strength', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 30 }, pattern: 'core-anti-lat', equipment: 'dumbbell' },
  { id: 'side-plank-row', name: 'Side Plank Row', category: 'strength', metric: 'reps', perSide: true, pattern: 'core-anti-lat', equipment: 'dumbbell' },
  { id: 'slider-leg-curl', name: 'Slider Leg Curl', category: 'strength', metric: 'reps', pattern: 'hamstring-curl', equipment: 'bodyweight' },
  { id: 'machine-leg-curl', name: 'Beinbeuger (Maschine)', category: 'strength', metric: 'weight_reps', incrementKg: 5, pattern: 'hamstring-curl', equipment: 'machine' },
  { id: 'glute-ham-raise', name: 'Glute-Ham Raise', category: 'strength', metric: 'reps', pattern: 'hamstring-curl', equipment: 'bodyweight' },
  { id: 'ring-pullup', name: 'Ring-Klimmzüge', category: 'rings', metric: 'reps' },
  { id: 'ring-dips', name: 'Ring Dips', category: 'rings', metric: 'reps' },
  { id: 'ring-rollout', name: 'Ring Rollout', category: 'rings', metric: 'reps' },
  { id: 'front-lever', name: 'Front-Lever-Progression', category: 'rings', metric: 'time', timer: { mode: 'countup' } },
  { id: 'sprint', name: 'Sprint', category: 'sprint', metric: 'distance', timer: { mode: 'countup' } },
  { id: 'couch-stretch', name: 'Couch Stretch · 2×90 s je Seite', category: 'mobility', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 90 }, restSec: 0 },
  { id: 't-spine', name: 'T-Spine Extension / Open Book · 10 Wdh.', category: 'mobility', metric: 'reps' },
  { id: 'knee-to-wall', name: 'Knee-to-Wall · 2×15 je Seite', category: 'mobility', metric: 'reps', perSide: true },
  { id: 'neck-isometric', name: 'Nacken-Isometrie · 4 Richtungen je 10 s', category: 'mobility', metric: 'time', timer: { mode: 'countdown', defaultSec: 10 }, restSec: 0 },
  { id: 'down-dog', name: 'Downward-Facing Dog', category: 'mobility', metric: 'time', timer: { mode: 'countdown', defaultSec: 30 }, restSec: 0 },
  { id: 'boardoff-seated', name: 'Board rein · raus · rein', category: 'boardoff', metric: 'reps' },
  { id: 'boardoff-tail-grab', name: 'Hängend · Tail Grab', category: 'boardoff', metric: 'reps' },
  { id: 'boardoff-one-footer', name: 'One-Footer · 2 s halten', category: 'boardoff', metric: 'reps', perSide: true, timer: { mode: 'pace', defaultSec: 2 } },
  { id: 'boardoff-full', name: 'Voller Board-Off hängend', category: 'boardoff', metric: 'reps' },
  { id: 'boardoff-timed', name: 'Kompletter Zyklus · Ziel < 3 s', category: 'boardoff', metric: 'time', timer: { mode: 'countup' } },
  { id: 'toes-to-bar', name: 'Toes-to-Bar', category: 'boardoff', metric: 'reps' },
  { id: 'dead-hang', name: 'Dead Hang', category: 'boardoff', metric: 'time', timer: { mode: 'countup' } },
  { id: 'hollow-body-hold', name: 'Hollow Body Hold', category: 'boardoff', metric: 'time', timer: { mode: 'countdown', defaultSec: 30 } },
  // Board-Off-Progression · Trapez-Hang (Aufhängung nötig)
  { id: 'bo-hang-tap', name: 'Trapez-Hang: Grab antippen', category: 'boardoff', metric: 'reps' },
  { id: 'bo-hang-hold', name: 'Trapez-Hang: Grab halten', category: 'boardoff', metric: 'time', timer: { mode: 'countdown', defaultSec: 10 } },
  { id: 'bo-hang-foot-release', name: 'Trapez-Hang: One-Foot Release', category: 'boardoff', metric: 'reps', perSide: true },
  { id: 'bo-hang-off-fin', name: 'Trapez-Hang: Board Off by Fin', category: 'boardoff', metric: 'reps' },
  { id: 'bo-hang-off-handle', name: 'Trapez-Hang: Board Off by Handle', category: 'boardoff', metric: 'reps' },
  { id: 'bo-hang-deep-hold', name: 'Trapez-Hang: Deep-Compression Hold', category: 'boardoff', metric: 'time', timer: { mode: 'countdown', defaultSec: 10 } },
  { id: 'bo-board-hold-1arm', name: 'Board-Hold einarmig (Rail/Finne)', category: 'boardoff', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 15 } },
  // Board-Off-Progression · Kompression
  { id: 'bo-seated-pike-lift', name: 'Seated Pike Lift', category: 'boardoff', metric: 'reps' },
  { id: 'bo-hollow-hold', name: 'Hollow Body Hold (Board-Off)', category: 'boardoff', metric: 'time', timer: { mode: 'countdown', defaultSec: 30 } },
  { id: 'bo-hang-knee-raise', name: 'Hanging Knee Raise (strikt)', category: 'boardoff', metric: 'reps' },
  { id: 'bo-hang-leg-raise', name: 'Hanging Straight-Leg Raise', category: 'boardoff', metric: 'reps' },
  { id: 'bo-hang-leg-raise-1l', name: 'Hanging Leg Raise einbeinig', category: 'boardoff', metric: 'reps', perSide: true },
  { id: 'bo-tuck-lsit', name: 'Tuck L-Sit', category: 'boardoff', metric: 'time', timer: { mode: 'countdown', defaultSec: 15 } },
  { id: 'bo-vsit-lift', name: 'V-Sit / Pike Lift mit Zusatzlast', category: 'boardoff', metric: 'reps' },
  // Board-Off-Progression · Griff & Handgelenk
  { id: 'bo-dead-hang', name: 'Dead Hang beidhändig', category: 'boardoff', metric: 'time', timer: { mode: 'countdown', defaultSec: 40 } },
  { id: 'bo-hang-1arm-assist', name: 'Einarmiger Hang (assistiert)', category: 'boardoff', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 12 } },
  { id: 'bo-bottoms-up-hold', name: 'Bottoms-Up KB Hold / Plate Pinch', category: 'boardoff', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 20 } },
  { id: 'bo-wrist-twist', name: 'Handgelenks-Drill: Board drehen', category: 'boardoff', metric: 'reps' },
  // Board-Off-Progression · Schulter & Anti-Extension/Rotation
  { id: 'bo-kb-oh-hold', name: 'Einarmiger KB Overhead-Hold', category: 'boardoff', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 25 } },
  { id: 'bo-oh-carry', name: 'Einarmiger Overhead Carry', category: 'boardoff', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 30 } },
  { id: 'bo-suitcase-hold', name: 'Suitcase / Offset Hold', category: 'boardoff', metric: 'time', perSide: true, timer: { mode: 'countdown', defaultSec: 25 } },
  { id: 'bo-deadbug-kb', name: 'Dead Bug mit KB Overhead', category: 'boardoff', metric: 'reps', perSide: true },
  // Board-Off-Progression · Mobilität & Motorik
  { id: 'bo-jefferson-curl', name: 'Jefferson Curl / Pike-Dehnung', category: 'boardoff', metric: 'time', timer: { mode: 'countdown', defaultSec: 45 } },
  { id: 'bo-seated-board', name: 'Board an-/ausziehen im Sitzen', category: 'boardoff', metric: 'reps' }
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
  'romanian-deadlift': 'romanian deadlift proper form',
  'hip-thrust': 'barbell hip thrust proper form',
  'kb-deadlift': 'kettlebell deadlift proper form',
  'back-squat': 'barbell back squat proper form',
  'goblet-squat': 'goblet squat proper form',
  'leg-press': 'leg press machine proper form',
  'reverse-lunge': 'dumbbell reverse lunge proper form',
  'dumbbell-step-up': 'dumbbell step up proper form',
  'pistol-squat': 'pistol squat progression tutorial',
  'db-bench-press': 'dumbbell bench press proper form',
  'machine-chest-press': 'machine chest press proper form',
  'weighted-pushup': 'weighted push up proper form',
  'db-shoulder-press': 'dumbbell shoulder press proper form',
  'push-press': 'barbell push press proper form',
  'pike-pushup': 'pike push up proper form',
  pullup: 'pull up proper form',
  'lat-pulldown': 'lat pulldown proper form',
  'assisted-pullup': 'assisted pull up machine proper form',
  'seal-row': 'seal row proper form',
  'db-row': 'single arm dumbbell row proper form',
  'inverted-row': 'inverted row proper form',
  'farmers-carry': 'farmers carry proper form',
  'front-rack-carry': 'kettlebell front rack carry proper form',
  'waiter-carry': 'kettlebell waiter carry proper form',
  'dead-bug': 'dead bug proper form',
  'plank-shoulder-tap': 'plank shoulder tap proper form',
  'suitcase-hold': 'suitcase hold proper form',
  'side-plank-row': 'side plank row proper form',
  'slider-leg-curl': 'slider hamstring curl proper form',
  'machine-leg-curl': 'lying leg curl machine proper form',
  'glute-ham-raise': 'glute ham raise proper form',
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
  'hollow-body-hold': 'hollow body hold proper form',
  'bo-hang-tap': 'hanging compression knee raise tuck proper form',
  'bo-hang-hold': 'l-sit tuck hold progression proper form',
  'bo-hang-foot-release': 'kiteboarding one footer board off tutorial',
  'bo-hang-off-fin': 'kiteboarding fin grab board off tutorial',
  'bo-hang-off-handle': 'kiteboarding board off by handle tutorial',
  'bo-hang-deep-hold': 'v-sit compression hold progression',
  'bo-board-hold-1arm': 'single arm weighted hold shoulder stability',
  'bo-seated-pike-lift': 'seated pike compression lift proper form',
  'bo-hollow-hold': 'hollow body hold proper form',
  'bo-hang-knee-raise': 'strict hanging knee raise proper form',
  'bo-hang-leg-raise': 'hanging straight leg raise proper form',
  'bo-hang-leg-raise-1l': 'single leg hanging leg raise proper form',
  'bo-tuck-lsit': 'tuck l-sit progression rings parallettes',
  'bo-vsit-lift': 'weighted v-sit pike compression lift',
  'bo-dead-hang': 'dead hang proper form',
  'bo-hang-1arm-assist': 'assisted one arm hang progression',
  'bo-bottoms-up-hold': 'bottoms up kettlebell hold proper form',
  'bo-wrist-twist': 'kiteboarding board off wrist drill',
  'bo-kb-oh-hold': 'single arm kettlebell overhead hold proper form',
  'bo-oh-carry': 'single arm overhead carry proper form',
  'bo-suitcase-hold': 'suitcase hold anti lateral flexion proper form',
  'bo-deadbug-kb': 'dead bug overhead kettlebell proper form',
  'bo-jefferson-curl': 'jefferson curl proper form',
  'bo-seated-board': 'kiteboarding board off land drill seated'
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
      { id: 'morning-down-dog', label: 'Downward-Facing Dog · 30 s + 5× Pedalieren', purpose: 'Waden, Sprunggelenk, Schulterflexion', timerSec: 30 },
      { id: 'morning-worlds-greatest', label: "World's Greatest Stretch · 5 je Seite", purpose: 'Hüftbeuger und BWS-Rotation' },
      { id: 'morning-hip-flexor', label: 'Half-Kneeling Hip Flexor Stretch · 45 s je Seite', purpose: 'Trapez-Gegenspieler', timerSec: 45 },
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
        id: 'hip-glute-bridge', label: 'Glute Bridge', dose: '2×15, oben 2 s halten', timerSec: 2, timerMode: 'pace',
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

// Board-Off-Progression · Trockentraining im Trapez.
// Fachliche Grundlage: docs/training/board-off-progression.md
export const boardOffLevels: BoardOffLevel[] = [
  {
    level: 0,
    label: 'Vorbereitung',
    skill: null,
    gate: 'Kompressionstest bestanden + Langsitz 30 s + Dead Hang 30 s',
    slots: [
      { exerciseId: 'bo-seated-pike-lift', sets: 3, defaultReps: 10, mistake: 'Knie beugen, um höher zu kommen', regression: 'Hände weiter hinten aufsetzen, Straddle statt Pike' },
      { exerciseId: 'bo-hollow-hold', sets: 3, defaultSec: 30, mistake: 'Lendenwirbelsäule hebt vom Boden ab', regression: 'Knie angewinkelt (Tuck Hollow)' },
      { exerciseId: 'bo-dead-hang', sets: 3, defaultSec: 35, mistake: 'Passiv in den Schultern hängen', regression: 'Füße am Boden entlasten' },
      { exerciseId: 'bo-jefferson-curl', sets: 3, defaultSec: 45, mistake: 'Mit Schwung in die Dehnung', regression: 'Straddle, Knie minimal gebeugt' }
    ]
  },
  {
    level: 1,
    label: 'Grab antippen',
    skill: 'Grab antippen',
    gate: '10 saubere Taps in Folge, je 1 s gehalten, ohne Pendeln',
    slots: [
      {
        exerciseId: 'bo-hang-tap', sets: 4, defaultReps: 8, needsRig: true,
        mistake: 'Mit Schwung pendeln statt aktiv beugen',
        regression: 'Nur Knie zur Brust, ohne Berührung',
        rigFreeAlternative: { exerciseId: 'bo-hang-leg-raise', sets: 4, defaultReps: 8, mistake: 'Mit Schwung pendeln statt aktiv beugen', regression: 'Knie gebeugt (Knee Raise)' }
      },
      { exerciseId: 'bo-hang-knee-raise', sets: 3, defaultReps: 10, mistake: 'Rücken ins Hohlkreuz, Becken kippt nicht mit', regression: 'Liegend: Reverse Curl mit fixierten Armen' },
      { exerciseId: 'bo-deadbug-kb', sets: 3, defaultReps: 8, mistake: 'Rippen heben ab', regression: 'Ohne Gewicht, nur Arme senkrecht' },
      { exerciseId: 'bo-dead-hang', sets: 3, defaultSec: 45, mistake: 'Schultern komplett passiv', regression: 'Füße entlasten' }
    ]
  },
  {
    level: 2,
    label: 'Grab halten',
    skill: 'Grab halten',
    gate: '3 × 10 s Grab Hold ohne Absinken, beidseitig',
    slots: [
      {
        exerciseId: 'bo-hang-hold', sets: 5, defaultSec: 10, needsRig: true,
        mistake: 'Position langsam absacken lassen und trotzdem weiterzählen',
        regression: 'Tuck-Position statt gestreckter, kürzere Holds',
        rigFreeAlternative: { exerciseId: 'bo-hollow-hold', sets: 5, defaultSec: 15, mistake: 'Lendenwirbelsäule hebt vom Boden ab', regression: 'Knie angewinkelt (Tuck Hollow)' }
      },
      { exerciseId: 'bo-tuck-lsit', sets: 4, defaultSec: 15, mistake: 'Schultern hochziehen', regression: 'Füße am Boden, nur Gewicht verlagern' },
      { exerciseId: 'bo-kb-oh-hold', sets: 3, defaultSec: 25, mistake: 'Rippenbogen kippt nach vorn', regression: 'Leichteres Gewicht, Rücken an der Wand' },
      { exerciseId: 'bo-seated-pike-lift', sets: 3, defaultReps: 8, mistake: 'Ruckartig statt kontrolliert', regression: 'Ohne Gewicht' }
    ]
  },
  {
    level: 3,
    label: 'One Footer',
    skill: 'One Footer',
    gate: '5 Releases pro Seite, Fuß trifft beim ersten Versuch, ohne Blickkontrolle',
    slots: [
      {
        exerciseId: 'bo-hang-foot-release', sets: 4, defaultReps: 5, needsRig: true,
        mistake: 'Nach unten schauen, um den Fuß zu treffen — im Sprung geht das nicht',
        regression: 'Fuß nur lösen, ohne Halten',
        rigFreeAlternative: { exerciseId: 'bo-deadbug-kb', sets: 4, defaultReps: 5, mistake: 'Rippen heben ab, Rumpf rotiert', regression: 'Ohne Gewicht' }
      },
      { exerciseId: 'bo-suitcase-hold', sets: 3, defaultSec: 25, mistake: 'Rumpf zur Seite kippen lassen', regression: 'Leichteres Gewicht' },
      { exerciseId: 'bo-hang-leg-raise-1l', sets: 3, defaultReps: 8, mistake: 'Standbein zieht mit hoch', regression: 'Knie gebeugt' },
      { exerciseId: 'bo-hang-1arm-assist', sets: 4, defaultSec: 12, mistake: 'Schulter komplett auskugeln lassen (passiv)', regression: 'Beide Hände, Gewicht 80/20 verlagern' }
    ]
  },
  {
    level: 4,
    label: 'Board Off by Fin',
    skill: 'Board Off by Fin',
    gate: '5 Board Offs, Board 3 s ruhig am Rail, Füße beim ersten Versuch zurück',
    slots: [
      {
        exerciseId: 'bo-hang-off-fin', sets: 4, defaultReps: 5, needsRig: true,
        mistake: 'Board zu weit vom Körper, Handgelenk knickt ab',
        regression: 'Board am Rail nahe der Mitte greifen',
        rigFreeAlternative: { exerciseId: 'bo-vsit-lift', sets: 4, defaultReps: 5, mistake: 'Rundrücken statt Hüftbeugung', regression: 'Ohne Zusatzlast, Straddle' }
      },
      { exerciseId: 'bo-board-hold-1arm', sets: 3, defaultSec: 15, mistake: 'Board kippen lassen und mit Schwung stabilisieren', regression: 'Board näher am Körper, zwei Hände' },
      { exerciseId: 'bo-bottoms-up-hold', sets: 3, defaultSec: 20, mistake: 'Ellbogen mitarbeiten lassen', regression: 'Leichteres Gewicht' },
      { exerciseId: 'bo-hang-leg-raise', sets: 3, defaultReps: 8, mistake: 'Kipping', regression: 'Knie zur Brust' }
    ]
  },
  {
    level: 5,
    label: 'Board Off by Handle',
    skill: 'Board Off by Handle',
    gate: '5 Board Offs by Handle mit je 3 s Hold, mit rechter und linker Greifhand',
    slots: [
      {
        exerciseId: 'bo-hang-off-handle', sets: 4, defaultReps: 5, needsRig: true,
        mistake: 'Rumpf nach vorn klappen statt Hüfte beugen',
        regression: 'Board erst am Rail greifen, dann zum Handle umgreifen',
        rigFreeAlternative: { exerciseId: 'bo-hang-leg-raise', sets: 4, defaultReps: 5, mistake: 'Kipping statt aktiver Hüftbeugung', regression: 'Knie zur Brust' }
      },
      {
        exerciseId: 'bo-hang-deep-hold', sets: 4, defaultSec: 10, needsRig: true,
        mistake: 'Beine sinken, Hand hält das Board hoch statt umgekehrt',
        regression: 'Kürzere Holds, Knie leicht gebeugt',
        rigFreeAlternative: { exerciseId: 'bo-tuck-lsit', sets: 4, defaultSec: 12, mistake: 'Schultern hochziehen', regression: 'Füße am Boden, nur Gewicht verlagern' }
      },
      { exerciseId: 'bo-vsit-lift', sets: 4, defaultReps: 8, mistake: 'Rundrücken statt Hüftbeugung', regression: 'Ohne Zusatzlast, Straddle' },
      { exerciseId: 'bo-oh-carry', sets: 3, defaultSec: 30, mistake: 'Seitliches Wegkippen', regression: 'Leichter, Rack Position statt Overhead' }
    ]
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
