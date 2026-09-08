# Recherche-Prompt: fachliche Grundlage für den Plan-Generator

> Ziel des Laufs: `docs/training/plan-generator.md` — die fachliche Referenz, auf der
> `src/logic/planGenerator.ts` aufsetzt. Analog zu
> [board-off-progression.md](board-off-progression.md): Evidenz offenlegen,
> `[P]`/`[B]`/`[V]` durchziehen, Widerspruch zur Vorgabe ausdrücklich erwünscht.
>
> Feature-Spec mit den verbindlichen Randbedingungen:
> [docs/features/plan-generator.md](../features/plan-generator.md). Der Agent darf die
> Trainingsinhalte hinterfragen, **nicht** die Architektur (deterministisch, offline,
> kein Gewicht, keine Wochenplanung).

---

## — ab hier der eigentliche Prompt —

# Fachliche Grundlage für einen regelbasierten Krafttrainings-Generator (Kitesurfen)

## Auftrag

Erarbeite die trainingswissenschaftliche Grundlage für einen **deterministischen
Plan-Generator**, der Krafttrainings-Templates aus vier Nutzerangaben baut:
Equipment, Tage pro Woche, Kite-Disziplin, gelenkschonende Übungsauswahl ja/nein.

Der Generator erzeugt pro Trainingstag eine feste Abfolge von **Bewegungsmustern**
und wählt je Muster eine konkrete Übung. Deine Aufgabe ist, für jede Disziplin und
jede Tagezahl festzulegen: **welche Muster, in welcher Rolle, mit wie vielen Sätzen,
Wiederholungen, welchem Tempo und welcher Pause** — plus die fachliche Begründung.

Kein Wassertraining, keine Trickanleitung. Kein Gewicht in Kilogramm (das steuert die
App über die Trainingshistorie). Keine Wochenplanung (die steht fest). Nur der Inhalt
einer einzelnen Krafteinheit.

## Zielgruppe

Kitesurfer im Freizeit- bis fortgeschrittenen Bereich, breite Altersspanne,
überwiegend Erwachsene mit Beruf und begrenzter Trainingszeit. Eine Einheit dauert
40–60 min, 1–4×/Woche, ganzjährig. Kein Personenbezug — der `preferGentle`-Schalter
ist die einzige Individualisierung neben Equipment/Disziplin/Frequenz.

## Verbindliches Gerüst — nicht umsortieren, nur unterlegen

### Bewegungsmuster-Vokabular (fix)

`squat` · `hinge` · `single-leg` · `push-h` (horizontal drücken) · `push-v` (vertikal
drücken) · `pull-h` (horizontal ziehen) · `pull-v` (vertikal ziehen) · `carry` ·
`core-anti-ext` (Anti-Extension) · `core-anti-rot` (Anti-Rotation) · `core-anti-lat`
(Anti-Lateralflexion) · `hamstring-curl` (Kniebeugung, nicht Hüftstreckung).

### Tages-Skelette (Vorschlag der Spec — prüfen, korrigieren, begründen)

- **1 Tag** — Ganzkörper: `hinge` P · `squat` P · `push-h` P · `pull-v` P ·
  `single-leg` A · `core-anti-rot` A
- **2 Tage** — an der heutigen App geeicht, Referenz:
  - A: `hinge` P · `single-leg` A · `push-h` P · `hamstring-curl` A · `carry` A
  - B: `pull-v` P · `squat` P · `pull-h` A · `hinge` A (einseitig) · `core-anti-rot` A ·
    `core-anti-lat` A
- **3 Tage** — A + B + Circuit (`hinge` explosiv · `push-v` · `core-anti-lat`)
- **4 Tage** — A + B + C + D („Oberkörper / Grip": `push-h` A · `pull-h` A · `carry` A ·
  `core-anti-rot` A)

P = `primary`, A = `accessory`. Die 2-Tage-Variante bildet grob das ab, was die App
heute fest verdrahtet hat (Big-Air-Fahrer, Gym) — sie ist der Sanity-Anker, nicht
sakrosankt.

### Disziplin-Fokus (Roadmap-Skizze — prüfen und schärfen)

| Disziplin | vermuteter Fokus |
|---|---|
| Big Air | Exzentrik, Landungskapazität, Hüft-Power |
| Freestyle | Rotation, Knie, Pop |
| Wave | Ausdauer, Schulter, Rumpf |
| Foil | isometrische Bein- und Rumpfarbeit |
| Wing | Schulter, Griff, Rumpfausdauer |

Diese Tabelle ist ein Startpunkt. Gleiche sie gegen Coaching-Content, Fahrer-Interviews
und die Biomechanik der jeweiligen Disziplin ab. Wo sie zu grob oder falsch ist:
widersprechen mit Begründung.

