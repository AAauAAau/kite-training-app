import { useRef, useState } from 'react';
import { exportBackup } from '../db';
import { localDate } from '../logic/date';
import { useAppStore } from '../store';

export function SettingsView() {
  const { settings, addBodyweight, updateSettings, restoreBackup, sessions } = useAppStore();
  const [weight, setWeight] = useState(settings.bodyweightLog.at(-1)?.kg.toString() ?? '86');
  const [focusTag, setFocusTag] = useState('');
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

  async function addFocusTag() {
    const tag = focusTag.trim();
    if (!tag) return;
    if (settings.kiteFocusTags.some((value) => value.toLocaleLowerCase() === tag.toLocaleLowerCase())) {
      return setMessage('Dieser Skill-Tag ist bereits vorhanden.');
    }
    await updateSettings({ kiteFocusTags: [...settings.kiteFocusTags, tag] });
    setFocusTag('');
    setMessage(`„${tag}“ hinzugefügt.`);
  }

  async function removeFocusTag(tag: string) {
    await updateSettings({ kiteFocusTags: settings.kiteFocusTags.filter((value) => value !== tag) });
    setMessage(`„${tag}“ aus der Auswahlliste entfernt.`);
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
        <span className="eyebrow">Wochenplanung</span><h2>Gym-Tage</h2>
        <p>An diesen Tagen werden Tag A und Tag B eingeplant.</p>
        <div className="day-picker">
          {[['Mo', 1], ['Di', 2], ['Mi', 3], ['Do', 4], ['Fr', 5], ['Sa', 6], ['So', 0]].map(([label, day]) => (
            <button key={day} className={settings.hamburgDays.includes(Number(day)) ? 'selected' : ''} onClick={() => toggleHamburgDay(Number(day))}>{label}</button>
          ))}
        </div>
      </section>
      {settings.boardOffLevel !== undefined && (
        <section className="settings-card card">
          <span className="eyebrow">Board-Off</span><h2>Progression</h2>
          <p>Deine aktuelle Stufe. Höherstufen, sobald du das Gate der Stufe schaffst.</p>
          <div className="segmented">
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <button key={level} className={settings.boardOffLevel === level ? 'selected' : ''} onClick={() => void updateSettings({ boardOffLevel: level })}>{level}</button>
            ))}
          </div>
          <p>Trapez-Aufhängung vorhanden?</p>
          <div className="segmented">
            <button className={(settings.boardOffHasRig ?? true) ? 'selected' : ''} onClick={() => void updateSettings({ boardOffHasRig: true })}>Ja</button>
            <button className={(settings.boardOffHasRig ?? true) ? '' : 'selected'} onClick={() => void updateSettings({ boardOffHasRig: false })}>Nein</button>
          </div>
          <button className="secondary" onClick={() => { void updateSettings({ boardOffLevel: undefined }); setMessage('Einstufung zurückgesetzt — beim nächsten Board-Off-Start neu.'); }}>Einstufung wiederholen</button>
        </section>
      )}
      <section className="settings-card card">
        <span className="eyebrow">Kite-Log</span><h2>Skill-Tags</h2>
        <p>Diese Tags stehen in den optionalen Kite-Details zur Auswahl. Bereits geloggte Tags bleiben beim Entfernen erhalten.</p>
        <div className="focus-tag-list">
          {settings.kiteFocusTags.map((tag) => (
            <span key={tag}>{tag}<button aria-label={`${tag} entfernen`} onClick={() => void removeFocusTag(tag)}>×</button></span>
          ))}
        </div>
        <div className="focus-tag-add">
          <input value={focusTag} maxLength={40} placeholder="Neuer Trick" aria-label="Neuer Skill-Tag" onChange={(event) => setFocusTag(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addFocusTag(); }} />
          <button className="secondary" onClick={() => void addFocusTag()}>Hinzufügen</button>
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
