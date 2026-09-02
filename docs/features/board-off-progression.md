# Board-Off-Progression in der App

Status: In Planung

Fachliche Grundlage: [docs/training/board-off-progression.md](../training/board-off-progression.md).
Diese Spec beschreibt nur die **App-Umsetzung** dieses Trainingsentwurfs.

## Ziel

Das Trockentraining für Board Offs als geführte Progression in die App bringen:
sechs Stufen (0–5) mit je vier Übungen, klarer Dosierung und einem sichtbaren
Aufstiegskriterium („Gate"). Die App ersetzt damit die heutigen fünf
Board-Off-Stufen, die aus Board-Manipulations-Drills am Klimmzugbalken bestehen,
durch die systematische Kraft-/Kompressions-Progression im Trapez-Hang.

Der Nutzer soll:
- sehen, auf welcher Stufe er steht und was ihn zur nächsten bringt,
- die Stufe als fertige Einheit starten (Typ `BOARD_OFF`, 15–20 min,
  anhängbar an eine Krafteinheit),
- die Sicherheitshinweise zur Aufhängung sehen, bevor er hängt.

## Entschieden

1. **Komplett ersetzen.** Die heutigen fünf Board-Off-Stufen (`boardOffStages`)
   fallen weg. Die neue 6-Stufen-Progression (0–5) ist die einzige Board-Off-
   Struktur. Der Sitz-Drill existiert nur noch als wählbare Übung
   (`bo-seated-board`), nicht als eigener Einstieg. Alte Übungs-IDs bleiben im
   Seed (geloggte Einheiten), verschwinden aber aus allen Stufen.
2. **Interaktive Einstufung.** Beim ersten Öffnen von Board-Off (kein
   `settings.boardOffLevel` gesetzt) ein kurzer Fragebogen (4 körperliche
   Selbsttests + 3 Skill-Fragen + Aufhängungs-Frage) → empfohlene Startstufe,
   gespeichert in `settings.boardOffLevel`. Danach manuell hoch/runter über den
   Picker. Einstufung jederzeit aus `SettingsView` wiederholbar.
3. **Frage + Regression-Swap.** `settings.boardOffHasRig` (Teil der Einstufung,
   in Settings änderbar). Ist keine Aufhängung vorhanden, werden `needsRig`-
   Übungen einer Stufe durch ihre boden-basierte Alternative (`rigFreeAlternative`)
   ersetzt. Jede `needsRig`-Übung **muss** eine Alternative definieren
   (Seed-Test).
4. **Voll inkl. Regression.** „Häufiger Fehler" und „Regression" kommen beide
   in die App: der Fehler als Übungsnotiz (`.exercise-note`), die Regression
   als aufklappbarer Zusatz pro Übung.

## Verhalten

### Einstufung (`BoardOffAssessment`)

Fragebogen beim ersten Board-Off-Aufruf, Reihenfolge:

1. Trapez-Aufhängung vorhanden? (ja/nein) → `boardOffHasRig`
2. **Aktive Kompression**: Langsitz, Beine gestreckt/geschlossen, Fersen ≥ 2
   Finger vom Boden, 3 s? (ja/nein)
3. **Langsitz-Haltung**: 30 s aufrecht ohne Rundrücken? (ja/nein)
4. **Schulterflexion**: Handrücken an der Wand, Rippen unten? (ja/nein, nur
   Hinweis — kein Gate)
5. **Dead Hang** beidhändig: unter 20 s / 20–30 s / über 30 s
6. Sicherer **Tail Grab** im Sprung? (ja/nein)
7. **One Footer** beidseitig? (ja/nein)
8. **Board Off by Fin** auf dem Wasser schon gefahren? (ja/nein)

`recommendBoardOffLevel` (siehe Logik) errechnet daraus 0–5. Ergebnis wird
angezeigt („Empfohlen: Stufe 2 — hier startest du") und beim Bestätigen
gespeichert. Ohne Aufhängung wird zusätzlich der Hinweis gezeigt, dass die
Stufen mit Bodenvarianten laufen.

### Stufen-Picker (ersetzt den heutigen „Board-Off-Stufe"-Screen)

- Liste der Stufen 0–5. Jede Karte zeigt: Nummer, Label („Grab antippen"),
  Skill-Namen (außer Stufe 0) und das **Gate** (Aufstiegskriterium) als
  kurzen Text.
- `settings.boardOffLevel` ist hervorgehoben. Jede Stufe ist frei wählbar
  (manuelles Hoch-/Runterstufen).
- Tippen startet die Einheit dieser Stufe.
- Oben ein fester Sicherheits-Hinweis zur **Tragfähigkeit** der Aufhängung
  (Klemm-Türreckstangen sind nicht geeignet) — nicht wegklickbar.
- Ohne `boardOffHasRig`: Badge „Bodenvariante" an den betroffenen Stufen.

### Einheit (`draft.type === 'BOARD_OFF'`)

- Die vier Übungen der Stufe (nach Rig-Swap) werden als Draft-Entries
  aufgebaut, analog zu `startTemplate` (Satzanzahl + Wdh./Sek.-Vorgabe aus
  der Stufen-Definition). `draft.boardOffLevel` wird gesetzt.
- `startingTarget`/`nextTarget`/Autoregulation greifen **nicht** — Board-Off-
  Übungen sind `reps`/`time`, kein `weight_reps`, kein `incrementKg`.
- Die `boardoff-setup`-Karte zeigt die Setup-/Sicherheitshinweise aus dem
  Trainingsdoc (Höhe, Hängewinkel, Trapez rutscht hoch, Tragfähigkeit).
- Aufklappbar: die Abbruch-Ampel (rot/gelb/grün) aus Abschnitt 6 des Docs.
- Pro Übungskarte: „Häufiger Fehler" als Notiz, „Regression" als
  `<details>`-Zusatz.
- `save()` schreibt `boardOffLevel` in die `Session`.

## Nicht-Ziele

- Keine Wasser-/Trickanleitung, keine Videoanalyse.
- Keine automatische Gate-Erkennung, kein „Stufe geschafft"-Auto-Advance.
- Keine Streaks, keine Punkte fürs Stufen-Aufsteigen.
- Keine Änderung an `sessionLoad` — `BOARD_OFF` bleibt bei 1,0.
- Keine Substitution für Board-Off-Übungen (bleibt wie in
  [exercise-substitution.md](exercise-substitution.md) ausgeschlossen).
- Kein Eingriff in `nextTarget`/`startingTarget`/Autoregulation.
- Die alten Board-Off-Übungs-IDs (`boardoff-seated`, `boardoff-tail-grab`,
  `boardoff-one-footer`, `boardoff-full`, `boardoff-timed`) werden **nicht
  gelöscht** — bereits geloggte Einheiten referenzieren sie.

## Datenmodell und Migration

### Typen (`src/types.ts`)

`BoardOffStage` (und `BoardOffStage.template`) werden entfernt und ersetzt:

```ts
export interface BoardOffSlot {
  exerciseId: string;
  sets: number;
  defaultReps?: number;
  defaultSec?: number;
  mistake: string;                 // "Häufiger Fehler"
  regression: string;              // "Regression"
  needsRig?: boolean;              // [T] — Aufhängung nötig
  rigFreeAlternative?: {           // Pflicht, wenn needsRig — Bodenvariante
    exerciseId: string;
    sets: number;
    defaultReps?: number;
    defaultSec?: number;
    mistake: string;
    regression: string;
  };
}

export interface BoardOffLevel {
  level: number;                   // 0–5
  label: string;                   // "Grab antippen"
  skill: string | null;            // Skill-Name | null (Stufe 0)
  gate: string;                    // Aufstiegskriterium
  slots: BoardOffSlot[];           // genau 4
}
```

Ergänzungen:

```ts
export interface Settings {
  // …
  boardOffLevel?: number;    // aktuelle Stufe, vom Nutzer / der Einstufung gesetzt
  boardOffHasRig?: boolean;  // Trapez-Aufhängung vorhanden
}

export interface Session {
  // …
  boardOffLevel?: number;    // geloggte Stufe (Log-/Wochenansicht)
}
```

`BoardOffAssessment` (Einstufungs-Antworten) lebt in `src/logic/boardoff.ts`,
nicht in `types.ts` (kein persistierter Typ).

### Seed (`src/data/seed.ts`)

- Neue Übungen `bo-*` aus Abschnitt 8 des Trainingsdocs ergänzen
  (`category: 'boardoff'`, `metric`, `perSide`), plus `youtubeQuery` je Übung.
  Zusätzlich `bo-seated-board` (Sitz-Drill) und `bo-wrist-twist`
  (Handgelenks-Drill) aus Abschnitt 7.
- **Jede `metric: 'time'`-Übung braucht ein `timer`-Objekt** — sonst schlägt
  `seed.test.ts` („gives every time exercise a timer mode") fehl. Countdown mit
  `defaultSec` passend zur Stufen-Dosierung; `bo-hang-1arm-assist`,
  `bo-board-hold-1arm` etc. bekommen `mode: 'countdown'`.
- `boardOffStages` → `boardOffLevels: BoardOffLevel[]` (6 Einträge) gemäß
  `BOARDOFF_LEVELS` im Doc, angereichert um `mistake`/`regression`/`needsRig`/
  `rigFreeAlternative` pro Slot.
- Alte `boardoff-*`-Übungen bleiben im `exerciseList`, verschwinden aus den
  Stufen.

### Migration

- Kein Dexie-Versions-Bump: keine neuen Indizes, Übungen werden bei jedem
  `initialize()` per `bulkPut` neu geseedet.
- Neue `Settings`-Felder optional, gemergt über `{ ...defaultSettings, ...settings }`.
- `Session.boardOffLevel` optional; alte Einheiten ohne.
- `BackupData` bleibt Version 1.
- Kein Datenverlust: bereits geloggte Board-Off-Sessions behalten ihre alten
  Übungs-IDs und werden weiter korrekt angezeigt.

## Logik

Neues reines Modul `src/logic/boardoff.ts`:

```ts
export interface BoardOffAssessment {
  hasRig: boolean;
  activeCompression: boolean;   // Test 1
  longSit30s: boolean;          // Test 2
  shoulderFlexion: boolean;     // Test 3 (advisory)
  deadHang: 'under20' | '20to30' | 'over30'; // Test 4
  tailGrab: boolean;
  oneFooter: boolean;
  boardOffByFin: boolean;
}

// Empfohlene Startstufe nach dem Entscheidungsbaum (Abschnitt 3 des Docs).
export function recommendBoardOffLevel(a: BoardOffAssessment): number;

// Slots einer Stufe, mit Bodenvariante wenn keine Aufhängung.
export function boardOffLevelSlots(level: BoardOffLevel, hasRig: boolean): BoardOffSlot[];
```

`recommendBoardOffLevel`:

- `!activeCompression || !longSit30s || deadHang === 'under20'` → `0`
- sonst `boardOffByFin` → `4`
- sonst `oneFooter` → `3`
- sonst `tailGrab` → `2`
- sonst → `1`
- `shoulderFlexion` fließt nicht in die Zahl ein (nur UI-Hinweis).
- Stufe 5 wird nie automatisch empfohlen (parallel zu 4, erst nach Praxis).

`boardOffLevelSlots`: bei `hasRig` unverändert; sonst jeden `needsRig`-Slot
durch seine `rigFreeAlternative` ersetzen (als vollwertiger Slot).

Tests in `src/logic/boardoff.test.ts`.

## UI

- `WorkoutView.tsx`:
  - Board-Off-Aufruf: wenn `settings.boardOffLevel === undefined` →
    Einstufungs-Fragebogen statt Picker. Sonst direkt Picker.
  - `boardOffPicker`-Screen: rendert `boardOffLevels`, Gate-Text,
    Skill-Name, Hervorhebung von `settings.boardOffLevel`, „Bodenvariante"-
    Badge ohne Rig, fester Tragfähigkeits-Hinweis oben.
  - `startBoardOffLevel(level)` baut den Draft aus
    `boardOffLevelSlots(level, hasRig)`, setzt `draft.boardOffLevel`.
    Übungsnotiz = `slot.mistake`; `slot.regression` wandert in
    `draft.boardOffRegressions[exerciseId]`.
  - `save()` schreibt `boardOffLevel` in die `Session`.
  - `boardoff-setup`-Karte: Inhalt aus Abschnitt 4 des Docs,
    Tragfähigkeits-Warnung hervorgehoben; Abbruch-Ampel als `<details>`.
  - `ExerciseEditor`: optionale `regression`-Prop → `<details class="exercise-regression">`.
- `SettingsView.tsx`: Abschnitt „Board-Off" — aktuelle Stufe (0–5, direkt
  wählbar), Toggle „Trapez-Aufhängung vorhanden", Button „Einstufung
  wiederholen".
- `LogView.tsx` / `WeekView.tsx` / `Dashboard.tsx`: Board-Off-Zeile zeigt
  `· Stufe N`, wenn `session.boardOffLevel` gesetzt ist.
- Neues CSS gering; `.stage-card`/`.stage-list`/`.segmented`/`.mobility-card`
  existieren. Fragebogen nutzt `.segmented` bzw. Ja/Nein-Buttons wie
  `RingsLogger`.

## Tests und Abnahmekriterien

### Automatisiert

`src/data/seed.test.ts`:
- `boardOffLevels` hat 6 Einträge, Level 0–5, jeder mit genau 4 Slots und
  nicht-leerem `gate`.
- Jede in einem Slot (inkl. `rigFreeAlternative`) referenzierte Übungs-ID
  existiert im `exerciseList`.
- Jeder `needsRig`-Slot hat eine `rigFreeAlternative`.
- Jede `bo-*`-Übung mit `metric: 'time'` hat ein `timer`.
- Alte `boardoff-*`-IDs sind weiterhin im Seed.

`src/logic/boardoff.test.ts`:
- `recommendBoardOffLevel`: harte Gates (Kompression, Langsitz, Dead Hang
  < 20 s) → 0; Skill-Ketten → 1/2/3/4; `shoulderFlexion` ändert nichts.
- `boardOffLevelSlots`: mit Rig unverändert; ohne Rig sind alle `needsRig`-
  Slots durch ihre Alternative ersetzt, Slot-Anzahl bleibt 4.

### Manuell (mobil, Dev-Server, Basis-URL `/kite-training-app/`)

- Board-Off erstmals öffnen → Einstufungs-Fragebogen; „Kompression nein"
  → Empfehlung Stufe 0.
- Fragebogen mit „Tail Grab ja, One Footer nein" → Empfehlung Stufe 2,
  gespeichert.
- Picker: 6 Stufen mit Gate-Text, Stufe 2 hervorgehoben.
- „Keine Aufhängung" → betroffene Stufen zeigen „Bodenvariante"; Stufe 2
  starten → `needsRig`-Übung ist durch die Bodenvariante ersetzt.
- Stufe 2 starten → 4 Übungen mit Dosierung, „Häufiger Fehler" als Notiz,
  „Regression" aufklappbar, Setup-Karte mit Tragfähigkeits-Warnung + Ampel.
- Einheit speichern → Log zeigt „Board-Off · Stufe 2".
- `SettingsView`: Stufe auf 3 setzen → Picker hebt Stufe 3 hervor;
  „Einstufung wiederholen" öffnet den Fragebogen erneut.
- `reps`/`time`-Übungen: kein Ziel-Badge, keine Autoregulation.
- Alt-Session mit `boardoff-seated` wird im Log weiterhin korrekt angezeigt.
- Offline-Start nach Deploy funktioniert weiterhin.

## Umsetzungsreihenfolge (Vorschlag)

1. Typen + Seed (Übungen, `boardOffLevels`, Timer) + `seed.test.ts`.
2. `src/logic/boardoff.ts` + Tests.
3. `WorkoutView`: Picker auf `boardOffLevels` umstellen, `startBoardOffLevel`,
   Rig-Swap, Regression-UI, Setup-Karte.
4. Einstufungs-Fragebogen.
5. `SettingsView`-Abschnitt.
6. `boardOffLevel` in Session + Log-/Wochen-/Dashboard-Anzeige.

Punkte 1–3 sind das Minimum für „funktioniert"; 4–6 können separat folgen.
