import { useMemo, useState } from 'react';
import { plural, t } from '../i18n';
import { feelKey, kiteIntensityKey, ringsAreaKey, ringsSkillKey, sessionTypeKey } from '../i18n/enums';
import { useLang } from '../i18n/react';
import { addDays, daysBetween, formatShortDate, localDate } from '../logic/date';
import { formatLoad, localeFor } from '../logic/format';
import { mobilityChecklists } from '../data/seed';
import { bodyRegionLabel, injuryState } from '../logic/injury';
import { localizeMobility } from '../logic/localize';
import { deloadDue, sessionLoad, weeklyStrengthWarning } from '../logic/training';
import type { BodyRegion, Lang } from '../types';
import { useAppStore } from '../store';
import type { ChecklistItem, KiteIntensity, Session } from '../types';
import { AlertIcon, CheckIcon, ChevronIcon, WindIcon } from './Icons';
import { KiteDetailsEditor } from './KiteDetailsEditor';
import { LoadSparkline } from './LoadSparkline';
import { SessionDatePicker } from './SessionDatePicker';
import { primeTimerAudio } from './TimerDock';

export function Dashboard({ onTrain, onKiteLogged }: { onTrain: () => void; onKiteLogged: (sessionId: string) => void }) {
  const { sessions, settings, activeTimer, addSession, updateSession, deleteSession, dismissDeload, updateSettings, startTimer, stopTimer } = useAppStore();
  const lang = useLang();
  const [quickKite, setQuickKite] = useState<Session | null>(null);
  const [kiteDate, setKiteDate] = useState(localDate());
  const [intensitySaved, setIntensitySaved] = useState(false);
  const today = localDate();
  const due = useMemo(() => deloadDue(sessions, settings, today), [sessions, settings, today]);
  const dismissed = settings.deloadDismissedUntil && settings.deloadDismissedUntil >= today;
  const todaySessions = sessions.filter((session) => session.date === today);
  const todayActivities = todaySessions.filter((session) => !isMorningRoutine(session));
  const activeKite = (quickKite?.date === kiteDate ? quickKite : null) ?? sessions.find((session) => session.date === kiteDate && session.type === 'KITE') ?? null;
  const morningTemplate = mobilityChecklists.find((template) => template.variant === 'morning')!;
  const morning = localizeMobility(morningTemplate, lang);
  const morningSession = todaySessions.find((session) =>
    isMorningRoutine(session)
  );
  const morningDone = morningSession?.mobilityDone?.filter((id) => id.startsWith('morning-')).length ?? 0;
  const strengthWarning = weeklyStrengthWarning(today, sessions);
  const injury = injuryState(settings, today);
  const runningInjuries = (settings.injuries ?? []).filter((item) => item.since <= today && item.until >= today);

  async function endInjury(region: BodyRegion) {
    await updateSettings({ injuries: (settings.injuries ?? []).filter((item) => item.region !== region) });
  }

  async function extendInjury(region: BodyRegion) {
    await updateSettings({
      injuries: (settings.injuries ?? []).map((item) => item.region === region ? { ...item, until: addDays(today, 14) } : item)
    });
  }

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
    if (!activeKite || !window.confirm(t('dashboard.removeKiteConfirm'))) return;
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
        durationMin: morningTemplate.durationMin, note: morningTemplate.title, createdAt: Date.now()
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
          <h1>{t('dashboard.title')}</h1>
          <time className="dashboard-date" dateTime={today}>{formatShortDate(today, localeFor(lang))}</time>
        </div>
        <div className="dashboard-logo-wrap">
          <img className="dashboard-logo" src={`${import.meta.env.BASE_URL}tl-kiteboarding-logo.png`} alt="TL Kiteboarding · Straight Outta Mecklenburg" />
        </div>
      </header>

      {due.due && due.reason && !dismissed && (
        <section className="alert-card">
          <AlertIcon />
          <div><strong>{t('dashboard.deloadTitle')}</strong><p>{t(due.reason.key, due.reason.params)}</p><button className="text-button" onClick={dismissDeload}>{t('common.hideSevenDays')}</button></div>
        </section>
      )}

      {strengthWarning && (
        <section className="alert-card subtle"><AlertIcon /><div><strong>{t('dashboard.legStrengthTitle')}</strong><p>{t(strengthWarning.key, strengthWarning.params)}</p></div></section>
      )}

      {injury.expired.map((item) => (
        <section className="alert-card" key={item.region}>
          <AlertIcon />
          <div>
            <strong>{t('dashboard.injuryExpiredTitle', { region: t(bodyRegionLabel(item.region)) })}</strong>
            <p>{t('dashboard.injuryExpiredBody')}</p>
            <div className="injury-reminder-actions">
              <button className="text-button" onClick={() => void endInjury(item.region)}>{t('common.end')}</button>
              <button className="text-button" onClick={() => void extendInjury(item.region)}>{t('common.plusTwoWeeks')}</button>
            </div>
          </div>
        </section>
      ))}

      {runningInjuries.length > 0 && (
        <section className="alert-card subtle">
          <AlertIcon />
          <div>
            <strong>{t('dashboard.injuryActiveTitle')}</strong>
            <p>{runningInjuries.map((item) => {
              const days = daysBetween(today, item.until);
              const remaining = plural(days, { one: t('common.daysRemainingOne'), other: t('common.daysRemainingOther', { n: days }) });
              return t('dashboard.injuryActiveItem', { region: t(bodyRegionLabel(item.region)), remaining });
            }).join(' · ')}</p>
          </div>
        </section>
      )}

      <section className="hero-card">
        <div className="hero-kite"><WindIcon size={42} /></div>
        <span className="eyebrow">{t('dashboard.heroEyebrow')}</span>
        <h2>{t('dashboard.heroTitle')}</h2>
        <p>{t('dashboard.heroBody')}</p>
        <SessionDatePicker value={kiteDate} onChange={setKiteDate} />
        <button className="primary kite-button" onClick={logKite}>
          <WindIcon /> {activeKite ? t('dashboard.logKiteMore') : t('dashboard.logKite')}
        </button>
        {activeKite && (
          <>
            <div className="intensity-picker compact">
              <span>{t('dashboard.intensityQuestion')}</span>
              <div className="segmented">
                {(['chill', 'normal', 'hard'] as KiteIntensity[]).map((value) => (
                  <button key={value} className={activeKite.intensity === value ? 'selected' : ''} onClick={() => setIntensity(value)}>{t(kiteIntensityKey(value))}</button>
                ))}
              </div>
              <small className={`autosave-hint ${intensitySaved ? 'confirmed' : ''}`} role="status">
                <CheckIcon /> {intensitySaved ? t('common.autosaveSaved') : t('common.autosaveIdle')}
              </small>
              <button className="remove-kite" onClick={removeKite}>{t('dashboard.removeSession')}</button>
            </div>
            <KiteDetailsEditor details={activeKite.kite} focusTags={settings.kiteFocusTags} onChange={setKiteDetails} />
          </>
        )}
      </section>

      <details className="mobility-card morning-card card">
        <summary>
          <span><span className="eyebrow">{t('dashboard.morningEyebrow', { min: morning.durationMin })}</span><strong>{morning.title}</strong></span>
          <span className={morningDone === morning.items.length ? 'routine-progress complete' : 'routine-progress'}>{morningDone}/{morning.items.length}</span>
        </summary>
        <div className="morning-content">
          <p className="morning-safety">{t('dashboard.morningSafety')}</p>
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
                    aria-label={timerActive ? t('dashboard.morningTimerStopAria', { label: item.label }) : t('dashboard.morningTimerStartAria', { label: item.label, sec: item.timerSec })}
                    onClick={() => void controlMorningTimer(item)}
                  >{timerActive ? t('common.timerStop') : item.timerMode === 'pace' ? t('common.timerPace', { sec: item.timerSec }) : t('common.timerSeconds', { sec: item.timerSec })}</button>
                )}
              </div>
            );
          })}
        </div>
      </details>

      <div className="section-heading"><h2>{t('dashboard.sectionToday')}</h2><button className="text-button" onClick={onTrain}>{t('dashboard.startTraining')} <ChevronIcon /></button></div>
      {todayActivities.length ? (
        <div className="session-list">
          {todayActivities.map((session) => <SessionRow key={session.id} session={session} lang={lang} />)}
        </div>
      ) : (
        <button className="empty-card" onClick={onTrain}><span>{t('dashboard.emptyNothing')}</span><strong>{t('dashboard.emptyChoose')}</strong></button>
      )}

      <LoadSparkline sessions={sessions} today={today} threshold={settings.loadThreshold7d} />

      <div className="section-heading"><h2>{t('dashboard.sectionRecent')}</h2></div>
      <div className="session-list">
        {sessions.filter((session) => session.date !== today && !isMorningRoutine(session)).slice(0, 4).map((session) => <SessionRow key={session.id} session={session} lang={lang} />)}
        {!sessions.some((session) => !isMorningRoutine(session)) && <p className="muted">{t('dashboard.recentEmpty')}</p>}
      </div>
    </main>
  );
}

