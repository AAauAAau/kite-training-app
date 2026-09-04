import { t } from '../i18n';
import { useLang } from '../i18n/react';
import type { Feel } from '../types';

export function FeelSheet({ onChoose, onClose }: { onChoose: (feel: Feel) => void; onClose: () => void }) {
  useLang();
  return (
    <div className="sheet-backdrop">
      <section className="bottom-sheet">
        <span className="eyebrow">{t('feel.saved')}</span>
        <h2>{t('feel.question')}</h2>
        <div className="feel-grid">
          <button onClick={() => onChoose('good')}><span>●</span>{t('enum.feel.good')}</button>
          <button onClick={() => onChoose('ok')}><span>●</span>{t('enum.feel.ok')}</button>
          <button onClick={() => onChoose('wrecked')}><span>●</span>{t('enum.feel.wrecked')}</button>
        </div>
        <button className="text-button sheet-skip" onClick={onClose}>{t('common.skip')}</button>
      </section>
    </div>
  );
}
