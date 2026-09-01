import { useMemo, useState } from 'react';
import { mobilityChecklists } from '../data/seed';
import { hipItemsForSession } from '../logic/mobility';
import { useAppStore } from '../store';
import type { ChecklistItem } from '../types';
import { CheckIcon } from './Icons';
import { primeTimerAudio } from './TimerDock';

export function PostSessionHipRoutine({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { sessions, activeTimer, updateSession, startTimer, stopTimer } = useAppStore();
  const [open, setOpen] = useState(false);
  const template = mobilityChecklists.find((candidate) => candidate.variant === 'hip')!;
  const session = sessions.find((candidate) => candidate.id === sessionId);
  const items = useMemo(
    () => session ? hipItemsForSession(template.items, session) : [],
    [session, template.items]
  );

  if (!session) return null;
  const loggedSession = session;

  const completed = items.filter((item) => loggedSession.mobilityDone?.includes(item.id)).length;

  async function toggleItem(itemId: string) {
    const current = loggedSession.mobilityDone ?? [];
    const mobilityDone = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    await updateSession(loggedSession.id, { mobilityDone });
  }

  async function controlTimer(item: ChecklistItem) {
    if (!item.timerSec) return;
    const sourceId = `${loggedSession.id}-${item.id}`;
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
    <aside className={`post-session-hip ${activeTimer ? 'timer-visible' : ''}`} aria-label="Post-Session-Hüftroutine">
      <section className="hip-routine-card card">
        {!open ? (
          <div className="hip-routine-prompt">
            <button className="hip-prompt-open" onClick={() => setOpen(true)}>
              <span><small>Nach der Session</small><strong>8 min Hüfte?</strong></span>
              <b>Öffnen ›</b>
            </button>
            <button className="hip-routine-close" aria-label="Hüftroutine ausblenden" onClick={onClose}>×</button>
          </div>
        ) : (
          <>
            <header className="hip-routine-header">
              <div><span className="eyebrow">Nach der Session · ca. {template.durationMin} min</span><h2>Hüftroutine</h2><p>Erst öffnen, dann festigen.</p></div>
              <button className="hip-routine-close" aria-label="Hüftroutine schließen" onClick={onClose}>×</button>
            </header>
            <div className="hip-routine-progress"><span>{completed}/{items.length} erledigt</span><i><b style={{ width: `${items.length ? completed / items.length * 100 : 0}%` }} /></i></div>
            <div className="hip-routine-items">
              {items.map((item, index) => {
                const checked = loggedSession.mobilityDone?.includes(item.id) ?? false;
                const timerActive = activeTimer?.sourceId === `${loggedSession.id}-${item.id}`;
                return (
                  <div className={`hip-routine-item ${checked ? 'checked' : ''}`} key={item.id}>
                    <button className="hip-item-check" onClick={() => void toggleItem(item.id)} aria-pressed={checked}>
                      <i>{checked ? <CheckIcon /> : index + 1}</i>
                      <span>
                        <strong>{item.label}</strong>
                        {item.dose && <b>{item.dose}</b>}
                        {(item.cue || item.cueDetail) && <small className="hip-critical-cue">{item.cue && <strong>{item.cue}</strong>}{item.cue && item.cueDetail ? ', ' : ''}{item.cueDetail}</small>}
                        {item.purpose && <small>{item.purpose}</small>}
                      </span>
                    </button>
                    {item.timerSec && (
                      <button className={`hip-item-timer ${timerActive ? 'active' : ''}`} onClick={() => void controlTimer(item)}>
                        {timerActive ? 'Timer stoppen' : item.timerMode === 'pace' ? `${item.timerSec} s Tempo` : `${item.timerSec} s Countdown`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="secondary hip-routine-done" onClick={onClose}>Routine schließen</button>
          </>
        )}
      </section>
    </aside>
  );
}
