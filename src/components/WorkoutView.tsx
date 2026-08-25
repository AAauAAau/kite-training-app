import { useState } from 'react';
import { boardOffStages, mobilityItems, templates } from '../data/seed';
import { localDate } from '../logic/date';
import { lastLoggedSet, nextTarget, sprintPrescription, sprintWarnings, sprintWeek } from '../logic/training';
import { useAppStore } from '../store';
import type { Entry, Exercise, RingsArea, RingsSkill, Session, SessionTemplate, SetLog, SessionType, TrainingIntensity } from '../types';
import { AlertIcon, CheckIcon, ChevronIcon, PlayIcon } from './Icons';

interface WorkoutViewProps {
  onSaved: (sessionId: string) => void;
  onCancel: () => void;
}

type Draft = {
  type: SessionType;
  title?: string;
  entries: Entry[];
  exerciseNotes: Record<string, string>;
  mobilityDone: string[];
  note: string;
  durationMin?: number;
  intensity?: TrainingIntensity;
  ringsAreas?: RingsArea[];
  ringsSkills?: RingsSkill[];
  sourceApp?: 'die-ringe';
};

const ringsAreaOptions: { value: RingsArea; label: string; detail: string }[] = [
  { value: 'mobility', label: 'Mobility', detail: 'Beweglichkeit & Vorbereitung' },
  { value: 'upper', label: 'Oberkörper', detail: 'Calisthenics' },
  { value: 'legs', label: 'Bodyweight Legs', detail: 'Beintraining' },
  { value: 'skills', label: 'Skill-Training', detail: 'Technik & Progression' }
];

const ringsSkillOptions: { value: RingsSkill; label: string }[] = [
  { value: 'ring-muscle-up', label: 'Ring Muscle-up' },
  { value: 'l-sit', label: 'L-Sit' },
  { value: 'side-split', label: 'Side Split' },
  { value: 'pistol-squat', label: 'Pistol Squat' }
];

