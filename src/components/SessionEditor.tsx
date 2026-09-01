import { useState } from 'react';
import type { Exercise, Feel, KiteDetails, RingsArea, RingsSkill, Session, SetLog, TrainingIntensity } from '../types';
import { CheckIcon } from './Icons';
import { KiteDetailsEditor } from './KiteDetailsEditor';
import { SessionDatePicker } from './SessionDatePicker';
import { SubstitutionSheet } from './SubstitutionSheet';

const feelOptions: { value: Feel | undefined; label: string }[] = [
  { value: undefined, label: 'Nicht erfasst' },
  { value: 'good', label: 'Gut' },
  { value: 'ok', label: 'Okay' },
  { value: 'wrecked', label: 'Leer' }
];

const ringsAreas: { value: RingsArea; label: string }[] = [
  { value: 'mobility', label: 'Mobility' },
  { value: 'upper', label: 'Oberkörper' },
  { value: 'legs', label: 'Legs' },
  { value: 'skills', label: 'Skills' }
];

const ringsSkills: { value: RingsSkill; label: string }[] = [
  { value: 'ring-muscle-up', label: 'Ring Muscle-up' },
  { value: 'l-sit', label: 'L-Sit' },
  { value: 'side-split', label: 'Side Split' },
  { value: 'pistol-squat', label: 'Pistol Squat' }
];

