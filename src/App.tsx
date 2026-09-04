import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { FeelSheet } from './components/FeelSheet';
import { CalendarIcon, HistoryIcon, HomeIcon, PlusIcon, SettingsIcon } from './components/Icons';
import { LogView } from './components/LogView';
import { PostSessionHipRoutine } from './components/PostSessionHipRoutine';
import { SettingsView } from './components/SettingsView';
import { TimerDock } from './components/TimerDock';
import { WeekView } from './components/WeekView';
import { WorkoutView } from './components/WorkoutView';
import { t } from './i18n';
import { useLang } from './i18n/react';
import { offersPostSessionHip } from './logic/mobility';
import { useAppStore } from './store';
import type { Feel, Session } from './types';

type View = 'home' | 'train' | 'week' | 'log' | 'settings';

export default function App() {
  const { ready, initialize, setFeel } = useAppStore();
  useLang();
  const [view, setView] = useState<View>('home');
  const [feelSessionId, setFeelSessionId] = useState<string | null>(null);
  const [hipSessionId, setHipSessionId] = useState<string | null>(null);

  useEffect(() => { void initialize(); }, [initialize]);

  async function chooseFeel(feel: Feel) {
    if (feelSessionId) await setFeel(feelSessionId, feel);
    setFeelSessionId(null);
    setView('home');
  }

  function finishWorkout(session: Session) {
    setFeelSessionId(session.id);
    setHipSessionId(offersPostSessionHip(session.type) ? session.id : null);
  }

  if (!ready) return <div className="splash"><div className="splash-kite">K</div><strong>Kite Strength</strong><span>{t('splash.preparing')}</span></div>;

  return (
    <div className="app-shell">
      {view === 'home' && <Dashboard onTrain={() => setView('train')} onKiteLogged={(id) => setHipSessionId(id)} />}
      {view === 'train' && <WorkoutView onSaved={finishWorkout} onCancel={() => setView('home')} />}
      {view === 'week' && <WeekView />}
      {view === 'log' && <LogView />}
      {view === 'settings' && <SettingsView />}

      {!feelSessionId && (
        <nav className="bottom-nav" aria-label={t('nav.aria')}>
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><HomeIcon /><span>{t('nav.today')}</span></button>
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}><CalendarIcon /><span>{t('nav.week')}</span></button>
          <button className={`nav-primary ${view === 'train' ? 'active' : ''}`} onClick={() => setView('train')}><PlusIcon /><span>{t('nav.log')}</span></button>
          <button className={view === 'log' ? 'active' : ''} onClick={() => setView('log')}><HistoryIcon /><span>{t('nav.history')}</span></button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}><SettingsIcon /><span>{t('nav.more')}</span></button>
        </nav>
      )}
      {feelSessionId && <FeelSheet onChoose={chooseFeel} onClose={() => { setFeelSessionId(null); setView('home'); }} />}
      {!feelSessionId && hipSessionId && <PostSessionHipRoutine sessionId={hipSessionId} onClose={() => setHipSessionId(null)} />}
      <TimerDock />
    </div>
  );
}
