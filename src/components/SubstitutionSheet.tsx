import { alternativesFor, equipmentLabels, groupByEquipment } from '../logic/substitution';
import type { Exercise } from '../types';

export function SubstitutionSheet({
  exercise,
  originalExercise,
  allExercises,
  usedExerciseIds,
  onChoose,
  onReset,
  onClose
}: {
  exercise: Exercise;
  originalExercise?: Exercise;
  allExercises: Exercise[];
  usedExerciseIds: string[];
  onChoose: (exerciseId: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const groups = groupByEquipment(alternativesFor(exercise.id, allExercises, usedExerciseIds));

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="bottom-sheet substitution-sheet" onClick={(event) => event.stopPropagation()}>
        <span className="eyebrow">Gleiches Bewegungsmuster</span>
        <h2>{exercise.name} ersetzen</h2>

        {originalExercise && (
          <button type="button" className="substitution-reset" onClick={onReset}>
            ↩ Zurück zu {originalExercise.name}
          </button>
        )}

        {groups.length === 0 ? (
          <p className="muted">Für diese Übung ist keine Alternative hinterlegt.</p>
        ) : (
          <div className="substitution-groups">
            {groups.map((group) => (
              <div className="substitution-group" key={group.equipment}>
                <span className="substitution-equipment">{equipmentLabels[group.equipment]}</span>
                {group.items.map((item) => (
                  <button type="button" className="substitution-option" key={item.id} onClick={() => onChoose(item.id)}>
                    {item.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <button type="button" className="text-button sheet-skip" onClick={onClose}>Abbrechen</button>
      </section>
    </div>
  );
}
