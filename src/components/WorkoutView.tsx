import { useState } from 'react';
import { t } from '../i18n';
import { ringsSkillKey, trainingIntensityKey } from '../i18n/enums';
import { useLang } from '../i18n/react';
import { boardOffLevels, mobilityChecklists, mobilityItems, templates } from '../data/seed';
import { formatShortDate, localDate } from '../logic/date';
import { formatFixed, formatKg, formatLoad, localeFor } from '../logic/format';
import { localizeBoardOffLevel, localizeExercise, localizeMobility, localizeTemplate } from '../logic/localize';
import { boardOffLevelSlots, levelNeedsRig, recommendBoardOffLevel } from '../logic/boardoff';
import type { BoardOffAssessment } from '../logic/boardoff';
import { autoregulatedKg, comebackState, lastLoggedSet, sprintPrescription, sprintWarnings, sprintWeek, startingTarget, strengthWarnings } from '../logic/training';
import type { AutoregulationFeedback } from '../logic/training';
import { applyInjuryToSlots, bodyRegionLabel, injurySessionTypes, injuryState } from '../logic/injury';
import { useAppStore } from '../store';
import type { BodyRegion, BoardOffLevel, Entry, Exercise, Lang, RingsArea, RingsSkill, Session, SessionTemplate, SetLog, SessionType, TrainingIntensity } from '../types';
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
  autoregulation?: Record<string, AutoregulationFeedback>;
  autoregulationManualSets?: Record<string, number[]>;
  boardOffLevel?: number;
  boardOffRegressions?: Record<string, string>;
  injuryAdjustments?: { regions: BodyRegion[]; swaps: { from: string; to: string }[]; dropped: string[] };
};

const ringsAreaOptions: { value: RingsArea; labelKey: 'enum.ringsArea.mobility' | 'workout.ringsAreaUpperLabel' | 'workout.ringsAreaLegsLabel' | 'workout.ringsAreaSkillsLabel'; detailKey: 'workout.ringsAreaMobilityDetail' | 'workout.ringsAreaUpperDetail' | 'workout.ringsAreaLegsDetail' | 'workout.ringsAreaSkillsDetail' }[] = [
  { value: 'mobility', labelKey: 'enum.ringsArea.mobility', detailKey: 'workout.ringsAreaMobilityDetail' },
  { value: 'upper', labelKey: 'workout.ringsAreaUpperLabel', detailKey: 'workout.ringsAreaUpperDetail' },
  { value: 'legs', labelKey: 'workout.ringsAreaLegsLabel', detailKey: 'workout.ringsAreaLegsDetail' },
  { value: 'skills', labelKey: 'workout.ringsAreaSkillsLabel', detailKey: 'workout.ringsAreaSkillsDetail' }
];

function exerciseName(exercises: Exercise[], id: string, lang: Lang): string {
  const exercise = exercises.find((item) => item.id === id);
  return exercise ? localizeExercise(exercise, lang).name : id;
}

const ringsSkillValues: RingsSkill[] = ['ring-muscle-up', 'l-sit', 'side-split', 'pistol-squat'];

