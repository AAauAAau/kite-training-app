import type { Equipment, Exercise } from '../types';

const equipmentOrder: Equipment[] = [
  'barbell', 'dumbbell', 'kettlebell', 'machine', 'bodyweight', 'band', 'rings'
];

export const equipmentLabels: Record<Equipment, string> = {
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  kettlebell: 'Kettlebell',
  machine: 'Maschine',
  bodyweight: 'Körpergewicht',
  band: 'Band',
  rings: 'Ringe'
};

/**
 * Alternativen zur gleichen Bewegungsmuster-Kategorie, ohne die Quelle selbst und ohne
 * bereits in der Einheit genutzte Übungen. Alphabetisch nach Name (locale 'de').
 */
export function alternativesFor(
  exerciseId: string,
  exercises: Exercise[],
  usedExerciseIds: string[] = []
): Exercise[] {
  const source = exercises.find((exercise) => exercise.id === exerciseId);
  if (!source?.pattern) return [];
  const used = new Set(usedExerciseIds);
  return exercises
    .filter((exercise) =>
      exercise.pattern === source.pattern &&
      exercise.id !== source.id &&
      !used.has(exercise.id)
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/** Gruppiert Übungen nach Gerät in fester Reihenfolge; leere Gruppen entfallen. */
export function groupByEquipment(
  exercises: Exercise[]
): { equipment: Equipment; items: Exercise[] }[] {
  return equipmentOrder
    .map((equipment) => ({
      equipment,
      items: exercises.filter((exercise) => exercise.equipment === equipment)
    }))
    .filter((group) => group.items.length > 0);
}
