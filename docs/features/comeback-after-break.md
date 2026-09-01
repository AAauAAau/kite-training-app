# Wiedereinstieg nach Pause

Status: Umgesetzt

## Ziel

Nach einer längeren Trainingspause (Urlaub, Krankheit) schlägt die App beim
Templatestart nicht das zuletzt geloggte Gewicht bzw. die `nextTarget`-Steigerung
vor, sondern ein reduziertes Startgewicht (~80 % des letzten Arbeitsgewichts).
Das verhindert die typische Woche‑1‑Verletzung, wenn nach zwei bis vier Wochen
Pause direkt am alten Gewicht weitergemacht wird.

Ein kurzer sichtbarer Hinweis erklärt, warum das Gewicht unten steht.

Der Eingriff korrigiert **nur den Startvorschlag der Einheit**. Die
Progressionshistorie bleibt unangetastet: `nextTarget()` rechnet unverändert
weiter, sobald wieder regelmäßig trainiert wird, und es gibt keinen Reset von
Erfolgs-/Fehlversuchsketten.

## Verhalten

- Beim Start eines Krafttemplates (A, B, KB) prüft die App den Abstand zwischen
  dem gewählten Einheitsdatum und der letzten qualifizierenden Trainingseinheit.
- Liegt dieser Abstand über der Schwelle, ist die Einheit im **Wiedereinstiegs‑
  Modus**:
  - Oben in der Einheit steht ein dezenter Hinweis (`alert-card subtle`), z. B.
    „Wiedereinstieg nach 3 Wochen Pause — Startgewichte auf 80 % reduziert. Erste
    Einheit bewusst leicht, dann normal weiter.“
  - Für jede `weight_reps`-Übung mit vorhandenem Arbeitsgewicht wird das
    vorgeschlagene Gewicht auf `runde(letztesArbeitsgewicht × Faktor)` gesetzt —
    sowohl in der Gewichts-Vorbelegung der Sätze als auch im Ziel-Badge.
  - Das Ziel-Badge zeigt in diesem Modus „Start N kg“ statt „Ziel N kg“.
  - Übungen ohne Arbeitsgewicht (`reps`, `time`) und Übungen mit
    `incrementKg: 0` behalten ihr normales Verhalten; für sie gilt nur der
    Hinweis oben.
- Der Modus ist rein aus den geloggten Daten abgeleitet. Keine zusätzliche
  Eingabe, kein Schalter, kein persistierter Zustand.
- Wird die Einheit gespeichert, wird nichts Besonderes markiert. Beim nächsten
  Start (dann liegt ja eine frische Einheit vor) ist der Modus automatisch
  wieder aus.
- Rückdatiertes Loggen: Die Prüfung nutzt das im Picker gewählte
  Einheitsdatum, nicht `localDate()`. Wer eine Einheit von vor drei Wochen
  nachträgt, löst den Modus nur aus, wenn davor tatsächlich eine lange Lücke lag.

## Nicht-Ziele

- Kein Reset der Progression (`nextTarget` bleibt unverändert).
- Kein mehrwöchiger Wiederaufbau-Plan, keine gestufte Rückkehr über mehrere
  Einheiten. Nur die erste Einheit nach der Pause wird korrigiert; ab der
  zweiten greift wieder die normale Logik.
- Keine Reduktion von Wiederholungs- oder Sekundenvorgaben.
- Keine Anpassung für Sprint, Ringe, Board-Off, Mobility, Kite, Padel.
- Keine Interaktion mit dem Substitutions-Feature über das hinaus, was sich
  automatisch ergibt (getauschte Übung nutzt denselben Startvorschlag-Pfad).
- Kein Nachfragen („warst du verletzt?“). Der Hinweistext nennt Urlaub/Krankheit
  nur als typische Ursache.

## Datenmodell und Migration

Keine Änderung an `types.ts`, `db.ts` oder `BackupData`. Kein Dexie-Versions-Bump.
Die Regel ist eine reine Ableitung aus `Session[]` zur Laufzeit. Bestehende
IndexedDB-Daten und Backups sind unberührt.

## Logik

Neu in `src/logic/training.ts`:

```ts
export const COMEBACK_AFTER_DAYS = 21;
export const COMEBACK_FACTOR = 0.8;

export interface ComebackState {
  active: boolean;
  daysSinceLast: number | null; // null = gar keine Vorgeschichte
  factor: number;
  reason: string;               // "" wenn inaktiv
}

// Abstand zwischen `date` und der letzten qualifizierenden Einheit VOR `date`.
export function comebackState(
  sessions: Session[],
  date?: string
): ComebackState;

// Startvorschlag für eine Übung zu Beginn einer Einheit.
// Ohne Pause identisch zu nextTarget(). Im Wiedereinstiegs-Modus:
// reduziertes, gerundetes Arbeitsgewicht statt Steigerung.
export function startingTarget(
  exerciseId: string,
  sessions: Session[],
  exercises: Exercise[],
  date?: string
): SetLog | null;
```

- **Qualifizierende Einheit**: Krafttemplates `A`, `B`, `KB`
  (`comebackSessionTypes`) — das sind die Einheiten, deren Gewichte progressiv
  geführt werden. `RINGS`/`SPRINT`/`KITE` etc. schützen die
  Langhantel-Grundübungen nicht vor Dekonditionierung und zählen daher nicht.
- **Schwelle**: `daysSinceLast > COMEBACK_AFTER_DAYS` (21 Tage; „3+ Wochen“).
  Reiner Tagesabstand, keine Kalenderwochen — deterministisch und
  zeitzonenunabhängig über `addDays`/String-Vergleich.
