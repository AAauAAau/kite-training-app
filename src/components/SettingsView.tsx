import { useRef, useState } from 'react';
import { exportBackup } from '../db';
import { localDate } from '../logic/date';
import { useAppStore } from '../store';

export function SettingsView() {
  const { settings, addBodyweight, updateSettings, restoreBackup, sessions } = useAppStore();
  const [weight, setWeight] = useState(settings.bodyweightLog.at(-1)?.kg.toString() ?? '86');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function saveWeight() {
    const kg = Number(weight.replace(',', '.'));
    if (!Number.isFinite(kg) || kg < 30 || kg > 250) return setMessage('Bitte plausibles Gewicht eingeben.');
    await addBodyweight(kg);
    setMessage(`${kg.toFixed(1)} kg für heute gespeichert.`);
  }

  async function downloadBackup() {
    const data = await exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kite-strength-backup-${localDate()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`${data.sessions.length} Einheiten exportiert.`);
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      await restoreBackup(JSON.parse(await file.text()));
      setMessage('Backup vollständig importiert.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import fehlgeschlagen.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function toggleHamburgDay(day: number) {
    const days = settings.hamburgDays.includes(day)
      ? settings.hamburgDays.filter((value) => value !== day)
      : [...settings.hamburgDays, day].sort();
    if (days.length) void updateSettings({ hamburgDays: days });
  }

  return (
    <main className="page settings-page">
      <header className="page-header"><div><span className="eyebrow">Lokal auf diesem Gerät</span><h1>Einstellungen</h1></div></header>
      <section className="settings-card card">
        <span className="eyebrow">Körpergewicht · wöchentlich</span><h2>Aktuelles Gewicht</h2>
        <div className="weight-input"><input inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} /><span>kg</span><button className="primary" onClick={saveWeight}>Speichern</button></div>
        <small>{settings.bodyweightLog.length} Einträge gespeichert</small>
      </section>
      <section className="settings-card card">
        <span className="eyebrow">Regeneration</span><h2>7-Tage-Lastlimit</h2>
        <div className="threshold-control"><input type="range" min="6" max="18" step="0.5" value={settings.loadThreshold7d} onChange={(event) => updateSettings({ loadThreshold7d: Number(event.target.value) })} /><strong>{settings.loadThreshold7d}</strong></div>
      </section>
      <section className="settings-card card">
        <span className="eyebrow">Wochenplanung</span><h2>Hamburg-Tage</h2>
        <div className="day-picker">
          {[['Mo', 1], ['Di', 2], ['Mi', 3], ['Do', 4], ['Fr', 5], ['Sa', 6], ['So', 0]].map(([label, day]) => (
            <button key={day} className={settings.hamburgDays.includes(Number(day)) ? 'selected' : ''} onClick={() => toggleHamburgDay(Number(day))}>{label}</button>
          ))}
        </div>
      </section>
      <section className="settings-card card">
        <span className="eyebrow">Backup</span><h2>Export / Import</h2><p>Alle {sessions.length} Einheiten, Übungen und Einstellungen als eine JSON-Datei.</p>
        <div className="backup-actions"><button className="primary" onClick={downloadBackup}>JSON exportieren</button><button className="secondary" onClick={() => inputRef.current?.click()}>JSON importieren</button></div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => importFile(event.target.files?.[0])} />
      </section>
      {message && <div className="toast-message" role="status">{message}</div>}
      <footer className="privacy-note">Keine Cloud. Keine Analytics. Deine Daten bleiben in diesem Browser.</footer>
    </main>
  );
}
