import { useMemo, useState } from 'react';
import { formatShortDate, localDate } from '../logic/date';
import { mobilityChecklists } from '../data/seed';
import { deloadDue, sessionLoad, weeklyStrengthWarning } from '../logic/training';
import { useAppStore } from '../store';
import type { ChecklistItem, KiteIntensity, RingsArea, RingsSkill, Session } from '../types';
import { AlertIcon, CheckIcon, ChevronIcon, WindIcon } from './Icons';
import { KiteDetailsEditor } from './KiteDetailsEditor';
import { LoadSparkline } from './LoadSparkline';
import { SessionDatePicker } from './SessionDatePicker';
import { primeTimerAudio } from './TimerDock';

const labels: Record<string, string> = { A: 'Tag A', B: 'Tag B', RINGS: 'Ringe', SPRINT: 'Sprint', KITE: 'Kite', PADEL: 'Padel Tennis', KB: 'Kettlebell', MOBILITY: 'Mobility', BOARD_OFF: 'Board-Off Drills', OTHER: 'Andere Aktivität' };
const ringsAreaLabels: Record<RingsArea, string> = { mobility: 'Mobility', upper: 'Oberkörper', legs: 'Legs', skills: 'Skills' };
const ringsSkillLabels: Record<RingsSkill, string> = { 'ring-muscle-up': 'Ring Muscle-up', 'l-sit': 'L-Sit', 'side-split': 'Side Split', 'pistol-squat': 'Pistol Squat' };