export function SessionEditor({
  session,
  exercises,
  focusTags,
  onSave,
  onCancel,
  onDelete
}: {
  session: Session;
  exercises: Exercise[];
  focusTags: string[];
  onSave: (session: Session) => Promise<void>;
  onCancel: () => void;
  onDelete: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Session>(session);
  const [saving, setSaving] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [originals, setOriginals] = useState<Record<string, string>>({});

  function substituteExercise(entryIndex: number, newExerciseId: string) {
    const entry = draft.entries[entryIndex];
    if (!entry || newExerciseId === entry.exerciseId) {
      setSwapIndex(null);
      return;
    }
    const originalId = originals[entry.exerciseId] ?? entry.exerciseId;
    const newExercise = exercises.find((item) => item.id === newExerciseId);
    setOriginals((current) => {
      const next = { ...current };
      delete next[entry.exerciseId];
      if (newExerciseId !== originalId) next[newExerciseId] = originalId;
      return next;
    });
    setDraft((current) => ({
      ...current,
      entries: current.entries.map((item, index) => index === entryIndex
        ? { exerciseId: newExerciseId, sets: item.sets.map((set) => ({ ...set, kg: undefined, perSide: newExercise?.perSide, successful: undefined })) }
        : item)
    }));
    setSwapIndex(null);
  }

  function updateSet(entryIndex: number, setIndex: number, set: SetLog) {
    setDraft((current) => ({
      ...current,
      entries: current.entries.map((entry, currentEntryIndex) => currentEntryIndex === entryIndex
        ? { ...entry, sets: entry.sets.map((candidate, currentSetIndex) => currentSetIndex === setIndex ? set : candidate) }
        : entry)
    }));
  }

  function addSet(entryIndex: number) {
    setDraft((current) => ({
      ...current,
      entries: current.entries.map((entry, currentEntryIndex) => {
        if (currentEntryIndex !== entryIndex) return entry;
        const previous = entry.sets.at(-1);
        return { ...entry, sets: [...entry.sets, previous ? { ...previous, successful: undefined } : {}] };
      })
    }));
  }

  function removeSet(entryIndex: number, setIndex: number) {
    setDraft((current) => ({
      ...current,
      entries: current.entries.map((entry, currentEntryIndex) => currentEntryIndex === entryIndex
        ? { ...entry, sets: entry.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex) }
        : entry)
    }));
  }

  function toggleRingArea(area: RingsArea) {
    const current = draft.ringsAreas ?? [];
    setDraft({ ...draft, ringsAreas: current.includes(area) ? current.filter((value) => value !== area) : [...current, area] });
  }

  function toggleRingSkill(skill: RingsSkill) {
    const current = draft.ringsSkills ?? [];
    setDraft({ ...draft, ringsSkills: current.includes(skill) ? current.filter((value) => value !== skill) : [...current, skill] });
  }

  async function save() {
    setSaving(true);
    await onSave({ ...draft, note: draft.note?.trim() || undefined, activityName: draft.activityName?.trim() || undefined });
  }

  return (
    <div className="session-editor">
      <SessionDatePicker value={draft.date} onChange={(date) => setDraft({ ...draft, date })} />

      <section className="session-edit-section">
        <span className="eyebrow">Gefühl</span>
        <div className="edit-choice-grid four">
          {feelOptions.map((option) => <button type="button" key={option.value ?? 'none'} className={draft.feel === option.value ? 'selected' : ''} onClick={() => setDraft({ ...draft, feel: option.value })}>{option.label}</button>)}
        </div>
      </section>

      {(draft.type === 'KITE' || draft.type === 'RINGS') && (
        <section className="session-edit-section">
          <span className="eyebrow">Intensität</span>
          <div className="edit-choice-grid three">
            {(['chill', 'normal', 'hard'] as TrainingIntensity[]).map((value) => <button type="button" key={value} className={draft.intensity === value ? 'selected' : ''} onClick={() => setDraft({ ...draft, intensity: value })}>{value === 'chill' ? 'Locker' : value === 'normal' ? 'Normal' : 'Hart'}</button>)}
          </div>
        </section>
      )}

      <section className="session-edit-fields">
        {draft.type === 'OTHER' && <label><span>Aktivität</span><input value={draft.activityName ?? ''} onChange={(event) => setDraft({ ...draft, activityName: event.target.value })} /></label>}
        <label><span>Dauer in Minuten</span><input type="number" inputMode="numeric" min="0" value={draft.durationMin ?? ''} onChange={(event) => setDraft({ ...draft, durationMin: event.target.value === '' ? undefined : Number(event.target.value) })} /></label>
        {draft.type === 'OTHER' && <label><span>Lastpunkte</span><input type="number" inputMode="decimal" min="0.5" max="3" step="0.5" value={draft.manualLoad ?? 1.5} onChange={(event) => setDraft({ ...draft, manualLoad: Number(event.target.value) })} /></label>}
      </section>

      {draft.type === 'RINGS' && (
        <section className="session-edit-section">
          <span className="eyebrow">Ringe-Details</span>
          <div className="edit-choice-grid two">
            {ringsAreas.map((option) => <button type="button" key={option.value} className={draft.ringsAreas?.includes(option.value) ? 'selected' : ''} onClick={() => toggleRingArea(option.value)}>{option.label}</button>)}
          </div>
          <div className="edit-chip-list">
            {ringsSkills.map((option) => <button type="button" key={option.value} className={draft.ringsSkills?.includes(option.value) ? 'selected' : ''} onClick={() => toggleRingSkill(option.value)}>{option.label}</button>)}
          </div>
        </section>
      )}

      {draft.entries.length > 0 && (
        <section className="session-edit-section">
          <span className="eyebrow">Übungen und Sätze</span>
          <div className="session-edit-exercises">
            {draft.entries.map((entry, entryIndex) => {
              const exercise = exercises.find((candidate) => candidate.id === entry.exerciseId);
              return (
                <div className="session-edit-exercise" key={entry.exerciseId}>
                  <strong>{exercise?.name ?? entry.exerciseId}</strong>
                  {entry.sets.map((set, setIndex) => (
                    <EditableSet
                      key={setIndex}
                      index={setIndex}
                      exercise={exercise}
                      set={set}
                      onChange={(next) => updateSet(entryIndex, setIndex, next)}
                      onRemove={() => removeSet(entryIndex, setIndex)}
                    />
                  ))}
                  <div className="session-edit-exercise-actions">
                    <button type="button" className="add-set-button" onClick={() => addSet(entryIndex)}>+ Satz</button>
                    {exercise?.pattern && (
                      <button type="button" className="add-set-button" onClick={() => setSwapIndex(entryIndex)}>Übung tauschen</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {draft.type === 'KITE' && (
        <KiteDetailsEditor
          details={draft.kite}
          focusTags={focusTags}
          idleLabel="Wird beim Speichern übernommen"
          savedLabel="Übernommen"
          onChange={async (kite: KiteDetails | undefined) => setDraft((current) => ({ ...current, kite }))}
        />
      )}

      <label className="session-edit-note"><span>Notiz</span><textarea rows={3} value={draft.note ?? ''} onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></label>
      {draft.mobilityDone?.length ? <p className="session-edit-checklist"><CheckIcon /> {draft.mobilityDone.length} Checklistenpunkte sind mit dieser Session verknüpft.</p> : null}

      <div className="session-edit-actions">
        <button type="button" className="primary" disabled={saving} onClick={() => void save()}>{saving ? 'Speichert …' : 'Änderungen speichern'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Abbrechen</button>
        <button type="button" className="session-delete-button" onClick={() => void onDelete()}>Session löschen</button>
      </div>

      {swapIndex !== null && draft.entries[swapIndex] && (() => {
        const entry = draft.entries[swapIndex];
        const current = exercises.find((item) => item.id === entry.exerciseId);
        if (!current) return null;
        const originalId = originals[entry.exerciseId];
        return (
          <SubstitutionSheet
            exercise={current}
            originalExercise={originalId ? exercises.find((item) => item.id === originalId) : undefined}
            allExercises={exercises}
            usedExerciseIds={draft.entries.map((item) => item.exerciseId)}
            onChoose={(id) => substituteExercise(swapIndex, id)}
            onReset={() => { if (originalId) substituteExercise(swapIndex, originalId); }}
            onClose={() => setSwapIndex(null)}
          />
        );
      })()}
    </div>
  );
}

function EditableSet({
  index,
  exercise,
  set,
  onChange,
  onRemove
}: {
  index: number;
  exercise?: Exercise;
  set: SetLog;
  onChange: (set: SetLog) => void;
  onRemove: () => void;
}) {
  const showKg = exercise?.metric === 'weight_reps' || set.kg !== undefined;
  const showReps = exercise?.metric === 'weight_reps' || exercise?.metric === 'reps' || set.reps !== undefined;
  const showSeconds = exercise?.metric === 'time' || set.sec !== undefined;
  const showDistance = exercise?.metric === 'distance' || set.distanceM !== undefined;

  function number(key: 'kg' | 'reps' | 'sec' | 'distanceM', value: string) {
    onChange({ ...set, [key]: value === '' ? undefined : Number(value) });
  }

  return (
    <div className="editable-set">
      <b>{index + 1}</b>
      {showKg && <label><span>kg</span><input type="number" inputMode="decimal" value={set.kg ?? ''} onChange={(event) => number('kg', event.target.value)} /></label>}
      {showReps && <label><span>Wdh.</span><input type="number" inputMode="numeric" value={set.reps ?? ''} onChange={(event) => number('reps', event.target.value)} /></label>}
      {showSeconds && <label><span>Sek.</span><input type="number" inputMode="decimal" value={set.sec ?? ''} onChange={(event) => number('sec', event.target.value)} /></label>}
      {showDistance && <label><span>Meter</span><input type="number" inputMode="decimal" value={set.distanceM ?? ''} onChange={(event) => number('distanceM', event.target.value)} /></label>}
      <button type="button" className={`edit-set-state ${set.successful === true ? 'successful' : set.successful === false ? 'failed' : ''}`} aria-label="Satzergebnis ändern" onClick={() => onChange({ ...set, successful: set.successful === undefined ? true : set.successful === true ? false : undefined })}>{set.successful === true ? '✓' : set.successful === false ? '×' : '○'}</button>
      <button type="button" className="remove-set-button" aria-label={`Satz ${index + 1} entfernen`} onClick={onRemove}>−</button>
    </div>
  );
}
