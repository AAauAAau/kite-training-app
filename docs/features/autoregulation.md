# Autoregulation statt fixer Progression

Status: Umgesetzt

## Ziel

Nach dem ersten Arbeitssatz einer Übung kurz abfragen, wie er sich anfühlte
(**leicht / passt / schwer**), und das Gewicht der noch offenen Sätze
**derselben Übung, derselben Session** entsprechend anpassen.

Löst das Problem, dass `nextTarget()` von der letzten Einheit ausgeht — bei
unregelmäßiger Frequenz kann das an einem konkreten Tag zu leicht oder zu
schwer sein. Autoregulation korrigiert das live, ohne die Steigerungslogik
selbst zu verändern.

Direkt verwandt mit [Wiedereinstieg nach Pause](comeback-after-break.md):
dort wird der **Startvorschlag** korrigiert, hier der **Verlauf innerhalb
der Session**. Beide können in derselben Einheit gemeinsam greifen (reduziertes
Startgewicht durch die Pause, dann zusätzlich autoreguliert je nach Satz 1).

## Verhalten

- Sobald Satz 1 einer `weight_reps`-Übung mit numerischem Gewicht als
  **erfolgreich (✓)** geloggt wird, erscheint darunter eine kompakte
  Drei-Wege-Auswahl: **Leicht · Passt · Schwer**. Bei einem Fehlversuch (×)
  erscheint sie nicht — dort greift ohnehin die `nextTarget`-Reduktion nach
  zwei Fehlversuchen.
- Auswahl passt das Gewicht der noch offenen Sätze derselben Übung an,
  relativ zum tatsächlich geloggten Gewicht von Satz 1 (`baseKg`):
  - Leicht → `baseKg × 1,075`
  - Passt → `baseKg`
  - Schwer → `baseKg × 0,925`
  - Rundung auf `incrementKg` der Übung (wie `nextTarget`/`startingTarget`).
  - Bei sehr leichten Gewichten kann die Rundung dazu führen, dass sich
    nichts ändert. Bewusst, kein Sonderfall.
- Betroffen sind nur Sätze mit `successful === undefined`, deren Gewicht der
  Nutzer **nicht selbst editiert** hat. Ein Satz, in dessen kg-Feld getippt
  wurde, ist ab dann „gepinnt" und wird von der Autoregulation nicht mehr
  überschrieben.
- Die Wahl bleibt sichtbar und ist **jederzeit umschaltbar**, solange die
  Übung noch offene Sätze hat. Jede Neuwahl verschiebt erneut von `baseKg`
  aus (nicht kumulativ zur vorherigen Wahl).
- Die Anpassung schreibt nur beim Klick auf die Auswahl, nicht laufend.
- Übungen ohne Gewicht (`reps`, `time`) oder mit `incrementKg: 0` bekommen
  keine Autoregulation — es gibt nichts, das sich sinnvoll um einen
  Gewichts-Schritt verschieben lässt.
- Rein sessionlokal: kein neues `Session`- oder `SetLog`-Feld, keine
  Persistierung der Wahl. Nach dem Speichern ist nichts davon in den Daten
  sichtbar außer den tatsächlich geloggten Gewichten der späteren Sätze.
- `nextTarget()` bleibt unverändert. Die nächste Einheit rechnet wie bisher
  vom letzten erfolgreichen Satz aus hoch — Autoregulation dieser Session
  fließt dort nur so ein, wie die tatsächlich geloggten Gewichte es ohnehin
  tun.

## Nicht-Ziele

- Keine Änderung an `nextTarget()`/`startingTarget()` oder der
  Progressionshistorie über die Session hinaus.
- Keine Anpassung von Wiederholungs- oder Sekundenvorgaben.
- Keine Autoregulation für Sprint, Ringe, Board-Off, Mobility, Kite, Padel.
- Kein RPE/RIR-Zahleneingabefeld. Drei feste Stufen, keine Skala.
- Keine Interaktion mit der Deload- oder Wiedereinstiegs-Logik über das
  hinaus, was sich automatisch ergibt (beide schreiben unabhängig auf
  `SetLog.kg`, letzte Aktion gewinnt).

## Datenmodell und Migration

Keine Änderung an `types.ts`, `db.ts` oder `BackupData`. Die Auswahl lebt
ausschließlich im `Draft`-State von `WorkoutView` (analog zu
`substitutions` aus der Übungs-Substitution).

```ts
type Draft = {
  // …
  autoregulation?: Record<string, 'easy' | 'ok' | 'hard'>;  // exerciseId -> Wahl
  autoregulationManualSets?: Record<string, number[]>;       // exerciseId -> Satz-Indizes mit vom Nutzer editiertem kg
};
```

