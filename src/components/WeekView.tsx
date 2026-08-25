import { useMemo, useState } from 'react';
import { addDays, formatShortDate, localDate, startOfWeek } from '../logic/date';
import { schedule } from '../logic/training';
import { useAppStore } from '../store';
import { CheckIcon, WindIcon } from './Icons';
import { KiteStrengthTrend } from './KiteStrengthTrend';

const names = { A: 'Tag A · Beine / Push', B: 'Tag B · Zug / Landung', RINGS: 'Ringe', SPRINT: 'Sprint' };

export function WeekView() {
  const { sessions, settings } = useAppStore();
  const [offset, setOffset] = useState(0);
  const monday = addDays(startOfWeek(localDate()), offset * 7);
  const plan = useMemo(() => schedule(monday, sessions, settings), [monday, sessions, settings]);
  return (
    <main className="page">
      <header className="page-header"><div><span className="eyebrow">Plan ohne Schuldgefühl</span><h1>Deine Woche</h1></div></header>
      <div className="week-switcher">
        <button aria-label="Vorherige Woche" onClick={() => setOffset((value) => value - 1)}>‹</button>
        <strong>{formatShortDate(monday)} – {formatShortDate(addDays(monday, 6))}</strong>
        <button aria-label="Nächste Woche" onClick={() => setOffset((value) => value + 1)}>›</button>
      </div>
      <section className="timeline">
        {plan.map((item) => (
          <article className={`plan-row ${item.overriddenByKite ? 'wind-swapped' : ''}`} key={`${item.date}-${item.type}`}>
            <div className="date-box"><strong>{formatShortDate(item.date).split(',')[0]}</strong><span>{item.date.slice(-2)}</span></div>
            <div className="timeline-line"><i /></div>
            <div className="plan-card card">
              <span className="eyebrow">{item.location}</span>
              {item.overriddenByKite ? <><h3><WindIcon /> Wind hat übernommen</h3><p>{names[item.type]} entfällt still.</p></> : <><h3>{names[item.type]}</h3><p>{item.completed ? 'Erledigt' : 'Geplant'}</p></>}
              {item.completed && <span className="done-badge"><CheckIcon /> erledigt</span>}
            </div>
          </article>
        ))}
      </section>
      <p className="week-note">Kitetage ersetzen den Plan. Keine Streaks, keine verpassten Einheiten.</p>
      <KiteStrengthTrend sessions={sessions} today={localDate()} />
    </main>
  );
}
