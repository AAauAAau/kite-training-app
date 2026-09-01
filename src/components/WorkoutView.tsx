import { useState } from 'react';
import { boardOffStages, mobilityChecklists, mobilityItems, templates } from '../data/seed';
import { formatShortDate, localDate } from '../logic/date';
import { lastLoggedSet, nextTarget, sprintPrescription, sprintWarnings, sprintWeek, strengthWarnings } from '../logic/training';
import { useAppStore } from '../store';
import type { Entry, Exercise, RingsArea, RingsSkill, Session, SessionTemplate, SetLog, SessionType, TrainingIntensity } from '../types';
import { AlertIcon, CheckIcon, ChevronIcon, PlayIcon, SwapIcon } from './Icons';
import { SessionDatePicker } from './SessionDatePicker';
import { SubstitutionSheet } from './SubstitutionSheet';
import { primeTimerAudio } from './TimerDock';

interface WorkoutViewProps {
  onSaved: (session: Session) => void;
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
  compactCoreToWarmup?: boolean;
  activityName?: string;
  manualLoad?: number;
  substitutions?: Record<string, string>;
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
  const { sessions, exercises, activeTimer, addSession, startTimer, stopTimer } = useAppStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [boardOffPicker, setBoardOffPicker] = useState(false);
  const [substituteIndex, setSubstituteIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessionDate, setSessionDate] = useState(localDate());
  const sessionHistory = sessions.filter((session) => session.date <= sessionDate);
  const week = sprintWeek(sessionHistory);

