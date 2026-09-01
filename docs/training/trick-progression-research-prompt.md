# Vorlage: Recherche-Prompt für Trick-Progressionen (Trockentraining)

> Generische Vorlage. Für einen neuen Trick nur die `{{Platzhalter}}` füllen und den Rest unverändert lassen.
> Erprobt an Board Off. Ziel: ein Modul, das direkt als Seed in die Kite-Tracker-App passt.

---

## Anleitung zum Ausfüllen

| Platzhalter | Was rein muss | Beispiel (Board Off) |
|---|---|---|
| `{{TRICK}}` | Name des Tricks | Board Off |
| `{{DISZIPLIN}}` | Big Air / Freestyle / Wave / Foil / Wing | Big Air |
| `{{SKILL_LEITER}}` | 4–6 Können-Stufen aus der Praxis, aufsteigend | Grab antippen → Grab halten → One Footer → by Fin → by Handle |
| `{{KERNÜBUNG}}` | Die wirksamste bekannte Trockenübung, falls vorhanden — sonst „keine bekannt" | Hängen im Trapez an Ring/Stange |
| `{{BEOBACHTUNGEN}}` | Was Praktiker berichten. **Nur Beobachtung, keine Erklärung.** | „By Handle wird als anstrengender empfunden als by Fin" |
| `{{ANFORDERUNGEN}}` | Erste Vermutung zu den körperlichen Anforderungen | Kompression, Griffkraft, Anti-Extension … |
| `{{PRODUKTE}}` | Kommerzielle Geräte **mit URL**, falls relevant | Boardoff Bar — https://www.boardoffbar.com/ |

**Wichtigste Regel beim Ausfüllen:** Unter `{{BEOBACHTUNGEN}}` gehören nur Beobachtungen, **niemals** eine vermutete Begründung. Eine mitgelieferte Erklärung wird vom Agent eher bestätigt als geprüft — und wenn sie falsch ist, baut die halbe Progression darauf auf.

---

## — ab hier der eigentliche Prompt —

# Recherche: Trockentrainings-Progression für {{TRICK}}

## Auftrag

Erarbeite eine **Trockentrainings-Progression**, die auf {{TRICK}} im Kitesurfen ({{DISZIPLIN}}) vorbereitet.

Kein Wassertraining, keine Trickanleitung für den Sprung selbst. Ausschließlich die körperlichen Voraussetzungen, die an Land trainierbar sind.

## Zielgruppe

Kitesurfer im Freizeit- bis fortgeschrittenen Bereich. Breite Altersspanne, überwiegend Erwachsene mit Beruf und begrenzter Trainingszeit.

- **Equipment in zwei Varianten:** mit Gym `[G]` und nur Stange/Ringe + Kettlebell `[K]`. Bei jeder Übung kennzeichnen.
- **Zeitbudget:** 15–20 Minuten, anhängbar an eine bestehende Krafteinheit, 2–3×/Woche.
- **Kein Personenbezug.** Keine Annahmen zu Alter, Gewicht, Vorverletzungen oder Trainingsstand — stattdessen Ein- und Ausschlusskriterien, anhand derer jeder selbst die Einstiegsstufe findet.
- **Kein gekauftes Gerät voraussetzen.** Eigenbau-Alternativen mitdenken.

## Ausgangsmaterial

**Skill-Leiter — das Gerüst, nicht umsortieren:**
{{SKILL_LEITER}}

Diese Reihenfolge stammt aus der Praxis. Unterlege sie mit Übungen, Dosierung und Aufstiegskriterien.

**Bekannte Kernübung:** {{KERNÜBUNG}}
Hier ansetzen, nicht bei null. Prüfen, verfeinern, mit Dosierung unterlegen.

**Beobachtungen aus der Praxis, zu prüfen:** {{BEOBACHTUNGEN}}
Für jede Beobachtung: (a) gegen weitere Praxisquellen abgleichen, (b) den **Mechanismus selbst herleiten**. Eine Erklärung ist bewusst nicht vorgegeben — finde sie. Wenn die Beobachtung sich nicht bestätigt, sag das deutlich.

**Vermutete Anforderungen — bewusst unvollständig:** {{ANFORDERUNGEN}}
Diese Liste ist ein Startpunkt, keine Vorgabe. **Suche aktiv nach fehlenden Anforderungen** und markiere Ergänzungen als solche. Widersprich, wo die Liste falsch liegt.

**Relevante Produkte:** {{PRODUKTE}}
URLs direkt aufrufen, nicht nur über Suchbegriffe suchen.