### Disziplin-Profil — die Stellschrauben, die der Generator kennt

Pro Disziplin liefert das Profil:

1. **Betonte Muster** (1–3) — bekommen auf den Primärtagen einen zusätzlichen
   `accessory`-Slot und/oder Priorität.
2. **Wiederholungsprofil** — eines von: `strength` (3–5) · `power` (3–6, explosiv) ·
   `endurance` (10–15) · `isometric` (Zeit-Slots). Gilt als Default für alle Slots,
   Abweichungen je Slot möglich.
3. **Exzentrik-Tempo ja/nein** — wenn ja, auf welchen Mustern (Tempo-Notiz + ggf.
   `pace`-Timer).

### Saison-Volumen

Der Generator skaliert dasselbe Skelett in zwei Stufen:
- `build` (Aufbau, kite-arme Zeit): Sätze wie festgelegt.
- `maintain` (Erhaltung, kite-reiche Zeit): **jede Primärübung ein Satz weniger**
  (min. 2), **der letzte Accessory-Slot je Tag entfällt**.

Prüfe: Ist das die richtige In-Season-Reduktion? Reicht −1 Satz, oder braucht es
zusätzlich weniger Wiederholungen / mehr Pause / Wegfall der Exzentrik-Belastung?
Gegenvorschlag willkommen, aber er muss ohne neue Stellschraube auskommen.

### `preferGentle` — gelenkschonende Reihenfolge

Bei gesetztem Schalter sortiert der Generator je Muster die gelenkschonendere Variante
nach vorn. Aktueller Vorschlag:

| Muster | schonend zuerst |
|---|---|
| `squat` | Goblet Squat, Beinpresse, Back Squat (statt Front Squat) |
| `hinge` | Trap-Bar, KB-Kreuzheben, Hip Thrust (statt Langhantel-RDL/-Kreuzheben) |
| `single-leg` | Step-up, Ausfallschritt rückwärts (statt Bulgarian Split Squat, Pistol) |
| `push-h` | Kurzhantel-Bank, Brustpresse (statt Langhantelbank) |
| `push-v` | Kurzhantel-Schulterdrücken (statt Push Press, Pike Push-up) |
| `pull-v` | assistierter Klimmzug, Latzug (statt Klimmzug mit Zusatzgewicht) |
| `hamstring-curl` | Beinbeuger-Maschine, Slider Curl (statt Nordic Curl) |

Bestätige oder korrigiere die Zuordnung — welche Variante belastet Knie / unterer
Rücken / Schulter unter Last tatsächlich weniger, bei vergleichbarem Trainingsreiz?

## Recherche-Auftrag

1. **Kitespezifisch:** Coaching-Content, Trainingspläne von Fahrern, Interviews,
   S&C-Artikel für die fünf Disziplinen. Welche körperlichen Qualitäten begrenzen
   Leistung und Verletzungsfreiheit je Disziplin?
2. **Übertragung aus dokumentierten Sportarten:** Sprung-/Landungskraft und Exzentrik
   (Leichtathletik, Sprungsport), isometrisches Training (Kletter-/Rehaliteratur,
   Foil-Balance), Rumpf-Anti-Bewegung (S&C-Standardwerke), Griff-/Schulterausdauer
   (Klettern, Turnen, Wing/Windsurf).
3. **Krafttrainings-Grundlagen:** Satz-/Wiederholungsbereiche für Kraft vs. Power vs.
   Kraftausdauer, sinnvolle Sätze pro Muster und Woche für Nebenberufler,
   Exzentrik-Dosierung, minimale effektive Dosis in belastungsreichen Phasen.
4. **Evidenzlage offenlegen.** Für Kitesurf-spezifisches Krafttraining gibt es kaum
   belastbare Literatur. Kennzeichne durchgehend:
   - `[P]` Coaching-/Trainer-Praxis mit Quelle
   - `[B]` biomechanische / trainingswissenschaftliche Ableitung
   - `[V]` Vermutung ohne Beleg

   **Erfinde keine Quellen.** Ein Abschnitt „Was ich nicht gefunden habe" ist Pflicht.

## Gewünschtes Ergebnis — in dieser Reihenfolge

1. **Evidenzlage** — Quellentabelle + „nicht gefunden"-Abschnitt. Zuerst.
2. **Disziplin-Anforderungsanalyse** — je Disziplin: begrenzende Qualitäten, die
   relevanten Bewegungsmuster, Korrekturen an der Fokus-Tabelle. Jede Zeile
   `[P]`/`[B]`/`[V]`.
