import { t } from '../i18n';
import { useLang } from '../i18n/react';
import { addDays, startOfWeek } from '../logic/date';
import { formatKg, formatLoad } from '../logic/format';
import { sessionLoad } from '../logic/training';
import type { Session } from '../types';

interface WeekPoint {
  start: string;
  kiteDays: number;
  strengthVolume: number;
  loadPoints: number;
}

function volume(session: Session): number {
  if (!['A', 'B', 'RINGS', 'KB'].includes(session.type)) return 0;
  return session.entries.reduce((sessionTotal, entry) => sessionTotal + entry.sets.reduce((entryTotal, set) => {
    if (set.successful === false || set.kg === undefined || set.reps === undefined) return entryTotal;
    return entryTotal + set.kg * set.reps * (set.perSide ? 2 : 1);
  }, 0), 0);
}

function weekPoints(sessions: Session[], today: string): WeekPoint[] {
  const currentMonday = startOfWeek(today);
  return Array.from({ length: 8 }, (_, index) => {
    const start = addDays(currentMonday, (index - 7) * 7);
    const end = addDays(start, 6);
    const inWeek = sessions.filter((session) => session.date >= start && session.date <= end);
    return {
      start,
      kiteDays: inWeek.filter((session) => session.type === 'KITE').length,
      strengthVolume: inWeek.reduce((sum, session) => sum + volume(session), 0),
      loadPoints: inWeek.reduce((sum, session) => sum + sessionLoad(session), 0)
    };
  });
}

export function KiteStrengthTrend({ sessions, today }: { sessions: Session[]; today: string }) {
  const lang = useLang();
  const points = weekPoints(sessions, today);
  const maxVolume = Math.max(...points.map((point) => point.strengthVolume), 1);
  const maxKite = Math.max(...points.map((point) => point.kiteDays), 1);
  const maxLoad = Math.max(...points.map((point) => point.loadPoints), 1);
  const x = (index: number) => 24 + index * 39;
  const volumeY = (value: number) => 116 - (value / maxVolume) * 78;
  const kiteY = (value: number) => 116 - (value / maxKite) * 78;
  const loadY = (value: number) => 116 - (value / maxLoad) * 78;
  const kiteLine = points.map((point, index) => `${x(index) + 10},${kiteY(point.kiteDays)}`).join(' ');
  const loadLine = points.map((point, index) => `${x(index) + 10},${loadY(point.loadPoints)}`).join(' ');
  const latest = points.at(-1)!;

  return (
    <section className="trend-card card">
      <div className="trend-heading">
        <div><span className="eyebrow">{t('trend.eyebrow')}</span><h2>{t('trend.title')}</h2></div>
        <div className="trend-current"><strong>{formatLoad(latest.loadPoints, lang)}</strong><span>{t('trend.points')}</span><strong>{latest.kiteDays}</strong><span>{t('trend.kiteDays')}</span><strong>{formatKg(Math.round(latest.strengthVolume), lang)}</strong><span>{t('trend.volume')}</span></div>
      </div>
      <div className="trend-legend"><span><i className="strength-key" />{t('trend.legendStrength')}</span><span><i className="kite-key" />{t('trend.legendKite')}</span><span><i className="points-key" />{t('trend.legendPoints')}</span></div>
      <svg className="trend-chart" viewBox="0 0 320 142" role="img" aria-label={t('trend.chartAria')}>
        <line x1="14" y1="116" x2="316" y2="116" className="trend-axis" />
        {points.map((point, index) => (
          <g key={`volume-${point.start}`}>
            <rect x={x(index)} y={volumeY(point.strengthVolume)} width="20" height={116 - volumeY(point.strengthVolume)} rx="4" className="volume-bar" />
            <text x={x(index) + 10} y="135" textAnchor="middle">{point.start.slice(5).replace('-', '.')}</text>
          </g>
        ))}
        <polyline points={kiteLine} className="kite-line" />
        {points.map((point, index) => <circle key={`kite-${point.start}`} cx={x(index) + 10} cy={kiteY(point.kiteDays)} r="4" className="kite-point" />)}
        <polyline points={loadLine} className="points-line" />
        {points.map((point, index) => <circle key={`points-${point.start}`} cx={x(index) + 10} cy={loadY(point.loadPoints)} r="3" className="points-point" />)}
      </svg>
      <p>{t('trend.note')}</p>
    </section>
  );
}
