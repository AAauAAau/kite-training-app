import { useMemo, useState } from 'react';
import { formatShortDate, localDate } from '../logic/date';
import { deloadDue, sessionLoad } from '../logic/training';
import { useAppStore } from '../store';
import type { KiteIntensity, RingsArea, RingsSkill, Session } from '../types';
import { AlertIcon, CheckIcon, ChevronIcon, WindIcon } from './Icons';
import { LoadSparkline } from './LoadSparkline';

const labels: Record<string, string> = { A: 'Tag A', B: 'Tag B', RINGS: 'Ringe', SPRINT: 'Sprint', KITE: 'Kite', PADEL: 'Padel Tennis', KB: 'Kettlebell', MOBILITY: 'Mobility', BOARD_OFF: 'Board-Off Drills' };
const ringsAreaLabels: Record<RingsArea, string> = { mobility: 'Mobility', upper: 'Oberkörper', legs: 'Legs', skills: 'Skills' };
const ringsSkillLabels: Record<RingsSkill, string> = { 'ring-muscle-up': 'Ring Muscle-up', 'l-sit': 'L-Sit', 'side-split': 'Side Split', 'pistol-squat': 'Pistol Squat' };

export function Dashboard({ onTrain }: { onTrain: () => void }) {
  const { sessions, settings, addSession, updateSession, deleteSession, dismissDeload } = useAppStore();
  const [quickKite, setQuickKite] = useState<Session | null>(null);
  const [intensitySaved, setIntensitySaved] = useState(false);
  const today = localDate();
  const due = useMemo(() => deloadDue(sessions, settings, today), [sessions, settings, today]);
  const dismissed = settings.deloadDismissedUntil && settings.deloadDismissedUntil >= today;
  const todaySessions = sessions.filter((session) => session.date === today);
  const activeKite = quickKite ?? todaySessions.find((session) => session.type === 'KITE') ?? null;

  async function logKite() {
    const session: Session = { id: crypto.randomUUID(), date: today, type: 'KITE', entries: [], intensity: 'normal', createdAt: Date.now() };
    await addSession(session);
    setQuickKite(session);
  }

  async function setIntensity(intensity: KiteIntensity) {
    if (!activeKite) return;
    await updateSession(activeKite.id, { intensity });
    setQuickKite({ ...activeKite, intensity });
    setIntensitySaved(true);
    window.setTimeout(() => setIntensitySaved(false), 1800);
  }

  async function removeKite() {
    if (!activeKite || !window.confirm('Kitetag wirklich entfernen?')) return;
    await deleteSession(activeKite.id);
    setQuickKite(null);
    setIntensitySaved(false);
  }

  return (
    <main className="page dashboard">
      <header className="page-header">
        <div><span className="eyebrow">{formatShortDate(today)}</span><h1>Moin.</h1></div>
        <div className="brand-mark"><WindIcon /></div>
      </header>

      {due.due && !dismissed && (
        <section className="alert-card">
          <AlertIcon />
          <div><strong>Deload wäre klug.</strong><p>{due.reason}</p><button className="text-button" onClick={dismissDeload}>7 Tage ausblenden</button></div>
        </section>
      )}

      <section className="hero-card">
        <div className="hero-kite"><WindIcon size={42} /></div>
        <span className="eyebrow">Wind schlägt Plan</span>
        <h2>Kitetag?</h2>
        <p>Ein Tap. Ist sofort in deiner Trainingslast.</p>
        <button className="primary kite-button" onClick={logKite} disabled={Boolean(activeKite)}>
          {activeKite ? <><CheckIcon /> Geloggt</> : <><WindIcon /> Kite loggen</>}
        </button>
        {activeKite && (
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
            <button className="remove-kite" onClick={removeKite}>Kitetag entfernen</button>
          </div>
        )}
      </section>

      <div className="section-heading"><h2>Heute</h2><button className="text-button" onClick={onTrain}>Training starten <ChevronIcon /></button></div>
      {todaySessions.length ? (
        <div className="session-list">
          {todaySessions.map((session) => <SessionRow key={session.id} session={session} />)}
        </div>
      ) : (
        <button className="empty-card" onClick={onTrain}><span>Noch nichts geloggt.</span><strong>Einheit auswählen</strong></button>
      )}

      <LoadSparkline sessions={sessions} today={today} threshold={settings.loadThreshold7d} />

      <div className="section-heading"><h2>Zuletzt</h2></div>
      <div className="session-list">
        {sessions.filter((session) => session.date !== today).slice(0, 4).map((session) => <SessionRow key={session.id} session={session} />)}
        {!sessions.length && <p className="muted">Deine Einheiten erscheinen hier.</p>}
      </div>
    </main>
  );
}

function SessionRow({ session }: { session: Session }) {
  const title = session.type === 'RINGS' && session.sourceApp === 'die-ringe' ? 'Die Ringe' : labels[session.type];
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
        <span>{formatShortDate(session.date)}{areas ? ` · ${areas}` : ''}{session.durationMin ? ` · ${session.durationMin} min` : ''} · Last {sessionLoad(session).toFixed(1)}</span>
        {skills && <small>{skills}</small>}
      </div>
      {session.feel && <span className={`feel-dot ${session.feel}`} title={session.feel} />}
    </div>
  );
}