export function Dashboard({ onTrain, onKiteLogged }: { onTrain: () => void; onKiteLogged: (sessionId: string) => void }) {
  const { sessions, settings, activeTimer, addSession, updateSession, deleteSession, dismissDeload, startTimer, stopTimer } = useAppStore();
  const [quickKite, setQuickKite] = useState<Session | null>(null);
  const [kiteDate, setKiteDate] = useState(localDate());
  const [intensitySaved, setIntensitySaved] = useState(false);
  const today = localDate();
  const due = useMemo(() => deloadDue(sessions, settings, today), [sessions, settings, today]);
  const dismissed = settings.deloadDismissedUntil && settings.deloadDismissedUntil >= today;
  const todaySessions = sessions.filter((session) => session.date === today);
  const todayActivities = todaySessions.filter((session) => !isMorningRoutine(session));
  const activeKite = (quickKite?.date === kiteDate ? quickKite : null) ?? sessions.find((session) => session.date === kiteDate && session.type === 'KITE') ?? null;
  const morning = mobilityChecklists.find((template) => template.variant === 'morning')!;
  const morningSession = todaySessions.find((session) =>
    isMorningRoutine(session)
  );
  const morningDone = morningSession?.mobilityDone?.filter((id) => id.startsWith('morning-')).length ?? 0;
  const strengthWarning = weeklyStrengthWarning(today, sessions);

  async function logKite() {
    const session: Session = { id: crypto.randomUUID(), date: kiteDate, type: 'KITE', entries: [], intensity: 'normal', createdAt: Date.now() };
    await addSession(session);
    setQuickKite(session);
    onKiteLogged(session.id);
  }

  async function setIntensity(intensity: KiteIntensity) {
    if (!activeKite) return;
    await updateSession(activeKite.id, { intensity });
    setQuickKite((current) => ({ ...(current ?? activeKite), intensity }));
    setIntensitySaved(true);
    window.setTimeout(() => setIntensitySaved(false), 1800);
  }

  async function setKiteDetails(kite: Session['kite']) {
    if (!activeKite) return;
    await updateSession(activeKite.id, { kite });
    setQuickKite((current) => ({ ...(current ?? activeKite), kite }));
  }

  async function removeKite() {
    if (!activeKite || !window.confirm('Kitetag wirklich entfernen?')) return;
    await deleteSession(activeKite.id);
    setQuickKite(null);
    setIntensitySaved(false);
  }

  async function toggleMorning(itemId: string) {
    const current = morningSession?.mobilityDone ?? [];
    const mobilityDone = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    if (morningSession) {
      if (mobilityDone.length) await updateSession(morningSession.id, { mobilityDone });
      else await deleteSession(morningSession.id);
    } else {
      await addSession({
        id: `morning-${today}`, date: today, type: 'MOBILITY', entries: [], mobilityDone,
        durationMin: morning.durationMin, note: morning.title, createdAt: Date.now()
      });
    }
  }

  async function controlMorningTimer(item: ChecklistItem) {
    if (!item.timerSec) return;
    const sourceId = `morning-${today}-${item.id}`;
    if (activeTimer?.sourceId === sourceId) {
      await stopTimer();
      return;
    }
    primeTimerAudio();
    const mode = item.timerMode ?? 'countdown';
    await startTimer({
      mode,
      kind: 'exercise',
      label: item.label,
      sourceId,
      defaultSec: item.timerSec,
      endTimestamp: Date.now() + item.timerSec * 1000
    });
  }

  return (
    <main className="page dashboard">
      <header className="page-header dashboard-header">
        <div className="dashboard-title">
          <span className="eyebrow">Kite Strength</span>
          <h1>Heute</h1>
          <time className="dashboard-date" dateTime={today}>{formatShortDate(today)}</time>
        </div>
        <div className="dashboard-logo-wrap">
          <img className="dashboard-logo" src={`${import.meta.env.BASE_URL}tl-kiteboarding-logo.png`} alt="TL Kiteboarding · Straight Outta Mecklenburg" />
        </div>
      </header>

      {due.due && !dismissed && (
        <section className="alert-card">
          <AlertIcon />
          <div><strong>Deload wäre klug.</strong><p>{due.reason}</p><button className="text-button" onClick={dismissDeload}>7 Tage ausblenden</button></div>
        </section>
      )}

      {strengthWarning && (
        <section className="alert-card subtle"><AlertIcon /><div><strong>Bein-Kraft im Blick behalten</strong><p>{strengthWarning}</p></div></section>
      )}

      <section className="hero-card">
        <div className="hero-kite"><WindIcon size={42} /></div>
        <span className="eyebrow">Wind schlägt Plan</span>
        <h2>Kitetag?</h2>
        <p>Ein Tap. Ist sofort in deiner Trainingslast.</p>
        <SessionDatePicker value={kiteDate} onChange={setKiteDate} />
        <button className="primary kite-button" onClick={logKite}>
          <WindIcon /> {activeKite ? 'Weitere Kite-Session loggen' : 'Kite loggen'}
        </button>
        {activeKite && (
          <>
            <div className="intensity-picker compact">
              <span>Wie intensiv?</span>
              <div className="segmented">
                {(['chill', 'normal', 'hard'] as KiteIntensity[]).map((value) => (
                  <button key={value} className={activeKite.intensity === value ? 'selected' : ''} onClick={() => setIntensity(value)}>{value === 'chill' ? 'Chill' : value === 'normal' ? 'Normal' : 'Hart'}</button>
                ))}
              </div>
              <small className={`autosave-hint ${intensitySaved ? 'confirmed' : ''}`} role="status">
                <CheckIcon /> {intensitySaved ? 'Gespeichert' : 'Wird automatisch gespeichert'}
              </small>
              <button className="remove-kite" onClick={removeKite}>Diese Session entfernen</button>
            </div>
            <KiteDetailsEditor details={activeKite.kite} focusTags={settings.kiteFocusTags} onChange={setKiteDetails} />
          </>
        )}
      </section>

      <details className="mobility-card morning-card card">
        <summary>
          <span><span className="eyebrow">Täglich · ca. {morning.durationMin} min</span><strong>{morning.title}</strong></span>
          <span className={morningDone === morning.items.length ? 'routine-progress complete' : 'routine-progress'}>{morningDone}/{morning.items.length}</span>
        </summary>
        <div className="morning-content">
          <p className="morning-safety">Morgens keine tiefe Vorbeuge mit rundem Rücken. Down Dog bleibt unbelastet.</p>
          {morning.items.map((item) => {
            const checked = morningSession?.mobilityDone?.includes(item.id) ?? false;
            const timerActive = activeTimer?.sourceId === `morning-${today}-${item.id}`;
            return (
              <div className="morning-item" key={item.id}>
                <button className={`morning-item-check ${checked ? 'checked' : ''}`} onClick={() => void toggleMorning(item.id)} aria-pressed={checked}>
                  <i>{checked && <CheckIcon />}</i><span><strong>{item.label}</strong>{item.purpose && <small>{item.purpose}</small>}</span>
                </button>
                {item.timerSec && (
                  <button
                    className={`morning-item-timer ${timerActive ? 'active' : ''}`}
                    aria-label={timerActive ? `${item.label}: Timer stoppen` : `${item.label}: ${item.timerSec} Sekunden Timer starten`}
                    onClick={() => void controlMorningTimer(item)}
                  >{timerActive ? 'Stop' : item.timerMode === 'pace' ? `${item.timerSec} s Tempo` : `${item.timerSec} s`}</button>
                )}
              </div>
            );
          })}
        </div>
      </details>

      <div className="section-heading"><h2>Heute</h2><button className="text-button" onClick={onTrain}>Training starten <ChevronIcon /></button></div>
      {todayActivities.length ? (
        <div className="session-list">
          {todayActivities.map((session) => <SessionRow key={session.id} session={session} />)}
        </div>
      ) : (
        <button className="empty-card" onClick={onTrain}><span>Noch nichts geloggt.</span><strong>Einheit auswählen</strong></button>
      )}

      <LoadSparkline sessions={sessions} today={today} threshold={settings.loadThreshold7d} />

      <div className="section-heading"><h2>Zuletzt</h2></div>
      <div className="session-list">
        {sessions.filter((session) => session.date !== today && !isMorningRoutine(session)).slice(0, 4).map((session) => <SessionRow key={session.id} session={session} />)}
        {!sessions.some((session) => !isMorningRoutine(session)) && <p className="muted">Deine Einheiten erscheinen hier.</p>}
      </div>
    </main>
  );
}

