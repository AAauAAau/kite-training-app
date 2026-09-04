import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../i18n';
import { useLang } from '../i18n/react';
import type { KiteBoard, KiteDetails, KiteWind } from '../types';
import { CheckIcon } from './Icons';

const winds: { value: KiteWind; key: 'enum.wind.leicht' | 'enum.wind.mittel' | 'enum.wind.stark' }[] = [
  { value: 'leicht', key: 'enum.wind.leicht' },
  { value: 'mittel', key: 'enum.wind.mittel' },
  { value: 'stark', key: 'enum.wind.stark' }
];

const boards: { value: KiteBoard; key: 'enum.board.twintip' | 'enum.board.foil' | 'enum.board.directional' }[] = [
  { value: 'twintip', key: 'enum.board.twintip' },
  { value: 'foil', key: 'enum.board.foil' },
  { value: 'directional', key: 'enum.board.directional' }
];

function cleanDetails(details: KiteDetails): KiteDetails | undefined {
  const focus = details.focus?.length ? details.focus : undefined;
  return details.wind || details.board || focus ? { ...details, focus } : undefined;
}

export function KiteDetailsEditor({
  details,
  focusTags,
  onChange,
  idleLabel,
  savedLabel
}: {
  details?: KiteDetails;
  focusTags: string[];
  onChange: (details?: KiteDetails) => Promise<void>;
  idleLabel?: string;
  savedLabel?: string;
}) {
  useLang();
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
        <span>{t('kiteDetails.summary')}</span>
        <small>{details ? t('kiteDetails.edit') : t('kiteDetails.optional')}</small>
        <b>⌄</b>
      </summary>
      <div className="kite-details-fields">
        <fieldset>
          <legend>{t('kiteDetails.wind')}</legend>
          <div className="kite-choice-grid three">
            {winds.map(({ value, key }) => (
              <button type="button" key={value} className={details?.wind === value ? 'selected' : ''} onClick={() => void save({ ...details, wind: details?.wind === value ? undefined : value })}>{t(key)}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t('kiteDetails.board')}</legend>
          <div className="kite-choice-grid three">
            {boards.map(({ value, key }) => (
              <button type="button" key={value} className={details?.board === value ? 'selected' : ''} onClick={() => void save({ ...details, board: details?.board === value ? undefined : value })}>{t(key)}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t('kiteDetails.focus')} <small>{t('kiteDetails.focusHint')}</small></legend>
          <div className="kite-focus-picker">
            {availableTags.map((tag) => (
              <button type="button" key={tag} className={details?.focus?.includes(tag) ? 'selected' : ''} onClick={() => toggleFocus(tag)}>{tag}</button>
            ))}
          </div>
        </fieldset>
        <small className={`autosave-hint ${saved ? 'confirmed' : ''}`} role="status">
          <CheckIcon /> {saved ? (savedLabel ?? t('common.autosaveSaved')) : (idleLabel ?? t('common.autosaveIdle'))}
        </small>
      </div>
    </details>
  );
}
