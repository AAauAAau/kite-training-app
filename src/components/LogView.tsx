import { useMemo, useState } from 'react';
import { t } from '../i18n';
import { feelKey, sessionTypeKey, trainingIntensityKey } from '../i18n/enums';
import { useLang } from '../i18n/react';
import { formatShortDate } from '../logic/date';
import { formatLoad, localeFor } from '../logic/format';
import { localizeExercise } from '../logic/localize';
import { sessionLoad } from '../logic/training';
import { useAppStore } from '../store';
import type { Exercise, Lang, Session, SessionType, SetLog } from '../types';
import { KiteDetailsEditor } from './KiteDetailsEditor';
import { KiteSeasonAnalysis } from './KiteSeasonAnalysis';
import { SessionEditor } from './SessionEditor';

function formatSet(set: SetLog): string {
  const values: string[] = [];
  if (set.kg !== undefined) values.push(`${set.kg} kg`);
  if (set.reps !== undefined) values.push(t('log.setReps', { reps: set.reps }));
  if (set.distanceM !== undefined) values.push(t('log.setMeters', { m: set.distanceM }));
  if (set.sec !== undefined) values.push(t('log.setSeconds', { sec: set.sec.toFixed(2) }));
  if (set.perSide) values.push(t('common.perSide'));
  if (set.successful === false) values.push(t('log.setFailed'));
  return values.join(' · ') || t('log.setEmpty');
}

function sessionTitle(session: Session): string {
  if (session.type === 'OTHER' && session.activityName) return session.activityName;
  if (session.type === 'MOBILITY' && (session.note === 'Morgenroutine' || session.mobilityDone?.some((id) => id.startsWith('morning-')))) return t('enum.morningRoutine');
  if (session.type === 'RINGS' && session.sourceApp === 'die-ringe') return t('enum.dieRinge');
  return t(sessionTypeKey(session.type));
}

export function LogView() {
  const { sessions, exercises, settings, updateSession, deleteSession } = useAppStore();
  const lang = useLang();
  const [filter, setFilter] = useState<'ALL' | SessionType>('ALL');
  const types = useMemo(() => [...new Set(sessions.map((session) => session.type))], [sessions]);
  const visible = filter === 'ALL' ? sessions : sessions.filter((session) => session.type === filter);
  const totalLoad = visible.reduce((sum, session) => sum + sessionLoad(session), 0);

  return (
    <main className="page log-page">
      <header className="page-header"><div><span className="eyebrow">{t('log.eyebrow')}</span><h1>{t('log.title')}</h1></div></header>

      <section className="log-summary card">
        <span><strong>{visible.length}</strong><small>{t('log.summarySessions')}</small></span>
        <span><strong>{formatLoad(totalLoad, lang)}</strong><small>{t('log.summaryLoad')}</small></span>
      </section>

      <div className="log-filters" aria-label={t('log.filterAria')}>
        <button className={filter === 'ALL' ? 'selected' : ''} onClick={() => setFilter('ALL')}>{t('log.filterAll')}</button>
        {types.map((type) => <button key={type} className={filter === type ? 'selected' : ''} onClick={() => setFilter(type)}>{t(sessionTypeKey(type))}</button>)}
      </div>

      {(filter === 'ALL' || filter === 'KITE') && <KiteSeasonAnalysis sessions={sessions} />}

      <div className="log-list">
        {visible.map((session) => (
          <LogEntry
            key={session.id}
            session={session}
            exercises={exercises}
            lang={lang}
            focusTags={settings.kiteFocusTags}
            updateSession={updateSession}
            deleteSession={deleteSession}
          />
        ))}
        {!visible.length && <p className="muted">{t('log.listEmpty')}</p>}
      </div>
    </main>
  );
}

function LogEntry({
  session,
  exercises,
  lang,
  focusTags,
  updateSession,
  deleteSession
}: {
  session: Session;
  exercises: Exercise[];
  lang: Lang;
  focusTags: string[];
  updateSession: (id: string, patch: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const locale = localeFor(lang);
  const title = sessionTitle(session);
  const deleteConfirm = () => t('log.deleteConfirm', { title, date: formatShortDate(session.date, locale) });
  return (
    <details className="log-entry card">
      <summary>
        <span className={`session-icon type-${session.type.toLowerCase()}`}>{title.slice(0, 1)}</span>
        <span><strong>{title}</strong><small>{formatShortDate(session.date, locale)}{session.type === 'BOARD_OFF' && session.boardOffLevel !== undefined ? ` · ${t('common.stageLabel', { level: session.boardOffLevel })}` : ''} · {t('common.loadLabel', { load: formatLoad(sessionLoad(session), lang) })}</small></span>
        <b>⌄</b>
      </summary>
      <div className="log-details">
        {editing ? (
          <SessionEditor
            session={session}
            exercises={exercises}
            focusTags={focusTags}
            onCancel={() => setEditing(false)}
            onSave={async (updated) => {
              const patch: Partial<Session> = { ...updated };
              delete patch.id;
              await updateSession(session.id, patch);
              setEditing(false);
            }}
            onDelete={async () => {
              if (!window.confirm(deleteConfirm())) return;
              await deleteSession(session.id);
            }}
          />
        ) : (
          <>
            {(session.durationMin || session.intensity || session.feel) && (
              <p>{session.durationMin ? t('common.minutes', { min: session.durationMin }) : ''}{session.intensity ? ` · ${t(trainingIntensityKey(session.intensity))}` : ''}{session.feel ? ` · ${t('log.feelPrefix', { feel: t(feelKey(session.feel)) })}` : ''}</p>
            )}
            {session.entries.map((entry) => {
              const exercise = exercises.find((item) => item.id === entry.exerciseId);
              return (
                <div className="log-exercise" key={entry.exerciseId}>
                  <strong>{exercise ? localizeExercise(exercise, lang).name : entry.exerciseId}</strong>
                  <ol>{entry.sets.map((set, index) => <li key={index}>{formatSet(set)}</li>)}</ol>
                </div>
              );
            })}
            {session.mobilityDone?.length ? <p>{session.mobilityDone.length === 1 ? t('log.checklistDoneOne') : t('log.checklistDoneOther', { n: session.mobilityDone.length })}</p> : null}
            {session.type === 'KITE' && (
              <KiteDetailsEditor details={session.kite} focusTags={focusTags} onChange={(kite) => updateSession(session.id, { kite })} />
            )}
            {session.note && <blockquote>{session.note}</blockquote>}
            {session.type !== 'KITE' && !session.entries.length && !session.mobilityDone?.length && <p>{t('log.noExtraDetails')}</p>}
            <div className="log-entry-actions">
              <button type="button" className="secondary" onClick={() => setEditing(true)}>{t('log.editSession')}</button>
              <button type="button" className="session-delete-button" onClick={async () => {
                if (!window.confirm(deleteConfirm())) return;
                await deleteSession(session.id);
              }}>{t('log.deleteSession')}</button>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