- **`startingTarget`**:
  - `comebackState` inaktiv → `return nextTarget(exerciseId, sessions, exercises, ...)` (unverändert).
  - aktiv, aber Übung nicht progressiv (`incrementKg === 0`) oder kein
    numerisches Arbeitsgewicht in der Historie → `return nextTarget(...)`
    (fällt auf `null` bzw. Normalverhalten zurück).
  - aktiv mit Arbeitsgewicht → nimm das letzte erfolgreiche Set (wie
    `nextTarget`), aber `kg = roundToIncrement(letztesErfolgreichesKg × factor, increment)`,
    `successful: undefined`.
- `nextTarget()` selbst wird **nicht** angefasst.

## UI

`src/components/WorkoutView.tsx`:

- In `startTemplate(...)`: Gewichts-Vorbelegung der Sätze kommt aus
  `startingTarget(...)` statt direkt aus `lastLoggedSet(...)`.
  Wiederholungen/Sekunden/Distanz weiterhin aus `lastLoggedSet`/Template-Default.
- Der Render-Pfad der Übungskarten nutzt `startingTarget` statt `nextTarget`
  für das Badge.
- Neuer Hinweis-Block oben in der aktiven Kraft-Einheit (nur wenn
  `comebackState(sessionHistory, sessionDate).active`), Markup analog zur
  `alert-card subtle` im Dashboard, mit `AlertIcon`.
- `ExerciseEditor`: Badge-Text „Start {kg} kg“ statt „Ziel {kg} kg“, wenn der
  Wiedereinstiegs-Modus aktiv ist (Flag als Prop).

Kein neues CSS-Token nötig; `.alert-card.subtle` und `.target` existieren.
Ggf. kleine `.target.comeback`-Variante für abweichende Farbe (optional).

`SessionEditor` (rückdatiertes Loggen) bleibt unverändert — dort gibt es kein
Ziel-Badge und keine Template-Vorbelegung aus `nextTarget`.

## Interaktion mit Deload

`deloadDue()` (7-Tage-Last über Limit oder 3× „wrecked“) und der
Wiedereinstiegs-Modus sind unabhängig:

- Nach einer langen Pause ist die 7‑Tage‑Last per Definition niedrig, ein
  lastbasierter Deload also ohnehin nicht aktiv.
- Beide Hinweise können theoretisch gleichzeitig erscheinen (Deload wegen
  „wrecked“-Serie unmittelbar vor der Pause). Das ist akzeptabel: beide raten
  in dieselbe Richtung (Gewicht runter). Keine Sonderlogik, kein
  gegenseitiges Unterdrücken.

## Tests und Abnahmekriterien

### Automatisiert (`src/logic/training.test.ts`)

`comebackState`:
- Keine Vorgeschichte → `{ active: false, daysSinceLast: null }`.
- Letzte Krafteinheit vor 14 Tagen → inaktiv.
- Letzte Krafteinheit vor 22 Tagen → aktiv, `reason` enthält Wochenzahl.
- Genau 21 Tage → inaktiv (Grenze exklusiv).
- Kite- und Sprint-Sessions in der Lücke zählen nicht als Training.
- Rückdatiertes Einheitsdatum: `date` steuert die Rechnung, nicht die
  Einfügereihenfolge.

`startingTarget`:
- Ohne Pause identisch zu `nextTarget` (gleicher Rückgabewert).
- Mit Pause: `kg` = gerundete 80 % des letzten erfolgreichen Gewichts,
  `successful: undefined`.
- Mit Pause, aber `incrementKg: 0` → `null` (wie `nextTarget`).
- Mit Pause, aber keine numerische Historie → `null`.
- Rundung folgt `increment` der Übung (z. B. 4 kg bei KB Swing).

### Manuell (mobil, Dev-Server, Basis-URL `/kite-training-app/`)

- Bestehende Testdaten so anlegen/aliasen, dass die letzte Krafteinheit > 3
  Wochen zurückliegt → Tag A starten → Hinweis oben sichtbar, Trap-Bar-Deadlift
  zeigt „Start“ statt „Ziel“ und ~80 % des letzten Gewichts, Vorbelegung der
  Sätze entsprechend.
- Einheit speichern → sofort erneut Tag A starten → Hinweis weg, normale
  Steigerung.
- Rückdatierte Einheit mitten in einer aktiven Trainingsphase → kein Hinweis.
- `reps`/`time`-Übungen (Pallof, Copenhagen) unverändert.
- Offline-Start nach Deploy funktioniert weiterhin.

## Entschieden

1. **Pausenende**: nur geloggte Krafttemplates `A`, `B`, `KB` beenden die Pause.
   Kite, Sprint, Ringe, Padel etc. zählen nicht.
2. **Schwelle**: Tagesabstand strikt größer als 21 Tage. **Faktor**: 0,8.
   Reiner Tagesabstand statt Kalenderwochen (deterministisch,
   zeitzonenunabhängig).
3. **Geltungsbereich**: ein Modus für die ganze Einheit, ausgelöst durch die
   Gesamtpause. Reduzierte Zahlen nur für `weight_reps`-Übungen; `reps`/`time`
   bekommen nur den Hinweis oben, keinen zusätzlichen Text pro Karte.
4. **Deload**: Wiedereinstiegs- und Deload-Hinweis dürfen gleichzeitig
   erscheinen. Keine Sonderlogik.
