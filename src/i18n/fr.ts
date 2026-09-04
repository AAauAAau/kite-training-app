import type { Messages } from './de';

// Platzhalter — die französischen Übersetzungen folgen in Phase 6 der Spec
// (docs/features/i18n-en-fr.md). Bis dahin fällt `t()` sichtbar auf Deutsch zurück.
export const messages = {} satisfies Partial<Messages>;