function isMorningRoutine(session: Session): boolean {
  return session.type === 'MOBILITY' && (
    session.note === 'Morgenroutine' || Boolean(session.mobilityDone?.some((id) => id.startsWith('morning-')))
  );
}

function SessionRow({ session, lang }: { session: Session; lang: Lang }) {
  const title = session.type === 'OTHER' && session.activityName
    ? session.activityName
    : session.type === 'RINGS' && session.sourceApp === 'die-ringe'
    ? t('enum.dieRinge')
    : session.type === 'MOBILITY' && (session.note === 'Morgenroutine' || session.mobilityDone?.some((id) => id.startsWith('morning-')))
      ? t('enum.morningRoutine')
      : t(sessionTypeKey(session.type));
  const areas = session.type === 'RINGS' && session.ringsAreas?.length
    ? session.ringsAreas.map((area) => t(ringsAreaKey(area))).join(' + ')
    : '';
  const skills = session.type === 'RINGS' && session.ringsSkills?.length
    ? session.ringsSkills.map((skill) => t(ringsSkillKey(skill))).join(' · ')
    : '';
  return (
    <div className="session-row card">
      <div className={`session-icon type-${session.type.toLowerCase()}`}>{session.type === 'KITE' ? <WindIcon /> : title.slice(0, 1)}</div>
      <div className="session-copy">
        <strong>{title}</strong>
        <span>{formatShortDate(session.date, localeFor(lang))}{areas ? ` · ${areas}` : ''}{session.type === 'BOARD_OFF' && session.boardOffLevel !== undefined ? ` · ${t('common.stageLabel', { level: session.boardOffLevel })}` : ''}{session.durationMin ? ` · ${t('common.minutes', { min: session.durationMin })}` : ''} · {t('common.loadLabel', { load: formatLoad(sessionLoad(session), lang) })}</span>
        {skills && <small>{skills}</small>}
      </div>
      {session.feel && <span className={`feel-dot ${session.feel}`} title={t(feelKey(session.feel))} />}
    </div>
  );
}