3. **Skelett-Review** — die vier Tages-Skelette bestätigt oder geändert, Slot für
   Slot begründet (warum dieses Muster, warum primary/accessory, warum diese
   Reihenfolge). Besonderer Blick auf 1 Tag (deckt es genug ab?) und 4 Tage (ist Tag D
   sinnvoll oder besser ein zweiter Beintag?).
4. **Disziplin-Profile** — pro Disziplin eine Tabelle:
   betonte Muster · Wiederholungsprofil · Exzentrik-Tempo (wo) · und je Slot-Rolle
   (primary / accessory / circuit) konkrete **Sätze × Wiederholungen bzw. Sekunden ·
   Tempo-Notiz · Pause**. So, dass `generateTemplates` daraus ohne weitere Entscheidung
   Zahlen ziehen kann.
5. **Saison-Reduktion** — Bewertung der `maintain`-Regel, ggf. Gegenvorschlag ohne
   neue Stellschraube.
6. **`preferGentle`-Zuordnung** — je Muster bestätigt/korrigiert, mit einem Satz
   Begründung (welche Struktur wird entlastet, bei welchem Reizverlust).
7. **Übungspool-Lücken** — die Spec listet fehlende Körpergewicht-/Band-/Ring- und
   `core-anti-ext`-Übungen. Prüfe die Liste fachlich: Sind die Vorschläge
   (`bodyweight-squat`, `wall-sit`, `band-good-morning`, `backpack-carry`, `ab-wheel`,
   `hollow-body-hold-strength`, Ring-Varianten) sinnvolle Vertreter ihres Musters?
   Fehlt etwas?
8. **Datenblock** — siehe Format unten.

## Format des Datenblocks

```ts
// Passt zu src/logic/planGenerator.ts. Keine Kilogramm, keine Wochenlogik.

// Skelett je Tagezahl
export const SKELETONS: Record<1 | 2 | 3 | 4, DaySkeleton[]>;
// DaySkeleton = { type: 'A'|'B'|'KB'; slots: PatternSlot[] }
// PatternSlot = { pattern: MovementPattern; role: 'primary'|'accessory';
//                 sets: number; reps?: number; sec?: number; tempoNote?: string }

// Disziplin-Profil
export const DISCIPLINE_PROFILES: Record<KiteDiscipline, {
  emphasis: MovementPattern[];
  repProfile: 'strength' | 'power' | 'endurance' | 'isometric';
  eccentricPatterns: MovementPattern[];   // leer = kein Tempo-Fokus
  // optionale Overrides je (pattern, role) für sets/reps/sec/tempoNote
  slotOverrides?: Array<{ pattern: MovementPattern; role?: 'primary'|'accessory';
                          sets?: number; reps?: number; sec?: number; tempoNote?: string }>;
}>;

// gelenkschonende Reihenfolge je Muster (nur die nach-vorn-Liste)
export const GENTLE_FIRST: Partial<Record<MovementPattern, string[]>>;
```

Alle Wiederholungs-/Sekunden-/Tempo-Werte müssen im Datenblock stehen, nicht nur im
Fließtext. Tempo-Notizen kurz und in einem Satz („3–4 s exzentrisch", „explosiv aus
der Grube").

## Nicht liefern

- Keine Trainingspläne mit Kilogramm-Vorgaben oder %-1RM.
- Keine Wochen-/Periodisierungspläne, keine Mesozyklen — die App macht Progression
  über Trainingshistorie + Autoregulation, nicht über Blöcke.
- Keine Trickanleitungen, keine Wasser-Drills, keine Sprung-/Plyo-Progressionen ohne
  Betreuung.
- Keine neuen Bewegungsmuster außerhalb des Vokabulars.
- Keine Bestätigung der Vorgaben um der Bestätigung willen. Mindestens eine begründete
  Korrektur wird erwartet; wenn alles passt, sag warum es passt.

---

## Nachbereitung (für dich, nicht für den Agent)

- Hat der Agent mindestens **eine** Vorgabe (Fokus-Tabelle, Skelett, `preferGentle`,
  `maintain`-Regel) begründet widerlegt oder geschärft? Wenn nicht: Gefälligkeitsverdacht.
- Sind alle `[P]`-Zeilen mit aufrufbaren URLs belegt?
- Deckt der Datenblock alle 5 Disziplinen × 4 Tagezahlen ab, ohne offene Zahl?
- Passt er ohne Schema-Change zu den Typen in
  [docs/features/plan-generator.md](../features/plan-generator.md)?
- Danach: `docs/training/plan-generator.md` aus dem Ergebnis bauen, Status-Zeile
  „Trainingsentwurf, noch nicht implementiert", und in der Feature-Spec Offen-Punkt 2
  auf „erledigt" ziehen.
