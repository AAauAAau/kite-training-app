import { useId, useRef, useState } from 'react';
import { addDays, isLoggableDate, localDate } from '../logic/date';

export function SessionDatePicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const today = localDate();
  const yesterday = addDays(today, -1);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  function select(date: string) {
    if (!isLoggableDate(date, today)) {
      setError('Ein zukünftiges Datum kann nicht geloggt werden.');
      return;
    }
    setError('');
    onChange(date);
  }

  function openPicker() {
    inputRef.current?.focus();
    inputRef.current?.showPicker?.();
  }

  return (
    <section className="session-date-picker">
      <label htmlFor={inputId}><span>Datum</span><input ref={inputRef} id={inputId} type="date" max={today} value={value} onChange={(event) => select(event.target.value)} /></label>
      <div className="date-shortcuts" aria-label="Datum schnell auswählen">
        <button type="button" className={value === today ? 'selected' : ''} onClick={() => select(today)}>Heute</button>
        <button type="button" className={value === yesterday ? 'selected' : ''} onClick={() => select(yesterday)}>Gestern</button>
        <button type="button" onClick={openPicker}>Datum wählen</button>
      </div>
      {error && <small className="date-error" role="alert">{error}</small>}
    </section>
  );
}