  function startTemplate(template: SessionTemplate) {
    const entries = template.exercises.map((item) => {
      const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
      const previous = lastLoggedSet(item.exerciseId, sessionHistory);
      return {
        exerciseId: item.exerciseId,
        sets: Array.from({ length: item.sets }, () => ({
          kg: previous?.kg,
          reps: previous?.reps ?? item.defaultReps,
          sec: previous?.sec ?? item.defaultSec,
          distanceM: previous?.distanceM ?? item.defaultDistanceM,
          perSide: exercise?.perSide,
          successful: undefined
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

  function startOther() {
    setDraft({
      type: 'OTHER', title: 'Andere Aktivität', entries: [], exerciseNotes: {}, mobilityDone: [], note: '',
      activityName: '', manualLoad: 1.5
    });
  }

  function startMobility() {
    setDraft({
      type: 'MOBILITY', title: 'Mobility', entries: [], exerciseNotes: {}, mobilityDone: [], note: ''
    });
  }

  function updateSet(entryIndex: number, setIndex: number, next: SetLog) {
    if (!draft) return;
    const previous = draft.entries[entryIndex]?.sets[setIndex];
    const exercise = exercises.find((item) => item.id === draft.entries[entryIndex]?.exerciseId);
    const entries = draft.entries.map((entry, currentEntry) => currentEntry === entryIndex
      ? { ...entry, sets: entry.sets.map((set, currentSet) => currentSet === setIndex ? next : set) }
      : entry
    );
    setDraft({ ...draft, entries });
    const restSec = exercise?.restSec ?? (exercise?.category === 'mobility' ? 0 : 90);
    if (previous?.successful !== true && next.successful === true && restSec > 0) {
      primeTimerAudio();
      void startTimer({
        mode: 'countdown', kind: 'rest', label: `${exercise?.name ?? 'Übung'} · Pause`,
        sourceId: `rest-${exercise?.id}`, defaultSec: restSec, endTimestamp: Date.now() + restSec * 1000
      });
    }
  }

  function substitute(entryIndex: number, newExerciseId: string) {
    if (!draft) return;
    const entry = draft.entries[entryIndex];
    if (!entry) return;
    const currentId = entry.exerciseId;
    if (newExerciseId === currentId) {
      setSubstituteIndex(null);
      return;
    }
    const originalId = draft.substitutions?.[currentId] ?? currentId;
    const newExercise = exercises.find((item) => item.id === newExerciseId);
    const previous = lastLoggedSet(newExerciseId, sessionHistory);
    const sets = entry.sets.map((set) => ({
      kg: previous?.kg,
      reps: previous?.reps ?? set.reps,
      sec: previous?.sec ?? set.sec,
      distanceM: previous?.distanceM ?? set.distanceM,
      perSide: newExercise?.perSide,
      successful: undefined as boolean | undefined
    }));
    const substitutions = { ...(draft.substitutions ?? {}) };
    delete substitutions[currentId];
    if (newExerciseId !== originalId) substitutions[newExerciseId] = originalId;
    setDraft({
      ...draft,
      entries: draft.entries.map((item, index) => index === entryIndex ? { exerciseId: newExerciseId, sets } : item),
      substitutions
    });
    setSubstituteIndex(null);
  }

  async function controlChecklistTimer(label: string, sourceId: string, mode: 'countdown' | 'countup' | 'pace', seconds?: number) {
    if (activeTimer?.sourceId === sourceId) {
      await stopTimer();
      return;
    }
    primeTimerAudio();
    const duration = seconds ?? 30;
    await startTimer({
      mode,
      kind: 'exercise',
      label,
      sourceId,
      defaultSec: duration,
      endTimestamp: mode === 'countup' ? undefined : Date.now() + duration * 1000
    });
  }

  async function save() {
    if (!draft) return;
    if (draft.type === 'RINGS' && draft.sourceApp === 'die-ringe' && !draft.ringsAreas?.length) return;
    if (draft.type === 'SPRINT') {
      const warnings = sprintWarnings(sessionDate, sessions);
      if (warnings.length && !window.confirm(`${warnings.join('\n\n')}\n\nTrotzdem speichern?`)) return;
    }
    const backWarnings = strengthWarnings(draft.type, sessionDate, sessions);
    if (backWarnings.length && !window.confirm(`${backWarnings.join('\n\n')}\n\nTrotzdem speichern?`)) return;
    setSaving(true);
    const entries = draft.compactCoreToWarmup
      ? draft.entries.filter((entry) => entry.exerciseId !== 'bird-dog' && entry.exerciseId !== 'side-plank')
      : draft.entries;
    const session: Session = {
      id: crypto.randomUUID(), date: sessionDate, type: draft.type, entries,
      mobilityDone: draft.mobilityDone, note: draft.note.trim() || undefined,
      durationMin: draft.durationMin, intensity: draft.intensity,
      activityName: draft.activityName?.trim() || undefined, manualLoad: draft.manualLoad,
      ringsAreas: draft.ringsAreas, ringsSkills: draft.ringsSkills,
      sourceApp: draft.sourceApp, createdAt: Date.now()
    };
    await addSession(session);
    onSaved(session);
  }

  if (!draft && boardOffPicker) return (
    <main className="page workout-menu">
      <header className="sticky-workout-header">
        <button className="icon-button" onClick={() => setBoardOffPicker(false)} aria-label="Zurück">‹</button>
        <div><span className="eyebrow">Land-Drills zu Hause</span><h1>Board-Off-Stufe</h1></div>
        <span className="exercise-count">5</span>
      </header>
      <SessionDatePicker value={sessionDate} onChange={setSessionDate} />
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
      <header className="page-header"><div><span className="eyebrow">Was passt?</span><h1>Training starten</h1></div></header>
      <SessionDatePicker value={sessionDate} onChange={setSessionDate} />
      <div className="template-list">
        <div className="template-group-heading"><span className="eyebrow">Trainingspläne</span><small>Mit Übungen und Satzvorgaben</small></div>
        {templates.map((template) => (
          <button className="template-card card" key={template.type} onClick={() => startTemplate(template)}>
            <span className={`template-letter type-${template.type.toLowerCase()}`}>{template.type === 'RINGS' ? 'R' : template.type}</span>
            <span><strong>{template.title}</strong><small>{template.subtitle} · Last {template.type === 'A' || template.type === 'B' ? '2,0' : '1,5'}</small></span><ChevronIcon />
          </button>
        ))}
        <div className="template-group-heading secondary-group"><span className="eyebrow">Aktivität erfassen</span><small>Schnell und ohne Trainingsplan loggen</small></div>
        <button className="template-card rings-card card" onClick={startRings}>
          <span className="template-letter type-rings">R</span>
          <span><strong>Die Ringe</strong><small>Bereiche & Skills · Last 1,0–2,0</small></span><ChevronIcon />
        </button>
        <button className="template-card sprint-card card" onClick={startSprint}>
          <span className="template-letter type-sprint">S</span>
          <span><strong>Sprint · Woche {week}</strong><small>6×{sprintPrescription(week).distance} m · {sprintPrescription(week).intensity} · Last 2,0</small></span><ChevronIcon />
        </button>
        <button className="template-card boardoff-card card" onClick={() => setBoardOffPicker(true)}>
          <span className="template-letter type-board_off">B</span>
          <span><strong>Board-Off Drills</strong><small>Land-Progression · Stufe 0–4 · Last 1,0</small></span><ChevronIcon />
        </button>
        <button className="template-card padel-card card" onClick={startPadel}>
          <span className="template-letter type-padel">P</span>
          <span><strong>Padel Tennis</strong><small>Dauer optional · Last 1,5</small></span><ChevronIcon />
        </button>
        <button className="template-card other-card card" onClick={startOther}>
          <span className="template-letter type-other">+</span>
          <span><strong>Andere Aktivität</strong><small>Joggen, Schwimmen etc. · Last frei</small></span><ChevronIcon />
        </button>
        <button className="template-card card" onClick={startMobility}>
          <span className="template-letter type-mobility">M</span>
          <span><strong>Mobility</strong><small>Checkliste · Last 0,0</small></span><ChevronIcon />
        </button>
      </div>
      <button className="text-button cancel-link" onClick={onCancel}>Abbrechen</button>
    </main>
  );

  const currentTemplate = templates.find((template) => template.type === draft.type);
  const prescription = draft.type === 'SPRINT' ? sprintPrescription(week) : null;
  const externalRings = draft.type === 'RINGS' && draft.sourceApp === 'die-ringe';
  const preSession = mobilityChecklists.find((template) => template.variant === 'pre-session')!;
  const visibleEntryCount = draft.compactCoreToWarmup
    ? draft.entries.filter((entry) => entry.exerciseId !== 'bird-dog' && entry.exerciseId !== 'side-plank').length
    : draft.entries.length;
  const substituteEntry = substituteIndex === null ? undefined : draft.entries[substituteIndex];
  const substituteExercise = substituteEntry && exercises.find((item) => item.id === substituteEntry.exerciseId);
  const substituteOriginalId = substituteEntry && draft.substitutions?.[substituteEntry.exerciseId];
  return (
    <main className="page workout-active">
      <header className="sticky-workout-header">
        <button className="icon-button" onClick={() => setDraft(null)} aria-label="Zurück">‹</button>
        <div><span className="eyebrow">{sessionDate === localDate() ? 'Heute' : formatShortDate(sessionDate)}</span><h1>{draft.title ?? currentTemplate?.title ?? `Sprint · Woche ${week}`}</h1></div>
        <span className="exercise-count">{externalRings ? draft.ringsAreas?.length ?? 0 : visibleEntryCount}</span>
      </header>
      <SessionDatePicker value={sessionDate} onChange={setSessionDate} />

      {draft.type === 'SPRINT' && (
        <>
          <section className="sprint-safety"><AlertIcon /><strong>Zwicken in der Oberschenkelrückseite → sofort abbrechen, nicht auslaufen.</strong></section>
          <section className="warmup card"><span className="eyebrow">10 min Warm-up</span><p>Skippings · A-Läufe · Anläufe</p><strong>6×{prescription?.distance} m @ {prescription?.intensity}</strong></section>
          <SprintStats sessions={sessionHistory} entries={draft.entries} />
        </>
      )}

      {(draft.type === 'A' || draft.type === 'B' || draft.type === 'KB') && (
        <section className="mobility-card card">
          <div><span className="eyebrow">Vor der ersten Übung · {preSession.durationMin} min</span><h3>{preSession.title}</h3></div>
          {preSession.items.map((item) => {
            const checked = draft.mobilityDone.includes(item.id);
            const sourceId = `checklist-${draft.type}-${item.id}`;
            const timerActive = activeTimer?.sourceId === sourceId;
            return (
              <div className="mobility-checklist-item" key={item.id}>
                <button className={`mobility-item-check ${checked ? 'checked' : ''}`} onClick={() => setDraft({ ...draft, mobilityDone: checked ? draft.mobilityDone.filter((value) => value !== item.id) : [...draft.mobilityDone, item.id] })} aria-pressed={checked}>
                  <i>{checked && <CheckIcon />}</i><span>{item.label}</span>
                </button>
                {item.timerSec && (
                  <button className={`mobility-item-timer ${timerActive ? 'active' : ''}`} onClick={() => void controlChecklistTimer(item.label, sourceId, item.timerMode ?? 'countdown', item.timerSec)}>
                    {timerActive ? 'Stop' : item.timerMode === 'pace' ? `${item.timerSec} s Tempo` : `${item.timerSec} s`}
                  </button>
                )}
              </div>
            );
          })}
          {draft.type === 'B' && (
            <button className={draft.compactCoreToWarmup ? 'checked' : ''} onClick={() => setDraft({ ...draft, compactCoreToWarmup: !draft.compactCoreToWarmup })}>
              <i>{draft.compactCoreToWarmup && <CheckIcon />}</i><span>Bird Dog + Side Plank hierher verschieben<small>Optional, falls Tag B sonst über 60 min dauert</small></span>
            </button>
          )}
        </section>
      )}

      {externalRings && (
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

      {draft.type === 'OTHER' && (
        <section className="other-options card">
          <span className="eyebrow">Freier Eintrag</span>
          <label>
            <span>Aktivität</span>
            <input autoFocus value={draft.activityName ?? ''} onChange={(event) => setDraft({ ...draft, activityName: event.target.value })} placeholder="z. B. Joggen" />
          </label>
          <label>
            <span>Dauer · optional</span>
            <div className="other-duration"><input type="number" inputMode="numeric" min="0" value={draft.durationMin ?? ''} onChange={(event) => setDraft({ ...draft, durationMin: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder="45" /><small>min</small></div>
          </label>
          <label>
            <span>Aktivitätslast <strong>{(draft.manualLoad ?? 1.5).toFixed(1)}</strong></span>
            <input type="range" min="0.5" max="3" step="0.5" value={draft.manualLoad ?? 1.5} onChange={(event) => setDraft({ ...draft, manualLoad: Number(event.target.value) })} />
            <small>0,5 = sehr locker · 1,5 = normal · 3,0 = sehr hart</small>
          </label>
        </section>
      )}

      {!externalRings && <div className="exercise-stack">
        {draft.entries.map((entry, entryIndex) => {
          if (draft.compactCoreToWarmup && (entry.exerciseId === 'bird-dog' || entry.exerciseId === 'side-plank')) return null;
          const exercise = exercises.find((item) => item.id === entry.exerciseId);
          if (!exercise) return null;
          const target = nextTarget(exercise.id, sessionHistory, exercises);
          return <ExerciseEditor key={exercise.id} exercise={exercise} entry={entry} target={target} note={draft.exerciseNotes[exercise.id]} update={(setIndex, set) => updateSet(entryIndex, setIndex, set)} onRequestSwap={() => setSubstituteIndex(entryIndex)} />;
        })}
      </div>}

      {(draft.type === 'A' || draft.type === 'B') && (
        <section className="mobility-card cooldown-card card">
          <div><span className="eyebrow">Danach oder separat · optional</span><h3>Mobility / Dehnen</h3></div>
          {mobilityItems.map((item) => {
            const checked = draft.mobilityDone.includes(item.id);
            const sourceId = `checklist-${draft.type}-${item.id}`;
            const timerActive = activeTimer?.sourceId === sourceId;
            return (
              <div className="mobility-checklist-item" key={item.id}>
                <button className={`mobility-item-check ${checked ? 'checked' : ''}`} onClick={() => setDraft({ ...draft, mobilityDone: checked ? draft.mobilityDone.filter((id) => id !== item.id) : [...draft.mobilityDone, item.id] })} aria-pressed={checked}><i>{checked && <CheckIcon />}</i><span>{item.name}</span></button>
                {item.timer && (
                  <button className={`mobility-item-timer ${timerActive ? 'active' : ''}`} onClick={() => void controlChecklistTimer(item.name, sourceId, item.timer!.mode, item.timer!.defaultSec)}>
                    {timerActive ? 'Stop' : item.timer.mode === 'countup' ? 'Start' : item.timer.mode === 'pace' ? `${item.timer.defaultSec ?? 30} s Tempo` : `${item.timer.defaultSec ?? 30} s`}
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

      {draft.type === 'MOBILITY' && (
        <section className="mobility-card cooldown-card card">
          <div><span className="eyebrow">Checkliste · Last 0,0</span><h3>Mobility</h3></div>
          {mobilityItems.map((item) => {
            const checked = draft.mobilityDone.includes(item.id);
            const sourceId = `checklist-${draft.type}-${item.id}`;
            const timerActive = activeTimer?.sourceId === sourceId;
            return (
              <div className="mobility-checklist-item" key={item.id}>
                <button className={`mobility-item-check ${checked ? 'checked' : ''}`} onClick={() => setDraft({ ...draft, mobilityDone: checked ? draft.mobilityDone.filter((id) => id !== item.id) : [...draft.mobilityDone, item.id] })} aria-pressed={checked}><i>{checked && <CheckIcon />}</i><span>{item.name}</span></button>
                {item.timer && (
                  <button className={`mobility-item-timer ${timerActive ? 'active' : ''}`} onClick={() => void controlChecklistTimer(item.name, sourceId, item.timer!.mode, item.timer!.defaultSec)}>
                    {timerActive ? 'Stop' : item.timer.mode === 'countup' ? 'Start' : item.timer.mode === 'pace' ? `${item.timer.defaultSec ?? 30} s Tempo` : `${item.timer.defaultSec ?? 30} s`}
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

      <label className="note-field card"><span>Notiz · optional</span><textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Technik, Schmerz, Variante …" rows={2} /></label>
      <div className="workout-actions"><button className="primary" onClick={save} disabled={saving || (externalRings && !draft.ringsAreas?.length) || (draft.type === 'OTHER' && !draft.activityName?.trim())}>{saving ? 'Speichert …' : externalRings && !draft.ringsAreas?.length ? 'Bereich auswählen' : draft.type === 'OTHER' && !draft.activityName?.trim() ? 'Aktivität benennen' : 'Einheit abschließen'}</button></div>

      {substituteIndex !== null && substituteExercise && (
        <SubstitutionSheet
          exercise={substituteExercise}
          originalExercise={substituteOriginalId ? exercises.find((item) => item.id === substituteOriginalId) : undefined}
          allExercises={exercises}
          usedExerciseIds={draft.entries.map((item) => item.exerciseId)}
          onChoose={(id) => substitute(substituteIndex, id)}
          onReset={() => { if (substituteOriginalId) substitute(substituteIndex, substituteOriginalId); }}
          onClose={() => setSubstituteIndex(null)}
        />
      )}
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
              <button key={option.value} className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => toggleArea(option.value)}>
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
              <button key={option.value} className={skills.includes(option.value) ? 'selected' : ''} aria-pressed={skills.includes(option.value)} onClick={() => toggleSkill(option.value)}>{option.label}</button>
            ))}
          </div>
        </section>
      )}

      <section className="rings-section card">
        <span className="eyebrow">Dauer</span>
        <div className="rings-duration-picker">
          {[30, 45, 60, 90].map((minutes) => (
            <button key={minutes} className={draft.durationMin === minutes ? 'selected' : ''} aria-pressed={draft.durationMin === minutes} onClick={() => update({ ...draft, durationMin: minutes })}>{minutes} min</button>
          ))}
        </div>
      </section>

      <section className="rings-section card intensity-picker">
        <span className="eyebrow">Gesamtbelastung</span>
        <div className="segmented rings-intensity">
          {(['chill', 'normal', 'hard'] as TrainingIntensity[]).map((value) => (
            <button key={value} className={draft.intensity === value ? 'selected' : ''} aria-pressed={draft.intensity === value} onClick={() => update({ ...draft, intensity: value })}>{value === 'chill' ? 'Locker' : value === 'normal' ? 'Normal' : 'Hart'}</button>
          ))}
        </div>
        <small>Lastpunkte: {draft.intensity === 'chill' ? '1,0' : draft.intensity === 'hard' ? '2,0' : '1,5'}</small>
      </section>
    </div>
  );
}

function ExerciseEditor({ exercise, entry, target, note, update, onRequestSwap }: { exercise: Exercise; entry: Entry; target: SetLog | null; note?: string; update: (index: number, set: SetLog) => void; onRequestSwap: () => void }) {
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
        <div className="exercise-header-actions">
          {target?.kg !== undefined && <span className="target">Ziel {target.kg} kg</span>}
          {exercise.pattern && (
            <button type="button" className="exercise-swap-button" onClick={onRequestSwap} aria-label={`${exercise.name} ersetzen`}>
              <SwapIcon />
            </button>
          )}
        </div>
      </div>
      <div className="set-table">
        <div className={`set-labels ${hasWeight ? '' : 'no-weight'}`}><span>Satz</span>{hasWeight && <span>kg</span>}<span>{exercise.metric === 'time' ? 'Sek.' : exercise.metric === 'distance' || exercise.id === 'suitcase-carry' ? 'Meter' : 'Wdh.'}</span><span>OK</span></div>
        {entry.sets.map((set, index) => <SetEditor key={index} index={index} exercise={exercise} set={set} update={(value) => update(index, value)} />)}
      </div>
    </section>
  );
}

function SetEditor({ index, exercise, set, update }: { index: number; exercise: Exercise; set: SetLog; update: (set: SetLog) => void }) {
  const hasWeight = exercise.metric === 'weight_reps';
  const secondaryKey = exercise.metric === 'time' ? 'sec' : exercise.metric === 'distance' ? 'distanceM' : 'reps';
  function number(key: 'kg' | 'reps' | 'sec' | 'distanceM', value: string) {
    update({ ...set, [key]: value === '' ? undefined : Number(value) });
  }
  return (
    <div className="set-with-timer">
      <div className={`set-row ${hasWeight ? '' : 'no-weight'}`}>
        <strong>{index + 1}</strong>
        {hasWeight && <input inputMode="decimal" aria-label={`Satz ${index + 1} Kilogramm`} value={set.kg ?? ''} placeholder="–" onChange={(event) => number('kg', event.target.value)} />}
        <input inputMode="decimal" aria-label={`Satz ${index + 1} Wert`} value={set[secondaryKey] ?? ''} placeholder="–" onChange={(event) => number(secondaryKey, event.target.value)} />
        <button
          type="button"
          className={set.successful === true ? 'set-success' : set.successful === false ? 'set-failed' : 'set-pending'}
          onClick={() => update({ ...set, successful: set.successful === undefined ? true : set.successful === true ? false : undefined })}
          aria-label={set.successful === true ? 'Erfolgreich geloggt' : set.successful === false ? 'Fehlversuch' : 'Satz loggen'}
        >{set.successful === true ? <CheckIcon /> : set.successful === false ? '×' : '○'}</button>
      </div>
      {(exercise.metric === 'time' || exercise.timer) && <SetTimerControl exercise={exercise} index={index} set={set} update={update} />}
    </div>
  );
}

function SetTimerControl({ exercise, index, set, update }: { exercise: Exercise; index: number; set: SetLog; update: (set: SetLog) => void }) {
  const { activeTimer, startTimer, stopTimer } = useAppStore();
  const config = exercise.timer ?? { mode: 'countdown' as const, defaultSec: set.sec ?? 30 };
  const sourceId = `${exercise.id}-${index}`;
  const active = activeTimer?.sourceId === sourceId;
  const seconds = set.sec ?? config.defaultSec ?? 30;

  async function control() {
    primeTimerAudio();
    if (active) {
      const elapsed = await stopTimer();
      if (config.mode === 'countup' && elapsed !== null) update({ ...set, sec: elapsed });
      return;
    }
    const duration = config.mode === 'pace' ? config.defaultSec ?? 4 : seconds;
    await startTimer({
      mode: config.mode,
      kind: 'exercise',
      label: `${exercise.name} · Satz ${index + 1}`,
      sourceId,
      defaultSec: duration,
      endTimestamp: config.mode === 'countup' ? undefined : Date.now() + duration * 1000
    });
  }

  const label = active
    ? config.mode === 'countup' ? 'Stoppen & Zeit übernehmen' : 'Timer stoppen'
    : config.mode === 'countup'
      ? set.sec !== undefined ? 'Erneut messen' : 'Stoppuhr starten'
      : config.mode === 'pace' ? `${seconds} s Tempo starten` : `${seconds} s Countdown`;
  return (
    <div className={`set-timer-controls ${exercise.metric !== 'time' && config.mode === 'countup' ? 'with-input' : ''}`}>
      {exercise.metric !== 'time' && config.mode === 'countup' && (
        <label className="direct-time-input">
          <span>Zeit</span>
          <input
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            aria-label={`Satz ${index + 1} Zeit in Sekunden`}
            value={set.sec ?? ''}
            placeholder="Sek."
            onChange={(event) => update({ ...set, sec: event.target.value === '' ? undefined : Number(event.target.value) })}
          />
        </label>
      )}
      <button type="button" className={`set-timer-button ${active ? 'active' : ''}`} onClick={() => void control()}>{label}</button>
    </div>
  );
}

function SprintStats({ sessions, entries }: { sessions: Session[]; entries: Entry[] }) {
  const sprintSets = entries.find((entry) => entry.exerciseId === 'sprint')?.sets ?? [];
  const distance = sprintSets.find((set) => set.distanceM)?.distanceM;
  const currentTimes = sprintSets.flatMap((set) => typeof set.sec === 'number' && set.sec > 0 ? [set.sec] : []);
  const history = sessions
    .filter((session) => session.type === 'SPRINT')
    .flatMap((session) => session.entries.find((entry) => entry.exerciseId === 'sprint')?.sets ?? [])
    .filter((set) => set.distanceM === distance && typeof set.sec === 'number' && set.sec > 0);
  const latest = [...sessions]
    .filter((session) => session.type === 'SPRINT' && session.entries.some((entry) =>
      entry.exerciseId === 'sprint' && entry.sets.some((set) => set.distanceM === distance && typeof set.sec === 'number' && set.sec > 0)
    ))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const latestTimes = latest?.entries.find((entry) => entry.exerciseId === 'sprint')?.sets
    .flatMap((set) => set.distanceM === distance && typeof set.sec === 'number' && set.sec > 0 ? [set.sec] : []) ?? [];
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const value = (seconds: number | undefined) => seconds === undefined ? '–' : `${seconds.toFixed(2)} s`;

  return (
    <section className="sprint-stats card">
      <div><span className="eyebrow">{distance ?? '–'} m Statistik</span><h3>Zeiten</h3></div>
      <div className="sprint-stat-grid">
        <span><small>Diese Einheit · schnellste</small><strong>{value(currentTimes.length ? Math.min(...currentTimes) : undefined)}</strong></span>
        <span><small>Diese Einheit · Schnitt</small><strong>{value(currentTimes.length ? average(currentTimes) : undefined)}</strong></span>
        <span><small>Letzte Einheit</small><strong>{value(latestTimes.length ? average(latestTimes) : undefined)}</strong></span>
        <span><small>Bestzeit</small><strong>{value(history.length ? Math.min(...history.map((set) => set.sec!)) : undefined)}</strong></span>
      </div>
    </section>
  );
}
