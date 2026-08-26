import { useMemo, useState } from 'react';
import { formatShortDate } from '../logic/date';
import { sessionLoad } from '../logic/training';
import { useAppStore } from '../store';
import type { Session, SessionType, SetLog } from '../types';
import { KiteDetailsEditor } from './KiteDetailsEditor';
import { KiteSeasonAnalysis } from './KiteSeasonAnalysis';

const labels: Record<SessionType, string> = {
  A: 'Tag A', B: 'Tag B', RINGS: 'Ringe', KB: 'KB-Circuit', SPRINT: 'Sprint',
  MOBILITY: 'Mobility', KITE: 'Kite', PADEL: 'Padel', BOARD_OFF: 'Board-Off', OTHER: 'Andere Aktivität'
};

function formatSet(set: SetLog): string {
  const values: string[] = [];
  if (set.kg !== undefined) values.push(`${set.kg} kg`);
  if (set.reps !== undefined) values.push(`${set.reps} Wdh.`);
  if (set.distanceM !== undefined) values.push(`${set.distanceM} m`);
  if (set.sec !== undefined) values.push(`${set.sec.toFixed(2)} s`);
  if (set.perSide) values.push('je Seite');
  if (set.successful === false) values.push('Fehlversuch');
  return values.join(' · ') || 'ohne Messwert';
}

export function LogView() {
  const { sessions, exercises, settings, updateSession } = useAppStore();
  const [filter, setFilter] = useState<'ALL' | SessionType>('ALL');
  const types = useMemo(() => [...new Set(sessions.map((session) => session.type))], [sessions]);
  const visible = filter === 'ALL' ? sessions : sessions.filter((session) => session.type === filter);
  const totalLoad = visible.reduce((sum, session) => sum + sessionLoad(session), 0);

  return (
    <main className="page log-page">
      <header className="page-header"><div><span className="eyebrow">Alle Einträge</span><h1>Verlauf</h1></div></header>

      <section className="log-summary card">
        <span><strong>{visible.length}</strong><small>Einheiten</small></span>
        <span><strong>{totalLoad.toFixed(1)}</strong><small>Lastpunkte</small></span>
      </section>

      <div className="log-filters" aria-label="Trainingstyp filtern">
        <button className={filter === 'ALL' ? 'selected' : ''} onClick={() => setFilter('ALL')}>Alle</button>
        {types.map((type) => <button key={type} className={filter === type ? 'selected' : ''} onClick={() => setFilter(type)}>{labels[type]}</button>)}
      </div>

      {(filter === 'ALL' || filter === 'KITE') && <KiteSeasonAnalysis sessions={sessions} />}

      <div className="log-list">
        {visible.map((session) => (
          <LogEntry
            key={session.id}
            session={session}
            exerciseNames={new Map(exercises.map((exercise) => [exercise.id, exercise.name]))}
            focusTags={settings.kiteFocusTags}
            updateSession={updateSession}
          />
        ))}
        {!visible.length && <p className="muted">Für diesen Filter gibt es noch keine Einträge.</p>}
      </div>
    </main>
  );
}

function LogEntry({
  session,
  exerciseNames,
  focusTags,
  updateSession
}: {
  session: Session;
  exerciseNames: Map<string, string>;
  focusTags: string[];
  updateSession: (id: string, patch: Partial<Session>) => Promise<void>;
}) {
  const title = session.type === 'OTHER' && session.activityName
    ? session.activityName
    : session.type === 'MOBILITY' && (session.note === 'Morgenroutine' || session.mobilityDone?.some((id) => id.startsWith('morning-')))
    ? 'Morgenroutine'
    : session.type === 'RINGS' && session.sourceApp === 'die-ringe' ? 'Die Ringe' : labels[session.type];
  return (
    <details className="log-entry card">
      <summary>
        <span className={`session-icon type-${session.type.toLowerCase()}`}>{title.slice(0, 1)}</span>
        <span><strong>{title}</strong><small>{formatShortDate(session.date)} · Last {sessionLoad(session).toFixed(1)}</small></span>
        <b>⌄</b>
      </summary>
      <div className="log-details">
        {(session.durationMin || session.intensity || session.feel) && (
          <p>{session.durationMin ? `${session.durationMin} min` : ''}{session.intensity ? ` · ${session.intensity}` : ''}{session.feel ? ` · Gefühl: ${session.feel}` : ''}</p>
        )}
        {session.entries.map((entry) => (
          <div className="log-exercise" key={entry.exerciseId}>
            <strong>{exerciseNames.get(entry.exerciseId) ?? entry.exerciseId}</strong>
            <ol>{entry.sets.map((set, index) => <li key={index}>{formatSet(set)}</li>)}</ol>
          </div>
        ))}
        {session.mobilityDone?.length ? <p>{session.mobilityDone.length} Checklistenpunkte erledigt</p> : null}
        {session.type === 'KITE' && (
          <KiteDetailsEditor details={session.kite} focusTags={focusTags} onChange={(kite) => updateSession(session.id, { kite })} />
        )}
        {session.note && <blockquote>{session.note}</blockquote>}
        {session.type !== 'KITE' && !session.entries.length && !session.mobilityDone?.length && <p>Keine weiteren Details erfasst.</p>}
      </div>
    </details>
  );
}