## Logik

Neue reine Funktion in `src/logic/training.ts`:

```ts
export const AUTOREGULATION_STEP = 0.075;
export type AutoregulationFeedback = 'easy' | 'ok' | 'hard';

// Gewicht für einen noch offenen Satz nach Autoregulations-Feedback.
// `baseKg` = tatsächlich geloggtes Gewicht von Satz 1.
export function autoregulatedKg(
  baseKg: number,
  feedback: AutoregulationFeedback,
  exercise: Exercise
): number;
```

- `easy` → `roundToIncrement(baseKg * (1 + AUTOREGULATION_STEP), increment)`
- `hard` → `roundToIncrement(baseKg * (1 - AUTOREGULATION_STEP), increment)`
- `ok` → `baseKg`
- `increment = exercise.incrementKg ?? 2.5`; bei `incrementKg === 0` wird die
  Funktion von der aufrufenden Seite gar nicht erst angeboten (siehe UI).

Der Anwendung auf die Sätze (welche Sätze betroffen sind, Draft-Update) lebt
in `WorkoutView`, analog zu `substitute()`/`updateSet()`. Kein neuer
Store-State, kein neuer `Session`-Write-Pfad.

## UI

- `ExerciseEditor`/`SetEditor` (`WorkoutView.tsx`): sobald `entry.sets[0]`
  `successful === true` hat und `exercise.metric === 'weight_reps'` und
  `exercise.incrementKg !== 0`, erscheint unter der Satztabelle eine
  `.segmented`-Dreiergruppe (gleicher Stil wie die Kite-Intensität):
  „Leicht · Passt · Schwer", mittlere Option „Passt" ohne Vorauswahl.
- Auswahl aktualisiert sofort alle Sätze mit `successful === undefined`
  über `updateSet` (Gewicht, `successful` bleibt `undefined`).
- Kein neues Sheet, kein Modal — passt zur bestehenden Dichte der aktiven
  Session-Ansicht.
- Kein neues Farb-Token; `.segmented` existiert bereits.

## Tests und Abnahmekriterien

### Automatisiert (`src/logic/training.test.ts`)

`autoregulatedKg`:
- `easy` erhöht um ~7,5 %, gerundet auf `incrementKg`.
- `hard` verringert um ~7,5 %, gerundet auf `incrementKg`.
- `ok` gibt `baseKg` unverändert zurück.
- Rundung greift bei krummem Increment (z. B. 4 kg bei KB Swing).
- Sehr leichtes Gewicht: Rundung kann bei `easy`/`hard` auf `baseKg` fallen.

### Manuell (mobil, Dev-Server, Basis-URL `/kite-training-app/`)

- Tag A starten, Trap-Bar Deadlift Satz 1 mit Gewicht loggen und ✓ setzen →
  Leicht/Passt/Schwer erscheint, Sätze 2–4 zeigen noch das ursprüngliche
  Zielgewicht.
- „Schwer" wählen → Sätze 2–4 zeigen reduziertes Gewicht, Satz 1 unverändert.
- Auswahl auf „Leicht" wechseln → Sätze 2–4 springen relativ zu Satz 1 nach
  oben (nicht kumulativ zur vorherigen Wahl).
- Satz 3 manuell auf ein eigenes Gewicht tippen, dann die Auswahl erneut
  ändern → Satz 3 bleibt beim eingegebenen Wert, Satz 2 und 4 verschieben sich.
- Übung mit `incrementKg: 0` (Back Extension) oder `reps`/`time`-Übung →
  keine Autoregulations-Auswahl sichtbar.
- Einheit speichern → im Log stehen die tatsächlich geloggten Gewichte,
  nichts Autoregulations-Spezifisches ist persistiert.
- Offline-Start nach Deploy funktioniert weiterhin.

## Entschieden

1. **Trigger**: nur wenn Satz 1 als erfolgreich (✓) geloggt ist. Kein
   Prompt nach einem Fehlversuch.
2. **Anpassungsgröße**: Prozentsatz `± 7,5 %` (`AUTOREGULATION_STEP`),
   gerundet auf den `incrementKg` der Übung.
3. **Welche Sätze**: nur `successful === undefined` und vom Nutzer nicht
   selbst editiert (`autoregulationManualSets`). Ein einmal getipptes
   kg-Feld ist gepinnt.
4. **Umschaltbar**: jederzeit änderbar, solange offene Sätze existieren.
   Jede Neuwahl rechnet neu von `baseKg` (Satz 1), nicht kumulativ.
