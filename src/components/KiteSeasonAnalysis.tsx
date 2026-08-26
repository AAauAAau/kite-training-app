import { useMemo, useState } from 'react';
import { localDate } from '../logic/date';
import { kiteSeasonStats } from '../logic/kite';
import type { Session } from '../types';

export function KiteSeasonAnalysis({ sessions }: { sessions: Session[] }) {
  const years = useMemo(
    () => [...new Set(sessions.filter((session) => session.type === 'KITE').map((session) => session.date.slice(0, 4)))].sort().reverse(),
    [sessions]
  );
  const thisYear = localDate().slice(0, 4);
  const [year, setYear] = useState(() => years.includes(thisYear) ? thisYear : years[0] ?? thisYear);
  const selectedYear = years.includes(year) ? year : years[0] ?? year;
  const stats = useMemo(() => kiteSeasonStats(sessions, selectedYear), [selectedYear, sessions]);

  if (!years.length) return null;

  return (
    <section className="kite-analysis card">
      <header>
        <div><span className="eyebrow">Kite-Auswertung</span><h2>Saison {selectedYear}</h2></div>
        {years.length > 1 && <select aria-label="Kite-Saison" value={selectedYear} onChange={(event) => setYear(event.target.value)}>{years.map((value) => <option key={value}>{value}</option>)}</select>}
      </header>
      <small>{stats.sessions} {stats.sessions === 1 ? 'Session' : 'Sessions'}</small>

      <StatGroup title="Windstärke" values={[
        ['Leicht', stats.wind.leicht], ['Mittel', stats.wind.mittel], ['Stark', stats.wind.stark], ['Ohne Angabe', stats.windUnknown]
      ]} total={stats.sessions} />
      <StatGroup title="Board" values={[
        ['Twintip', stats.board.twintip], ['Foil', stats.board.foil], ['Directional', stats.board.directional], ['Ohne Angabe', stats.boardUnknown]
      ]} total={stats.sessions} />

      <div className="kite-stat-group">
        <h3>Skill-Fokus</h3>
        {stats.focus.length ? stats.focus.map(({ tag, count }) => (
          <StatBar key={tag} label={tag} count={count} total={stats.sessions} />
        )) : <p>Noch kein Skill-Fokus erfasst.</p>}
        {stats.focusUnknown > 0 && <small>{stats.focusUnknown} {stats.focusUnknown === 1 ? 'Session' : 'Sessions'} ohne Fokus-Angabe</small>}
      </div>
    </section>
  );
}

function StatGroup({ title, values, total }: { title: string; values: [string, number][]; total: number }) {
  return (
    <div className="kite-stat-group">
      <h3>{title}</h3>
      {values.map(([label, count]) => <StatBar key={label} label={label} count={count} total={total} />)}
    </div>
  );
}

function StatBar({ label, count, total }: { label: string; count: number; total: number }) {
  const percent = total ? count / total * 100 : 0;
  return (
    <div className="kite-stat-row">
      <span>{label}</span><div><i style={{ width: `${percent}%` }} /></div><strong>{count}</strong>
    </div>
  );
}