export function WorkoutView({ onSaved, onCancel }: WorkoutViewProps) {
  const { sessions, exercises, settings, activeTimer, addSession, updateSettings, startTimer, stopTimer } = useAppStore();
  const lang = useLang();
  const locale = localeFor(lang);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [boardOffPicker, setBoardOffPicker] = useState(false);
  const boardOffHasRig = settings.boardOffHasRig ?? true;
  const [substituteIndex, setSubstituteIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessionDate, setSessionDate] = useState(localDate());
  const sessionHistory = sessions.filter((session) => session.date <= sessionDate);
  const week = sprintWeek(sessionHistory);
  const comeback = comebackState(sessionHistory, sessionDate);
  const injury = injuryState(settings, sessionDate);

  function injuryHint(swaps: { from: string; to: string }[], dropped: string[]) {
    return swaps.length || dropped.length
      ? { regions: injury.blockedRegions, swaps, dropped }
      : undefined;
  }

  function startTemplate(rawTemplate: SessionTemplate) {
    const template = localizeTemplate(rawTemplate, lang);
    const adjustment = injury.blockedRegions.length && injurySessionTypes.includes(template.type)
      ? applyInjuryToSlots(template.exercises, exercises, injury.blockedRegions)
      : { swaps: [], dropped: [] };
    const swapMap = new Map(adjustment.swaps.map((swap) => [swap.from, swap.to]));
    const droppedSet = new Set(adjustment.dropped);
    const slots = template.exercises
      .filter((item) => !droppedSet.has(item.exerciseId))
      .map((item) => ({ ...item, exerciseId: swapMap.get(item.exerciseId) ?? item.exerciseId }));
    const entries = slots.map((item) => {
      const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
      const previous = lastLoggedSet(item.exerciseId, sessionHistory);
      const start = comeback.active ? startingTarget(item.exerciseId, sessionHistory, exercises, sessionDate) : null;
      return {
        exerciseId: item.exerciseId,
        sets: Array.from({ length: item.sets }, () => ({
          kg: start?.kg ?? previous?.kg,
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
      exerciseNotes: Object.fromEntries(
        template.exercises
          .filter((item) => item.note && !swapMap.has(item.exerciseId) && !droppedSet.has(item.exerciseId))
          .map((item) => [item.exerciseId, item.note!])
      ),
      substitutions: Object.fromEntries(adjustment.swaps.map((swap) => [swap.to, swap.from])),
      injuryAdjustments: injuryHint(adjustment.swaps, adjustment.dropped),
      mobilityDone: [],
      note: ''
    });
    setBoardOffPicker(false);
  }

  function startBoardOffLevel(rawLevel: BoardOffLevel) {
    const level = localizeBoardOffLevel(rawLevel, lang);
    const allSlots = boardOffLevelSlots(level, boardOffHasRig);
    const dropped = injury.blockedRegions.length
      ? applyInjuryToSlots(allSlots, exercises, injury.blockedRegions).dropped
      : [];
    const droppedSet = new Set(dropped);
    const slots = allSlots.filter((slot) => !droppedSet.has(slot.exerciseId));
    const entries = slots.map((slot) => {
      const exercise = exercises.find((candidate) => candidate.id === slot.exerciseId);
      return {
        exerciseId: slot.exerciseId,
        sets: Array.from({ length: slot.sets }, () => ({
          reps: slot.defaultReps,
          sec: slot.defaultSec,
          perSide: exercise?.perSide,
          successful: undefined
        }))
      };
    });
    setDraft({
      type: 'BOARD_OFF',
      title: level.level === 0 ? t('workout.titleBoardOffPrep') : t('workout.titleBoardOffStage', { level: level.level, label: level.label }),
      entries,
      exerciseNotes: Object.fromEntries(slots.map((slot) => [slot.exerciseId, slot.mistake])),
      boardOffRegressions: Object.fromEntries(slots.map((slot) => [slot.exerciseId, slot.regression])),
      injuryAdjustments: injuryHint([], dropped),
      boardOffLevel: level.level,
      mobilityDone: [],
      note: ''
    });
    setBoardOffPicker(false);
  }

  function startSprint() {
    const prescription = sprintPrescription(week);
    setDraft({
      type: 'SPRINT', title: t('workout.titleSprint', { week }), exerciseNotes: {}, mobilityDone: [], note: '',
      entries: [{ exerciseId: 'sprint', sets: Array.from({ length: 6 }, () => ({ distanceM: prescription.distance, successful: true })) }]
    });
  }

  function startRings() {
    setDraft({
      type: 'RINGS', title: t('workout.titleRings'), entries: [], exerciseNotes: {}, mobilityDone: [], note: '',
      durationMin: 45, intensity: 'normal', ringsAreas: [], ringsSkills: [], sourceApp: 'die-ringe'
    });
  }

  function startPadel() {
    setDraft({
      type: 'PADEL', title: t('workout.titlePadel'), entries: [], exerciseNotes: {},
      mobilityDone: [], note: '', durationMin: 90
    });
  }

  function startOther() {
    setDraft({
      type: 'OTHER', title: t('workout.titleOther'), entries: [], exerciseNotes: {}, mobilityDone: [], note: '',
      activityName: '', manualLoad: 1.5
    });
  }

  function startMobility() {
    setDraft({
      type: 'MOBILITY', title: t('workout.titleMobility'), entries: [], exerciseNotes: {}, mobilityDone: [], note: ''
    });
  }

  function updateSet(entryIndex: number, setIndex: number, next: SetLog) {
    if (!draft) return;
    const previous = draft.entries[entryIndex]?.sets[setIndex];
    const exerciseId = draft.entries[entryIndex]?.exerciseId;
    const exercise = exercises.find((item) => item.id === exerciseId);
    const entries = draft.entries.map((entry, currentEntry) => currentEntry === entryIndex
      ? { ...entry, sets: entry.sets.map((set, currentSet) => currentSet === setIndex ? next : set) }
      : entry
    );
    let autoregulationManualSets = draft.autoregulationManualSets;
    if (exerciseId && previous && next.kg !== previous.kg) {
      const pinned = draft.autoregulationManualSets?.[exerciseId] ?? [];
      if (!pinned.includes(setIndex)) {
        autoregulationManualSets = { ...draft.autoregulationManualSets, [exerciseId]: [...pinned, setIndex] };
      }
    }
    setDraft({ ...draft, entries, autoregulationManualSets });
    const restSec = exercise?.restSec ?? (exercise?.category === 'mobility' ? 0 : 90);
    if (previous?.successful !== true && next.successful === true && restSec > 0) {
      primeTimerAudio();
      void startTimer({
        mode: 'countdown', kind: 'rest',
        label: t('workout.restPauseLabel', { name: exercise ? localizeExercise(exercise, lang).name : t('workout.exerciseFallbackName') }),
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
    const autoregulation = { ...(draft.autoregulation ?? {}) };
    const autoregulationManualSets = { ...(draft.autoregulationManualSets ?? {}) };
    delete autoregulation[currentId];
    delete autoregulationManualSets[currentId];
    setDraft({
      ...draft,
      entries: draft.entries.map((item, index) => index === entryIndex ? { exerciseId: newExerciseId, sets } : item),
      substitutions,
      autoregulation,
      autoregulationManualSets
    });
    setSubstituteIndex(null);
  }

  function applyAutoregulation(entryIndex: number, feedback: AutoregulationFeedback) {
    if (!draft) return;
    const entry = draft.entries[entryIndex];
    const exercise = entry && exercises.find((item) => item.id === entry.exerciseId);
    const baseKg = entry?.sets[0]?.kg;
    if (!entry || !exercise || typeof baseKg !== 'number') return;
    const targetKg = autoregulatedKg(baseKg, feedback, exercise);
    const pinned = draft.autoregulationManualSets?.[entry.exerciseId] ?? [];
    const sets = entry.sets.map((set, index) =>
      index > 0 && set.successful === undefined && !pinned.includes(index) ? { ...set, kg: targetKg } : set
    );
    setDraft({
      ...draft,
      entries: draft.entries.map((item, index) => index === entryIndex ? { ...item, sets } : item),
      autoregulation: { ...draft.autoregulation, [entry.exerciseId]: feedback }
    });
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
      const warnings = sprintWarnings(sessionDate, sessions).map((warning) => t(warning.key, warning.params));
      if (warnings.length && !window.confirm(`${warnings.join('\n\n')}\n\n${t('workout.sprintConfirmSuffix')}`)) return;
    }
    const backWarnings = strengthWarnings(draft.type, sessionDate, sessions).map((warning) => t(warning.key, warning.params));
    if (backWarnings.length && !window.confirm(`${backWarnings.join('\n\n')}\n\n${t('workout.sprintConfirmSuffix')}`)) return;
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
      boardOffLevel: draft.boardOffLevel,
      sourceApp: draft.sourceApp, createdAt: Date.now()
    };
    await addSession(session);
    onSaved(session);
  }

  if (!draft && boardOffPicker && settings.boardOffLevel === undefined) return (
    <main className="page workout-menu">
      <header className="sticky-workout-header">
        <button className="icon-button" onClick={() => setBoardOffPicker(false)} aria-label={t('common.back')}>‹</button>
        <div><span className="eyebrow">{t('workout.assessmentEyebrow')}</span><h1>{t('workout.assessmentTitle')}</h1></div>
      </header>
      <BoardOffAssessmentForm onDone={async (assessment) => {
        await updateSettings({ boardOffLevel: recommendBoardOffLevel(assessment), boardOffHasRig: assessment.hasRig });
      }} />
    </main>
  );

  if (!draft && boardOffPicker) return (
    <main className="page workout-menu">
      <header className="sticky-workout-header">
        <button className="icon-button" onClick={() => setBoardOffPicker(false)} aria-label={t('common.back')}>‹</button>
        <div><span className="eyebrow">{t('workout.boardOffPickerEyebrow')}</span><h1>{t('workout.boardOffPickerTitle')}</h1></div>
        <span className="exercise-count">6</span>
      </header>
      <SessionDatePicker value={sessionDate} onChange={setSessionDate} />
      <section className="alert-card">
        <AlertIcon />
        <div><strong>{t('workout.loadCheckTitle')}</strong><p>{t('workout.loadCheckBody')}</p></div>
      </section>
      {!boardOffHasRig && (
        <section className="alert-card subtle"><AlertIcon /><div><strong>{t('workout.noRigTitle')}</strong><p>{t('workout.noRigBody')}</p></div></section>
      )}
      <div className="stage-list">
        {boardOffLevels.map((rawLevel) => {
          const level = localizeBoardOffLevel(rawLevel, lang);
          return (
            <button className={`stage-card card ${settings.boardOffLevel === level.level ? 'selected' : ''}`} key={level.level} onClick={() => startBoardOffLevel(rawLevel)}>
              <span className="stage-number">{level.level}</span>
              <span>
                <strong>{level.label}{settings.boardOffLevel === level.level ? t('workout.yourStageSuffix') : ''}</strong>
                <small>{t('workout.stageGate', { gate: level.gate })}</small>
                {!boardOffHasRig && levelNeedsRig(level) && <small className="stage-badge">{t('workout.floorVariant')}</small>}
              </span>
              <ChevronIcon />
            </button>
          );
        })}
      </div>
    </main>
  );

  if (!draft) return (
    <main className="page workout-menu">
      <header className="page-header"><div><span className="eyebrow">{t('workout.menuEyebrow')}</span><h1>{t('workout.menuTitle')}</h1></div></header>
      <SessionDatePicker value={sessionDate} onChange={setSessionDate} />
      <div className="template-list">
        <div className="template-group-heading"><span className="eyebrow">{t('workout.plansHeading')}</span><small>{t('workout.plansSub')}</small></div>
        {templates.map((rawTemplate) => {
          const template = localizeTemplate(rawTemplate, lang);
          const load = formatLoad(template.type === 'A' || template.type === 'B' ? 2 : 1.5, lang);
          return (
            <button className="template-card card" key={template.type} onClick={() => startTemplate(rawTemplate)}>
              <span className={`template-letter type-${template.type.toLowerCase()}`}>{template.type === 'RINGS' ? 'R' : template.type}</span>
              <span><strong>{template.title}</strong><small>{t('workout.templateSub', { subtitle: template.subtitle, load })}</small></span><ChevronIcon />
            </button>
          );
        })}
        <div className="template-group-heading secondary-group"><span className="eyebrow">{t('workout.activityHeading')}</span><small>{t('workout.activitySub')}</small></div>
        <button className="template-card rings-card card" onClick={startRings}>
          <span className="template-letter type-rings">R</span>
          <span><strong>{t('workout.cardRingsTitle')}</strong><small>{t('workout.cardRingsSub')}</small></span><ChevronIcon />
        </button>
        <button className="template-card sprint-card card" onClick={startSprint}>
          <span className="template-letter type-sprint">S</span>
          <span><strong>{t('workout.cardSprintTitle', { week })}</strong><small>{t('workout.cardSprintSub', { distance: sprintPrescription(week).distance, intensity: sprintPrescription(week).intensity })}</small></span><ChevronIcon />
        </button>
        <button className="template-card boardoff-card card" onClick={() => setBoardOffPicker(true)}>
          <span className="template-letter type-board_off">B</span>
          <span><strong>{t('workout.cardBoardOffTitle')}</strong><small>{t('workout.cardBoardOffSub')}</small></span><ChevronIcon />
        </button>
        <button className="template-card padel-card card" onClick={startPadel}>
          <span className="template-letter type-padel">P</span>
          <span><strong>{t('workout.cardPadelTitle')}</strong><small>{t('workout.cardPadelSub')}</small></span><ChevronIcon />
        </button>
        <button className="template-card other-card card" onClick={startOther}>
          <span className="template-letter type-other">+</span>
          <span><strong>{t('workout.cardOtherTitle')}</strong><small>{t('workout.cardOtherSub')}</small></span><ChevronIcon />
        </button>
        <button className="template-card card" onClick={startMobility}>
          <span className="template-letter type-mobility">M</span>
          <span><strong>{t('workout.cardMobilityTitle')}</strong><small>{t('workout.cardMobilitySub')}</small></span><ChevronIcon />
        </button>
      </div>
      <button className="text-button cancel-link" onClick={onCancel}>{t('common.cancel')}</button>
    </main>
  );

  const rawCurrentTemplate = templates.find((template) => template.type === draft.type);
  const currentTemplate = rawCurrentTemplate ? localizeTemplate(rawCurrentTemplate, lang) : undefined;
  const prescription = draft.type === 'SPRINT' ? sprintPrescription(week) : null;
  const externalRings = draft.type === 'RINGS' && draft.sourceApp === 'die-ringe';
  const preSession = localizeMobility(mobilityChecklists.find((template) => template.variant === 'pre-session')!, lang);
  const visibleEntryCount = draft.compactCoreToWarmup
    ? draft.entries.filter((entry) => entry.exerciseId !== 'bird-dog' && entry.exerciseId !== 'side-plank').length
    : draft.entries.length;
  const substituteEntry = substituteIndex === null ? undefined : draft.entries[substituteIndex];
  const substituteExercise = substituteEntry && exercises.find((item) => item.id === substituteEntry.exerciseId);
  const substituteOriginalId = substituteEntry && draft.substitutions?.[substituteEntry.exerciseId];
  return (
    <main className="page workout-active">
      <header className="sticky-workout-header">
        <button className="icon-button" onClick={() => setDraft(null)} aria-label={t('common.back')}>‹</button>
        <div><span className="eyebrow">{sessionDate === localDate() ? t('common.today') : formatShortDate(sessionDate, locale)}</span><h1>{draft.title ?? currentTemplate?.title ?? t('workout.titleSprint', { week })}</h1></div>
        <span className="exercise-count">{externalRings ? draft.ringsAreas?.length ?? 0 : visibleEntryCount}</span>
      </header>
      <SessionDatePicker value={sessionDate} onChange={setSessionDate} />

      {comeback.active && comeback.reason && (draft.type === 'A' || draft.type === 'B' || draft.type === 'KB') && (
        <section className="alert-card subtle">
          <AlertIcon />
          <div>
            <strong>{t('workout.comebackTitle')}</strong>
            <p>{t(comeback.reason.key, comeback.reason.params)} {t('comeback.hintSuffix')}</p>
          </div>
        </section>
      )}

      {draft.injuryAdjustments && (
        <section className="alert-card subtle">
          <AlertIcon />
          <div>
            <strong>{t('workout.injuryTitle', { regions: draft.injuryAdjustments.regions.map((region) => t(bodyRegionLabel(region))).join(', ') })}</strong>
            <p>
              {[
                ...draft.injuryAdjustments.swaps.map((swap) => t('workout.injurySwap', { from: exerciseName(exercises, swap.from, lang), to: exerciseName(exercises, swap.to, lang) })),
                ...draft.injuryAdjustments.dropped.map((id) => t('workout.injuryDrop', { name: exerciseName(exercises, id, lang) }))
              ].join(' · ')}
            </p>
            {draft.type === 'BOARD_OFF' && draft.entries.length < 2 && (
              <p>{t('workout.injuryBoardOffThin')}</p>
            )}
          </div>
        </section>
      )}

      {draft.type === 'SPRINT' && (
        <>
          <section className="sprint-safety"><AlertIcon /><strong>{t('workout.sprintSafety')}</strong></section>
          <section className="warmup card"><span className="eyebrow">{t('workout.sprintWarmupEyebrow')}</span><p>{t('workout.sprintWarmupBody')}</p><strong>{t('workout.sprintPrescription', { distance: prescription?.distance ?? '', intensity: prescription?.intensity ?? '' })}</strong></section>
          <SprintStats sessions={sessionHistory} entries={draft.entries} lang={lang} />
        </>
      )}

      {(draft.type === 'A' || draft.type === 'B' || draft.type === 'KB') && (
        <section className="mobility-card card">
          <div><span className="eyebrow">{t('workout.warmupEyebrow', { min: preSession.durationMin })}</span><h3>{preSession.title}</h3></div>
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
                    {timerActive ? t('common.timerStop') : item.timerMode === 'pace' ? t('common.timerPace', { sec: item.timerSec }) : t('common.timerSeconds', { sec: item.timerSec })}
                  </button>
                )}
              </div>
            );
          })}
          {draft.type === 'B' && (
            <button className={draft.compactCoreToWarmup ? 'checked' : ''} onClick={() => setDraft({ ...draft, compactCoreToWarmup: !draft.compactCoreToWarmup })}>
              <i>{draft.compactCoreToWarmup && <CheckIcon />}</i><span>{t('workout.compactCoreLabel')}<small>{t('workout.compactCoreHint')}</small></span>
            </button>
          )}
        </section>
      )}

      {externalRings && (
        <RingsLogger draft={draft} update={setDraft} />
      )}

      {draft.type === 'BOARD_OFF' && (
        <section className="boardoff-setup card">
          <span className="eyebrow">{t('workout.boardOffSetupEyebrow')}</span>
          <h3>{t('workout.boardOffSetupTitle')}</h3>
          <ul>
            <li><strong>{t('workout.boardOffSetupLoad')}</strong> {t('workout.boardOffSetupLoadBody')}</li>
            <li><strong>{t('workout.boardOffSetupHeight')}</strong> {t('workout.boardOffSetupHeightBody')}</li>
            <li><strong>{t('workout.boardOffSetupAngle')}</strong> {t('workout.boardOffSetupAngleBody')}</li>
            <li><strong>{t('workout.boardOffSetupHarness')}</strong> {t('workout.boardOffSetupHarnessBody')}</li>
          </ul>
          <details className="boardoff-ampel">
            <summary>{t('workout.boardOffAmpelSummary')}</summary>
            <p><strong>{t('workout.boardOffAmpelRed')}</strong> {t('workout.boardOffAmpelRedBody')}</p>
            <p><strong>{t('workout.boardOffAmpelYellow')}</strong> {t('workout.boardOffAmpelYellowBody')}</p>
            <p><strong>{t('workout.boardOffAmpelGreen')}</strong> {t('workout.boardOffAmpelGreenBody')}</p>
          </details>
        </section>
      )}

      {draft.type === 'PADEL' && (
        <section className="padel-options card">
          <span className="eyebrow">{t('workout.padelEyebrow')}</span>
          <h3>{t('workout.padelTitle')}</h3>
          <div className="duration-picker">
            {[60, 90, 120].map((minutes) => (
              <button key={minutes} className={draft.durationMin === minutes ? 'selected' : ''} onClick={() => setDraft({ ...draft, durationMin: minutes })}>{t('common.minutes', { min: minutes })}</button>
            ))}
          </div>
          <p>{t('workout.padelNote')}</p>
        </section>
      )}

      {draft.type === 'OTHER' && (
        <section className="other-options card">
          <span className="eyebrow">{t('workout.otherEyebrow')}</span>
          <label>
            <span>{t('workout.otherActivity')}</span>
            <input autoFocus value={draft.activityName ?? ''} onChange={(event) => setDraft({ ...draft, activityName: event.target.value })} placeholder={t('workout.otherActivityPlaceholder')} />
          </label>
          <label>
            <span>{t('workout.otherDuration')}</span>
            <div className="other-duration"><input type="number" inputMode="numeric" min="0" value={draft.durationMin ?? ''} onChange={(event) => setDraft({ ...draft, durationMin: event.target.value === '' ? undefined : Number(event.target.value) })} placeholder="45" /><small>min</small></div>
          </label>
          <label>
            <span>{t('workout.otherLoad')} <strong>{formatLoad(draft.manualLoad ?? 1.5, lang)}</strong></span>
            <input type="range" min="0.5" max="3" step="0.5" value={draft.manualLoad ?? 1.5} onChange={(event) => setDraft({ ...draft, manualLoad: Number(event.target.value) })} />
            <small>{t('workout.otherLoadScale')}</small>
          </label>
        </section>
      )}

      {!externalRings && <div className="exercise-stack">
        {draft.entries.map((entry, entryIndex) => {
          if (draft.compactCoreToWarmup && (entry.exerciseId === 'bird-dog' || entry.exerciseId === 'side-plank')) return null;
          const exercise = exercises.find((item) => item.id === entry.exerciseId);
          if (!exercise) return null;
          const target = startingTarget(exercise.id, sessionHistory, exercises, sessionDate);
          return <ExerciseEditor key={exercise.id} exercise={exercise} entry={entry} target={target} comeback={comeback.active} note={draft.exerciseNotes[exercise.id]} regression={draft.boardOffRegressions?.[exercise.id]} autoregulation={draft.autoregulation?.[exercise.id]} onAutoregulate={(feedback) => applyAutoregulation(entryIndex, feedback)} update={(setIndex, set) => updateSet(entryIndex, setIndex, set)} onRequestSwap={() => setSubstituteIndex(entryIndex)} />;
        })}
      </div>}

      {(draft.type === 'A' || draft.type === 'B' || draft.type === 'MOBILITY') && (
        <section className="mobility-card cooldown-card card">
          <div><span className="eyebrow">{draft.type === 'MOBILITY' ? t('workout.mobilityChecklistEyebrow') : t('workout.cooldownEyebrow')}</span><h3>{draft.type === 'MOBILITY' ? t('workout.mobilityChecklistTitle') : t('workout.cooldownTitle')}</h3></div>
          {mobilityItems.map((rawItem) => {
            const item = localizeExercise(rawItem, lang);
            const checked = draft.mobilityDone.includes(item.id);
            const sourceId = `checklist-${draft.type}-${item.id}`;
            const timerActive = activeTimer?.sourceId === sourceId;
            return (
              <div className="mobility-checklist-item" key={item.id}>
                <button className={`mobility-item-check ${checked ? 'checked' : ''}`} onClick={() => setDraft({ ...draft, mobilityDone: checked ? draft.mobilityDone.filter((id) => id !== item.id) : [...draft.mobilityDone, item.id] })} aria-pressed={checked}><i>{checked && <CheckIcon />}</i><span>{item.name}</span></button>
                {item.timer && (
                  <button className={`mobility-item-timer ${timerActive ? 'active' : ''}`} onClick={() => void controlChecklistTimer(item.name, sourceId, item.timer!.mode, item.timer!.defaultSec)}>
                    {timerActive ? t('common.timerStop') : item.timer.mode === 'countup' ? t('workout.timerStart') : item.timer.mode === 'pace' ? t('common.timerPace', { sec: item.timer.defaultSec ?? 30 }) : t('common.timerSeconds', { sec: item.timer.defaultSec ?? 30 })}
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

      <label className="note-field card"><span>{t('workout.noteLabel')}</span><textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder={t('workout.notePlaceholder')} rows={2} /></label>
      <div className="workout-actions"><button className="primary" onClick={save} disabled={saving || (externalRings && !draft.ringsAreas?.length) || (draft.type === 'OTHER' && !draft.activityName?.trim())}>{saving ? t('common.saving') : externalRings && !draft.ringsAreas?.length ? t('workout.selectArea') : draft.type === 'OTHER' && !draft.activityName?.trim() ? t('workout.nameActivity') : t('workout.finish')}</button></div>

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

  const lang = useLang();

  return (
    <div className="rings-logger">
      <section className="rings-source card">
        <span className="eyebrow">{t('workout.ringsSourceEyebrow')}</span>
        <h3>{t('workout.ringsSourceTitle')}</h3>
        <p>{t('workout.ringsSourceBody')}</p>
      </section>

      <section className="rings-section card">
        <span className="eyebrow">{t('workout.ringsAreasEyebrow')}</span>
        <div className="rings-area-grid">
          {ringsAreaOptions.map((option) => {
            const selected = areas.includes(option.value);
            return (
              <button key={option.value} className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => toggleArea(option.value)}>
                <i>{selected && <CheckIcon />}</i>
                <span><strong>{t(option.labelKey)}</strong><small>{t(option.detailKey)}</small></span>
              </button>
            );
          })}
        </div>
      </section>

      {areas.includes('skills') && (
        <section className="rings-section card">
          <span className="eyebrow">{t('workout.ringsSkillsEyebrow')}</span>
          <div className="skill-picker">
            {ringsSkillValues.map((value) => (
              <button key={value} className={skills.includes(value) ? 'selected' : ''} aria-pressed={skills.includes(value)} onClick={() => toggleSkill(value)}>{t(ringsSkillKey(value))}</button>
            ))}
          </div>
        </section>
      )}

      <section className="rings-section card">
        <span className="eyebrow">{t('workout.ringsDurationEyebrow')}</span>
        <div className="rings-duration-picker">
          {[30, 45, 60, 90].map((minutes) => (
            <button key={minutes} className={draft.durationMin === minutes ? 'selected' : ''} aria-pressed={draft.durationMin === minutes} onClick={() => update({ ...draft, durationMin: minutes })}>{t('common.minutes', { min: minutes })}</button>
          ))}
        </div>
      </section>

      <section className="rings-section card intensity-picker">
        <span className="eyebrow">{t('workout.ringsIntensityEyebrow')}</span>
        <div className="segmented rings-intensity">
          {(['chill', 'normal', 'hard'] as TrainingIntensity[]).map((value) => (
            <button key={value} className={draft.intensity === value ? 'selected' : ''} aria-pressed={draft.intensity === value} onClick={() => update({ ...draft, intensity: value })}>{t(trainingIntensityKey(value))}</button>
          ))}
        </div>
        <small>{t('workout.ringsLoadPoints', { load: formatLoad(draft.intensity === 'chill' ? 1 : draft.intensity === 'hard' ? 2 : 1.5, lang) })}</small>
      </section>
    </div>
  );
}

const autoregulationOptions: { value: AutoregulationFeedback; key: 'workout.autoregulationEasy' | 'workout.autoregulationOk' | 'workout.autoregulationHard' }[] = [
  { value: 'easy', key: 'workout.autoregulationEasy' },
  { value: 'ok', key: 'workout.autoregulationOk' },
  { value: 'hard', key: 'workout.autoregulationHard' }
];

function ExerciseEditor({ exercise: rawExercise, entry, target, comeback, note, regression, autoregulation, onAutoregulate, update, onRequestSwap }: { exercise: Exercise; entry: Entry; target: SetLog | null; comeback?: boolean; note?: string; regression?: string; autoregulation?: AutoregulationFeedback; onAutoregulate: (feedback: AutoregulationFeedback) => void; update: (index: number, set: SetLog) => void; onRequestSwap: () => void }) {
  const lang = useLang();
  const exercise = localizeExercise(rawExercise, lang);
  const hasWeight = exercise.metric === 'weight_reps';
  const youtubeUrl = exercise.youtubeQuery
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtubeQuery)}`
    : undefined;
  const showAutoregulation = hasWeight && exercise.incrementKg !== 0
    && entry.sets[0]?.successful === true && typeof entry.sets[0]?.kg === 'number'
    && entry.sets.some((set, index) => index > 0 && set.successful === undefined);
  const secondaryLabel = exercise.metric === 'time' ? t('workout.setColSeconds') : exercise.metric === 'distance' || exercise.id === 'suitcase-carry' ? t('workout.setColMeters') : t('workout.setColReps');
  return (
    <section className="exercise-card card">
      <div className="exercise-header">
        <div>
          <h3>{exercise.name}</h3>
          {exercise.perSide && <span className="side-badge">{t('common.perSide')}</span>}
          {note && <p className="exercise-note">{note}</p>}
          {youtubeUrl && (
            <a className="exercise-video-link" href={youtubeUrl} target="_blank" rel="noreferrer" aria-label={t('workout.videoLinkAria', { name: exercise.name })}>
              <PlayIcon /> {t('workout.videoLink')}
            </a>
          )}
        </div>
        <div className="exercise-header-actions">
          {target?.kg !== undefined && <span className={`target${comeback ? ' comeback' : ''}`}>{comeback ? t('workout.targetStart', { kg: formatKg(target.kg, lang) }) : t('workout.targetGoal', { kg: formatKg(target.kg, lang) })}</span>}
          {exercise.pattern && (
            <button type="button" className="exercise-swap-button" onClick={onRequestSwap} aria-label={t('workout.swapAria', { name: exercise.name })}>
              <SwapIcon />
            </button>
          )}
        </div>
      </div>
      <div className="set-table">
        <div className={`set-labels ${hasWeight ? '' : 'no-weight'}`}><span>{t('workout.setColSet')}</span>{hasWeight && <span>{t('workout.setColKg')}</span>}<span>{secondaryLabel}</span><span>{t('workout.setColOk')}</span></div>
        {entry.sets.map((set, index) => <SetEditor key={index} index={index} exercise={exercise} set={set} update={(value) => update(index, value)} />)}
      </div>
      {showAutoregulation && (
        <div className="autoregulation">
          <span className="eyebrow">{t('workout.autoregulationEyebrow')}</span>
          <div className="segmented">
            {autoregulationOptions.map((option) => (
              <button key={option.value} type="button" className={autoregulation === option.value ? 'selected' : ''} aria-pressed={autoregulation === option.value} onClick={() => onAutoregulate(option.value)}>
                {t(option.key)}
              </button>
            ))}
          </div>
        </div>
      )}
      {regression && (
        <details className="exercise-regression">
          <summary>{t('workout.regressionSummary')}</summary>
          <p>{regression}</p>
        </details>
      )}
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
        {hasWeight && <input inputMode="decimal" aria-label={t('workout.setKgAria', { n: index + 1 })} value={set.kg ?? ''} placeholder="–" onChange={(event) => number('kg', event.target.value)} />}
        <input inputMode="decimal" aria-label={t('workout.setValueAria', { n: index + 1 })} value={set[secondaryKey] ?? ''} placeholder="–" onChange={(event) => number(secondaryKey, event.target.value)} />
        <button
          type="button"
          className={set.successful === true ? 'set-success' : set.successful === false ? 'set-failed' : 'set-pending'}
          onClick={() => update({ ...set, successful: set.successful === undefined ? true : set.successful === true ? false : undefined })}
          aria-label={set.successful === true ? t('workout.setSuccessLogged') : set.successful === false ? t('workout.setFailedLabel') : t('workout.setLogAction')}
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
      label: t('workout.timerSetLabel', { name: exercise.name, n: index + 1 }),
      sourceId,
      defaultSec: duration,
      endTimestamp: config.mode === 'countup' ? undefined : Date.now() + duration * 1000
    });
  }

  const label = active
    ? config.mode === 'countup' ? t('workout.timerStopKeepTime') : t('common.timerStopFull')
    : config.mode === 'countup'
      ? set.sec !== undefined ? t('workout.timerRemeasure') : t('workout.timerStartStopwatch')
      : config.mode === 'pace' ? t('workout.timerStartPace', { sec: seconds }) : t('workout.timerStartCountdown', { sec: seconds });
  return (
    <div className={`set-timer-controls ${exercise.metric !== 'time' && config.mode === 'countup' ? 'with-input' : ''}`}>
      {exercise.metric !== 'time' && config.mode === 'countup' && (
        <label className="direct-time-input">
          <span>{t('workout.directTimeLabel')}</span>
          <input
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            aria-label={t('workout.setTimeAria', { n: index + 1 })}
            value={set.sec ?? ''}
            placeholder={t('workout.directTimePlaceholder')}
            onChange={(event) => update({ ...set, sec: event.target.value === '' ? undefined : Number(event.target.value) })}
          />
        </label>
      )}
      <button type="button" className={`set-timer-button ${active ? 'active' : ''}`} onClick={() => void control()}>{label}</button>
    </div>
  );
}

function SprintStats({ sessions, entries, lang }: { sessions: Session[]; entries: Entry[]; lang: Lang }) {
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
  const value = (seconds: number | undefined) => seconds === undefined ? '–' : t('workout.sprintSeconds', { sec: formatFixed(seconds, lang, 2) });

  return (
    <section className="sprint-stats card">
      <div><span className="eyebrow">{t('workout.sprintStatsEyebrow', { distance: distance ?? '–' })}</span><h3>{t('workout.sprintStatsTitle')}</h3></div>
      <div className="sprint-stat-grid">
        <span><small>{t('workout.sprintStatFastest')}</small><strong>{value(currentTimes.length ? Math.min(...currentTimes) : undefined)}</strong></span>
        <span><small>{t('workout.sprintStatAverage')}</small><strong>{value(currentTimes.length ? average(currentTimes) : undefined)}</strong></span>
        <span><small>{t('workout.sprintStatLast')}</small><strong>{value(latestTimes.length ? average(latestTimes) : undefined)}</strong></span>
        <span><small>{t('workout.sprintStatBest')}</small><strong>{value(history.length ? Math.min(...history.map((set) => set.sec!)) : undefined)}</strong></span>
      </div>
    </section>
  );
}

const boardOffAssessmentQuestions: { key: keyof Omit<BoardOffAssessment, 'deadHang'>; qKey: 'workout.assessmentQHasRig' | 'workout.assessmentQActiveCompression' | 'workout.assessmentQLongSit30s' | 'workout.assessmentQShoulderFlexion' | 'workout.assessmentQTailGrab' | 'workout.assessmentQOneFooter' | 'workout.assessmentQBoardOffByFin' | 'workout.assessmentQBoardOffByHandle' }[] = [
  { key: 'hasRig', qKey: 'workout.assessmentQHasRig' },
  { key: 'activeCompression', qKey: 'workout.assessmentQActiveCompression' },
  { key: 'longSit30s', qKey: 'workout.assessmentQLongSit30s' },
  { key: 'shoulderFlexion', qKey: 'workout.assessmentQShoulderFlexion' },
  { key: 'tailGrab', qKey: 'workout.assessmentQTailGrab' },
  { key: 'oneFooter', qKey: 'workout.assessmentQOneFooter' },
  { key: 'boardOffByFin', qKey: 'workout.assessmentQBoardOffByFin' },
  { key: 'boardOffByHandle', qKey: 'workout.assessmentQBoardOffByHandle' }
];

function BoardOffAssessmentForm({ onDone }: { onDone: (assessment: BoardOffAssessment) => void | Promise<void> }) {
  const lang = useLang();
  const [answers, setAnswers] = useState<Partial<BoardOffAssessment>>({});
  const complete = boardOffAssessmentQuestions.every(({ key }) => typeof answers[key] === 'boolean') && answers.deadHang !== undefined;
  const recommended = complete ? recommendBoardOffLevel(answers as BoardOffAssessment) : null;
  const recommendedLevel = recommended !== null ? localizeBoardOffLevel(boardOffLevels[recommended], lang) : null;
  return (
    <div className="boardoff-assessment">
      <section className="card boardoff-assessment-intro">
        <span className="eyebrow">{t('workout.assessmentHowEyebrow')}</span>
        <p>{t('workout.assessmentHowBody')}</p>
      </section>
      <section className="card boardoff-questions">
        {boardOffAssessmentQuestions.map(({ key, qKey }) => (
          <div className="boardoff-question" key={key}>
            <p>{t(qKey)}</p>
            <div className="segmented">
              <button type="button" className={answers[key] === true ? 'selected' : ''} onClick={() => setAnswers({ ...answers, [key]: true })}>{t('common.yes')}</button>
              <button type="button" className={answers[key] === false ? 'selected' : ''} onClick={() => setAnswers({ ...answers, [key]: false })}>{t('common.no')}</button>
            </div>
          </div>
        ))}
        <div className="boardoff-question">
          <p>{t('workout.assessmentQDeadHang')}</p>
          <div className="segmented">
            {(['under20', '20to30', 'over30'] as const).map((value) => (
              <button type="button" key={value} className={answers.deadHang === value ? 'selected' : ''} onClick={() => setAnswers({ ...answers, deadHang: value })}>
                {value === 'under20' ? t('workout.assessmentDeadHangUnder20') : value === '20to30' ? t('workout.assessmentDeadHang20to30') : t('workout.assessmentDeadHangOver30')}
              </button>
            ))}
          </div>
        </div>
      </section>
      {recommended !== null && recommendedLevel !== null && (
        <section className="card boardoff-recommendation">
          <span className="eyebrow">{t('workout.assessmentRecommendationEyebrow')}</span>
          <h3>{t('workout.assessmentRecommendationTitle', { level: recommended, label: recommendedLevel.label })}</h3>
          <p>{recommended === 0 ? t('workout.assessmentRecommendation0') : t('workout.assessmentRecommendationNext', { gate: recommendedLevel.gate })}</p>
          {answers.hasRig === false && <p className="muted">{t('workout.assessmentNoRig')}</p>}
          {answers.shoulderFlexion === false && <p className="muted">{t('workout.assessmentShoulderFlexion')}</p>}
        </section>
      )}
      <div className="workout-actions">
        <button className="primary" disabled={!complete} onClick={() => complete && void onDone(answers as BoardOffAssessment)}>
          {complete ? t('workout.assessmentApply', { level: recommended ?? '' }) : t('workout.assessmentAnswerAll')}
        </button>
      </div>
    </div>
  );
}
