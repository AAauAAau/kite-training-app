# Roadmap: Individualisierung & mögliche Verbesserungen

> Ideensammlung, noch **keine** Spec. Was hiervon gebaut wird, entscheidet sich einzeln. Grundprinzip bleibt: kein Backend, offline-first, keine Streaks, keine Gamification.

## Status

| Reihenfolge | Thema | Status |
| --- | --- | --- |
| 1 | Übungs-Substitution | Umgesetzt → [Spec](features/exercise-substitution.md) |
| 2 | Wiedereinstieg nach Pause | Umgesetzt → [Spec](features/comeback-after-break.md) |
| 3 | Autoregulation statt fixer Progression | Umgesetzt → [Spec](features/autoregulation.md) |
| 4 | Verletzungs-Modus | Idee |
| 5 | Saison-Modus | Idee |
| 6 | Plan-Generator | Idee |

Mögliche Zustände: `Idee`, `In Planung`, `In Arbeit`, `Umgesetzt`.

---

## Leitgedanke

Der größte Hebel ist nicht mehr Features, sondern ein **Onboarding, das aus Randbedingungen einen Plan erzeugt**. Die App kennt bisher genau einen Nutzer. Individualisierung heißt: dieselbe Logik, andere Eingaben — nicht mehr Code.

## 1. Plan-Generator statt fester Templates

Höchster Wert, höchster Aufwand.

Fünf Fragen beim Erststart:

- **Equipment:** Gym / nur Kettlebell / nur Ringe / nichts
- **Tage pro Woche:** 1–4
- **Disziplin:** Big Air / Freestyle / Wave / Foil / Wing
- **Alter und Verletzungshistorie**
- **Saison oder Winter**

Daraus ein **deterministisches Regelsystem, keine KI.** Bewegungsmuster stehen fest, die konkrete Übung ergibt sich aus dem Equipment.

Disziplin-Schwerpunkte:

| Disziplin | Fokus |
| --- | --- |
| Big Air | Exzentrik, Landungskapazität, Hüft-Power |
| Freestyle | Rotation, Knie, Pop |
| Wave | Ausdauer, Schulter, Rumpf |
| Foil | isometrische Bein- und Rumpfarbeit |
| Wing | Schulter, Griff, Rumpfausdauer |

Testbar, erklärbar, offline. Kein Modell, kein Netzwerkzugriff.

## 2. Übungs-Substitution

**Bestes Aufwand-Nutzen-Verhältnis. Zuerst bauen.**

- Long-Press auf eine Übung → „Alternative"
- Gleiches Bewegungsmuster, anderes Werkzeug
- Ansatzweise schon vorhanden („Bank **oder** Schulterdrücken"), aber nicht systematisch

Löst vier Abbruchgründe mit einem Feature: Gerät belegt, Schmerz, kein Gym, keine Lust.

Setzt voraus: jede Übung bekommt ein `pattern`-Feld (`squat`, `hinge`, `push-h`, `push-v`, `pull-h`, `pull-v`, `carry`, `core-anti-ext`, `core-anti-rot`, `single-leg`).

## 3. Autoregulation statt fixer Progression

- Nach dem ersten Arbeitssatz: **leicht / passt / schwer**
- Zielgewicht der Folgesätze passt sich an
- Ersetzt nicht `nextTarget()`, sondern korrigiert innerhalb der Session

Begründung: Bei unregelmäßiger Trainingsfrequenz bricht lineare Progression ständig. Autoregulation fängt das ab, statt einen Reset zu erzwingen.

## 4. Saison-Modus, automatisch aus Kite-Frequenz

**Das eigentliche Alleinstellungsmerkmal — nicht das Loggen.**

- Wenige Kite-Tage über 3 Wochen → **Aufbaumodus:** mehr Volumen
- Viele Kite-Tage → **Erhaltungsmodus:** weniger Volumen, mehr Regeneration
- Ableitung aus vorhandenen Daten, keine zusätzliche Eingabe

Keine Fitness-App kann das, weil keine den Sport kennt.

## 5. Wiedereinstieg nach Pause

- Nach 3+ Wochen ohne Training automatisch **80 %** vorschlagen statt „letztes Gewicht"
- Kurzer Hinweis, warum

Verhindert die Verletzung, die typischerweise in Woche 1 nach Urlaub oder Krankheit passiert. Kleiner Aufwand, hoher Schutzwert.

## 6. Verletzungs-Modus

- Körperregion temporär sperren
- Betroffene Übungen fallen raus, Ersatz rückt nach (nutzt die Substitution aus Punkt 2)
- Zeitlich begrenzt, mit Erinnerung zum Reaktivieren

Beispiel unterer Rücken: Swings raus, Hip Thrust rein; Langhantelrudern → Seal Row.

## Bewusst nicht bauen

- **LLM-„Coach"** — braucht Backend, kostet pro Anfrage, halluziniert bei Trainingsempfehlungen. Genau der Ort, wo das nicht hingehört.
- Wearable-Integrationen, Videoanalyse, Ernährungstracking
- Social, Leaderboards, Challenges, Streaks — widerspricht dem gesamten Designprinzip
- Wetter-/Wind-APIs

## Reihenfolge

**2 → 5 → 3 → 6 → 4 → 1**

Substitution zuerst: nützt sofort im Eigengebrauch und ist die Basis für Verletzungs-Modus und Plan-Generator. Punkt 1 zuletzt, weil er erst sinnvoll ist, wenn die Bausteine stehen.

Punkte 2 und 5 sind unabhängig von jeder Veröffentlichungsfrage — die lohnen sich auch, wenn die App für immer bei einem Nutzer bleibt.
