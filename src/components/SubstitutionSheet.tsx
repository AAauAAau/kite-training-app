import { t } from '../i18n';
import { useLang } from '../i18n/react';
import { localizeExercise } from '../logic/localize';
import { alternativesFor, equipmentLabel, groupByEquipment } from '../logic/substitution';
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
  const lang = useLang();
  const groups = groupByEquipment(alternativesFor(exercise.id, allExercises, usedExerciseIds));

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="bottom-sheet substitution-sheet" onClick={(event) => event.stopPropagation()}>
        <span className="eyebrow">{t('substitution.eyebrow')}</span>
        <h2>{t('substitution.title', { name: localizeExercise(exercise, lang).name })}</h2>

        {originalExercise && (
          <button type="button" className="substitution-reset" onClick={onReset}>
            {t('substitution.resetTo', { name: localizeExercise(originalExercise, lang).name })}
          </button>
        )}

        {groups.length === 0 ? (
          <p className="muted">{t('substitution.none')}</p>
        ) : (
          <div className="substitution-groups">
            {groups.map((group) => (
              <div className="substitution-group" key={group.equipment}>
                <span className="substitution-equipment">{t(equipmentLabel(group.equipment))}</span>
                {group.items.map((item) => (
                  <button type="button" className="substitution-option" key={item.id} onClick={() => onChoose(item.id)}>
                    {localizeExercise(item, lang).name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <button type="button" className="text-button sheet-skip" onClick={onClose}>{t('common.cancel')}</button>
      </section>
    </div>
  );
}
