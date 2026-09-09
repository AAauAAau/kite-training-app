# Plan-Generator

Status: In Umsetzung (Logik + UI gebaut, uncommitted auf `i18n-de-en-fr`, Stand 2026-09-09)

## Ziel

Die App kennt heute genau einen Nutzer: die Templates Tag A / Tag B / KB-Circuit in
`src/data/seed.ts` sind fest auf sein Gym, seine Frequenz und seine Disziplin
(Big Air) zugeschnitten. Der Plan-Generator ersetzt diese festen Krafttemplates
durch **aus vier Antworten deterministisch erzeugte** Templates — gleiche Logik,
andere Eingaben, kein zusätzlicher Code pro Nutzer.

Beim ersten Start beantwortet der Nutzer vier Fragen (Equipment, Tage pro Woche,
Disziplin, gelenkschonende Übungsauswahl ja/nein). Daraus baut ein Regelsystem die
Kraft-Templates: Bewegungsmuster-Skelett steht fest, die konkrete Übung ergibt sich
aus dem Equipment, die Betonung aus der Disziplin, die Übungsauswahl-Reihenfolge aus
dem Gelenkschon-Schalter. Der **Saison-Modus** (Roadmap-Punkt 5) geht hier auf:
Aufbau- vs. Erhaltungsvolumen wird automatisch aus der geloggten Kite-Frequenz
abgeleitet, ohne zusätzliche Eingabe.

Kein Backend, keine Netzwerkanfrage, kein Modell. Deterministisch, testbar,
offline. Ohne beantwortete Fragen bleibt alles exakt wie heute.

Baut auf der [Übungs-Substitution](exercise-substitution.md) auf (`pattern`,
`equipment`, Gerätereihenfolge, Ersatzpool) und dem
[Verletzungs-Modus](injury-mode.md) (`strains`, Filterung beim Start). Der
Generator erzeugt nur die Slot-Liste; Substitution, Autoregulation, Wiedereinstieg
und Verletzungs-Filter greifen danach unverändert.

## Verhalten

### Onboarding (erster Start)

