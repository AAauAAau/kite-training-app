# Mehrsprachigkeit: Deutsch, Englisch, Französisch

Status: In Planung

## Ziel

Die App ist heute vollständig deutsch — sichtbare Texte in Komponenten, Seed-Daten
(Übungsnamen, Templates, Mobility-Checklisten, Board-Off-Stufen) und die
Warn-/Begründungstexte in `src/logic/`. Ziel ist, dieselbe App in **Englisch** und
**Französisch** nutzbar zu machen, ohne Backend, ohne Laufzeit-Netzwerkzugriff und
ohne die Offline-Fähigkeit zu verlieren.

Der Nutzer soll:
- die Sprache in den Einstellungen wählen (Deutsch / English / Français),
- beim ersten Start automatisch eine passende Sprache bekommen
  (`navigator.language`, Fallback Deutsch),
- **alle** sichtbaren Texte in der gewählten Sprache sehen — inklusive Übungsnamen,
  Trainingshinweisen, Board-Off-Fehler-/Regression-Texten und Datumsformaten,
- die Sprache jederzeit umschalten können, ohne Datenverlust und ohne Reload.

Deutsch bleibt die Quellsprache: Übersetzungs-Keys werden aus dem deutschen Katalog
typisiert, fehlende Übersetzungen fallen sichtbar auf Deutsch zurück (und lassen
einen Test scheitern).

## Entschieden

1. **Drei Sprachen, keine weitere Infrastruktur.** `de` (Default/Quelle), `en`, `fr`.
   Kein Plural-/ICU-Framework, keine Laufzeit-Ladepfade — alle drei Kataloge sind
   Teil des Bundles.
2. **Eigenes Mini-i18n statt `i18next`/`react-i18next`.** Ein `t(key, params)` über
   getippte Message-Kataloge in `src/i18n/`. Begründung: der String-Bestand ist
   überschaubar (~350 Keys), es gibt kaum echte Pluralfälle, und die Projektlinie
   ist „wenig Abhängigkeiten, deterministisch, testbar". `react-i18next` wäre die
   Alternative, bringt aber ~40 kB und einen zweiten Zustandsspeicher mit.
3. **Domain-Copy getrennt von Domain-Struktur.** `src/data/seed.ts` behält die
   deutschen Strings als Fallback und bleibt die einzige Quelle für IDs, Sätze,
   Metrik, Timer, `needsRig` usw. Die Übersetzungen (Übungsnamen, Template-Titel/
   Notizen, Mobility-Labels/Cues, Board-Off-Labels/Gates/Fehler/Regressionen)
   liegen in `src/i18n/content/en.ts` und `fr.ts`, jeweils **nach denselben IDs
   verschlüsselt**. Aufgelöst wird zur Renderzeit, nicht beim Seeden.
4. **Persistierte Werte bleiben Codes, nicht Anzeige-Text.** `KiteWind`
   (`leicht|mittel|stark`), `PlannedSession.location` (`Gym|Zuhause`),
   `SessionType`, `Feel` usw. bleiben unverändert in IndexedDB und Backups; sie
   werden nur bei der Anzeige übersetzt. Keine Datenmigration.
5. **`src/logic/` gibt Message-Deskriptoren zurück, keine fertigen Sätze.**
   `strengthWarnings`, `deloadDue().reason`, der Comeback-Hinweis und die
   Substitutions-Equipment-Labels liefern künftig `{ key, params }` statt
   deutschem Text. Die Komponenten übersetzen. Betrifft bestehende Tests
   (siehe unten).
6. **Kite-Fachbegriffe werden nicht übersetzt.** Trick-/Disziplinnamen
   (`Megaloop`, `Handle Pass`, `Board Off` …) und die `youtubeQuery`-Strings
   bleiben wie sie sind. Der Default-Wert `kiteFocusTags` bekommt lediglich zwei
   generische Einträge lokalisiert (`Nur Cruisen` → `Just cruising` / `Balade`).

## Verhalten

### Sprachwahl

