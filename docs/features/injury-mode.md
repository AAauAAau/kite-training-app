# Verletzungs-Modus

Status: Umgesetzt

## Ziel

Wenn eine Körperregion zwickt (Knie, unterer Rücken, Schulter, Rippen …), soll die App die
betroffenen Übungen beim Start eines Templates nicht mehr vorschlagen, sondern automatisch
durch eine gleichwertige, schonende Übung ersetzen — und dort, wo es keinen schonenden
Ersatz gibt, den Slot weglassen. Der Nutzer trainiert weiter, ohne die Einheit jedes Mal
von Hand umzubauen und ohne die gereizte Struktur weiter zu belasten.

Zeitlich begrenzt: Die Schonung hat ein voraussichtliches Ende. Ab dem Ablaufdatum erinnert
das Dashboard daran, wieder voll zu belasten oder die Schonung zu verlängern; die Schonung
bleibt bis dahin wirksam.

Baut direkt auf der [Übungs-Substitution](exercise-substitution.md) auf: gleiches
`pattern`, gleiche Ersatzpool-Übungen, dieselbe Draft-Mechanik. Neu ist nur die
Region-Zuordnung je Übung und die automatische Auswahl beim Start.

## Verhalten

- In den Einstellungen gibt es eine Karte **„Schonung / Verletzung"**. Auswahl einer
  Körperregion plus einer voraussichtlichen Dauer (1, 2 oder 4 Wochen) legt eine aktive
  Schonung an. Mehrere Regionen gleichzeitig sind möglich.
- Eine aktive Schonung wirkt beim Start von **Tag A, Tag B, KB-Circuit und Board-Off**:
  - Jede Slot-Übung, deren belastete Regionen (`strains`) die gesperrte Region enthält,
    wird ersetzt durch die erste schonende Alternative mit gleichem `pattern` — schonend
    heißt: ihr `strains` enthält **keine** gesperrte Region. Reihenfolge wie im
    Substitutions-Sheet (Gerät: Langhantel → … → Ringe, innerhalb alphabetisch).
  - Gibt es keine schonende Alternative, entfällt der Slot. Er taucht in der Einheit
    nicht auf. Board-Off-Übungen haben kein `pattern` und keinen Ersatzpool — dort wird
    ein betroffener Slot immer ausgelassen (drop-only).
  - Slots ohne `strains`-Konflikt bleiben unverändert.
- Oben in der betroffenen Einheit steht ein Hinweis (`alert-card subtle`), der auflistet,
  was angepasst wurde: „Schonung Knie — Front Squat → Beinpresse getauscht, Nordic Curl
  entfällt."
- Ein automatisch getauschter Slot verhält sich wie ein manueller Tausch: `⇄`-Button
  vorhanden, im Sheet steht „Zurück zu <Original>". Der Nutzer kann also pro Übung die
  Originalübung zurückholen (bewusster Override) oder eine andere Alternative wählen.
- Das Substitutions-Sheet selbst wird **nicht** gefiltert. Es zeigt weiterhin alle
  Alternativen zum Muster; die Schonung wirkt nur auf den automatischen Aufbau beim Start.
