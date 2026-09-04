import { useRef, useState } from 'react';
import { t } from '../i18n';
import { bodyRegionLabel } from '../logic/injury';
import { useLang } from '../i18n/react';
import { exportBackup } from '../db';
import { addDays, daysBetween, formatShortDate, localDate, weekdayLabels } from '../logic/date';
import { formatKg, localeFor, parseDecimal } from '../logic/format';
import { injuryState, selectableBodyRegions } from '../logic/injury';
import { useAppStore } from '../store';
import type { BodyRegion, Lang } from '../types';

const GYM_DAYS: number[] = [1, 2, 3, 4, 5, 6, 0]; // Mo … So, passend zu weekdayLabels()
const LANGUAGES: { value: Lang; key: 'settings.languageDe' | 'settings.languageEn' | 'settings.languageFr' }[] = [
  { value: 'de', key: 'settings.languageDe' },
  { value: 'en', key: 'settings.languageEn' },
  { value: 'fr', key: 'settings.languageFr' }
];

export function SettingsView() {
  const { settings, addBodyweight, updateSettings, restoreBackup, sessions } = useAppStore();
  const lang = useLang();
  const locale = localeFor(lang);
  const [weight, setWeight] = useState(settings.bodyweightLog.at(-1)?.kg.toString() ?? '86');
  const [focusTag, setFocusTag] = useState('');
  const [message, setMessage] = useState('');
  const [injuryRegion, setInjuryRegion] = useState<BodyRegion | null>(null);
  const [injuryDays, setInjuryDays] = useState(14);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = localDate();
  const dayLabels = weekdayLabels(locale);
  const injuries = [...(settings.injuries ?? [])].sort((a, b) => a.until.localeCompare(b.until));
  const expiredRegions = new Set(injuryState(settings, today).expired.map((injury) => injury.region));

  async function saveWeight() {
    const kg = parseDecimal(weight);
    if (!Number.isFinite(kg) || kg < 30 || kg > 250) return setMessage(t('settings.weightInvalid'));
    await addBodyweight(kg);
    setMessage(t('settings.weightSaved', { kg: formatKg(kg, lang) }));
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
    setMessage(t('settings.backupExported', { n: data.sessions.length }));
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      await restoreBackup(JSON.parse(await file.text()));
      setMessage(t('settings.backupImported'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('settings.backupImportFailed'));
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function toggleGymDay(day: number) {
    const days = settings.hamburgDays.includes(day)
      ? settings.hamburgDays.filter((value) => value !== day)
      : [...settings.hamburgDays, day].sort();
    if (days.length) void updateSettings({ hamburgDays: days });
  }

  async function addFocusTag() {
    const tag = focusTag.trim();
    if (!tag) return;
    if (settings.kiteFocusTags.some((value) => value.toLocaleLowerCase() === tag.toLocaleLowerCase())) {
      return setMessage(t('settings.tagsDuplicate'));
    }
    await updateSettings({ kiteFocusTags: [...settings.kiteFocusTags, tag] });
    setFocusTag('');
    setMessage(t('settings.tagsAdded', { tag }));
  }

  async function removeFocusTag(tag: string) {
    await updateSettings({ kiteFocusTags: settings.kiteFocusTags.filter((value) => value !== tag) });
    setMessage(t('settings.tagsRemoved', { tag }));
  }

  async function startInjury() {
    if (!injuryRegion) return;
    const since = today;
    const until = addDays(since, injuryDays - 1);
    const next = [...(settings.injuries ?? []).filter((injury) => injury.region !== injuryRegion), { region: injuryRegion, since, until }];
    await updateSettings({ injuries: next });
    setMessage(t('settings.injurySaved', { region: t(bodyRegionLabel(injuryRegion)), date: formatShortDate(until, locale) }));
    setInjuryRegion(null);
  }

  async function endInjury(region: BodyRegion) {
    await updateSettings({ injuries: (settings.injuries ?? []).filter((injury) => injury.region !== region) });
    setMessage(t('settings.injuryEnded', { region: t(bodyRegionLabel(region)) }));
  }

  return (
    <main className="page settings-page">
      <header className="page-header"><div><span className="eyebrow">{t('settings.eyebrow')}</span><h1>{t('settings.title')}</h1></div></header>

      <section className="settings-card card">
        <span className="eyebrow">{t('settings.languageEyebrow')}</span><h2>{t('settings.languageTitle')}</h2>
        <div className="segmented">
          {LANGUAGES.map((option) => (
            <button key={option.value} className={lang === option.value ? 'selected' : ''} aria-pressed={lang === option.value} onClick={() => void updateSettings({ lang: option.value })}>{t(option.key)}</button>
          ))}
        </div>
      </section>

      <section className="settings-card card">
        <span className="eyebrow">{t('settings.weightEyebrow')}</span><h2>{t('settings.weightTitle')}</h2>
        <div className="weight-input"><input inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} /><span>kg</span><button className="primary" onClick={saveWeight}>{t('common.save')}</button></div>
        <small>{settings.bodyweightLog.length === 1 ? t('settings.weightCountOne') : t('settings.weightCountOther', { n: settings.bodyweightLog.length })}</small>
      </section>
      <section className="settings-card card">
        <span className="eyebrow">{t('settings.loadEyebrow')}</span><h2>{t('settings.loadTitle')}</h2>
        <div className="threshold-control"><input type="range" min="6" max="18" step="0.5" value={settings.loadThreshold7d} onChange={(event) => updateSettings({ loadThreshold7d: Number(event.target.value) })} /><strong>{settings.loadThreshold7d}</strong></div>
      </section>
      <section className="settings-card card">
        <span className="eyebrow">{t('settings.gymDaysEyebrow')}</span><h2>{t('settings.gymDaysTitle')}</h2>
        <p>{t('settings.gymDaysBody')}</p>
        <div className="day-picker">
          {GYM_DAYS.map((day, index) => (
            <button key={day} className={settings.hamburgDays.includes(day) ? 'selected' : ''} onClick={() => toggleGymDay(day)}>{dayLabels[index]}</button>
          ))}
        </div>
      </section>
      {settings.boardOffLevel !== undefined && (
        <section className="settings-card card">
          <span className="eyebrow">{t('settings.boardOffEyebrow')}</span><h2>{t('settings.boardOffTitle')}</h2>
          <p>{t('settings.boardOffBody')}</p>
          <div className="segmented">
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <button key={level} className={settings.boardOffLevel === level ? 'selected' : ''} onClick={() => void updateSettings({ boardOffLevel: level })}>{level}</button>
            ))}
          </div>
          <p>{t('settings.boardOffRigQuestion')}</p>
          <div className="segmented">
            <button className={(settings.boardOffHasRig ?? true) ? 'selected' : ''} onClick={() => void updateSettings({ boardOffHasRig: true })}>{t('common.yes')}</button>
            <button className={(settings.boardOffHasRig ?? true) ? '' : 'selected'} onClick={() => void updateSettings({ boardOffHasRig: false })}>{t('common.no')}</button>
          </div>
          <button className="secondary" onClick={() => { void updateSettings({ boardOffLevel: undefined }); setMessage(t('settings.boardOffReassessDone')); }}>{t('settings.boardOffReassess')}</button>
        </section>
      )}
      <section className="settings-card card">
        <span className="eyebrow">{t('settings.injuryEyebrow')}</span><h2>{t('settings.injuryTitle')}</h2>
        <p>{t('settings.injuryBody')}</p>
        {injuries.length > 0 && (
          <div className="injury-list">
            {injuries.map((injury) => {
              const remaining = daysBetween(today, injury.until);
              const expired = expiredRegions.has(injury.region);
              return (
                <div key={injury.region}>
                  <span>
                    <b>{t(bodyRegionLabel(injury.region))}</b>
                    <small className={expired ? 'injury-expired' : undefined}>
                      {expired ? t('settings.injuryExpired') : remaining === 0 ? t('settings.injuryEndsToday') : t('common.daysRemainingOther', { n: remaining })}
                    </small>
                  </span>
                  <button onClick={() => void endInjury(injury.region)}>{t('common.end')}</button>
                </div>
              );
            })}
          </div>
        )}
        <div className="injury-region-picker">
          {selectableBodyRegions.map((region) => (
            <button
              key={region}
              className={injuryRegion === region ? 'selected' : ''}
              aria-pressed={injuryRegion === region}
              onClick={() => setInjuryRegion(injuryRegion === region ? null : region)}
            >{t(bodyRegionLabel(region))}</button>
          ))}
        </div>
        <div className="segmented">
          {[7, 14, 28].map((days) => (
            <button key={days} className={injuryDays === days ? 'selected' : ''} aria-pressed={injuryDays === days} onClick={() => setInjuryDays(days)}>
              {days === 7 ? t('settings.injuryDurationOne') : t('settings.injuryDurationOther', { n: days / 7 })}
            </button>
          ))}
        </div>
        <button className="primary" disabled={!injuryRegion} onClick={() => void startInjury()}>
          {injuryRegion ? t('settings.injuryStart', { region: t(bodyRegionLabel(injuryRegion)) }) : t('settings.injuryChooseRegion')}
        </button>
      </section>
      <section className="settings-card card">
        <span className="eyebrow">{t('settings.tagsEyebrow')}</span><h2>{t('settings.tagsTitle')}</h2>
        <p>{t('settings.tagsBody')}</p>
        <div className="focus-tag-list">
          {settings.kiteFocusTags.map((tag) => (
            <span key={tag}>{tag}<button aria-label={t('settings.tagsRemoveAria', { tag })} onClick={() => void removeFocusTag(tag)}>×</button></span>
          ))}
        </div>
        <div className="focus-tag-add">
          <input value={focusTag} maxLength={40} placeholder={t('settings.tagsPlaceholder')} aria-label={t('settings.tagsInputAria')} onChange={(event) => setFocusTag(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addFocusTag(); }} />
          <button className="secondary" onClick={() => void addFocusTag()}>{t('common.add')}</button>
        </div>
      </section>
      <section className="settings-card card">
        <span className="eyebrow">{t('settings.backupEyebrow')}</span><h2>{t('settings.backupTitle')}</h2><p>{t('settings.backupBody', { n: sessions.length })}</p>
        <div className="backup-actions"><button className="primary" onClick={downloadBackup}>{t('settings.backupExport')}</button><button className="secondary" onClick={() => inputRef.current?.click()}>{t('settings.backupImport')}</button></div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => importFile(event.target.files?.[0])} />
      </section>
      {message && <div className="toast-message" role="status">{message}</div>}
      <footer className="privacy-note">{t('settings.privacy')}</footer>
    </main>
  );
}