- Neuer Wert `settings.lang: 'de' | 'en' | 'fr'`.
- Beim allerersten Start (kein `settings.lang` gespeichert): aus
  `navigator.languages` die erste Sprache mit Präfix `de`/`en`/`fr` nehmen, sonst
  `de`. Ergebnis wird beim ersten `updateSettings`/Seed persistiert.
- In `SettingsView` ein Abschnitt „Sprache / Language / Langue" mit drei Buttons
  (`.segmented`). Auswahl schreibt `settings.lang` und wirkt **sofort** (React
  rerendert über den Store, kein Reload).
- `document.documentElement.lang` wird beim Start und bei jeder Änderung auf den
  aktiven Wert gesetzt.

### Was übersetzt wird

| Bereich | Beispiele |
| --- | --- |
| Navigation & Screens | „Heute/Woche/Loggen/Verlauf/Mehr", Header, Buttons, Toasts |
| Formulare | Platzhalter, `aria-label`, Validierungs- und Statusmeldungen |
| Übungen | `exercise.name` inkl. Zusätze wie „· 40 m je Seite" |
| Templates | `title`, `subtitle`, `note` je `TemplateExercise` |
| Mobility | `title`, `label`, `purpose`, `dose`, `cue`, `cueDetail` |
| Board-Off | `label`, `skill`, `gate`, `mistake`, `regression` (inkl. `rigFreeAlternative`), Setup-/Sicherheitstexte, Abbruch-Ampel |
| Logik-Hinweise | Deload-Grund, Rücken-Warnung, KB-ohne-Kraft-Warnung, Comeback-Hinweis, Equipment-Labels der Substitution |
| Enums bei Anzeige | Wind (`leicht`→„leicht/light/léger"), Board, Feel, Ort, SessionType-Titel |
| Datum/Zahl | Wochentage, Kurzdatum, kg-/Distanz-Formatierung über die aktive Locale |

### Fallback-Regel

`t('some.key')` in `en`/`fr` ohne Eintrag → deutscher String **und** `console.warn`
im Dev-Build. Für Domain-Copy (`localizeExercise` etc.): fehlt der Eintrag in
`en`/`fr`, wird der `de`-Wert aus dem Seed genommen. Vollständigkeit sichern Tests.

### Nicht sichtbar für den Nutzer

- Keine „Sprache automatisch erkannt"-Meldung; die Wahl steht einfach in den
  Einstellungen.
- Keine Teilübersetzung pro Screen — entweder ist ein String im Katalog oder er
  fällt sichtbar auf Deutsch zurück (Bug, kein Feature).

## Nicht-Ziele

- Keine weiteren Sprachen als `de`/`en`/`fr`, kein RTL, keine dynamische
  Katalognachladung.
- Keine Laufzeit-Übersetzung (kein Übersetzungs-API-Aufruf, keine LLM).
  Widerspricht „kein Backend, keine Netzwerkanfragen".
- Keine Migration persistierter Enum-Werte auf neutrale Codes.
- Keine Übersetzung der Kite-Trick-/Disziplinnamen und der `youtubeQuery`-Strings.
- Keine sprachabhängigen Trainingsinhalte (die Dosierung ist überall gleich, nur
  der Text ändert sich).
- Keine Übersetzung des fachlichen Trainings-Docs unter `docs/training/`.
- Keine Pluralformen-Engine — die wenigen Zählfälle („1 Eintrag / 5 Einträge")
  werden mit einer einfachen `plural(n, one, other)`-Hilfe in jedem Katalog
  gelöst.

## Datenmodell und Migration

### Typen (`src/types.ts`)

```ts
export type Lang = 'de' | 'en' | 'fr';

export interface Settings {
  // …
  lang?: Lang;   // aktive Sprache; fehlt → beim Start aus navigator.language gesetzt
}
```

Kein neuer persistierter Typ sonst. `Exercise`, `SessionTemplate`,
`MobilityChecklistTemplate`, `BoardOffLevel` bleiben strukturell unverändert; ihre
Text-Felder sind ab jetzt „deutscher Fallback", nicht „die Anzeige".

### Migration

- Kein Dexie-Versions-Bump (kein Index, keine Struktur).
- `settings.lang` optional, gemergt über `{ ...defaultSettings, ...settings }`.
  `defaultSettings.lang` bleibt **ungesetzt**, damit der erste Start die
  Browser-Sprache übernehmen kann; `store.initialize()` setzt den Wert danach
  einmalig.
- `BackupData` bleibt Version 1. Ein Backup aus einer älteren App-Version hat kein
  `lang` → beim Import wird die Browser-Sprache genutzt. Ein Backup **mit** `lang`
  wird von einer älteren App-Version ignoriert (unbekanntes Feld) — kein Fehler.
- Übungen werden weiter bei jedem `initialize()` per `bulkPut` geseedet; da die
  Anzeige die Sprache erst beim Rendern auflöst, ändert Sprachwechsel weder DB
  noch Seed.
- Bestehende Sessions referenzieren Übungs-IDs, nicht Namen → keine Anzeige bricht.

## Logik

### Neues Modul `src/i18n/`

```
src/i18n/
  index.ts        // t(), plural(), setLang(), getLang(), detectLang()
  de.ts           // Quellkatalog — Messages-Typ leitet sich hieraus ab
  en.ts           // satisfies Messages
  fr.ts           // satisfies Messages
  content/
    de.ts         // Re-Export der Seed-Strings als {exercises,templates,mobility,boardOff}
    en.ts         // Übersetzungen, Partial<Content>
    fr.ts
```

```ts
// index.ts
export type Messages = typeof import('./de').messages;      // Quell-Typ
export function t<K extends MessageKey>(key: K, params?: Record<string, string | number>): string;
export function plural(n: number, forms: { one: string; other: string }): string;
export function detectLang(nav: readonly string[]): Lang;   // rein, testbar
```

- `t` ist rein bezüglich der aktiven Sprache: die Sprache kommt aus einem
  Modul-State, den der Store bei `initialize()` und bei jedem `updateSettings`
  mit `lang` über `setLang()` setzt. Komponenten lesen zusätzlich `settings.lang`
  aus dem Store, damit React rerendert.
- Interpolation: `t('weight.saved', { kg: 86 })` ersetzt `{kg}` im Template.
  Keine Verschachtelung, kein HTML.

### Domain-Lokalisierung (rein, unter `src/logic/localize.ts`)

```ts
export function localizeExercise(ex: Exercise, lang: Lang): Exercise;          // nur name getauscht
export function localizeTemplate(tpl: SessionTemplate, lang: Lang): SessionTemplate;
export function localizeMobility(t: MobilityChecklistTemplate, lang: Lang): MobilityChecklistTemplate;
export function localizeBoardOffLevel(l: BoardOffLevel, lang: Lang): BoardOffLevel;
```

Jede Funktion: `lang === 'de'` → Eingabe unverändert; sonst Feld-für-Feld aus
`content/<lang>.ts` überschreiben, fehlende Felder aus dem `de`-Original.

### Anpassung bestehender Logik

- `src/logic/training.ts`
  - `lowerBackWarning` / `kbWithoutStrengthWarning`: von `string` zu
    `WarningDescriptor` (`{ key: MessageKey }`).
  - `deloadDue()` → `reason` wird `{ key, params }` statt Satz.
  - Comeback-Hinweis (`nextTarget`/`startingTarget`-Umfeld) → `{ key, params: { weeks, percent } }`.
  - `strengthWarnings()` pusht Deskriptoren statt Strings.
- `src/logic/substitution.ts`: `equipmentLabel` liefert einen `MessageKey`
  (`equipment.barbell` …), nicht das deutsche Wort.
- `src/logic/date.ts`: `formatShortDate(isoDate, locale = 'de-DE')` bekommt einen
  optionalen `locale`-Parameter; neue `weekdayLabels(locale)`-Hilfe für die
  Wochenansicht. Modul bleibt frei von Store-Zugriff — die Locale wird vom Aufrufer
  übergeben (`{ de: 'de-DE', en: 'en-GB', fr: 'fr-FR' }[lang]`).
- Zahl/Einheit: neue `formatKg(n, lang)` / `formatDistance(m, lang)` in
  `src/logic/format.ts` über `Intl.NumberFormat`. Eingabe-Parsing
  (`replace(',', '.')`) bleibt tolerant für beide Dezimaltrennzeichen.

### Store

- `initialize()`: nach `readAll()` — wenn `settings.lang` fehlt,
  `lang = detectLang(navigator.languages)`, `updateSettings({ lang })` **nicht**
  automatisch schreiben, sondern nur `setLang(lang)` + `set({ settings: { ...settings, lang } })`.
  Persistiert wird erst bei der ersten echten Nutzeraktion oder direkt hier —
  Entscheidung: **direkt persistieren**, damit Backups die Sprache enthalten.
- `updateSettings({ lang })` ruft zusätzlich `setLang(lang)` und setzt
  `document.documentElement.lang`.

## UI

- `src/App.tsx`: Bottom-Nav-Labels, Splash-Text, `aria-label="Hauptnavigation"`
  über `t()`.
- `src/main.tsx` / `index.html`: `<html lang>` initial `de`, wird nach
  `initialize()` gesetzt. `<title>` bleibt „Kite Strength" (Eigenname).
- `SettingsView.tsx`: neuer Abschnitt Sprache (3 Buttons). Alle Meldungen
  (`saveWeight`, `downloadBackup`, `importFile`, Tag-Meldungen) über `t()` mit
  Parametern. Der Datenschutz-Footer ebenfalls.
- `WorkoutView.tsx`: Übungen über `localizeExercise(ex, lang)` rendern;
  Template-Titel/Notizen über `localizeTemplate`; Board-Off-Picker und -Einheit
  über `localizeBoardOffLevel`; Warnungen aus `strengthWarnings` über `t()`.
- `Dashboard.tsx` / `WeekView.tsx` / `LogView.tsx` / `SessionEditor.tsx` /
  `KiteDetailsEditor.tsx` / `PostSessionHipRoutine.tsx` / `SubstitutionSheet.tsx` /
  `FeelSheet.tsx` / `TimerDock.tsx`: alle Klartext-Strings → `t()`; Datum über
  `formatShortDate(iso, localeFor(lang))`; Enum-Anzeige (Wind/Board/Feel/Ort/
  SessionType) über kleine Mapping-Helfer, die `MessageKey`s auflösen.
- Kein neues CSS nötig; die Sprachwahl nutzt `.segmented`/`.day-picker`-Optik.
- Textlängen: EN/FR-Strings sind teils länger — bestehende Buttons/Labels auf
  `text-overflow`/Umbruch prüfen (manueller Check, siehe unten).

## Tests und Abnahmekriterien

### Automatisiert

`src/i18n/i18n.test.ts`:
- `en` und `fr` haben **exakt** dieselben Keys wie `de` (kein fehlender, kein
  überzähliger Key).
- `detectLang`: `['fr-CH','de']`→`fr`, `['en-US']`→`en`, `['es']`→`de`, `[]`→`de`.
- `t` interpoliert `{param}` korrekt und lässt unbekannte Params unangetastet.
- `plural` wählt `one`/`other` korrekt für `de`/`en`/`fr`.

`src/i18n/content.test.ts`:
- Für jede Übungs-ID im Seed existiert ein `en`- und `fr`-Name (oder bewusst
  Fallback — dann in einer expliziten Allowlist).
- Alle `templates`, `mobilityChecklists`, `boardOffLevels` (inkl.
  `rigFreeAlternative`) sind in `en`/`fr` vollständig übersetzt.
- Keine `en`/`fr`-Content-Datei referenziert eine ID, die es im Seed nicht gibt.

`src/logic/localize.test.ts`:
- `localizeExercise(ex,'de')` gibt das Original zurück (referenzielle Gleichheit
  erlaubt).
- `localizeBoardOffLevel(level,'fr')` übersetzt `label`/`gate`/`mistake`/
  `regression` und behält Struktur (4 Slots, `sets`, `needsRig`).

Bestehende Tests anpassen:
- `src/logic/training.test.ts`: Assertions wie `toContain('Rücken ist von gestern')`
  → auf Deskriptor-`key` prüfen (`expect(...).toEqual({ key: 'warning.lowerBack' })`).
- `src/logic/substitution.test.ts`: `equipmentLabel`-Erwartungen auf `MessageKey`.
- `src/store.ts`-nahe Tests (falls vorhanden): `assertLoggableDate`-Fehlertext
  bleibt intern (Error-Message muss nicht übersetzt werden — Entscheidung:
  Entwicklertext, kein UI-Text).

### Manuell (mobil, Dev-Server, Basis-URL `/kite-training-app/`)

- Erststart mit Browser-Sprache Französisch → App startet auf Französisch,
  `settings.lang === 'fr'` persistiert, `<html lang="fr">`.
- Einstellungen → „English" wählen: Navigation, Dashboard, Workout, Log sofort
  englisch, ohne Reload; kein deutscher Reststring auf den Hauptscreens.
- Workout Tag A starten: Übungsnamen, Notizen, Aufwärm-Checkliste englisch;
  Zielgewicht/Autoregulation unverändert.
- Board-Off-Picker + Stufe 2 starten (EN und FR): Label, Gate, „Häufiger Fehler",
  „Regression", Setup-/Tragfähigkeits-Warnung, Abbruch-Ampel übersetzt.
- Rücken-Warnung provozieren (Tag A + gestriger harter Kitetag) → Warnung
  erscheint in der aktiven Sprache.
- Comeback-Hinweis (letzte Krafteinheit > 3 Wochen) → Prozent/Wochen korrekt
  interpoliert, Sprache stimmt.
- Wochenansicht: Wochentage und Kurzdatum in der aktiven Locale.
- Backup exportieren → JSON enthält `settings.lang`. In frischem Profil
  importieren → Sprache übernommen.
- Alt-Backup ohne `lang` importieren → App fällt auf Browser-Sprache zurück, kein
  Fehler.
- Sprache auf Deutsch zurück → identisch zum heutigen Stand (Regressionscheck).
- Offline-Start nach Deploy in allen drei Sprachen (Service Worker cached alle
  Kataloge, da im Bundle).
- Lange FR-Strings: Bottom-Nav, Board-Off-Karten und Settings-Buttons brechen
  sauber um / kürzen, kein horizontaler Overflow.

## PWA / Metadaten

- `vite.config.ts`-Manifest bleibt englisch-neutral: `name`/`short_name` sind
  Eigennamen; `description` auf einen kurzen englischen Satz umstellen
  („Offline training log for strength, sprint and kite days"). Kein
  sprachabhängiges Manifest (PWA unterstützt das nur eingeschränkt, und der
  Aufwand lohnt für einen Einzelnutzer nicht).
- `index.html`-`meta[description]` analog auf Englisch; `lang`-Attribut wird zur
  Laufzeit gesetzt.

## Umsetzungsreihenfolge (Vorschlag)

1. `src/i18n/` Gerüst: `Messages`-Typ aus `de.ts`, `t`/`plural`/`detectLang`,
   Tests. `settings.lang` + Store-Verdrahtung + `SettingsView`-Umschalter.
2. UI-Strings Screen für Screen nach `de.ts` ziehen und `t()` einsetzen
   (App-Shell → Dashboard → Workout → Log/Week → Sheets). Nur `de` befüllt.
3. `src/logic/`-Deskriptoren umbauen (training, substitution, date, format) +
   Tests anpassen.
4. `content/de.ts` als Re-Export der Seed-Strings; `localize*`-Funktionen + Tests.
5. `en.ts` + `content/en.ts` befüllen, Vollständigkeits-Tests grün.
6. `fr.ts` + `content/fr.ts` befüllen.
7. Manueller Durchlauf in allen drei Sprachen, Textlängen-Feinschliff, Manifest.

Schritte 1–4 sind die Struktur (danach ist die App „mehrsprachig-fähig", aber nur
auf Deutsch befüllt); 5–7 sind die eigentlichen Übersetzungen und können separat
folgen.
