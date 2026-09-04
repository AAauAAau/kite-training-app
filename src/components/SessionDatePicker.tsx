import { useId, useRef, useState } from 'react';
import { t } from '../i18n';
import { useLang } from '../i18n/react';
import { addDays, isLoggableDate, localDate } from '../logic/date';

export function SessionDatePicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  useLang();
  const today = localDate();
  const yesterday = addDays(today, -1);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  function select(date: string) {
    if (!isLoggableDate(date, today)) {
      setError(t('datePicker.future'));
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
      <label htmlFor={inputId}><span>{t('datePicker.label')}</span><input ref={inputRef} id={inputId} type="date" max={today} value={value} onChange={(event) => select(event.target.value)} /></label>
      <div className="date-shortcuts" aria-label={t('datePicker.quickAria')}>
        <button type="button" className={value === today ? 'selected' : ''} onClick={() => select(today)}>{t('common.today')}</button>
        <button type="button" className={value === yesterday ? 'selected' : ''} onClick={() => select(yesterday)}>{t('common.yesterday')}</button>
        <button type="button" onClick={openPicker}>{t('datePicker.choose')}</button>
      </div>
      {error && <small className="date-error" role="alert">{error}</small>}
    </section>
  );
}
