import { addDays } from '../logic/date';
import { rollingLoad7d } from '../logic/training';
import type { Session } from '../types';

export function LoadSparkline({ sessions, today, threshold }: { sessions: Session[]; today: string; threshold: number }) {
  const values = Array.from({ length: 14 }, (_, index) => rollingLoad7d(sessions, addDays(today, index - 13)));
  const max = Math.max(threshold, ...values, 1);
  const points = values.map((value, index) => `${(index / 13) * 100},${38 - (value / max) * 34}`).join(' ');
  const latest = values.at(-1) ?? 0;
  return (
    <div className="load-card card">
      <div>
        <span className="eyebrow">7-Tage-Last</span>
        <strong className={latest > threshold ? 'danger-text' : ''}>{latest.toFixed(1)}</strong>
        <small>Limit {threshold}</small>
      </div>
      <svg className="sparkline" viewBox="0 0 100 40" preserveAspectRatio="none" aria-label="Lastverlauf der letzten 14 Tage">
        <line x1="0" y1={38 - (threshold / max) * 34} x2="100" y2={38 - (threshold / max) * 34} className="threshold-line" />
        <polyline points={points} />
      </svg>
    </div>
  );
}
