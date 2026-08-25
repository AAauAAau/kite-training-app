export type SessionType = 'A' | 'B' | 'RINGS' | 'KB' | 'SPRINT' | 'MOBILITY' | 'KITE' | 'PADEL' | 'BOARD_OFF';
export type Feel = 'good' | 'ok' | 'wrecked';
export type TrainingIntensity = 'chill' | 'normal' | 'hard';
export type KiteIntensity = TrainingIntensity;
export type RingsArea = 'mobility' | 'upper' | 'legs' | 'skills';
export type RingsSkill = 'ring-muscle-up' | 'l-sit' | 'side-split' | 'pistol-squat';

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
  ringsAreas?: RingsArea[];
  ringsSkills?: RingsSkill[];
  sourceApp?: 'die-ringe';
  note?: string;
  mobilityDone?: string[];
  createdAt: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'rings' | 'sprint' | 'mobility' | 'boardoff';
  metric: 'weight_reps' | 'reps' | 'time' | 'distance';
  incrementKg?: number;
  perSide?: boolean;
  youtubeQuery?: string;
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
  type: Extract<SessionType, 'A' | 'B' | 'RINGS' | 'BOARD_OFF'>;
  title: string;
  subtitle: string;
  exercises: TemplateExercise[];
}

export interface BoardOffStage {
  level: number;
  title: string;
  summary: string;
  template: SessionTemplate;
}

export interface PlannedSession {
  date: string;
  type: Extract<SessionType, 'A' | 'B' | 'RINGS' | 'SPRINT'>;
  location: 'Gym' | 'Zuhause';
  overriddenByKite: boolean;
  completed: boolean;
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  sessions: Session[];
  exercises: Exercise[];
  settings: Settings;
}
