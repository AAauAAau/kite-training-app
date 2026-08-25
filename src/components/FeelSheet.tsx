import type { Feel } from '../types';

export function FeelSheet({ onChoose, onClose }: { onChoose: (feel: Feel) => void; onClose: () => void }) {
  return (
    <div className="sheet-backdrop">
      <section className="bottom-sheet">
        <span className="eyebrow">Einheit gespeichert</span>
        <h2>Wie fühlst du dich?</h2>
        <div className="feel-grid">
          <button onClick={() => onChoose('good')}><span>●</span>Gut</button>
          <button onClick={() => onChoose('ok')}><span>●</span>Okay</button>
          <button onClick={() => onChoose('wrecked')}><span>●</span>Leer</button>
        </div>
        <button className="text-button sheet-skip" onClick={onClose}>Überspringen</button>
      </section>
    </div>
  );
}
