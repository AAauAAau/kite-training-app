import { useMemo, useState } from 'react';
import { plural, t } from '../i18n';
import { useLang } from '../i18n/react';
import { localDate } from '../logic/date';
import { kiteSeasonStats } from '../logic/kite';
import type { Session } from '../types';

export function KiteSeasonAnalysis({ sessions }: { sessions: Session[] }) {
  useLang();
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
        <div><span className="eyebrow">{t('kiteAnalysis.eyebrow')}</span><h2>{t('kiteAnalysis.season', { year: selectedYear })}</h2></div>
        {years.length > 1 && <select aria-label={t('kiteAnalysis.selectAria')} value={selectedYear} onChange={(event) => setYear(event.target.value)}>{years.map((value) => <option key={value}>{value}</option>)}</select>}
      </header>
      <small>{plural(stats.sessions, { one: t('kiteAnalysis.sessionsOne', { n: stats.sessions }), other: t('kiteAnalysis.sessionsOther', { n: stats.sessions }) })}</small>

      <StatGroup title={t('kiteAnalysis.wind')} values={[
        [t('enum.wind.leicht'), stats.wind.leicht], [t('enum.wind.mittel'), stats.wind.mittel], [t('enum.wind.stark'), stats.wind.stark], [t('kiteAnalysis.unknown'), stats.windUnknown]
      ]} total={stats.sessions} />
      <StatGroup title={t('kiteAnalysis.board')} values={[
        [t('enum.board.twintip'), stats.board.twintip], [t('enum.board.foil'), stats.board.foil], [t('enum.board.directional'), stats.board.directional], [t('kiteAnalysis.unknown'), stats.boardUnknown]
      ]} total={stats.sessions} />

      <div className="kite-stat-group">
        <h3>{t('kiteAnalysis.skillFocus')}</h3>
        {stats.focus.length ? stats.focus.map(({ tag, count }) => (
          <StatBar key={tag} label={tag} count={count} total={stats.sessions} />
        )) : <p>{t('kiteAnalysis.noFocus')}</p>}
        {stats.focusUnknown > 0 && <small>{plural(stats.focusUnknown, { one: t('kiteAnalysis.focusUnknownOne', { n: stats.focusUnknown }), other: t('kiteAnalysis.focusUnknownOther', { n: stats.focusUnknown }) })}</small>}
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
