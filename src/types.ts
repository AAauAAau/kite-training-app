export type SessionType = 'A' | 'B' | 'RINGS' | 'KB' | 'SPRINT' | 'MOBILITY' | 'KITE' | 'PADEL' | 'BOARD_OFF' | 'OTHER';
export type Feel = 'good' | 'ok' | 'wrecked';
export type TrainingIntensity = 'chill' | 'normal' | 'hard';
export type KiteIntensity = TrainingIntensity;
export type KiteWind = 'leicht' | 'mittel' | 'stark';
export type KiteBoard = 'twintip' | 'foil' | 'directional';
export type RingsArea = 'mobility' | 'upper' | 'legs' | 'skills';
export type RingsSkill = 'ring-muscle-up' | 'l-sit' | 'side-split' | 'pistol-squat';

export interface KiteDetails {
  wind?: KiteWind;
  board?: KiteBoard;
  focus?: string[];
}

export interface SetLog {
  kg?: number;
  reps?: number;
  sec?: number;
  distanceM?: number;
  perSide?: boolean;
  successful?: boolean;
}

export interface Entry {
  exerciseId: string;
  sets: SetLog[];
}

export interface Session {
  id: string;
  date: string;
  type: SessionType;
  entries: Entry[];
  feel?: Feel;
  durationMin?: number;
  intensity?: TrainingIntensity;
  kite?: KiteDetails;
  ringsAreas?: RingsArea[];
  ringsSkills?: RingsSkill[];
  sourceApp?: 'die-ringe';
  note?: string;
  activityName?: string;
  manualLoad?: number;
  mobilityDone?: string[];
  boardOffLevel?: number;
  createdAt: number;
}

export type MovementPattern =
  | 'squat' | 'hinge' | 'single-leg'
  | 'push-h' | 'push-v' | 'pull-h' | 'pull-v'
  | 'carry' | 'core-anti-ext' | 'core-anti-rot' | 'core-anti-lat'
  | 'hamstring-curl';

export type Equipment =
  | 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'bodyweight' | 'band' | 'rings';

export type BodyRegion =
  | 'lower-back' | 'knee' | 'shoulder' | 'elbow-wrist' | 'hip-groin' | 'neck' | 'ribs' | 'ankle';

export interface Injury {
  region: BodyRegion;
  since: string;   // ISO-Datum, Beginn
  until: string;   // ISO-Datum, voraussichtliches Ende (inklusiv)
}

export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'rings' | 'sprint' | 'mobility' | 'boardoff';
  metric: 'weight_reps' | 'reps' | 'time' | 'distance';
  incrementKg?: number;
  perSide?: boolean;
  timer?: { mode: 'countdown' | 'countup' | 'pace'; defaultSec?: number };
  restSec?: number;
  youtubeQuery?: string;
  pattern?: MovementPattern;
  equipment?: Equipment;
  strains?: BodyRegion[];   // Regionen unter nennenswerter Last; nur für den Verletzungs-Modus
}

export interface ActiveTimer {
  id: 'active';
  mode: 'countdown' | 'countup' | 'pace';
  kind: 'exercise' | 'rest';
  label: string;
  sourceId?: string;
  startedAt: number;
  endTimestamp?: number;
  defaultSec?: number;
}

export interface BodyweightLog {
  date: string;
  kg: number;
}

export interface Settings {
  id: 'settings';
  bodyweightLog: BodyweightLog[];
  deloadDismissedUntil?: string;
  loadThreshold7d: number;
  hamburgDays: number[];
  timerAudioEnabled?: boolean;
  kiteFocusTags: string[];
  boardOffLevel?: number;
  boardOffHasRig?: boolean;
  injuries?: Injury[];
}

export interface TemplateExercise {
  exerciseId: string;
  sets: number;
  defaultReps?: number;
  defaultSec?: number;
  defaultDistanceM?: number;
  note?: string;
}

export interface SessionTemplate {
  type: Extract<SessionType, 'A' | 'B' | 'RINGS' | 'KB' | 'BOARD_OFF'>;
  title: string;
  subtitle: string;
  exercises: TemplateExercise[];
}

export interface BoardOffSlotBase {
  exerciseId: string;
  sets: number;
  defaultReps?: number;
  defaultSec?: number;
  mistake: string;
  regression: string;
}

export interface BoardOffSlot extends BoardOffSlotBase {
  needsRig?: boolean;
  rigFreeAlternative?: BoardOffSlotBase;
}

export interface BoardOffLevel {
  level: number;
  label: string;
  skill: string | null;
  gate: string;
  slots: BoardOffSlot[];
}

export interface PlannedSession {
  date: string;
  type: Extract<SessionType, 'A' | 'B' | 'RINGS' | 'KB' | 'SPRINT'>;
  location: 'Gym' | 'Zuhause';
  overriddenByKite: boolean;
  completed: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  purpose?: string;
  dose?: string;
  cue?: string;
  cueDetail?: string;
  timerSec?: number;
  timerMode?: 'countdown' | 'pace';
}

export interface MobilityChecklistTemplate {
  variant: 'pre-session' | 'morning' | 'hip';
  title: string;
  durationMin: number;
  items: ChecklistItem[];
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  sessions: Session[];
  exercises: Exercise[];
  settings: Settings;
}