- Das Dashboard zeigt bei aktiver Schonung einen dezenten Status
  („Schonung aktiv: Knie · noch 9 Tage") und ab dem Ablaufdatum eine Erinnerung
  (`alert-card`): „Schonung Knie ist abgelaufen. Wieder voll belasten oder verlängern?"
  mit „Beenden" und „+2 Wochen". Bis der Nutzer eine der beiden Aktionen wählt, filtert
  die Schonung weiter.
- Rückdatiertes Loggen: Die Prüfung nutzt das im Picker gewählte Einheitsdatum. Eine
  Einheit, die in ein vergangenes Schonungsfenster fällt, wird entsprechend angepasst.
- Kein persistierter Zustand pro Einheit. Beim nächsten Start wird erneut aus
  `settings.injuries` und Datum abgeleitet.

## Nicht-Ziele

- Keine Anpassung für Sprint, Ringe, Mobility, Kite, Padel. Nur A, B, KB, Board-Off.
- Kein medizinischer Anspruch. Die Region-Zuordnung ist eine pauschale Trainings-Heuristik
  („belastet diese Struktur nennenswert"), keine Diagnose und keine Reha-Progression.
- Kein Wiederaufbau-Plan nach der Schonung (kein gestuftes Zurückführen der Last). Nach
  „Beenden" greift wieder die normale Logik inkl. `nextTarget`.
- Keine Reduktion von Gewicht/Wiederholungen für die verbleibenden Übungen. Betroffene
  Übungen werden getauscht oder entfallen — der Rest bleibt unangetastet.
- Keine Änderung an `nextTarget` oder der Progressionshistorie. Eine entfallene Übung
  erzeugt in dieser Einheit einfach keinen neuen Datenpunkt.
- Kein Nachfragen und keine Symptomerfassung. Region + Dauer, mehr nicht.
- Kein automatisches Verlängern. Nach dem Ablaufdatum bleibt die Filterung aktiv, bis der
  Nutzer „Beenden" oder „+2 Wochen" tippt.

## Datenmodell und Migration

`types.ts`:

```ts
export type BodyRegion =
  | 'lower-back' | 'knee' | 'shoulder' | 'elbow-wrist' | 'hip-groin' | 'neck' | 'ribs' | 'ankle';

export interface Injury {
  region: BodyRegion;
  since: string;   // ISO-Datum, Beginn
  until: string;   // ISO-Datum, voraussichtliches Ende (inklusiv)
}

export interface Exercise {
  // …
  strains?: BodyRegion[];   // Regionen unter nennenswerter Last; nur für den Verletzungs-Modus
}

export interface Settings {
  // …
  injuries?: Injury[];
}
```

Migration: keine. `Exercise.strains` wird bei jedem `initialize()` / `restoreBackup()`
neu geseedet. `settings.injuries` ist optional und wird über
`{ ...defaultSettings, ...settings }` gemerged. Kein Dexie-Versions-Bump, `BackupData`
bleibt Version 1.

### Regionen

| Region | Bedeutung (Trainings-Heuristik) | in Auswahl |
| --- | --- | --- |
| `lower-back` | axiale Wirbelsäulenlast oder belastete Flexion/Hinge | ja |
| `knee` | belastete Kniebeugung/-streckung unter Kompression | ja |
| `shoulder` | Überkopf oder belastete glenohumerale Arbeit (Drücken, Ziehen, Hängen) | ja |
| `elbow-wrist` | schwerer Griff, Hängen, Press-Lockout, direkte Handgelenkslast | ja |
| `hip-groin` | Adduktion / tiefe belastete Hüftbeugung (Copenhagen, Windmill) | ja |
| `neck` | belastete Überkopf-Lockout- oder Front-Rack-Position (HWS) | ja |
| `ribs` | belastete Rumpfrotation, Lateralflexion, harte Bauchpresse; **jeder Trapez-Hang** | ja |
| `ankle` | belastete Dorsalflexion / plyometrisch — praktisch nur Sprint | nein (ungenutzt) |

`ankle` bleibt im Typ, hat aber in den erfassten Templates keine Zuordnung und wird in
der Auswahl vorerst nicht angeboten.

### `strains`-Zuordnung · Krafttemplates

| Übung | strains |
| --- | --- |
| trap-bar-deadlift | lower-back |
| bulgarian-split-squat | knee |
| bench-or-ohp | shoulder, elbow-wrist, neck |
| nordic-negative | knee |
| suitcase-carry | elbow-wrist, ribs |
| weighted-pullup | shoulder, elbow-wrist |
| front-squat-or-stepdown | knee, lower-back, neck |
| barbell-row | lower-back, ribs |
| single-leg-rdl | lower-back |
| pallof-press | — |
| copenhagen-plank | hip-groin, ribs |
| back-extension-45 | lower-back |
| bird-dog | — |
| side-plank | ribs |
| kb-swing | lower-back, ribs |
| kb-clean-press | shoulder, elbow-wrist, neck |
| kb-windmill | hip-groin, shoulder, ribs |

### `strains`-Zuordnung · Ersatzpool

| Übung | strains | schonend für |
| --- | --- | --- |
| romanian-deadlift | lower-back | — |
| hip-thrust | — | hinge bei lower-back / ribs |
| kb-deadlift | lower-back | — |
| back-squat | knee, lower-back | squat bei neck |
| goblet-squat | knee | squat bei lower-back / neck |
| leg-press | knee | squat bei lower-back / neck |
| reverse-lunge | knee | — |
| dumbbell-step-up | knee | — |
| pistol-squat | knee | — |
| db-bench-press | shoulder, elbow-wrist | push-h bei neck |
| machine-chest-press | shoulder, elbow-wrist | push-h bei neck |
| weighted-pushup | shoulder, elbow-wrist | push-h bei neck |
| db-shoulder-press | shoulder, elbow-wrist, neck | — |
| push-press | shoulder, elbow-wrist, neck | — |
| pike-pushup | shoulder, elbow-wrist, neck | — |
| pullup | shoulder, elbow-wrist | — |
| lat-pulldown | shoulder | — |
| assisted-pullup | shoulder, elbow-wrist | — |
| seal-row | — | pull-h bei lower-back / ribs |
| db-row | lower-back | — |
| inverted-row | — | pull-h bei lower-back / ribs |
| farmers-carry | elbow-wrist | carry bei ribs |
| front-rack-carry | shoulder, elbow-wrist, ribs | — |
| waiter-carry | shoulder, elbow-wrist, neck | — |
| dead-bug | — | core-anti-rot immer |
| plank-shoulder-tap | — | core-anti-rot immer |
| suitcase-hold | elbow-wrist, ribs | — |
| side-plank-row | ribs | — |
| slider-leg-curl | knee | — |
| machine-leg-curl | knee | — |
| glute-ham-raise | knee, lower-back | — |

Folgen für häufige Fälle:

- **`lower-back`, Tag A:** trap-bar-deadlift → hip-thrust. Rest unverändert.
- **`lower-back`, Tag B:** front-squat → Goblet Squat, barbell-row → Seal Row,
  single-leg-rdl → hip-thrust. back-extension-45 entfällt — hip-thrust ist die einzige
  schonende `hinge`-Alternative und schon vergeben.
- **`knee`, Tag A:** bulgarian-split-squat entfällt (alle `single-leg`-Alternativen
  belasten das Knie), nordic-negative entfällt (alle `hamstring-curl`-Alternativen
  belasten das Knie). Trap-Bar, Bank, Carry bleiben.
- **`ribs`, Tag B:** barbell-row → Seal Row, copenhagen-plank und side-plank entfallen
  (alle `core-anti-lat`-Alternativen belasten die Rippen). Pallof/Bird Dog bleiben.
- **`neck`, KB-Circuit:** kb-clean-press entfällt (alle `push-v` belasten den Nacken),
  kb-swing bleibt, kb-windmill entfällt bereits über die Schulter/Rippen … bzw. bleibt,
  wenn nur `neck` gesperrt ist (kb-windmill hat kein `neck`).

Jede Einheit bleibt trainierbar; im schlimmsten Fall (Knie) fallen zwei Zusatzübungen
weg, die Grundübungen bleiben.

### `strains`-Zuordnung · Board-Off

Board-Off-Übungen (`category: 'boardoff'`) haben kein `pattern`; betroffene Slots werden
immer ausgelassen. Grobzuordnung:

| Gruppe | Übungen | strains |
| --- | --- | --- |
| Trapez-Hang | alle `bo-hang-*`, `bo-board-hold-1arm`, `bo-dead-hang`, `dead-hang`, `boardoff-tail-grab`, `boardoff-one-footer`, `boardoff-full`, `boardoff-timed`, `toes-to-bar` | shoulder, elbow-wrist, ribs |
| Hang + Hüftbeugung | `bo-hang-knee-raise`, `bo-hang-leg-raise`, `bo-hang-leg-raise-1l`, `toes-to-bar` | + lower-back |
| Boden-Kompression | `bo-seated-pike-lift`, `bo-hollow-hold`, `hollow-body-hold`, `bo-vsit-lift`, `bo-jefferson-curl` | lower-back |
| Überkopf | `bo-kb-oh-hold`, `bo-oh-carry`, `bo-deadbug-kb` | shoulder, neck |
| Griff / Handgelenk | `bo-bottoms-up-hold`, `bo-wrist-twist` | elbow-wrist |
| Offset / Anti-Lat | `bo-suitcase-hold` | elbow-wrist, ribs |
| Boden-Drill | `boardoff-seated`, `bo-seated-board` | — |

Damit streicht eine `ribs`- oder `shoulder`-Schonung den kompletten Trapez-Hang-Teil und
lässt nur Bodenarbeit übrig. Das ist gewollt — mit gereizten Rippen oder Schulter gehört
man nicht ins Trapez. Der Hinweis oben macht das transparent; bleiben < 2 Übungen übrig,
zeigt die Einheit zusätzlich „Diese Stufe ist mit der aktuellen Schonung kaum sinnvoll."

## Logik

Neues reines Modul `src/logic/injury.ts`:

```ts
export const INJURY_DURATION_DAYS = [7, 14, 28] as const;
export const injurySessionTypes: Session['type'][] = ['A', 'B', 'KB', 'BOARD_OFF'];

export interface InjuryState {
  blockedRegions: BodyRegion[];   // Regionen aktiver Schonungen (until noch nicht bestätigt beendet)
  expired: Injury[];              // Schonungen mit until < date — Erinnerung fällig, filtern aber weiter
}

// blockedRegions = alle Regionen in settings.injuries; expired = Teilmenge mit until < date.
export function injuryState(settings: Pick<Settings, 'injuries'>, date?: string): InjuryState;

// Belastet die Übung eine gesperrte Region?
export function isContraindicated(exercise: Exercise, blocked: BodyRegion[]): boolean;

// Erste schonende Alternative (gleiches pattern, kein strains-Konflikt, nicht bereits genutzt).
// Reihenfolge über groupByEquipment. null = keine schonende Alternative / kein pattern.
export function injurySafeAlternative(
  exerciseId: string,
  exercises: Exercise[],
  blocked: BodyRegion[],
  usedExerciseIds: string[]
): Exercise | null;

// Baut die Slot-Liste eines Templates/Levels für die aktive Schonung um.
export function applyInjuryToSlots(
  slots: { exerciseId: string }[],
  exercises: Exercise[],
  blocked: BodyRegion[]
): {
  exerciseIds: string[];                  // finale IDs in Reihenfolge, ohne entfallene
  swaps: { from: string; to: string }[];  // für Hinweis + draft.substitutions
  dropped: string[];                      // entfallene Original-IDs, für den Hinweis
};
```

- `injuryState`: gesperrt sind **alle** Regionen aus `settings.injuries` — auch die
  abgelaufenen (siehe [Entschieden](#entschieden) Punkt 1). `expired` steuert nur die
  Dashboard-Erinnerung.
- `isContraindicated`: `exercise.strains?.some((r) => blocked.includes(r)) ?? false`.
- `injurySafeAlternative`: `groupByEquipment(alternativesFor(id, exercises, used))`
  abflachen, erste ohne `isContraindicated`; für Übungen ohne `pattern` sofort `null`.
- `applyInjuryToSlots` iteriert die Slots, hält vergebene IDs nach (kein doppelter
  Ersatz), baut die drei Rückgabelisten. Board-Off-Slots landen mangels Alternative
  immer in `dropped`.
- `nextTarget` / `startingTarget` bleiben unangetastet. Für getauschte Übungen greift der
  bestehende Pfad (letzter geloggter Wert der neuen Übung), identisch zum manuellen Tausch.

## UI

### Einstellungen (`SettingsView`)

Neue Karte, immer sichtbar:

- `eyebrow` „Schonung" · `h2` „Verletzung / gereizte Region"
- Bei aktiven Schonungen: Liste je Region mit Restdauer bzw. „abgelaufen" und Button
  „Beenden".
- Hinzufügen: Segmented-Control der Regionen (Label: „Unterer Rücken", „Knie",
  „Schulter", „Ellenbogen / Handgelenk", „Hüfte / Leiste", „Nacken", „Rippen"), darunter
  Dauer-Auswahl (1 / 2 / 4 Wochen), Button „Schonung starten".
  `since = localDate()`, `until = addDays(since, tage - 1)`. Eine Region, die schon in
  `injuries` steht, wird überschrieben (neue Dauer), nicht dupliziert.
- Hinweistext: „Betroffene Übungen werden in Tag A/B/KB und Board-Off automatisch
  getauscht oder ausgelassen. Kein medizinischer Rat."

Store: `updateSettings({ injuries })` reicht — keine neue Action nötig.

### Dashboard (`Dashboard`)

- Für jede abgelaufene Schonung (`injuryState(settings, today).expired`) eine
  `alert-card`: „Schonung <Region> ist abgelaufen." · Buttons „Beenden" (entfernt die
  `Injury`) und „+2 Wochen" (`until = addDays(today, 14)`). Platzierung neben der
  Deload-Karte.
- Für aktive, noch nicht abgelaufene Schonungen eine `alert-card subtle`:
  „Schonung aktiv: <Regionen> · noch <n> Tage" (kürzeste Restdauer, wenn mehrere).

### Workout (`WorkoutView`)

- `blocked = injuryState(settings, sessionDate).blockedRegions`.
- In `startTemplate` und `startBoardOffLevel`: wenn
  `injurySessionTypes.includes(type) && blocked.length`, vor dem `entries`-Aufbau
  `applyInjuryToSlots(slots, exercises, blocked)` aufrufen.
  - `entries` nur für die zurückgegebenen `exerciseIds` bauen (Board-Off: die vollen
    Slot-Objekte auf diese IDs filtern, damit `mistake`/`regression` erhalten bleiben).
  - `draft.substitutions` mit den `swaps` vorbelegen (`{ [to]: from }`) für den
    „Zurück zu Original"-Flow.
  - neues Draft-Feld `injuryAdjustments?: { swaps: { from: string; to: string }[]; dropped: string[] }`
    für den Hinweis.
- Neuer Hinweis-Block oben in der aktiven Einheit (Markup analog zum
  Wiedereinstiegs-Hinweis), nur wenn `injuryAdjustments` gesetzt: Regionen nennen, dann
  „<Original> → <Ersatz>" je Swap und „<Original> entfällt" je Drop. Bei Board-Off mit
  < 2 verbleibenden Übungen zusätzlich der Satz aus dem Board-Off-Abschnitt.
- Kein neues CSS-Token: `.alert-card`, `.alert-card.subtle`, `.segmented`,
  `.exercise-swap-button` reichen. Ggf. kleine Regel für die Einstellungs-Liste.

## Tests und Abnahmekriterien

### Automatisiert

`src/logic/injury.test.ts`:

- `injuryState`: leere/fehlende `injuries` → `{ blockedRegions: [], expired: [] }`.
- `until >= date` → Region in `blockedRegions`, nicht in `expired`.
- `until < date` → Region **weiterhin** in `blockedRegions` **und** in `expired`.
- `until === date` → aktiv, nicht expired (inklusiv).
- Rückdatiertes `date` vor `since` → Region nicht gesperrt.
- `isContraindicated`: true nur bei Schnittmenge `strains` ∩ `blocked`; Übung ohne
  `strains` → false.
- `injurySafeAlternative`: nur Übungen ohne `strains`-Konflikt, gleiches `pattern`, nie
  die Quelle, nie bereits genutzte; Reihenfolge = Gerätereihenfolge; `null` wenn alle
  Alternativen betroffen sind oder die Quelle kein `pattern` hat.
- `applyInjuryToSlots`:
  - `lower-back` auf Tag-B-Slots → front-squat → goblet-squat, barbell-row → seal-row,
    single-leg-rdl → hip-thrust; `dropped` = `['back-extension-45']`.
  - `knee` auf Tag-A-Slots → `dropped` = `['bulgarian-split-squat', 'nordic-negative']`,
    keine falschen Tausche.
  - `ribs` auf Board-Off Stufe 1 → alle Trapez-Hang-Slots in `dropped`, keine `swaps`.
  - zwei betroffene Slots gleichen Musters bekommen nicht dieselbe Alternative.
  - keine gesperrte Region → Eingabe unverändert (`exerciseIds` = Original, leere
    `swaps`/`dropped`).

`src/data/seed.test.ts` (Ergänzungen):

- Jede Übung in Template A, B, KB und in `boardOffLevels` hat `strains` gesetzt (auch
  `[]` gültig, aber das Feld muss bewusst vorhanden sein).
- Für jede Kombination aus (in A/B/KB genutztes `pattern`) × (Region, die eine
  Template-Übung dieses Musters belastet) ist entweder eine schonende Alternative im Seed
  **oder** der Entfall in einer Snapshot-Liste je Region als akzeptiert vermerkt.

### Manuell (mobil, Basis-URL `/kite-training-app/`)

- Einstellungen → Schonung „Unterer Rücken", 2 Wochen → Tag B starten → Hinweis oben,
  Front Squat als Goblet Squat, Langhantelrudern als Seal Row, Back Extension entfällt,
  `⇄` zeigt „Zurück zu …".
- „Zurück zu Front Squat" holt Originalübung inkl. Ziel-Badge zurück.
- Schonung „Knie" → Tag A starten → Bulgarian Split Squat und Nordic Curl fehlen, Hinweis
  nennt beide als „entfällt".
- Schonung „Rippen" → Board-Off Stufe 1 starten → nur `bo-deadbug-kb` bleibt, Warnsatz sichtbar.
- Einheit speichern, im Log erscheint die tatsächlich trainierte Übung.
- Dashboard: aktiver Status sichtbar; Datum auf einen Tag nach `until` stellen →
  Erinnerungskarte erscheint, Tag B ist weiterhin angepasst (Filter läuft weiter).
- „+2 Wochen" verlängert, „Beenden" entfernt die Schonung und stellt die Einheit normal
  wieder her.
- Offline-Start nach Deploy funktioniert weiterhin.

## Offen

Nichts mehr — Spec bereit zur Umsetzung.

## Entschieden

1. **Nach dem Ablaufdatum bleibt die Filterung aktiv**, bis der Nutzer „Beenden" oder
   „+2 Wochen" wählt. Das Ablaufdatum löst nur die Dashboard-Erinnerung aus. Grund: Ein
   Verletzungs-Feature darf den Schutz nicht stillschweigend entfernen; die Roadmap-Formel
   „Erinnerung zum Reaktivieren" wird als „Erinnerung, eine Entscheidung zu treffen"
   umgesetzt. (Nutzer-Entscheidung offen gelassen → konservative Variante gewählt.)
2. **Geltungsbereich:** A, B, KB **und** Board-Off. Sprint/Ringe/Mobility/Kite/Padel
   bleiben außen vor.
3. **Regionen:** sieben in der Auswahl (unterer Rücken, Knie, Schulter,
   Ellenbogen/Handgelenk, Hüfte/Leiste, Nacken, Rippen); `ankle` nur im Typ.
4. **Dashboard-Aktiv-Indikator:** wird gebaut (`alert-card subtle`).
5. **Board-Off ist drop-only** — keine Pattern-basierten Tausche, betroffene Slots
   entfallen; jeder Trapez-Hang trägt `ribs`.
