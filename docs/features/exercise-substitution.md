# Übungs-Substitution

Status: Umgesetzt

## Ziel

Während einer laufenden Einheit eine einzelne Übung durch eine gleichwertige ersetzen,
wenn das Gerät belegt ist, etwas zwickt, kein Gym verfügbar ist oder schlicht die Lust
auf die Übung fehlt. Ein Feature gegen vier der häufigsten Abbruchgründe.

Heute ist das nur punktuell gelöst („Bankdrücken **oder** Schulterdrücken", „Front Squat /
Box Step-down") und nicht systematisch. Danach hat jede Übung einen definierten Ersatzpool.

## Verhalten

- In `WorkoutView` hat jede Übungskarte einen sichtbaren Tausch-Button (`⇄`).
- Tippen öffnet ein Bottom-Sheet (`.bottom-sheet`, wie `FeelSheet`) mit den Alternativen
  zur selben Bewegungsmuster-Kategorie, gruppiert und mit Geräte-Label (`Langhantel`,
  `Kurzhantel`, `Kettlebell`, `Maschine`, `Körpergewicht`, `Band`).
- Bereits in der Einheit enthaltene Übungen erscheinen nicht in der Liste.
- Auswahl tauscht die Übung **nur im aktuellen Draft**:
  - Satzanzahl bleibt.
  - Wiederholungs-/Sekunden-Vorgabe des Slots bleibt (die Vorgabe gehört zum Slot,
    nicht zur Übung).
  - Gewicht wird auf den letzten geloggten Wert der neuen Übung gesetzt (`lastLoggedSet`),
    sonst leer. `successful` wird zurückgesetzt.
  - Die schriftliche Slot-Notiz entfällt (sie beschreibt die Originalübung).
- Ist eine Übung getauscht, zeigt das Sheet zusätzlich „Zurück zu <Original>".
- Das Template selbst wird nie verändert. Beim nächsten Start steht wieder das Original.
- Persistiert wird ausschließlich das Ergebnis: `Session.entries[i].exerciseId` = neue ID.
- In `SessionEditor` (nachträgliches Loggen) dieselbe Funktion über einen `Übung tauschen`-
  Button pro Übungsblock.

## Nicht-Ziele

- Kein gespeichertes Equipment-Profil und kein Ausfiltern nach „besitze ich" — das ist
  Roadmap-Punkt 1 (Plan-Generator).
- Kein dauerhaftes Merken „ersetze künftig immer X durch Y".
- Keine automatischen Vorschläge. Immer nutzergestartet.
- Keine Substitution für Sprint, Ringe, Board-Off oder Mobility. Nur Krafttemplates A, B, KB.
- Keine Änderung an der Progressionslogik (`nextTarget`).
- Kein Long-Press. Ein sichtbarer Button ist auffindbar, funktioniert am Desktop und ist
  barrierefrei; Long-Press kollidiert auf iOS mit Textauswahl und Kontextmenü.

## Datenmodell und Migration

`Exercise` bekommt zwei optionale Felder:

```ts
export type MovementPattern =
  | 'squat' | 'hinge' | 'single-leg'
  | 'push-h' | 'push-v' | 'pull-h' | 'pull-v'
  | 'carry' | 'core-anti-ext' | 'core-anti-rot' | 'core-anti-lat'
  | 'hamstring-curl';

export type Equipment =
  | 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'bodyweight' | 'band' | 'rings';

export interface Exercise {
  // …
  pattern?: MovementPattern;
  equipment?: Equipment;
}
```

Migration: keine. Übungen werden bei jedem `initialize()` per `db.exercises.bulkPut`
neu geseedet, ebenso nach `restoreBackup()`. Bestehende IndexedDB-Zeilen und alte Backups
erhalten die Felder automatisch. Kein Dexie-Versions-Bump (keine neuen Indizes, Filterung
läuft im Speicher über < 60 Übungen). `BackupData` bleibt Version 1.

### Muster-Zuordnung der bestehenden Template-Übungen

| Übung | Muster | Gerät | Anmerkung |
| --- | --- | --- | --- |
| trap-bar-deadlift | hinge | barbell | |
| bulgarian-split-squat | single-leg | dumbbell | |
| bench-or-ohp | push-h | barbell | primär horizontal |
| nordic-negative | hamstring-curl | bodyweight | eigenes Muster, s. u. |
| suitcase-carry | carry | dumbbell | einseitig, Anti-Lateralflexion |
| weighted-pullup | pull-v | bodyweight | |
| front-squat-or-stepdown | squat | barbell | |
| barbell-row | pull-h | barbell | |
| single-leg-rdl | hinge | dumbbell | einseitiger Hinge, als hinge geführt |
| pallof-press | core-anti-rot | band | |
| copenhagen-plank | core-anti-lat | bodyweight | |
| back-extension-45 | hinge | bodyweight | Endurance-Fokus, `incrementKg: 0` bleibt |
| bird-dog | core-anti-rot | bodyweight | |
| side-plank | core-anti-lat | bodyweight | |
| kb-swing | hinge | kettlebell | explosiv |
| kb-clean-press | push-v | kettlebell | |
| kb-windmill | core-anti-lat | kettlebell | |

Zwei Muster über die Roadmap-Liste hinaus vorgeschlagen:

- **`hamstring-curl`** für den Nordic Curl. Kniebeugung, nicht Hüftstreckung — Ersatz sind
  Leg Curl, Slider Curl, Glute-Ham-Raise, nicht Kreuzheben. Fällt es weg, landet der
  Nordic bei `hinge` und bekommt fachlich unpassende Alternativen.
- **`core-anti-lat`** (Anti-Lateralflexion) für Side Plank, Copenhagen, Windmill.
  Ohne dieses Muster fielen sie mit Pallof/Bird Dog in `core-anti-rot` zusammen, was
  die eigentliche Trainingsabsicht (seitliche Rumpfstabilität, Adduktion) verwässert.

### Ersatzpool

Damit jedes genutzte Muster ≥ 2 Übungen hat, kommen reine Substitutions-Übungen in die
Seed-Liste (`category: 'strength'`, in keinem Template referenziert). **Klein starten:
2–3 pro Muster**, später bei Bedarf erweitern. Vorschlag:

| Muster | Zusätzliche Übungen (ID) |
| --- | --- |
| hinge | romanian-deadlift, hip-thrust, kb-deadlift |
| squat | back-squat, goblet-squat, leg-press |
| single-leg | reverse-lunge, dumbbell-step-up, pistol-squat |
| push-h | db-bench-press, machine-chest-press, weighted-pushup |
| push-v | db-shoulder-press, push-press, pike-pushup |
| pull-v | pullup, lat-pulldown, assisted-pullup |
| pull-h | seal-row, db-row, inverted-row |
| carry | farmers-carry, front-rack-carry, waiter-carry |
| core-anti-rot | dead-bug, plank-shoulder-tap |
| core-anti-lat | suitcase-hold, side-plank-row |
| hamstring-curl | slider-leg-curl, machine-leg-curl, glute-ham-raise |

`single-leg-rdl` zählt als `hinge`; das `single-leg`-Muster kommt allein aus dem Ersatzpool
plus `bulgarian-split-squat`.

**Testanpassung:** `seed.test.ts` prüft aktuell explizit
`exercises.some(e => e.id === 'farmers-carry') === false` (Rest der Entscheidung, die
bilaterale Carry aus den Templates zu nehmen). Die Farmer's Carry darf als reine
Substitutions-Option wieder in den Seed — diese Assertion wird entfernt. Die
Template-Zeile bleibt: Tag A führt weiterhin `suitcase-carry`, nicht `farmers-carry`.

## Logik

Neues reines Modul `src/logic/substitution.ts`:

```ts
export function alternativesFor(exerciseId: string, exercises: Exercise[]): Exercise[];
// gleiche pattern, ohne die Quelle selbst, alphabetisch (locale 'de')

export function groupByEquipment(exercises: Exercise[]): { equipment: Equipment; items: Exercise[] }[];
// stabile Reihenfolge: barbell, dumbbell, kettlebell, machine, bodyweight, band, rings
```

Der Tausch selbst (Draft-Manipulation, Satz-Neuaufbau) lebt in `WorkoutView` bzw.
`SessionEditor`, analog zum bestehenden `updateSet`. Kein neuer Store-State.

Draft-Erweiterung in `WorkoutView`:

```ts
type Draft = {
  // …
  substitutions?: Record<string, string>; // aktuelleId -> OriginalId, nur für „zurück"
};
```

## UI

- `ExerciseEditor` (`WorkoutView`): Tausch-Button `⇄` rechts im `.exercise-header`,
  neben/unter dem `Ziel`-Badge. `aria-label="Übung ersetzen"`.
- Neues `SubstitutionSheet`-Component (`.sheet-backdrop` + `.bottom-sheet`):
  Titel „<Übungsname> ersetzen", darunter Gruppen je Gerät, je Eintrag Name + Muster
  ist implizit. Fußzeile „Abbrechen"; bei bereits getauschter Übung zusätzlich
  „Zurück zu <Original>".
- `SessionEditor`: `Übung tauschen`-Button unter der Satzliste jedes `session-edit-exercise`.
  Vereinfachte Variante ohne History-Lookup — beim Tausch werden `kg` und `successful`
  jedes Satzes geleert, Satzanzahl und Wdh./Sek. bleiben. Das „Zurück zu"-Original wird
  nur im Editor-State gehalten (kein `Session`-Feld).
- Kein neues Farb-/Typo-Token nötig; vorhandene `.bottom-sheet`- und `.icon-button`-Styles
  reichen, plus eine kleine `.exercise-swap-button`-Regel in `styles.css`.

## Tests und Abnahmekriterien

### Automatisiert

`src/logic/substitution.test.ts`:

- `alternativesFor` liefert nur Übungen mit gleichem `pattern`, nie die Quelle selbst.
- Unbekannte ID oder Übung ohne `pattern` → `[]`.
- Ergebnis alphabetisch sortiert.
- `groupByEquipment` in fester Gerätereihenfolge, leere Gruppen entfallen.

`src/data/seed.test.ts` (Ergänzungen):

- Jede Übung in Template A, B und KB hat ein `pattern`.
- Jede `strength`-Übung hat ein `equipment`.
- Jedes in einem Template genutzte `pattern` hat ≥ 2 Übungen im Seed
  (Substitution ist nie leer).
- Die alte `farmers-carry`-Verbotsassertion ist entfernt; `farmers-carry` hat `pattern: 'carry'`.
- Tag A referenziert weiterhin `suitcase-carry`, nicht `farmers-carry`.

### Manuell (mobil)

- Tag B starten → `⇄` bei „Front Squat / Box Step-down" → Alternative „Goblet Squat" →
  Satzanzahl und Wdh.-Vorgabe bleiben, kg leer, Slot-Notiz weg.
- Alternative loggen, Einheit speichern, im Log erscheint „Goblet Squat".
- Erneut Tag B starten → wieder „Front Squat / Box Step-down".
- „Zurück zu Front Squat" stellt Übung und Notiz wieder her.
- Übung, die schon in der Einheit ist, taucht nicht in der Liste auf.
- Offline-Start nach Deploy funktioniert weiterhin.

## Entschieden

1. **Trigger:** sichtbarer `⇄`-Button, kein Long-Press.
2. **Zusatzmuster:** `hamstring-curl` und `core-anti-lat` werden beide übernommen.
3. **`single-leg-rdl`:** wird als `hinge` geführt.
4. **Ersatzpool:** klein starten mit 2–3 Übungen pro Muster, später erweitern.
