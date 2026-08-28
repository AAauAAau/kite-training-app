import { useEffect, useMemo, useRef, useState } from 'react';
import type { KiteBoard, KiteDetails, KiteWind } from '../types';
import { CheckIcon } from './Icons';

const winds: { value: KiteWind; label: string }[] = [
  { value: 'leicht', label: 'Leicht' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'stark', label: 'Stark' }
];

const boards: { value: KiteBoard; label: string }[] = [
  { value: 'twintip', label: 'Twintip' },
  { value: 'foil', label: 'Foil' },
  { value: 'directional', label: 'Directional' }
];

function cleanDetails(details: KiteDetails): KiteDetails | undefined {
  const focus = details.focus?.length ? details.focus : undefined;
  return details.wind || details.board || focus ? { ...details, focus } : undefined;
}

export function KiteDetailsEditor({
  details,
  focusTags,
  onChange,
  idleLabel = 'Wird automatisch gespeichert',
  savedLabel = 'Gespeichert'
}: {
  details?: KiteDetails;
  focusTags: string[];
  onChange: (details?: KiteDetails) => Promise<void>;
  idleLabel?: string;
  savedLabel?: string;
}) {
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);
  const availableTags = useMemo(
    () => [...new Set([...focusTags, ...(details?.focus ?? [])])],
    [details?.focus, focusTags]
  );

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  async function save(next: KiteDetails) {
    await onChange(cleanDetails(next));
    setSaved(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setSaved(false), 1600);
  }

  function toggleFocus(tag: string) {
    const current = details?.focus ?? [];
    const focus = current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag];
    void save({ ...details, focus });
  }

  return (
    <details className="kite-details-editor">
      <summary>
        <span>Details</span>
        <small>{details ? 'Bearbeiten' : 'Optional'}</small>
        <b>⌄</b>
      </summary>
      <div className="kite-details-fields">
        <fieldset>
          <legend>Windstärke</legend>
          <div className="kite-choice-grid three">
            {winds.map(({ value, label }) => (
              <button type="button" key={value} className={details?.wind === value ? 'selected' : ''} onClick={() => void save({ ...details, wind: details?.wind === value ? undefined : value })}>{label}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Board</legend>
          <div className="kite-choice-grid three">
            {boards.map(({ value, label }) => (
              <button type="button" key={value} className={details?.board === value ? 'selected' : ''} onClick={() => void save({ ...details, board: details?.board === value ? undefined : value })}>{label}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Fokus <small>Mehrfachauswahl</small></legend>
          <div className="kite-focus-picker">
            {availableTags.map((tag) => (
              <button type="button" key={tag} className={details?.focus?.includes(tag) ? 'selected' : ''} onClick={() => toggleFocus(tag)}>{tag}</button>
            ))}
          </div>
        </fieldset>
        <small className={`autosave-hint ${saved ? 'confirmed' : ''}`} role="status">
          <CheckIcon /> {saved ? savedLabel : idleLabel}
        </small>
      </div>
    </details>
  );
}
