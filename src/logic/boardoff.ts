import type { BoardOffLevel, BoardOffSlot } from '../types';

export interface BoardOffAssessment {
  hasRig: boolean;
  activeCompression: boolean;   // Langsitz, Fersen heben, 3 s
  longSit30s: boolean;          // 30 s aufrecht ohne Rundrücken
  shoulderFlexion: boolean;     // Handrücken an der Wand — nur Hinweis, kein Gate
  deadHang: 'under20' | '20to30' | 'over30';
  tailGrab: boolean;            // sicherer Tail Grab im Sprung
  oneFooter: boolean;           // One Footer beidseitig
  boardOffByFin: boolean;       // schon auf dem Wasser gefahren
}

/**
 * Empfohlene Startstufe nach dem Entscheidungsbaum in
 * docs/training/board-off-progression.md (Abschnitt 3).
 * Stufe 5 wird nie automatisch empfohlen — sie läuft parallel zu 4.
 */
export function recommendBoardOffLevel(a: BoardOffAssessment): number {
  if (!a.activeCompression || !a.longSit30s || a.deadHang === 'under20') return 0;
  if (a.boardOffByFin) return 4;
  if (a.oneFooter) return 3;
  if (a.tailGrab) return 2;
  return 1;
}

/** Hat die Stufe mindestens eine Übung, die eine Trapez-Aufhängung braucht? */
export function levelNeedsRig(level: BoardOffLevel): boolean {
  return level.slots.some((slot) => slot.needsRig);
}

/**
 * Die vier Slots einer Stufe. Ohne Aufhängung wird jeder `needsRig`-Slot
 * durch seine boden-basierte Alternative ersetzt; die Slot-Anzahl bleibt.
 */
export function boardOffLevelSlots(level: BoardOffLevel, hasRig: boolean): BoardOffSlot[] {
  if (hasRig) return level.slots;
  return level.slots.map((slot) =>
    slot.needsRig && slot.rigFreeAlternative ? { ...slot.rigFreeAlternative } : slot
  );
}
