import { useMemo, useState } from 'react';
import { t } from '../i18n';
import { locationKey, sessionTypeKey } from '../i18n/enums';
import { useLang } from '../i18n/react';
import { addDays, formatShortDate, isBackfilledSession, localDate, startOfWeek } from '../logic/date';
import { localeFor } from '../logic/format';
import { schedule, strengthWarnings } from '../logic/training';
import { useAppStore } from '../store';
import type { Session } from '../types';
import { CheckIcon, WindIcon } from './Icons';
import { KiteStrengthTrend } from './KiteStrengthTrend';

type PlannedType = 'A' | 'B' | 'RINGS' | 'KB' | 'SPRINT';

const planNameKeys: Record<PlannedType, 'week.planA' | 'week.planB' | 'week.planRINGS' | 'week.planKB' | 'week.planSPRINT'> = {
  A: 'week.planA', B: 'week.planB', RINGS: 'week.planRINGS', KB: 'week.planKB', SPRINT: 'week.planSPRINT'
};

function sessionName(session: Session): string {
  return session.type === 'OTHER' && session.activityName ? session.activityName : t(sessionTypeKey(session.type));
}

export function WeekView() {
  const { sessions, settings } = useAppStore();
  const lang = useLang();
  const locale = localeFor(lang);
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
      <header className="page-header"><div><span className="eyebrow">{t('week.eyebrow')}</span><h1>{t('week.title')}</h1></div></header>
      <div className="week-switcher">
        <button aria-label={t('week.prev')} onClick={() => setOffset((value) => value - 1)}>‹</button>
        <strong>{formatShortDate(monday, locale)} – {formatShortDate(sunday, locale)}</strong>
        <button aria-label={t('week.next')} onClick={() => setOffset((value) => value + 1)}>›</button>
      </div>
      <section className="timeline">
        {plan.map((item) => {
          const logged = sessions.filter((session) => session.date === item.date && session.type === (item.overriddenByKite ? 'KITE' : item.type));
          const backfilled = logged.some(isBackfilledSession);
          const planName = t(planNameKeys[item.type]);
          return (
            <article className={`plan-row ${item.overriddenByKite ? 'wind-swapped' : ''}`} key={`${item.date}-${item.type}`}>
              <div className="date-box"><strong>{formatShortDate(item.date, locale).split(',')[0]}</strong><span>{item.date.slice(-2)}</span></div>
              <div className="timeline-line"><i /></div>
              <div className="plan-card card">
                <span className="eyebrow">{t(locationKey(item.location))}</span>
                {item.overriddenByKite ? <><h3><WindIcon /> {t('week.windTookOver')}</h3><p>{t('week.planSkips', { plan: planName })}</p></> : <><h3>{planName}</h3><p>{item.completed ? t('week.done') : t('week.planned')}</p></>}
                {strengthWarnings(item.type, item.date, sessions).map((warning) => <p className="plan-warning" key={warning.key}>{t(warning.key, warning.params)}</p>)}
                <span className="plan-badges">
                  {item.completed && <span className="done-badge"><CheckIcon /> {t('week.doneBadge')}</span>}
                  {backfilled && <span className="backfilled-badge">{t('common.backfilled')}</span>}
                </span>
              </div>
            </article>
          );
        })}
      </section>
      {loggedThisWeek.length > 0 && (
        <section className="week-session-log card">
          <span className="eyebrow">{t('week.loggedThisWeek')}</span>
          {loggedThisWeek.map((session) => (
            <div key={session.id}>
              <span><strong>{sessionName(session)}</strong><small>{formatShortDate(session.date, locale)}{session.type === 'BOARD_OFF' && session.boardOffLevel !== undefined ? ` · ${t('common.stageLabel', { level: session.boardOffLevel })}` : ''}</small></span>
              {isBackfilledSession(session) && <small className="backfilled-badge">{t('common.backfilled')}</small>}
            </div>
          ))}
        </section>
      )}
      <p className="week-note">{t('week.note')}</p>
      <KiteStrengthTrend sessions={sessions} today={localDate()} />
    </main>
  );
}
