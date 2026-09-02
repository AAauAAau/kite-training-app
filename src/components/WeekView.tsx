import { useMemo, useState } from 'react';
import { addDays, formatShortDate, isBackfilledSession, localDate, startOfWeek } from '../logic/date';
import { schedule, strengthWarnings } from '../logic/training';
import { useAppStore } from '../store';
import type { Session, SessionType } from '../types';
import { CheckIcon, WindIcon } from './Icons';
import { KiteStrengthTrend } from './KiteStrengthTrend';

const names = { A: 'Tag A · Beine / Push', B: 'Tag B · Zug / Landung', RINGS: 'Ringe-Circuit', KB: 'KB-Circuit', SPRINT: 'Sprint' };
const sessionNames: Record<SessionType, string> = {
  A: 'Tag A', B: 'Tag B', RINGS: 'Ringe', KB: 'Kettlebell', SPRINT: 'Sprint', MOBILITY: 'Mobility',
  KITE: 'Kite', PADEL: 'Padel Tennis', BOARD_OFF: 'Board-Off Drills', OTHER: 'Andere Aktivität'
};

function sessionName(session: Session): string {
  return session.type === 'OTHER' && session.activityName ? session.activityName : sessionNames[session.type];
}

export function WeekView() {
  const { sessions, settings } = useAppStore();
  const [offset, setOffset] = useState(0);
  const monday = addDays(startOfWeek(localDate()), offset * 7);
  const sunday = addDays(monday, 6);
  const plan = useMemo(() => schedule(monday, sessions, settings), [monday, sessions, settings]);
  const loggedThisWeek = useMemo(
    () => sessions.filter((session) => session.date >= monday && session.date <= sunday).sort((a, b) => a.date.localeCompare(b.date)),
    [monday, sessions, sunday]
  );
  return (
    <main className="page">
      <header className="page-header"><div><span className="eyebrow">Plan ohne Schuldgefühl</span><h1>Deine Woche</h1></div></header>
      <div className="week-switcher">
        <button aria-label="Vorherige Woche" onClick={() => setOffset((value) => value - 1)}>‹</button>
        <strong>{formatShortDate(monday)} – {formatShortDate(sunday)}</strong>
        <button aria-label="Nächste Woche" onClick={() => setOffset((value) => value + 1)}>›</button>
      </div>
      <section className="timeline">
        {plan.map((item) => {
          const logged = sessions.filter((session) => session.date === item.date && session.type === (item.overriddenByKite ? 'KITE' : item.type));
          const backfilled = logged.some(isBackfilledSession);
          return (
            <article className={`plan-row ${item.overriddenByKite ? 'wind-swapped' : ''}`} key={`${item.date}-${item.type}`}>
              <div className="date-box"><strong>{formatShortDate(item.date).split(',')[0]}</strong><span>{item.date.slice(-2)}</span></div>
              <div className="timeline-line"><i /></div>
              <div className="plan-card card">
                <span className="eyebrow">{item.location}</span>
                {item.overriddenByKite ? <><h3><WindIcon /> Wind hat übernommen</h3><p>{names[item.type]} entfällt still.</p></> : <><h3>{names[item.type]}</h3><p>{item.completed ? 'Erledigt' : 'Geplant'}</p></>}
                {strengthWarnings(item.type, item.date, sessions).map((warning) => <p className="plan-warning" key={warning}>{warning}</p>)}
                <span className="plan-badges">
                  {item.completed && <span className="done-badge"><CheckIcon /> erledigt</span>}
                  {backfilled && <span className="backfilled-badge">↶ nachgetragen</span>}
                </span>
              </div>
            </article>
          );
        })}
      </section>
      {loggedThisWeek.length > 0 && (
        <section className="week-session-log card">
          <span className="eyebrow">Diese Woche geloggt</span>
          {loggedThisWeek.map((session) => (
            <div key={session.id}>
              <span><strong>{sessionName(session)}</strong><small>{formatShortDate(session.date)}{session.type === 'BOARD_OFF' && session.boardOffLevel !== undefined ? ` · Stufe ${session.boardOffLevel}` : ''}</small></span>
              {isBackfilledSession(session) && <small className="backfilled-badge">↶ nachgetragen</small>}
            </div>
          ))}
        </section>
      )}
      <p className="week-note">Kitetage ersetzen den Plan. Keine Streaks, keine verpassten Einheiten.</p>
      <KiteStrengthTrend sessions={sessions} today={localDate()} />
    </main>
  );
}