- Wird von `App.tsx` angezeigt, wenn `ready && !settings.trainingProfile && sessions.length === 0`.
  Ein bestehender Nutzer mit Daten aber ohne Profil bekommt **kein** erzwungenes
  Onboarding — er startet weiter auf den Seed-Templates und legt ein Profil bei
  Bedarf über die Einstellungen an (siehe [Entschieden](#entschieden) Punkt 1).
- Vier Schritte, je ein `.segmented`-Control, „Zurück" / „Weiter", am Ende
  „Plan erstellen":
  1. **Equipment:** Gym · Nur Kettlebell · Nur Ringe · Nichts
  2. **Tage pro Woche:** 1 · 2 · 3 · 4
  3. **Disziplin:** Big Air · Freestyle · Wave · Foil · Wing
  4. **Gelenkschonende Übungen:** ein Schalter „Gelenkschonende Standardübungen
     bevorzugen? (Trap-Bar, Goblet, Maschinen, assistierte Klimmzüge)". Kein
     Altersfeld — der Nutzer entscheidet direkt (siehe [Entschieden](#entschieden) Punkt 4).
- „Plan erstellen" schreibt `settings.trainingProfile` und wirkt sofort (Store-Rerender,
  kein Reload).
- „Überspringen"-Link auf jedem Schritt: kein Profil, die App startet auf den
  Seed-Templates wie bisher. Das Onboarding erscheint danach nicht erneut
  (es wird ein `trainingProfile: { skipped: true }`-Sentinel gesetzt — siehe Datenmodell).

### Was der Generator erzeugt

- Der Generator ersetzt **nur** die Krafttemplates (`type` `A`, `B`, `KB`). Sprint,
  Ringe-Circuit, Board-Off, Mobility, Padel, „Sonstiges" bleiben unangetastet.
- Pro Trainingstag steht ein festes **Muster-Skelett** (`hinge`, `squat`,
  `push-h` …). Für jeden Slot wählt der Generator die konkrete Übung aus einer
  geordneten Präferenzliste je Muster, gefiltert nach:
  - **Equipment-Stufe** — welche `Exercise.equipment`-Werte erlaubt sind.
  - **Gelenkschon-Schalter** — bei `preferGentle` wird die gelenkschonendere Variante
    nach vorn sortiert (Trap-Bar statt Langhantel-Kreuzheben, Goblet/Beinpresse statt
    Front Squat, Kurzhantel statt Langhantel drücken, assistierter statt
    Zusatzgewicht-Klimmzug).
  - Bereits im selben Template vergebene Übungen fallen raus (kein Doppel-Slot).
- Die **Disziplin** verschiebt Betonung und Wiederholungsprofil:

  | Disziplin | Betonte Muster (Extra-Slot / Priorität) | Wdh.-Profil | Tempo |
  | --- | --- | --- | --- |
  | Big Air | `hinge`, `single-leg`, `hamstring-curl` | Kraft (3–5) | exzentrisch betont auf Single-Leg / Curl / Squat |
  | Freestyle | `single-leg`, `squat`, `core-anti-rot` | Power (3–6, explosiv) | explosiv (Pop) auf Squat / Single-Leg |
  | Wave | `pull-v`, `push-v`, `core-anti-lat` | Ausdauer (10–15) | zügig |
  | Foil | `squat` (iso), `core-anti-ext` | isometrisch | Zeit-Slots statt Wiederholungen wo möglich |
  | Wing | `carry`, `pull-h`, `push-v` | Ausdauer (10–15) | zügig |

- Die **Saison** skaliert das Volumen (siehe unten): `build` = volle Sätze,
  `maintain` = pro Grundübung ein Satz weniger und der jeweils letzte Zusatz-Slot
  entfällt.
- Generierte Templates werden **nie persistiert**. Sie werden bei jedem Rendern aus
  `settings.trainingProfile` + `sessions` + Seed-Übungen neu abgeleitet — genau wie
  `schedule()` oder die Verletzungs-Anpassung. Eine geloggte Einheit speichert reale
  Übungs-IDs; `nextTarget` / Verlauf funktionieren über einen Profilwechsel hinweg
  identisch zum manuellen Übungstausch.

### Saison-Modus (aus Kite-Frequenz)

- `seasonMode(sessions, date)` betrachtet ein **14-Tage-Fenster** (`SEASON_WINDOW_DAYS`)
  und zählt darin jeden `type: 'KITE'`-Tag (Intensität egal).
- **Hysterese** — der Modus schaltet nicht bei einem einzelnen Wert um, sondern hat
  zwei Schwellen:
  - `build → maintain`, sobald **≥ `SEASON_MAINTAIN_ENTER`** (Vorschlag 4) Kite-Tage
    im Fenster liegen.
  - `maintain → build`, erst wenn **≤ `SEASON_MAINTAIN_EXIT`** (Vorschlag 1) Kite-Tage
    im Fenster liegen.
  - Dazwischen bleibt der zuletzt aktive Modus. Das verhindert wöchentliches
    Hin-und-Her bei Frequenz um die Schwelle.
- Da die Hysterese einen „vorherigen Modus" braucht, ist `seasonMode` **rein aber
  iterativ**: es läuft von der ersten geloggten Kite-Einheit (Startmodus `build`)
  tageweise bis `date` und wendet die Schwellen an. Kein persistierter Zustand —
  deterministisch und testbar wie `schedule()` / `sprintWeek()`.
- Ohne Kite-Historie (erster Start, Winter) → `'build'`.
- Datumsabhängig wie die Deload- und Verletzungslogik: rückdatiertes Loggen nutzt
  das im Picker gewählte Einheitsdatum.
- **Abschaltbar** — unter „Mehr" → Trainingsplan-Karte ein Schalter
  „Saison-Anpassung automatisch". Aus → der Generator nutzt immer `build`-Volumen.
  Der Schalter zeigt beim Ausschalten eine Warnung: „Ohne Saison-Anpassung
  trainierst du auch in der Kite-Hochsaison mit vollem Kraftvolumen. Bei vielen
  Kite-Tagen kann das zu viel werden." Bestätigen nötig.
- Kein „Saison erkannt"-Popup. Der aktive Modus steht klein in der
  Trainingsplan-Karte und als Hinweiszeile oben in der Einheit
  („Erhaltungsmodus: weniger Volumen, du kitest gerade viel.").

### Was gleich bleibt

- `schedule()` (Wochenplanung, Gym-Tage, Sprint-/Circuit-Tag) unverändert. Der
  Generator liefert Templates, nicht den Wochenkalender. `settings.gymDays` bleibt
  die Quelle der Kraft-Tage; `daysPerWeek` steuert nur, **wie viele** Templates
  erzeugt werden und wie voll sie sind.
- `nextTarget` / `startingTarget` / Autoregulation besitzen weiter das Gewicht. Der
  Generator gibt Sätze, Wiederholungen und Tempo-Notizen vor, nie Kilogramm.
- Sprint-Progression, Board-Off-Progression, Mobility-Checklisten unverändert.

## Nicht-Ziele

- **Kein LLM, kein Netzwerk, kein Modell.** Reines Regelsystem (Roadmap: „bewusst
  nicht bauen").
- Keine Änderung an `schedule()`, an der Sprint- oder Board-Off-Logik, an den
  Mobility-Checklisten.
- Keine Gewichtsvorgabe durch den Generator. Kilogramm bleibt bei
  `nextTarget`/`startingTarget`/Autoregulation.
- Keine Periodisierung, keine Trainingsblöcke, keine Woche-zu-Woche-Progression über
  das hinaus, was `nextTarget` + Autoregulation ohnehin leisten.
- Keine weiteren Disziplinen als die fünf, keine Misch-Disziplin, kein
  Gewichten mehrerer Disziplinen.
- Kein Generieren von Ringe-, Sprint-, Padel-, Mobility- oder Board-Off-Einheiten.
- Kein automatisches Anlegen von `settings.injuries` aus dem Gelenkschon-Schalter —
  er beeinflusst nur die Übungsauswahl-Reihenfolge, nicht den Verletzungs-Modus
  (siehe [Entschieden](#entschieden) Punkt 4).
- Kein Altersfeld, keine Alters-Heuristik. Der Nutzer wählt die gelenkschonende
  Auswahl direkt oder nicht.
- Keine medizinische Aussage.
- Keine sprachabhängigen Inhalte — die Dosierung ist in jeder Sprache gleich, nur
  die neuen UI-Strings kommen in den i18n-Katalog.

## Datenmodell und Migration

### Typen (`src/types.ts`)

```ts
export type EquipmentAccess = 'gym' | 'kettlebell' | 'rings' | 'none';
export type KiteDiscipline = 'big-air' | 'freestyle' | 'wave' | 'foil' | 'wing';
export type SeasonMode = 'build' | 'maintain';

export interface TrainingProfile {
  skipped?: boolean;            // Onboarding bewusst übersprungen → Seed-Templates, nicht erneut fragen
  equipment: EquipmentAccess;
  daysPerWeek: 1 | 2 | 3 | 4;
  discipline: KiteDiscipline;
  preferGentle?: boolean;       // gelenkschonende Übungsauswahl (GENTLE_FIRST-Reihenfolge)
  seasonAdjust?: boolean;       // default (undefined) = an; false = immer build-Volumen
  createdAt: number;
}

export interface Settings {
  // …
  trainingProfile?: TrainingProfile;
  planNudgeDismissed?: boolean;   // Dashboard-Hinweis „Plan einrichten" weggeklickt
}
```

Bei `skipped: true` sind die übrigen Felder ohne Bedeutung; nur `equipment`,
`daysPerWeek`, `discipline` sind bei einem echten Profil Pflicht. `seasonAdjust`
fehlt → Saison-Anpassung aktiv.

### Migration

- Kein Dexie-Versions-Bump (kein Index, keine Struktur).
- `settings.trainingProfile` und `settings.planNudgeDismissed` optional, gemergt über
  `{ ...defaultSettings, ...settings }` und durch `migrateSettings()` (dort nur
  durchgereicht, kein Umbau nötig).
- `defaultSettings.trainingProfile` bleibt **ungesetzt** → ein bestehendes Profil ohne
  das Feld verhält sich exakt wie heute (Seed-Templates).
- `BackupData` bleibt Version 1. Ein altes Backup ohne `trainingProfile` → Seed-Templates.
  Ein neues Backup mit `trainingProfile`, in eine ältere App-Version importiert →
  unbekanntes Feld, ignoriert, kein Fehler.
- Generierte Templates berühren weder DB noch Seed. Ein Profilwechsel ändert nur, was
  beim nächsten Rendern der Workout-Übersicht angezeigt wird.

### Übungspool-Ergänzungen (`src/data/seed.ts`)

Damit jedes Muster auf **jeder** Equipment-Stufe auflöst, braucht der Seed neue
Körpergewicht-/Band-Übungen, einen `core-anti-ext`-Eintrag und getaggte
Ringe-Übungen. Klein starten, analog zum Substitutions-Ersatzpool
(`category: 'strength'`, in keinem festen Template referenziert):

**Neue Übungen**

| Muster | Lücke | Vorschlag (neue IDs) |
| --- | --- | --- |
| `squat` | kein Körpergewicht-Squat, keine Iso-Variante (Foil) | `bodyweight-squat` (bw), `wall-sit` (bw, `metric: 'time'`) |
| `hinge` | dünn ohne Langhantel/Kurzhantel | `bodyweight-single-leg-rdl` (bw), `band-good-morning` (band) |
| `carry` | alles Kurzhantel/Kettlebell | `backpack-carry` (bw) — beladener Rucksack, `metric: 'distance'` |
| `core-anti-ext` | **kein** Seed-Eintrag mit diesem Muster | `ab-wheel` (bw), `hollow-body-hold-strength` (bw, `metric: 'time'`) |

**Ringe-Übungen nachrüsten** (bestehende Einträge, `equipment: 'rings'` + `pattern`):

| ID | Muster |
| --- | --- |
| `ring-pullup` | `pull-v` |
| `ring-dips` | `push-v` |
| `ring-rollout` | `core-anti-ext` |
| `front-lever` | `core-anti-ext` (Alternative) |
| neu `ring-row` | `pull-h` |
| neu `ring-pushup` | `push-h` |
| neu `ring-bulgarian` / `ring-split-squat` | `single-leg` |
| neu `ring-hamstring-curl` | `hamstring-curl` |
| neu `ring-fallout` | `core-anti-rot` |

`hinge`, `squat`, `carry`, `core-anti-lat` auf der `rings`-Stufe laufen über die
Körpergewicht-/Band-Einträge (Ringe bieten hier keine sinnvolle Variante) — das
ist der Normalfall, kein Ausfall.

Alle neuen Übungen bekommen `pattern`, `equipment`, `strains` (Verletzungs-Modus)
und `youtubeQuery`, wie die bestehenden. Ein `seed.test.ts`-Test sichert die
Abdeckung für alle vier Stufen (siehe unten).

## Logik

Neues reines Modul `src/logic/planGenerator.ts`:

```ts
import type { Exercise, SeasonMode, SessionTemplate, Session, TrainingProfile } from '../types';

export const SEASON_WINDOW_DAYS = 14;
export const SEASON_MAINTAIN_ENTER = 4;   // build → maintain ab so vielen Kite-Tagen im Fenster
export const SEASON_MAINTAIN_EXIT = 1;    // maintain → build erst bei so wenigen

// Iterativ von der ersten Kite-Einheit (Startmodus 'build') bis `date`, mit Hysterese.
// Jeder Kite-Tag zählt. Rein und deterministisch, kein persistierter Zustand.
export function seasonMode(sessions: Session[], date?: string): SeasonMode;

// preferGentle-Schalter des Profils. Einzeiler, aber als Funktion gekapselt für die Tests.
export function gentleBias(profile: TrainingProfile): boolean;

// Deterministische Krafttemplates. Gleiche Eingabe -> tief-gleiche Ausgabe.
export function generateTemplates(
  profile: TrainingProfile,
  season: SeasonMode,
  exercises: Exercise[]
): SessionTemplate[];

// Bindeglied für die UI: Profil vorhanden und nicht skipped -> generieren, sonst Seed.
// Saison: profile.seasonAdjust === false -> immer 'build', sonst seasonMode(sessions, date).
export function activeTemplates(
  settings: Pick<Settings, 'trainingProfile'>,
  sessions: Session[],
  exercises: Exercise[],
  date?: string
): SessionTemplate[];
```

### Skelett je `daysPerWeek`

`DaySkeleton = { type: 'A' | 'B' | 'KB'; titleKey: string; slots: PatternSlot[] }`
mit `PatternSlot = { pattern: MovementPattern; role: 'primary' | 'accessory'; sets: number; reps?: number; sec?: number }`.

- **1 Tag** — ein Ganzkörper-Template (`type: 'A'`):
  `hinge` P · `squat` P · `push-h` P · `pull-v` P · `single-leg` A · `core-anti-rot` A
- **2 Tage** — reproduziert grob die heutigen Tag A / Tag B:
  - A „Push / Beine": `hinge` P · `single-leg` A · `push-h` P · `hamstring-curl` A · `carry` A
  - B „Zug / Landung": `pull-v` P · `squat` P · `pull-h` A · `hinge` A (einseitig) · `core-anti-rot` A · `core-anti-lat` A
- **3 Tage** — A + B + Circuit:
  - C „Circuit": `hinge` (explosiv) · `push-v` · `core-anti-lat`.
    `type: 'KB'` bei Equipment `kettlebell`/`gym`, sonst dasselbe Skelett über die
    für die Stufe erlaubten Übungen (`rings` → Ring-Varianten, `none` → Körpergewicht).
    Der bestehende Ringe-Circuit bleibt als separate Aktivität wählbar (unverändert,
    nicht generiert).
- **4 Tage** — A + B + C + D:
  - D „Oberkörper / Grip": `push-h` A · `pull-h` A · `carry` A · `core-anti-rot` A

Die **Disziplin** fügt den Primärtagen (A/B) genau einen Zusatz-Slot ihres ersten
betonten Musters hinzu (`role: 'accessory'`), sofern nicht schon vorhanden, und
setzt das Wdh.-/Tempo-Profil aller Slots. **Foil** ersetzt zusätzlich den
`squat`-Primär-Slot durch eine Iso-Variante (`wall-sit`), wenn im Pool vorhanden.

### Übungsauswahl je Muster

```ts
// Standard-Präferenz (kräftigste / gängigste Variante zuerst).
const PATTERN_POOL: Record<MovementPattern, string[]>;
// Umsortierung bei preferGentle: gelenkschonende IDs nach vorn.
const GENTLE_FIRST: Partial<Record<MovementPattern, string[]>>;
```

`PATTERN_POOL` (aus dem bestehenden Seed + Ergänzungen):

| Muster | Reihenfolge (Gerätereihenfolge: barbell → … → bodyweight → band → rings) |
| --- | --- |
| `hinge` | trap-bar-deadlift, romanian-deadlift, kb-swing, kb-deadlift, single-leg-rdl, hip-thrust, back-extension-45, bodyweight-single-leg-rdl, band-good-morning |
| `squat` | front-squat-or-stepdown, back-squat, goblet-squat, leg-press, bodyweight-squat, wall-sit |
| `single-leg` | bulgarian-split-squat, reverse-lunge, dumbbell-step-up, pistol-squat, ring-split-squat |
| `push-h` | bench-or-ohp, db-bench-press, machine-chest-press, weighted-pushup, ring-pushup |
| `push-v` | push-press, kb-clean-press, db-shoulder-press, pike-pushup, ring-dips |
| `pull-v` | weighted-pullup, pullup, lat-pulldown, assisted-pullup, ring-pullup |
| `pull-h` | barbell-row, seal-row, db-row, inverted-row, ring-row |
| `carry` | suitcase-carry, farmers-carry, front-rack-carry, waiter-carry, backpack-carry |
| `core-anti-rot` | pallof-press, bird-dog, dead-bug, plank-shoulder-tap, ring-fallout |
| `core-anti-lat` | copenhagen-plank, side-plank, suitcase-hold, side-plank-row, kb-windmill |
| `core-anti-ext` | ab-wheel, hollow-body-hold-strength, ring-rollout, front-lever |
| `hamstring-curl` | nordic-negative, machine-leg-curl, slider-leg-curl, glute-ham-raise, ring-hamstring-curl |

`GENTLE_FIRST` (nur bei `preferGentle`, Rest der Reihenfolge bleibt):

| Muster | nach vorn |
| --- | --- |
| `squat` | goblet-squat, leg-press, back-squat |
| `hinge` | trap-bar-deadlift, kb-deadlift, hip-thrust |
| `single-leg` | dumbbell-step-up, reverse-lunge |
| `push-h` | db-bench-press, machine-chest-press |
| `push-v` | db-shoulder-press, kb-clean-press |
| `pull-v` | assisted-pullup, lat-pulldown |
| `hamstring-curl` | machine-leg-curl, slider-leg-curl |

### Equipment-Stufen

| Stufe | erlaubte `Exercise.equipment` |
| --- | --- |
| `gym` | alle sieben |
| `kettlebell` | kettlebell, bodyweight, band |
| `rings` | rings, bodyweight, band |
| `none` | bodyweight, band |

Alle vier Stufen werden zum Start voll unterstützt (siehe
[Entschieden](#entschieden) Punkt 7). Das setzt zwei Seed-Erweiterungen voraus:
die Körpergewicht-/Band-Übungen aus der Pool-Tabelle **und** das Nachrüsten der
bestehenden Ringe-Übungen mit `pattern`/`equipment: 'rings'` plus einiger neuer
Ring-Varianten, damit jedes Muster auf der `rings`-Stufe auflöst (Details unten).

`resolveSlot(pattern, allowedEquipment, preferGentle, usedIds, exercises)`:
Präferenzliste (ggf. `GENTLE_FIRST`-umsortiert) → erste Übung, deren `equipment`
erlaubt ist und die nicht in `usedIds` steht. Nichts gefunden → Slot entfällt
(`dropped`-Liste, in der Übersicht als dezente Zeile „Slot ohne passendes Gerät
ausgelassen"). Die Abdeckungstests sichern, dass **alle vier Stufen** keinen
Primär-Slot verlieren; verbleibende Accessory-Ausfälle (z. B. `carry` auf `none`)
stehen in einer Snapshot-Allowlist je Stufe.

### Volumen je Saison

- `build`: Sätze wie im Skelett.
- `maintain`: jede `role: 'primary'`-Übung ein Satz weniger (min. 2); der letzte
  `role: 'accessory'`-Slot je Tag entfällt.

### Titel / Untertitel

`generateTemplates` setzt `title`/`subtitle` auf i18n-Keys-aufgelöste Strings ist
**nicht** möglich (reines Modul ohne `lang`). Stattdessen liefert der Generator
`title`/`subtitle` als deutschen Fallback; die Workout-Übersicht baut den
Anzeigetitel aus `t('plan.title.<type>')` und `t('plan.subtitle.<discipline>', { load })`.
Generierte Templates durchlaufen **nicht** `localizeTemplate` (kein
Content-Katalog je `type`); die Übungsnamen lokalisieren weiter über
`localizeExercise`, Notizen kommen aus `t('plan.note.*')`-Keys.

### Store

- `initialize()` / `restoreBackup()`: unverändert. `trainingProfile` kommt über
  `readAll()` → `migrateSettings()` mit.
- `updateSettings({ trainingProfile })` reicht — keine neue Action.

## UI

### Onboarding (`src/components/Onboarding.tsx`, neu)

- Vier `.segmented`-Schritte wie oben, Fortschritt als `n / 4`. `App.tsx` rendert die
  Komponente statt der Haupt-Shell, solange `ready && !settings.trainingProfile && !sessions.length`.
- „Plan erstellen" → `updateSettings({ trainingProfile: { equipment, daysPerWeek, discipline, preferGentle, createdAt: Date.now() } })`.
- „Überspringen" → `updateSettings({ trainingProfile: { skipped: true, createdAt: Date.now() } })`.
- Kein neues CSS-Token: `.segmented`, `.page`, `.card`, `.text-button` reichen.

### Einstellungen (`SettingsView`)

Neue Karte „Trainingsplan", immer sichtbar:

- Ohne Profil / `skipped`: Kurzhinweis „Standardplan (Tag A / Tag B / Circuit)" +
  Button „Plan einrichten" → öffnet den Onboarding-Flow (gleiche Komponente,
  eingebettet).
- Mit Profil: Zusammenfassung („Gym · 3 Tage · Big Air · gelenkschonend · Aufbaumodus")
  + „Anpassen" (Flow vorbelegt) + „Auf Standardplan zurücksetzen"
  (`updateSettings({ trainingProfile: undefined })` bzw. `{ skipped: true }`).
- Der aktive `seasonMode` wird hier angezeigt (abgeleitet, nicht editierbar).
- Schalter **„Saison-Anpassung automatisch"** (`profile.seasonAdjust`, default an).
  Ausschalten öffnet eine Bestätigung (`.sheet-backdrop` / `confirm`-Stil) mit dem
  Warntext; erst nach „Trotzdem ausschalten" wird `seasonAdjust: false` geschrieben.
  Wieder einschalten ohne Rückfrage. Nur sichtbar, wenn ein Profil existiert.

### Dashboard (`Dashboard`)

- Einmaliger Hinweis für Bestandsnutzer: `alert-card` neben der Deload-Karte, wenn
  `!settings.trainingProfile && sessions.length > 0 && !settings.planNudgeDismissed`.
  Text „Neu: Trainingsplan aus deinen Angaben — Equipment, Tage, Disziplin." Buttons
  „Einrichten" (öffnet den Onboarding-Flow) und „Später"
  (`updateSettings({ planNudgeDismissed: true })`).
- Sobald ein Profil gesetzt **oder** der Hinweis weggeklickt ist, erscheint er nie
  wieder. Bei leerer DB (echter Erststart) greift stattdessen das Voll-Onboarding,
  der Hinweis erscheint dort gar nicht.
- Bei aktivem Profil zeigt das Dashboard klein den `seasonMode`
  („Erhaltungsmodus aktiv") — nur als Status, keine Aktion.

### Workout (`WorkoutView`)

- `templates`-Import ersetzt durch
  `const activePlan = useMemo(() => activeTemplates(settings, sessions, exercises, sessionDate), [...])`.
- Template-Liste, aktive-Einheit-Lookup (`activePlan.find((t) => t.type === draft.type)`)
  und `startTemplate` lesen aus `activePlan`.
- Anzeigetitel/-untertitel generierter Templates über `t('plan.*')` statt
  `localizeTemplate`.
- Hinweiszeile oben in der Einheit bei `seasonMode === 'maintain'` (`alert-card subtle`):
  „Erhaltungsmodus — weniger Volumen, du kitest gerade viel."
- `dropped`-Slots: dezente Zeile unter der Übungsliste in der Übersicht.

### `src/i18n/de.ts`

Neue Key-Gruppe `plan.*` (Titel, Untertitel je Disziplin, Notizen, Saison-Hinweis,
Saison-Abschalt-Warnung, Dashboard-Hinweis, Onboarding-Fragen und -Optionen,
Settings-Karte). `en.ts` / `fr.ts` bleiben
vorerst Stubs — konsistent mit dem aktuellen i18n-Stand (Übersetzungs-Phasen 5–7
noch offen); die Vollständigkeitstests bleiben `describe.todo`.

## Tests und Abnahmekriterien

### Automatisiert

`src/logic/planGenerator.test.ts`:

- **`seasonMode` (Hysterese)**: 0 Kite-Tage → `build`; erste Serie erreicht
  `SEASON_MAINTAIN_ENTER` → `maintain`; danach Frequenz sinkt auf 2–3 im Fenster →
  bleibt `maintain` (weder ≥ ENTER noch ≤ EXIT); fällt auf `SEASON_MAINTAIN_EXIT` →
  zurück auf `build`. Serie knapp unter ENTER, die nie einsetzt → durchgehend `build`.
  Kite-Tag exakt am 14-Tage-Fensterrand: Grenze definiert und getestet. Rückdatiertes
  `date` vor der ersten Kite-Einheit → `build`. Zwei Läufe mit gleichen Sessions →
  identisch (Determinismus trotz Iteration).
- **`seasonAdjust: false`**: `activeTemplates` nutzt `build`-Volumen unabhängig von
  der Kite-Frequenz.
- **`gentleBias`**: `preferGentle: true` → true; `false`/fehlend → false. Bei true
  enthält der `squat`-Slot eine `GENTLE_FIRST`-Übung (Goblet/Beinpresse), nie Front Squat.
- **Determinismus**: `generateTemplates(profile, season, exercises)` zweimal →
  `toEqual`.
- **Equipment-Stufen**: `none` → nur `equipment` `bodyweight`/`band`; `kettlebell` →
  nur `kettlebell`/`bodyweight`/`band`; `rings` → nur `rings`/`bodyweight`/`band`;
  `gym` → alle Primär-Slots besetzt. Für **jede** Stufe ist jeder Primär-Slot besetzt.
- **`daysPerWeek`**: 1 → ein Template, deckt hinge+squat+push+pull+core ab; 2 → A+B;
  3 → +Circuit; 4 → +vierter Tag. Kein Muster doppelt im selben Template.
- **Disziplin**: Big Air → ≥ 2 Slots der Familie `hinge`/`single-leg`/`hamstring-curl`
  mit exzentrischer Tempo-Notiz; Wave/Wing → Primär-`reps` ≥ 10; Foil → ≥ 1
  `metric: 'time'`-Slot; Freestyle → `core-anti-rot`-Zusatz-Slot vorhanden.
- **Saison**: `maintain` vs. `build` bei gleichem Profil → jede Primärübung ein Satz
  weniger, ein Accessory-Slot weniger pro Tag.
- **`activeTemplates`**: ohne `trainingProfile` bzw. mit `skipped: true` → `toEqual(templates)`
  (Seed unverändert); mit Profil → generierte Liste.

`src/data/seed.test.ts` (Ergänzungen):

- Jede neue Pool-Übung hat `pattern`, `equipment`, `strains`, `youtubeQuery`.
- Für jedes in einem Skelett genutzte `pattern` × **jede** der vier Equipment-Stufen
  löst `resolveSlot` einen Primär-Slot auf (kein Primär-Ausfall auf keiner Stufe).
- Accessory-Ausfälle nur, wenn in der Snapshot-Allowlist je Stufe vermerkt.
- Alle bestehenden `category: 'rings'`-Übungen haben jetzt `pattern` und `equipment: 'rings'`.
- `core-anti-ext` hat ≥ 1 Seed-Übung.

### Manuell (mobil, Dev-Server, Basis-URL `/kite-training-app/`)

- Frisches Profil: Onboarding „Gym · 2 Tage · Big Air · Gelenkschon aus" → Tag A / Tag B
  entsprechen inhaltlich den heutigen Seed-Templates (Regressionscheck).
- „Nur Kettlebell · 3 Tage · Wave" → A/B/Circuit ohne Langhantel-Übungen, höhere
  Wiederholungszahlen, Circuit als KB-Circuit.
- „Nur Ringe · 2 Tage · Wing" → Zug/Druck über Ring-Varianten, `hinge`/`squat` über
  Körpergewicht, kein Primär-Slot fehlt.
- „Nichts · 1 Tag · Foil" → ein Ganzkörper-Template, Wall-Sit statt Front Squat,
  Hollow-Hold als Core; ausgelassene Accessory-Slots als dezente Zeile sichtbar.
- Gelenkschon-Schalter an → Tag B zeigt Goblet Squat / Beinpresse statt Front
  Squat, assistierten Klimmzug statt Zusatzgewicht.
- Saison: 4 Kite-Tage der letzten zwei Wochen loggen → Trainingsplan-Karte
  und Einheit zeigen „Erhaltungsmodus", ein Satz weniger je Grundübung.
- Einen Kite-Tag löschen (jetzt 3 im Fenster) → bleibt „Erhaltungsmodus" (Hysterese).
  Bis auf 1 Kite-Tag im Fenster reduzieren → zurück auf „Aufbaumodus".
- „Saison-Anpassung automatisch" ausschalten → Warnung erscheint, nach Bestätigen
  volles Volumen trotz Kite-Tagen; Karte zeigt „Saison-Anpassung aus".
- Bestandsnutzer (Sessions vorhanden, kein Profil): Dashboard zeigt den Hinweis
  „Trainingsplan einrichten". „Später" → weg und bleibt weg. „Einrichten" → Onboarding.
- Übung in laufender generierter Einheit tauschen (`⇄`) → funktioniert wie bei den
  Seed-Templates; Einheit speichern → im Log steht die real trainierte Übung.
- Verletzungs-Modus „Knie" + generierter Tag A → betroffene Slots getauscht/ausgelassen
  (bestehende Logik greift auf die generierte Slot-Liste).
- Einstellungen → „Auf Standardplan zurücksetzen" → Workout-Übersicht zeigt wieder
  Tag A / Tag B / KB aus dem Seed.
- Backup exportieren → JSON enthält `settings.trainingProfile`. Alt-Backup ohne das
  Feld importieren → Standardplan, kein Fehler.
- Offline-Start nach Deploy funktioniert weiterhin (kein neuer Ladepfad, alles im Bundle).

## Offen

1. **Saison-Konstanten final eichen** — `SEASON_WINDOW_DAYS = 14`,
   `SEASON_MAINTAIN_ENTER = 4`, `SEASON_MAINTAIN_EXIT = 1` sind gesetzte Startwerte.
   Nach dem ersten echten Saison-Wechsel gegenprüfen, ob Umschaltpunkt und
   Hysterese-Breite passen.
2. **Fachliche Grundlage** — *erledigt:* [`docs/training/plan-generator.md`](../training/plan-generator.md)
   (analog Board-Off) liefert konkrete Sätze/Wiederholungen/Tempo/Pause je Disziplin,
   den Skelett-Review Slot für Slot und den Datenblock für `generateTemplates`. Sechs
   begründete Korrekturen ggü. den Tabellen hier: 1-Tag `pull-v`→`pull-h`; Tag B
   6. Slot `core-anti-lat`→`core-anti-ext`; Circuit als Power-Pacing statt Metcon;
   4-Tag Tag D wird echter Beintag mit `single-leg`-Primär-Slot (+ `type: 'D'` nötig);
   `push-v` raus aus Wave/Wing-`emphasis`; `back-squat` raus aus `GENTLE_FIRST[squat]`.
   Plus `maintain`-Zusatz (Exzentrik-Tempo streichen, +30 s Pause) und Pool-Lücke
   `band-pulldown`. Die Tabellen in dieser Spec sind damit überholt, wo sie abweichen —
   der Trainingsentwurf ist die Referenz.

## Entschieden

1. **Kein erzwungenes Onboarding für Bestandsdaten.** Auto-Onboarding nur bei
   `sessions.length === 0`. Wer schon Einheiten hat, bleibt auf den Seed-Templates,
   bekommt aber einen einmaligen, wegklickbaren Dashboard-Hinweis „Trainingsplan
   einrichten" (`settings.planNudgeDismissed`) und die Settings-Karte. Grund: Der
   Generator darf einem laufenden Trainingsverlauf nicht ungefragt die Templates
   unter den Füßen wegziehen, soll aber auffindbar sein.
2. **Der Generator ersetzt nur die Krafttemplates**, nicht die Wochenplanung.
   `schedule()` und `settings.gymDays` bleiben unverändert; `daysPerWeek` steuert nur
   Anzahl und Umfang der Templates.
3. **Saison-Modus geht hier auf** (Roadmap-Punkt 5): automatische Ableitung aus der
   Kite-Frequenz, kein manueller „Saison / Winter"-Schalter im Onboarding. Damit
   entfällt die fünfte Onboarding-Frage der Roadmap-Skizze. Jeder Kite-Tag zählt,
   14-Tage-Fenster, Hysterese (Ein bei ≥ 4, Aus erst bei ≤ 1). Über „Mehr" →
   Trainingsplan-Karte mit Warnung komplett abschaltbar (`seasonAdjust: false`).
4. **Kein Altersfeld.** Statt einer Alters-Heuristik gibt es einen direkten Schalter
   „gelenkschonende Übungsauswahl" (`preferGentle`). Er beeinflusst nur die
   Übungsauswahl-Reihenfolge (`GENTLE_FIRST`), nicht Volumen und nicht
   `settings.injuries`.
5. **Generierte Templates werden nie persistiert** — Ableitung zur Renderzeit aus
   Profil + Sessions, identisch zum Muster von `schedule()` und der
   Verletzungs-Anpassung.
6. **Ohne Profil ist das Verhalten bit-identisch zu heute.** `activeTemplates()` gibt
   dann `templates` aus dem Seed zurück.
7. **Alle vier Equipment-Stufen zum Start** (`gym`, `kettlebell`, `rings`, `none`).
   Setzt die Seed-Erweiterungen voraus: Körpergewicht-/Band-Übungen für die Lücken
   plus `pattern`/`equipment: 'rings'` an allen Ringe-Übungen und ein paar neue
   Ring-Varianten. Jede Stufe muss jeden Primär-Slot besetzen können.
8. **Saison-Anpassung ist abschaltbar, aber mit Reibung.** Schalter unter „Mehr",
   Ausschalten nur nach bestätigter Warnung. Grund: ein automatischer
   Schutzmechanismus darf nicht still weg sein, aber der Nutzer muss die Kontrolle
   behalten. `seasonAdjust: false` → Generator nutzt immer `build`.
9. **Hysterese statt Einzelschwelle** beim Saison-Umschalten, damit der Plan bei
   Kite-Frequenz nahe der Grenze nicht wöchentlich zwischen den Volumen springt.