export function WorkoutView({ onSaved, onCancel }: WorkoutViewProps) {
  const { sessions, exercises, addSession } = useAppStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [boardOffPicker, setBoardOffPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const week = sprintWeek(sessions);

  function startTemplate(template: SessionTemplate) {
    const entries = template.exercises.map((item) => {
      const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
      const previous = lastLoggedSet(item.exerciseId, sessions);
      return {
        exerciseId: item.exerciseId,
        sets: Array.from({ length: item.sets }, () => ({
          kg: previous?.kg,
          reps: previous?.reps ?? item.defaultReps,
          sec: previous?.sec ?? item.defaultSec,
          distanceM: previous?.distanceM ?? item.defaultDistanceM,
          perSide: exercise?.perSide,
          successful: true
        }))
      };
    });
    setDraft({
      type: template.type,
      title: template.title,
      entries,
      exerciseNotes: Object.fromEntries(template.exercises.filter((item) => item.note).map((item) => [item.exerciseId, item.note!])),
      mobilityDone: [],
      note: ''
    });
    setBoardOffPicker(false);
  }

  function startSprint() {
    const prescription = sprintPrescription(week);
    setDraft({
      type: 'SPRINT', title: `Sprint · Woche ${week}`, exerciseNotes: {}, mobilityDone: [], note: '',
      entries: [{ exerciseId: 'sprint', sets: Array.from({ length: 6 }, () => ({ distanceM: prescription.distance, successful: true })) }]
    });
  }

  function startRings() {
    setDraft({
      type: 'RINGS', title: 'Die Ringe', entries: [], exerciseNotes: {}, mobilityDone: [], note: '',
      durationMin: 45, intensity: 'normal', ringsAreas: [], ringsSkills: [], sourceApp: 'die-ringe'
    });
  }

  function startPadel() {
    setDraft({
      type: 'PADEL', title: 'Padel Tennis', entries: [], exerciseNotes: {},
      mobilityDone: [], note: '', durationMin: 90
    });
  }

  function updateSet(entryIndex: number, setIndex: number, next: SetLog) {
    if (!draft) return;
    const entries = draft.entries.map((entry, currentEntry) => currentEntry === entryIndex
      ? { ...entry, sets: entry.sets.map((set, currentSet) => currentSet === setIndex ? next : set) }
      : entry
    );
    setDraft({ ...draft, entries });
  }

  async function save() {
    if (!draft) return;
    if (draft.type === 'RINGS' && !draft.ringsAreas?.length) return;
    if (draft.type === 'SPRINT') {
      const warnings = sprintWarnings(localDate(), sessions);
      if (warnings.length && !window.confirm(`${warnings.join('\n\n')}\n\nTrotzdem speichern?`)) return;
    }
    setSaving(true);
    const session: Session = {
      id: crypto.randomUUID(), date: localDate(), type: draft.type, entries: draft.entries,
      mobilityDone: draft.mobilityDone, note: draft.note.trim() || undefined,
      durationMin: draft.durationMin, intensity: draft.intensity,
      ringsAreas: draft.ringsAreas, ringsSkills: draft.ringsSkills,
      sourceApp: draft.sourceApp, createdAt: Date.now()
    };
    await addSession(session);
    onSaved(session.id);
  }

  if (!draft && boardOffPicker) return (
    <main className="page workout-menu">
      <header className="sticky-workout-header">
        <button className="icon-button" onClick={() => setBoardOffPicker(false)} aria-label="Zurück">‹</button>
        <div><span className="eyebrow">Land-Drills zu Hause</span><h1>Board-Off-Stufe</h1></div>
        <span className="exercise-count">5</span>
      </header>
      <section className="boardoff-principle card"><strong>Immer vorderer Fuß zuerst rein.</strong><p>Variiere Winkel und Board-Lage bewusst – das Muskelgedächtnis soll auch Fehlerbilder kennen.</p></section>
      <div className="stage-list">
        {boardOffStages.map((stage) => (
          <button className="stage-card card" key={stage.level} onClick={() => startTemplate(stage.template)}>
            <span className="stage-number">{stage.level}</span>
            <span><strong>{stage.title}</strong><small>{stage.summary}</small></span>
            <ChevronIcon />
          </button>
        ))}
      </div>
    </main>
  );

  if (!draft) return (
    <main className="page workout-menu">
      <header className="page-header"><div><span className="eyebrow">Was passt heute?</span><h1>Training starten</h1></div></header>
      <div className="template-list">
        {templates.map((template) => (
          <button className="template-card card" key={template.type} onClick={() => startTemplate(template)}>
            <span className={`template-letter type-${template.type.toLowerCase()}`}>{template.type === 'RINGS' ? 'R' : template.type}</span>
            <span><strong>{template.title}</strong><small>{template.subtitle}</small></span><ChevronIcon />
          </button>
        ))}
        <button className="template-card rings-card card" onClick={startRings}>
          <span className="template-letter type-rings">R</span>
          <span><strong>Die Ringe</strong><small>Bereiche, Skills & Belastung kompakt loggen</small></span><ChevronIcon />
        </button>
        <button className="template-card sprint-card card" onClick={startSprint}>
          <span className="template-letter type-sprint">S</span>
          <span><strong>Sprint · Woche {week}</strong><small>6×{sprintPrescription(week).distance} m · {sprintPrescription(week).intensity}</small></span><ChevronIcon />
        </button>
        <button className="template-card boardoff-card card" onClick={() => setBoardOffPicker(true)}>
          <span className="template-letter type-board_off">B</span>
          <span><strong>Board-Off Drills</strong><small>Land-Progression · Stufe 0–4</small></span><ChevronIcon />
        </button>
        <button className="template-card padel-card card" onClick={startPadel}>
          <span className="template-letter type-padel">P</span>
          <span><strong>Padel Tennis</strong><small>Aktivitätslast 1.5 · Dauer optional</small></span><ChevronIcon />
        </button>
      </div>
      <button className="text-button cancel-link" onClick={onCancel}>Abbrechen</button>
    </main>
  );

  const currentTemplate = templates.find((template) => template.type === draft.type);
  const prescription = draft.type === 'SPRINT' ? sprintPrescription(week) : null;
  return (
    <main className="page workout-active">
      <header className="sticky-workout-header">
        <button className="icon-button" onClick={() => setDraft(null)} aria-label="Zurück">‹</button>
        <div><span className="eyebrow">Heute</span><h1>{draft.title ?? currentTemplate?.title ?? `Sprint · Woche ${week}`}</h1></div>
        <span className="exercise-count">{draft.type === 'RINGS' ? draft.ringsAreas?.length ?? 0 : draft.entries.length}</span>
      </header>

      {draft.type === 'SPRINT' && (
        <>
          <section className="sprint-safety"><AlertIcon /><strong>Zwicken in der Oberschenkelrückseite → sofort abbrechen, nicht auslaufen.</strong></section>
          <section className="warmup card"><span className="eyebrow">10 min Warm-up</span><p>Skippings · A-Läufe · Anläufe</p><strong>6×{prescription?.distance} m @ {prescription?.intensity}</strong></section>
        </>
      )}

      {(draft.type === 'A' || draft.type === 'B') && (
        <section className="mobility-card card">
          <div><span className="eyebrow">5 min vorab</span><h3>Mobility</h3></div>
          {mobilityItems.map((item) => {
            const checked = draft.mobilityDone.includes(item.id);
            return <button key={item.id} className={checked ? 'checked' : ''} onClick={() => setDraft({ ...draft, mobilityDone: checked ? draft.mobilityDone.filter((id) => id !== item.id) : [...draft.mobilityDone, item.id] })}><i>{checked && <CheckIcon />}</i><span>{item.name}</span></button>;
          })}
        </section>
      )}

      {draft.type === 'RINGS' && (
        <RingsLogger draft={draft} update={setDraft} />
      )}

      {draft.type === 'BOARD_OFF' && (
        <section className="boardoff-setup card">
          <span className="eyebrow">Sicheres Setup</span>
          <h3>Vor dem Start</h3>
          <ul>
            <li>Stabile Klimmzugstange oder Kitebar an sicheren Schlaufen</li>
            <li>Board mit echten Footstraps und Pads</li>
            <li>Matte oder Teppich unter dem Board</li>
            <li>Füße hängen nur knapp über dem Boden</li>
          </ul>
          <strong>Vorderer Fuß immer zuerst.</strong>
        </section>
      )}

      {draft.type === 'PADEL' && (
        <section className="padel-options card">
          <span className="eyebrow">Optionale Dauer</span>
          <h3>Wie lange habt ihr gespielt?</h3>
          <div className="duration-picker">
            {[60, 90, 120].map((minutes) => (
              <button key={minutes} className={draft.durationMin === minutes ? 'selected' : ''} onClick={() => setDraft({ ...draft, durationMin: minutes })}>{minutes} min</button>
            ))}
          </div>
          <p>Padel zählt unabhängig von der Dauer mit einer Trainingslast von 1.5.</p>
        </section>
      )}

      {draft.type !== 'RINGS' && <div className="exercise-stack">
        {draft.entries.map((entry, entryIndex) => {
          const exercise = exercises.find((item) => item.id === entry.exerciseId);
          if (!exercise) return null;
          const target = nextTarget(exercise.id, sessions, exercises);
          return <ExerciseEditor key={exercise.id} exercise={exercise} entry={entry} target={target} note={draft.exerciseNotes[exercise.id]} update={(setIndex, set) => updateSet(entryIndex, setIndex, set)} />;
        })}
      </div>}

      <label className="note-field card"><span>Notiz · optional</span><textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Technik, Schmerz, Variante …" rows={2} /></label>
      <div className="workout-actions"><button className="primary" onClick={save} disabled={saving || (draft.type === 'RINGS' && !draft.ringsAreas?.length)}>{saving ? 'Speichert …' : draft.type === 'RINGS' && !draft.ringsAreas?.length ? 'Bereich auswählen' : 'Einheit abschließen'}</button></div>
    </main>
  );
}

function RingsLogger({ draft, update }: { draft: Draft; update: (draft: Draft) => void }) {
  const areas = draft.ringsAreas ?? [];
  const skills = draft.ringsSkills ?? [];

  function toggleArea(area: RingsArea) {
    const selected = areas.includes(area);
    update({
      ...draft,
      ringsAreas: selected ? areas.filter((value) => value !== area) : [...areas, area],
      ringsSkills: area === 'skills' && selected ? [] : skills
    });
  }

  function toggleSkill(skill: RingsSkill) {
    const nextSkills = skills.includes(skill) ? skills.filter((value) => value !== skill) : [...skills, skill];
    update({
      ...draft,
      ringsSkills: nextSkills,
      ringsAreas: nextSkills.length && !areas.includes('skills') ? [...areas, 'skills'] : areas
    });
  }

  return (
    <div className="rings-logger">
      <section className="rings-source card">
        <span className="eyebrow">Externes Training</span>
        <h3>Details bleiben in „Die Ringe“</h3>
        <p>Hier erfasst du nur, was du trainiert hast und wie belastend die gesamte Einheit war.</p>
      </section>

      <section className="rings-section card">
        <span className="eyebrow">Was war dabei?</span>
        <div className="rings-area-grid">
          {ringsAreaOptions.map((option) => {
            const selected = areas.includes(option.value);
            return (
              <button key={option.value} className={selected ? 'selected' : ''} onClick={() => toggleArea(option.value)}>
                <i>{selected && <CheckIcon />}</i>
                <span><strong>{option.label}</strong><small>{option.detail}</small></span>
              </button>
            );
          })}
        </div>
      </section>

      {areas.includes('skills') && (
        <section className="rings-section card">
          <span className="eyebrow">Welche Skills?</span>
          <div className="skill-picker">
            {ringsSkillOptions.map((option) => (
              <button key={option.value} className={skills.includes(option.value) ? 'selected' : ''} onClick={() => toggleSkill(option.value)}>{option.label}</button>
            ))}
          </div>
        </section>
      )}

      <section className="rings-section card">
        <span className="eyebrow">Dauer</span>
        <div className="rings-duration-picker">
          {[30, 45, 60, 90].map((minutes) => (
            <button key={minutes} className={draft.durationMin === minutes ? 'selected' : ''} onClick={() => update({ ...draft, durationMin: minutes })}>{minutes} min</button>
          ))}
        </div>
      </section>

      <section className="rings-section card intensity-picker">
        <span className="eyebrow">Gesamtbelastung</span>
        <div className="segmented rings-intensity">
          {(['chill', 'normal', 'hard'] as TrainingIntensity[]).map((value) => (
            <button key={value} className={draft.intensity === value ? 'selected' : ''} onClick={() => update({ ...draft, intensity: value })}>{value === 'chill' ? 'Locker' : value === 'normal' ? 'Normal' : 'Hart'}</button>
          ))}
        </div>
        <small>Lastpunkte: {draft.intensity === 'chill' ? '1,0' : draft.intensity === 'hard' ? '2,0' : '1,5'}</small>
      </section>
    </div>
  );
}

function ExerciseEditor({ exercise, entry, target, note, update }: { exercise: Exercise; entry: Entry; target: SetLog | null; note?: string; update: (index: number, set: SetLog) => void }) {
  const hasWeight = exercise.metric === 'weight_reps';
  const youtubeUrl = exercise.youtubeQuery
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtubeQuery)}`
    : undefined;
  return (
    <section className="exercise-card card">
      <div className="exercise-header">
        <div>
          <h3>{exercise.name}</h3>
          {exercise.perSide && <span className="side-badge">je Seite</span>}
          {note && <p className="exercise-note">{note}</p>}
          {youtubeUrl && (
            <a className="exercise-video-link" href={youtubeUrl} target="_blank" rel="noreferrer" aria-label={`Technikvideo für ${exercise.name} auf YouTube suchen`}>
              <PlayIcon /> Technik ansehen
            </a>
          )}
        </div>
        {target?.kg !== undefined && <span className="target">Ziel {target.kg} kg</span>}
      </div>
      <div className="set-table">
        <div className={`set-labels ${hasWeight ? '' : 'no-weight'}`}><span>Satz</span>{hasWeight && <span>kg</span>}<span>{exercise.metric === 'time' ? 'Sek.' : exercise.metric === 'distance' || exercise.id === 'farmers-carry' ? 'Meter' : 'Wdh.'}</span><span>OK</span></div>
        {entry.sets.map((set, index) => <SetEditor key={index} index={index} metric={exercise.metric} set={set} update={(value) => update(index, value)} />)}
      </div>
    </section>
  );
}

function SetEditor({ index, metric, set, update }: { index: number; metric: Exercise['metric']; set: SetLog; update: (set: SetLog) => void }) {
  const hasWeight = metric === 'weight_reps';
  const secondaryKey = metric === 'time' ? 'sec' : metric === 'distance' ? 'distanceM' : 'reps';
  function number(key: 'kg' | 'reps' | 'sec' | 'distanceM', value: string) {
    update({ ...set, [key]: value === '' ? undefined : Number(value) });
  }
  return (
    <div className={`set-row ${hasWeight ? '' : 'no-weight'}`}>
      <strong>{index + 1}</strong>
      {hasWeight && <input inputMode="decimal" aria-label={`Satz ${index + 1} Kilogramm`} value={set.kg ?? ''} placeholder="–" onChange={(event) => number('kg', event.target.value)} />}
      <input inputMode="decimal" aria-label={`Satz ${index + 1} Wert`} value={set[secondaryKey] ?? ''} placeholder="–" onChange={(event) => number(secondaryKey, event.target.value)} />
      <button type="button" className={set.successful !== false ? 'set-success' : 'set-failed'} onClick={() => update({ ...set, successful: set.successful === false })} aria-label={set.successful !== false ? 'Erfolgreich' : 'Fehlversuch'}>{set.successful !== false ? <CheckIcon /> : '×'}</button>
    </div>
  );
}
