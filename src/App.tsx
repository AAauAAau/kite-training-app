import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { FeelSheet } from './components/FeelSheet';
import { CalendarIcon, HomeIcon, PlusIcon, SettingsIcon } from './components/Icons';
import { SettingsView } from './components/SettingsView';
import { WeekView } from './components/WeekView';
import { WorkoutView } from './components/WorkoutView';
import { useAppStore } from './store';
import type { Feel } from './types';

type View = 'home' | 'train' | 'week' | 'settings';

export default function App() {
  const { ready, initialize, setFeel } = useAppStore();
  const [view, setView] = useState<View>('home');
  const [feelSessionId, setFeelSessionId] = useState<string | null>(null);

  useEffect(() => { void initialize(); }, [initialize]);

  async function chooseFeel(feel: Feel) {
    if (feelSessionId) await setFeel(feelSessionId, feel);
    setFeelSessionId(null);
    setView('home');
  }

  if (!ready) return <div className="splash"><div className="splash-kite">K</div><strong>Kite Strength</strong><span>Offline wird vorbereitet …</span></div>;

  return (
    <div className="app-shell">
      {view === 'home' && <Dashboard onTrain={() => setView('train')} />}
      {view === 'train' && <WorkoutView onSaved={(id) => setFeelSessionId(id)} onCancel={() => setView('home')} />}
      {view === 'week' && <WeekView />}
      {view === 'settings' && <SettingsView />}

      {!feelSessionId && (
        <nav className="bottom-nav" aria-label="Hauptnavigation">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><HomeIcon /><span>Heute</span></button>
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}><CalendarIcon /><span>Woche</span></button>
          <button className={`nav-primary ${view === 'train' ? 'active' : ''}`} onClick={() => setView('train')}><PlusIcon /><span>Loggen</span></button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}><SettingsIcon /><span>Mehr</span></button>
        </nav>
      )}
      {feelSessionId && <FeelSheet onChoose={chooseFeel} onClose={() => { setFeelSessionId(null); setView('home'); }} />}
    </div>
  );
}