## Recherche-Auftrag

1. Kite-Coaching-Content, Trainingsvideos, Foren, Trainingspläne von Fahrern — für {{TRICK}} und benachbarte Tricks.
2. Übertragung aus Sportarten, in denen dieselben Muster besser dokumentiert sind: **Turnen** (Kompression, Holds), **Wakeboard/Snowboard** (Grabs, Rotation), **Klettern** (Griffkraft, Hangprotokolle), **Kampfsport** (Rotationskontrolle).
3. **Evidenzlage offenlegen.** Für Kitesurf-Tricks existiert kaum belastbare Trainingsliteratur. Kennzeichne durchgehend:
   - `[P]` Coaching-Praxis mit Quelle
   - `[B]` biomechanische Ableitung
   - `[V]` Vermutung ohne Beleg

   **Erfinde keine Quellen.** Ein eigener Abschnitt „Was ich nicht gefunden habe" ist Pflicht — dort gehört auch hin, wenn die Kernübung selbst unbelegt ist.

## Gewünschtes Ergebnis

In dieser Reihenfolge:

1. **Evidenzlage** — Quellentabelle plus „nicht gefunden"-Abschnitt. Zuerst, damit klar ist, worauf was beruht.
2. **Anforderungsanalyse** — mit Korrekturen und Ergänzungen zur Vorgabe, jede Zeile mit `[P]`/`[B]`/`[V]`
3. **Voraussetzungs-Check** — 3–5 Selbsttests, in unter 2 Minuten durchführbar, mit klarem Bestanden-Kriterium
4. **Einstufung** — Entscheidungsbaum, mit welcher Stufe man startet. Muss auch abdecken: Trick wird bereits gefahren, Ziel ist mehr Kontrolle. Und: Equipment fehlt.
5. **Setup und Sicherheit** — Aufbau, Tragfähigkeit, Abbruchmöglichkeit
6. **Die Stufen** — eine Tabelle pro Stufe mit: Übung · Equipment `[G]`/`[K]` · Dosierung · Metrik (`time`/`reps`) · häufiger Fehler in einem Satz · **Regression**
7. **Aufstiegskriterium pro Stufe** — messbar, nicht „wenn es sich gut anfühlt"
8. **Ampel** — rot (sofort abbrechen) / gelb (Übung abbrechen, Regression) / grün (normal, weitermachen)
9. **App-Seed** — Code-Block, siehe unten

## Format des App-Seeds

```ts
// category: '{{TRICK_SLUG}}'
// metric: 'time' für Holds, 'reps' für dynamische Übungen
// Skill-Level NICHT als eigene Übungen abbilden, sondern als Progressionsstufen über Dosierung.

export const {{trickSlug}}Exercises = [
  { id: '...', name: '...', category: '{{TRICK_SLUG}}', metric: 'time' | 'reps', perSide?: boolean },
] as const;

export const {{TRICK_SLUG}}_LEVELS = [
  {
    level: 0, label: '...', skill: null,
    items: [{ id: '...', sets: 3, reps: 10 }],
    gate: '...',
  },
] as const;
```

Übungen thematisch gruppieren (Kernübung · Kompression · Griff · Schulter · Mobilität). IDs mit einheitlichem Präfix.

## Nicht liefern

- Keine Trickanleitung, keine Wasser-Drills
- Keine allgemeinen „Core-Workouts" ohne Bezug zur konkreten Anforderung
- Keine Sit-ups, Crunches, Russian Twists
- Keine Trampolin- oder Sprungdrills — Verletzungsrisiko ohne Betreuung
- Keine erfundenen Quellen. Lieber „keine belastbare Quelle gefunden".
- Keine Bestätigung der Vorgaben um der Bestätigung willen. Widerspruch mit Begründung ist erwünscht.

---

## Nachbereitung (für dich, nicht für den Agent)

Nach jedem Lauf prüfen:
- Hat der Agent mindestens **eine** Vorgabe widerlegt oder ergänzt? Wenn nicht: Verdacht auf Gefälligkeitsantwort, kritisch nachhaken.
- Sind alle `[P]`-Zeilen mit echten, aufrufbaren URLs belegt?
- Ist der „nicht gefunden"-Abschnitt vorhanden und substanziell?
- Passt der Seed ohne Schema-Change in die App?

### Kandidaten für weitere Module
Megaloop · Handle Pass · Kiteloop · Late Backroll · Front Roll · Double Loop · Landungen allgemein