function isMorningRoutine(session: Session): boolean {
  return session.type === 'MOBILITY' && (
    session.note === 'Morgenroutine' || Boolean(session.mobilityDone?.some((id) => id.startsWith('morning-')))
  );
}

function SessionRow({ session }: { session: Session }) {
  const title = session.type === 'OTHER' && session.activityName
    ? session.activityName
    : session.type === 'RINGS' && session.sourceApp === 'die-ringe'
    ? 'Die Ringe'
    : session.type === 'MOBILITY' && (session.note === 'Morgenroutine' || session.mobilityDone?.some((id) => id.startsWith('morning-')))
      ? 'Morgenroutine'
      : labels[session.type];
  const areas = session.type === 'RINGS' && session.ringsAreas?.length
    ? session.ringsAreas.map((area) => ringsAreaLabels[area]).join(' + ')
    : '';
  const skills = session.type === 'RINGS' && session.ringsSkills?.length
    ? session.ringsSkills.map((skill) => ringsSkillLabels[skill]).join(' · ')
    : '';
  return (
    <div className="session-row card">
      <div className={`session-icon type-${session.type.toLowerCase()}`}>{session.type === 'KITE' ? <WindIcon /> : title.slice(0, 1)}</div>
      <div className="session-copy">
        <strong>{title}</strong>
        <span>{formatShortDate(session.date)}{areas ? ` · ${areas}` : ''}{session.type === 'BOARD_OFF' && session.boardOffLevel !== undefined ? ` · Stufe ${session.boardOffLevel}` : ''}{session.durationMin ? ` · ${session.durationMin} min` : ''} · Last {sessionLoad(session).toFixed(1)}</span>
        {skills && <small>{skills}</small>}
      </div>
      {session.feel && <span className={`feel-dot ${session.feel}`} title={session.feel} />}
    </div>
  );
}
