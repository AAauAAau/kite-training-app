import type { BodyRegion, Exercise, Injury, Session, Settings } from '../types';
import { localDate } from './date.ts';
import { alternativesFor, groupByEquipment } from './substitution.ts';

export const INJURY_DURATION_DAYS = [7, 14, 28] as const;

/** Templates, deren Aufbau der Verletzungs-Modus anpasst. */
export const injurySessionTypes: Session['type'][] = ['A', 'B', 'KB', 'BOARD_OFF'];

export const bodyRegionLabels: Record<BodyRegion, string> = {
  'lower-back': 'Unterer Rücken',
  knee: 'Knie',
  shoulder: 'Schulter',
  'elbow-wrist': 'Ellenbogen / Handgelenk',
  'hip-groin': 'Hüfte / Leiste',
  neck: 'Nacken',
  ribs: 'Rippen',
  ankle: 'Sprunggelenk'
};

/** In der Einstellungs-Auswahl angebotene Regionen (ohne die ungenutzte `ankle`). */
export const selectableBodyRegions: BodyRegion[] = [
  'lower-back', 'knee', 'shoulder', 'elbow-wrist', 'hip-groin', 'neck', 'ribs'
];

export interface InjuryState {
  /** Regionen aktiver Schonungen — sperren Übungen bis der Nutzer die Schonung beendet. */
  blockedRegions: BodyRegion[];
  /** Schonungen, deren `until` vor `date` liegt — Erinnerung fällig, filtern aber weiter. */
  expired: Injury[];
}

/**
 * Aktive und abgelaufene Schonungen zum Stichtag. Eine Schonung wirkt ab `since`
 * und bleibt wirksam, bis der Nutzer sie beendet; `until` steuert nur die Erinnerung.
 */
export function injuryState(settings: Pick<Settings, 'injuries'>, date = localDate()): InjuryState {
  const started = (settings.injuries ?? []).filter((injury) => injury.since <= date);
  return {
    blockedRegions: [...new Set(started.map((injury) => injury.region))],
    expired: started.filter((injury) => injury.until < date)
  };
}

/** Belastet die Übung eine gesperrte Region? */
export function isContraindicated(exercise: Exercise, blocked: BodyRegion[]): boolean {
  return exercise.strains?.some((region) => blocked.includes(region)) ?? false;
}

/**
 * Erste schonende Alternative: gleiches `pattern`, kein `strains`-Konflikt, nicht bereits
 * genutzt. Reihenfolge über `groupByEquipment` (Langhantel → … → Ringe, dann alphabetisch).
 * `null`, wenn die Quelle kein `pattern` hat oder jede Alternative betroffen ist.
 */
export function injurySafeAlternative(
  exerciseId: string,
  exercises: Exercise[],
  blocked: BodyRegion[],
  usedExerciseIds: string[] = []
): Exercise | null {
  const ordered = groupByEquipment(alternativesFor(exerciseId, exercises, usedExerciseIds))
    .flatMap((group) => group.items);
  return ordered.find((exercise) => !isContraindicated(exercise, blocked)) ?? null;
}

export interface InjuryAdjustment {
  exerciseIds: string[];                  // finale IDs in Reihenfolge, ohne entfallene
  swaps: { from: string; to: string }[];  // für Hinweis + draft.substitutions
  dropped: string[];                      // entfallene Original-IDs, für den Hinweis
}

/**
 * Baut die Slot-Liste eines Templates oder Board-Off-Levels für die aktive Schonung um:
 * betroffene Slots werden auf die erste schonende Alternative getauscht, sonst ausgelassen.
 * Zwei betroffene Slots gleichen Musters bekommen nie dieselbe Alternative.
 */
export function applyInjuryToSlots(
  slots: { exerciseId: string }[],
  exercises: Exercise[],
  blocked: BodyRegion[]
): InjuryAdjustment {
  const exerciseIds: string[] = [];
  const swaps: { from: string; to: string }[] = [];
  const dropped: string[] = [];
  const taken = new Set(slots.map((slot) => slot.exerciseId));

  for (const slot of slots) {
    const exercise = exercises.find((item) => item.id === slot.exerciseId);
    if (!exercise || !isContraindicated(exercise, blocked)) {
      exerciseIds.push(slot.exerciseId);
      continue;
    }
    const alternative = injurySafeAlternative(slot.exerciseId, exercises, blocked, [...taken]);
    if (!alternative) {
      dropped.push(slot.exerciseId);
      continue;
    }
    swaps.push({ from: slot.exerciseId, to: alternative.id });
    exerciseIds.push(alternative.id);
    taken.add(alternative.id);
  }

  return { exerciseIds, swaps, dropped };
}
