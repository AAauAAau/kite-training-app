import { useState } from 'react';
import { t } from '../i18n';
import { useAppStore } from '../store';
import type { EquipmentAccess, KiteDiscipline, TrainingProfile } from '../types';

interface OnboardingProps {
  /** Bestehendes Profil vorbelegen (Einstellungen → „Anpassen"). */
  initial?: TrainingProfile;
  /** Als Karte in den Einstellungen eingebettet — kein „Überspringen", Titelzeile schlanker. */
  embedded?: boolean;
  onDone: () => void;
  onCancel?: () => void;
}

const EQUIPMENT: { value: EquipmentAccess; key: 'plan.equipment.gym' | 'plan.equipment.kettlebell' | 'plan.equipment.rings' | 'plan.equipment.none' }[] = [
  { value: 'gym', key: 'plan.equipment.gym' },
  { value: 'kettlebell', key: 'plan.equipment.kettlebell' },
  { value: 'rings', key: 'plan.equipment.rings' },
  { value: 'none', key: 'plan.equipment.none' }
];

const DISCIPLINES: { value: KiteDiscipline; key: 'plan.discipline.big-air' | 'plan.discipline.freestyle' | 'plan.discipline.wave' | 'plan.discipline.foil' | 'plan.discipline.wing' }[] = [
  { value: 'big-air', key: 'plan.discipline.big-air' },
  { value: 'freestyle', key: 'plan.discipline.freestyle' },
  { value: 'wave', key: 'plan.discipline.wave' },
  { value: 'foil', key: 'plan.discipline.foil' },
  { value: 'wing', key: 'plan.discipline.wing' }
];

const DAYS: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
const STEPS = 4;

export function Onboarding({ initial, embedded, onDone, onCancel }: OnboardingProps) {
  const { updateSettings } = useAppStore();
  const [step, setStep] = useState(0);
  const [equipment, setEquipment] = useState<EquipmentAccess>(initial?.equipment ?? 'gym');
  const [daysPerWeek, setDaysPerWeek] = useState<1 | 2 | 3 | 4>(initial?.daysPerWeek ?? 2);
  const [discipline, setDiscipline] = useState<KiteDiscipline>(initial?.discipline ?? 'big-air');
  const [preferGentle, setPreferGentle] = useState(initial?.preferGentle ?? false);

  const editing = Boolean(initial && !initial.skipped);

  async function create() {
    await updateSettings({
      trainingProfile: {
        equipment,
        daysPerWeek,
        discipline,
        preferGentle,
        seasonAdjust: initial?.seasonAdjust,
        createdAt: initial?.createdAt ?? Date.now()
      }
    });
    onDone();
  }

  async function skip() {
    await updateSettings({ trainingProfile: { skipped: true, createdAt: Date.now() } });
    onDone();
  }

  const stepBody = [
    <div key="equipment">
      <h2>{t('plan.onboarding.equipmentTitle')}</h2>
      <div className="segmented segmented-stack">
        {EQUIPMENT.map((option) => (
          <button key={option.value} className={equipment === option.value ? 'selected' : ''} aria-pressed={equipment === option.value} onClick={() => setEquipment(option.value)}>
            {t(option.key)}
          </button>
        ))}
      </div>
    </div>,
    <div key="days">
      <h2>{t('plan.onboarding.daysTitle')}</h2>
      <div className="segmented">
        {DAYS.map((n) => (
          <button key={n} className={daysPerWeek === n ? 'selected' : ''} aria-pressed={daysPerWeek === n} onClick={() => setDaysPerWeek(n)}>
            {t('plan.onboarding.daysUnit', { n })}
          </button>
        ))}
      </div>
    </div>,
    <div key="discipline">
      <h2>{t('plan.onboarding.disciplineTitle')}</h2>
      <div className="segmented segmented-stack">
        {DISCIPLINES.map((option) => (
          <button key={option.value} className={discipline === option.value ? 'selected' : ''} aria-pressed={discipline === option.value} onClick={() => setDiscipline(option.value)}>
            {t(option.key)}
          </button>
        ))}
      </div>
    </div>,
    <div key="gentle">
      <h2>{t('plan.onboarding.gentleTitle')}</h2>
      <p>{t('plan.onboarding.gentleBody')}</p>
      <div className="segmented">
        <button className={preferGentle ? 'selected' : ''} aria-pressed={preferGentle} onClick={() => setPreferGentle(true)}>{t('plan.onboarding.gentleOn')}</button>
        <button className={preferGentle ? '' : 'selected'} aria-pressed={!preferGentle} onClick={() => setPreferGentle(false)}>{t('plan.onboarding.gentleOff')}</button>
      </div>
    </div>
  ];

  const content = (
    <>
      <div className="onboarding-step card">
        <span className="eyebrow">{t('plan.onboarding.stepOf', { n: step + 1 })}</span>
        {stepBody[step]}
      </div>
      <div className="onboarding-nav">
        {step > 0
          ? <button className="secondary" onClick={() => setStep(step - 1)}>{t('common.back')}</button>
          : editing && onCancel
            ? <button className="secondary" onClick={onCancel}>{t('common.cancel')}</button>
            : <span />}
        {step < STEPS - 1
          ? <button className="primary" onClick={() => setStep(step + 1)}>{t('plan.onboarding.next')}</button>
          : <button className="primary" onClick={() => void create()}>{editing ? t('common.save') : t('plan.onboarding.create')}</button>}
      </div>
      {!embedded && !editing && (
        <div className="onboarding-skip">
          <button className="text-button" onClick={() => void skip()}>{t('common.skip')}</button>
          <small>{t('plan.onboarding.skipHint')}</small>
        </div>
      )}
    </>
  );

  if (embedded) return <div className="onboarding-embedded">{content}</div>;

  return (
    <main className="page onboarding-page">
      <header className="page-header">
        <div><span className="eyebrow">{t('plan.onboarding.eyebrow')}</span><h1>{t('plan.onboarding.title')}</h1></div>
      </header>
      {content}
    </main>
  );
}
