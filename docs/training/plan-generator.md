# Plan-Generator — fachliche Grundlage

> Status: Trainingsentwurf und fachliche Referenz. **Umgesetzt** (uncommitted auf
> `i18n-de-en-fr`, Stand 2026-09-09): Logik ([`src/logic/planGenerator.ts`](../../src/logic/planGenerator.ts)
> + Seed-Pool + Tests), Onboarding ([`src/components/Onboarding.tsx`](../../src/components/Onboarding.tsx)),
> Settings-Karte, Dashboard-Hinweis, `WorkoutView`-Verdrahtung, `plan.*`-i18n (DE/EN).

Fachliche Unterlage für `src/logic/planGenerator.ts`. Legt fest, welche
Bewegungsmuster eine einzelne Krafteinheit je Disziplin und je Tagezahl enthält,
in welcher Rolle, mit wie vielen Sätzen, Wiederholungen, welchem Tempo und welcher
Pause — plus Begründung. Kein Gewicht in Kilogramm (steuert die App über die
Trainingshistorie), keine Wochenplanung (steht fest, `schedule()`), kein
Wassertraining.

Verbindliche Randbedingungen aus der [Feature-Spec](../features/plan-generator.md):
deterministisch, offline, reines Regelsystem. Die Trainingsinhalte hier sind
hinterfragbar, die Architektur nicht.

Kennzeichnung durchgängig:

- **`[P]`** — Coaching-/Trainer-Praxis mit aufrufbarer Quelle
- **`[B]`** — biomechanische / trainingswissenschaftliche Ableitung aus dokumentierten Sportarten
- **`[V]`** — Vermutung / Erfahrungswert ohne Beleg

---

## 1. Evidenzlage

### 1.1 Quellen

**Kitespezifisch — Coaching-Praxis (`[P]`), keine Interventionsstudien**

| Quelle | Aussage, die hier verwendet wird |
|---|---|
| Duotone Kiteboarding Academy, „19 New Workouts" ([duotonesports.com](https://www.duotonesports.com/en/kiteboarding/stories/stories/19-new-workouts), [IKSURFMAG](https://www.iksurfmag.com/kitesurfing-news/2023/10/19-new-workouts-academy-app/)) | Team-Athleten-Programm (Trainer N. Borgatti, mit R. Arnaus, S. Spiessberger). „Kritische Muskelgruppen und Ganzkörper-Konditionierung für Fitness **und Verletzungsresistenz**." Protokoll-Details nur auf App-Ebene, nicht öffentlich verschreibbar. |
| MACkite, „Why Exercising Makes You A Better Kiteboarder" ([mackiteboarding.com](https://www.mackiteboarding.com/how-exercise-makes-you-a-better-kitesurfer.htm)) | Gym-Fokus für Kite = **Gelenk-Resilienz und Power-Ausdauer**, nicht Hypertrophie: „stacked" durch Chop bleiben, Sheeting-Wechsel kontrollieren, Schultern und unterer Rücken schützen, wenn müde. |
| North, Marc-Jacobs-Interview ([northactionsports.com](https://northactionsports.com/blogs/all/the-next-level-marc-jacobs-interview)) | Big-Air-Profi: „viel Gym", Ziel **keine schwachen Muskelgruppen / Dysbalancen**, explizit zur Verletzungsprävention. |
| Red Bull, „Kiteboarding progression … Megaloop board-offs" ([redbull.com](https://www.redbull.com/us-en/kiteboarding-progression-tricks-guide-megaloop)) | Megaloop/Big Air: Mindest-Fitnessniveau als Sicherheitsvoraussetzung; Board-Off als Standard-Ziel im Big-Air-Bereich. |
| Surfertoday, „How to pull big airs" ([surfertoday.com](https://www.surfertoday.com/kiteboarding/how-to-pull-big-airs-in-kiteboarding)); Elite Watersports, „Jump Higher" ([elitewatersports.com](https://elitewatersports.com/blogs/beginner-information/jump-higher-kiteboarding)) | Landung: **tail-first, weiche Knie, Beine fallen lassen**. Pop: „je stärker Beine und Core, desto härter der Pop". Box Jumps für Absprung-Power. |
| kitewingandfoil.com, „Strength Training for Kitesurfing & Wing Foiling" ([kitewingandfoil.com](https://kitewingandfoil.com/strength-training-exercises-for-kitesurfing-and-wing-foiling/)) | „Grip-Ausdauer, Schulterstabilität, rotatorische Core-Kraft, Unterkörper-Power für Stance und Pop." **2 Einheiten/Woche** für die meisten, dritte kurze nur bei guter Regeneration und viel Wasserzeit; 5–7 Übungen, 1–2 Wdh. „in der Tank". Winging: **Schultern + Core** priorisieren, Druck/Zug ausbalancieren. |
| SROKA, „How fit … wing foil?" ([srokacompany.com](https://srokacompany.com/en/blog/how-fit-are-you-to-practice-wing-foil/)); surf-magazin.de, „Training for wingsurfers" ([surf-magazin.de](https://www.surf-magazin.de/en/wingsurfing/how-to/tips-and-tricks/training-for-wingsurfers-the-best-exercises-for-foiling/)); kiteworldshop.com ([kiteworldshop.com](https://www.kiteworldshop.com/en/blog/physical-preparation-wing-foil-kitesurf-n20)) | Foil-Sailing: **Balance maximal, anaerob niedrig-mittel**, explosive Power nur zum An-Pumpen. Skapula-Stabilisatoren die meistbeanspruchte Gruppe beim Wingen. |
| hydrofoiling.org, „Core Strength Exercises for Hydrofoil Foiling" ([hydrofoiling.org](https://www.hydrofoiling.org/hydrofoil-foiling-and-core-strength-exercises/)) | Foilen belastet den Rumpf **isometrisch und exzentrisch**: Rectus abdominis dauerkontrahiert gegen das Kippen des Oberkörpers, Obliquen dynamisch gegen die Rotationskräfte des Foils. Knie weich als Stoßdämpfer. |
| The Inertia, „Strength Train for Surfing: Paddling" ([theinertia.com](https://www.theinertia.com/surf/how-to-properly-strength-train-for-surfing-paddling/)); Vasa ([vasatrainer.com](https://vasatrainer.com/blog/how-to-properly-strength-train-for-surfing/)) | Wellenreiten (Übertrag Wave/Strapless): >50 % der Zeit Paddeln, HF >120 in >80 % der Session → **aerob-anaerobe Ausdauer**, hintere Schulter/Skapula, rotatorischer Core, Hüfte/Beine. „Funktional, instabil, rotatorisch — nicht Maximalkraft/Hypertrophie." |
| StrengthClimbing, „Hangboard Repeaters" ([strengthclimbing.com](https://strengthclimbing.com/hangboard-repeaters/)); Gripped ([gripped.com](https://gripped.com/indoor-climbing/build-strength-endurance-with-hangboard-repeaters-heres-how/)) | Griff-**Ausdauer** (Übertrag Wave/Wing/Board-Off): intermittierende Hangs / Repeaters schlagen Maximal-Holds; ~45 % Verbesserung Griffausdauer in 8 Wochen. |

**Biomechanik / Trainingswissenschaft (`[B]`)**

| Quelle | Aussage |
|---|---|
| Injuries in kitesurfing — retrospektive Umfrage nach **Disziplin und Level**, BMC Sports Sci Med Rehabil 2026 ([Springer](https://link.springer.com/article/10.1186/s13102-026-01551-w), [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12969894/)) | Freestyle: Knieband **10,1 %** (höchster Wert aller Disziplinen), Finger 6,8 %, Schulterluxation 4,7 %. Big Air: **Rippen 19,3 %**, Gehirnerschütterung 7,2 %, Knieband 6,9 %. Wave/Strapless: Schürfwunden 35,2 %, Knieband 5,9 %. Freeride: Schürfwunden 30,7 %, Rippen 9,7 %. Knieband-Verletzungen = mit Abstand der größte kumulierte Ausfall (35 076 Tage), nur 64,3 % kehren auf Vorniveau zurück. ACL-Rekonstruktion ist der häufigste operierte Eingriff. Anfänger 65 / 1000 h vs. Profis 1,1 / 1000 h. |
| Epidemiology of injuries in kitesurfing ([PubMed](https://pubmed.ncbi.nlm.nih.gov/41664971/)); Kiteboarding Injuries: Epidemiology …, Clin J Sport Med 2025 ([journals.lww.com](https://journals.lww.com/cjsportsmed/abstract/2025/07000/kiteboarding_injuries__epidemiology,_common.14.aspx)); Biomechanical and Physiological Demands of Kitesurfing ([ResearchGate](https://www.researchgate.net/publication/257535169_Biomechanical_and_Physiological_Demands_of_Kitesurfing_and_Epidemiology_of_Injury_Among_Kitesurfers)) | Über alle Disziplinen: **Knie ~24 %, Sprunggelenk/Fuß ~19 %, Rippen ~13 %, Schulter ~10 %**. Untere Extremität ~43 %. Verletzungsinzidenz grob 4–10 / 1000 h. |
| NSCA — Satz-/Wiederholungsbereiche ([ptpioneer NSCA-CPT Kap. 15](https://www.ptpioneer.com/personal-training/certifications/nsca-cpt/nsca-cpt-chapter-15/); [NSCA Coach 12.3.8, PDF](https://www.nsca.com/globalassets/education/articles/coaches/12.3/nsca-coach-12.3.8_using-intensity-based-on-sets-and-repetitions.pdf)) | Kraft 1–6 Wdh. (≥85 % 1RM), Pause 2–5 min. Power 3–6 Sätze × 1–6 Wdh., Pause 2–5 min. Kraftausdauer >15 Wdh. (<67 % 1RM), Pause ~30 s (Zirkel) bis 3 min. |
| Minimal effective dose: Androulakis-Korakakis et al., syst. Review + Meta ([PubMed 31797219](https://pubmed.ncbi.nlm.nih.gov/31797219/)); Powerlifter-MED ([Frontiers](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2021.713655/full)); „Minimalist Training" narrative Review ([PMC10933173](https://pmc.ncbi.nlm.nih.gov/articles/PMC10933173/)); „Minimal dose … general population" ([PMC11127831](https://pmc.ncbi.nlm.nih.gov/articles/PMC11127831/)) | **Kraft** wird mit ~1 harten Satz je Muster/Woche bzw. 1 Einheit/Woche über 8–32 Wochen **gehalten**, wenn die Intensität/Anstrengung hoch bleibt. Volumen ist für den Erhalt zweitrangig, **Last und Nähe zum Muskelversagen sind entscheidend**. |
| Isometrisches Training: Oranchuk et al., syst. Review ([PubMed 30580468](https://pubmed.ncbi.nlm.nih.gov/30580468/)) | Adaptation stark **winkel- und dauerspezifisch**. Lange Holds (4×30 s) > kurze (4×10×3 s) für Hypertrophie bei gleicher Time-under-Tension. Praxis: mit 1 Satz/Übung beginnen, dann 2.; alternativ 3–5×30–60 s. |
| Trap-Bar vs. Langhantel-Kreuzheben ([Stronger by Science](https://www.strongerbyscience.com/trap-bar-deadlifts/), fasst Swinton et al. 2011 zusammen) | Trap-Bar senkt **Spitzenmoment an LWS und Hüfte** signifikant, verlagert Last Richtung Knie. Erector-/Hamstring-EMG etwas höher bei der geraden Stange, Quad-EMG höher bei Trap-Bar. |
| Goblet-/Front- vs. Back-Squat ([sportscienceinsider.com](https://sportscienceinsider.com/goblet-squat-vs-front-squat-a-comparative-guide/)) | Front-geladene Kniebeuge (Goblet, Front) reduziert **Wirbelsäulen-Kompression** gegenüber Back Squat bei vergleichbarer Quad-Aktivierung; aufrechterer Rumpf. Goblet technisch anspruchsloser als Front Squat. |
| Landungs-/ACL-Prävention: syst. Review + Meta ([PMC10254820](https://pmc.ncbi.nlm.nih.gov/articles/PMC10254820/)) | Bodenreaktionskraft bei Landung 3–5× Körpergewicht. Kniebeugung <30° bei Bodenkontakt erhöht ACL-Last. **Exzentrik-betontes Training** verbessert dynamische Kniestabilität; die exzentrische „Brems"-Phase wird in Programmen oft vernachlässigt. Knieextensoren sind die dominante Gruppe bei der Kraftabsorption. |
| Nordic-Hamstring: van Dyk et al. 2019, „halbiert die Rate" ([ResearchGate](https://www.researchgate.net/publication/331367089_Including_the_Nordic_hamstring_exercise_in_injury_prevention_programmes_halves_the_rate_of_hamstring_injuries_A_systematic_review_and_meta-analysis_of_8459_athletes)) — **Gegenposition**: methodische Neubewertung, Effekt „inconclusive" ([PubMed 34520846](https://pubmed.ncbi.nlm.nih.gov/34520846/)) | NHE reduziert Hamstring-Verletzungen um „bis zu 51 %" — Zahl ist umstritten. Unstrittiger: NHE erzeugt sehr hohe exzentrische Knieflexor-Last ([Nordic vs. Razor Curl EMG, PMC10723670](https://pmc.ncbi.nlm.nih.gov/articles/PMC10723670/)). |
| Proximale Hamstring-Tendinopathie, JOSPT 2016 ([jospt.org](https://www.jospt.org/doi/10.2519/jospt.2016.5986)) | Tempo-Vorgabe für kontrollierte Knieflexor-Arbeit: **3 s je Phase** (metronomgestützt), 3–4 Sätze, Start 15RM → 8RM. |
| Anti-Bewegungs-Core / McGill ([ideafit.com](https://www.ideafit.com/using-anti-rotation-to-coach-rotation/)) | Primärfunktion des Rumpfes ist **Anti-Bewegung** (Beugung/Rotation/Streckung unter Last verhindern). „Big Three" (Curl-up, Side Plank, Bird Dog). Pallof Press = Anti-Rotation, trainiert die **Absicht zu bewegen**, nicht die Bewegung → geringes Risiko, hoher Nutzen für die LWS. Rumpfsteifigkeit ist das Zentrum der Kraftübertragung. |

### 1.2 Was ich nicht gefunden habe — keine Quelle, nicht erfunden

- **Keine einzige Interventionsstudie zu Krafttraining bei Kitesurfern.** Kein RCT, keine Kohorte mit Trainings-Vorher-Nachher. Jede disziplinspezifische Dosierung unten ist `[B]` oder `[V]`, nie `[P]` im Sinne von „belegt wirksam".
- **Kein öffentliches S&C-Programm eines Profi-Teams mit konkreten Sätzen/Wiederholungen/Tempo.** Die Duotone- und North-Academy-Apps existieren, ihre Protokolle sind aber paywalled und nur auf Artikelebene beschrieben.
- **Keine biomechanische Messung der Landungskräfte im Kite-Big-Air.** Die 3–5×-Körpergewicht-Zahl und die Exzentrik-Logik sind aus Turnen/Leichtathletik/Sprungsport übertragen.
- **Keine Daten zu Bein-Asymmetrie bei Kitesurfern** oder ihrem Zusammenhang mit Verletzungen. Übertragen aus anderen einbeinig-dominanten Sportarten.
- **Foil und Wing haben kaum eigene Verletzungsepidemiologie.** Die Disziplin-Verletzungstabelle der 2026-Umfrage ist für diese beiden dünn bis leer — beide Sportarten sind zu neu.
- **preferGentle:** keine Studie mit Schmerz-/Verletzungs-Endpunkten für z. B. Goblet vs. Front Squat bei älteren oder dekonditionierten Trainierenden. Die Gelenklast-Aussagen sind aus allgemeiner Biomechanik (EMG, Wirbelsäulenmoment, patellofemorale Kraft), nicht aus Outcome-Studien.
- **Kite-Griffausdauer:** kein kitespezifisches Protokoll. Übertragen aus Kletter-Hangboard-Literatur.

---

## 2. Disziplin-Anforderungsanalyse

Format: begrenzende Qualität → relevante Muster → Korrektur an der Fokus-Tabelle. Jede Zeile getaggt.

### 2.1 Big Air / Megaloop

| Qualität | Muster | Tag |
|---|---|---|
| Exzentrische Landungskapazität Knie (BRK 3–5× KG, tail-first, weiche Knie) | `squat`, `single-leg`, `hamstring-curl` | `[B]` Landungs-Review + `[P]` Surfertoday/Elite |
| Hüft-Power / Absprung (Pop, „harder pop with stronger legs+core") | `hinge` (explosiv), `single-leg` | `[P]` Elite Watersports |
| Rumpf-**Anti-Extension** gegen den nach oben-hinten ziehenden Loop und bei harter Landung | `core-anti-ext` | `[B]` — Zugrichtung + Rippen 19 % häufigste Big-Air-Verletzung |
| Griff / einarmige Überkopf-Stabilität (Board-Off ist Big-Air-Standard; Bar durch den Loop halten) | `carry`, `pull-v` | `[P]` Red Bull; Querverweis [board-off-progression.md](board-off-progression.md) |
| Dysbalancen vermeiden (Profi-Praxis) | ganzkörperliche Grundabdeckung | `[P]` North / M. Jacobs |

**Korrektur an der Fokus-Tabelle:** „Exzentrik, Landungskapazität, Hüft-Power" ist richtig, aber unvollständig. **Ergänzen: `core-anti-ext` und Griff.** Die häufigste Big-Air-Verletzung sind Rippen (19 %), nicht Knie — das ist Rumpf-unter-Zug, nicht Beinkraft. Die Exzentrik gehört primär auf `squat`/`single-leg`/`hamstring-curl` (Knie-Bremsen), **nicht** auf `hinge` — der `hinge` ist im Big Air die explosive Absprungqualität. `[B]`

### 2.2 Freestyle / Wakestyle

| Qualität | Muster | Tag |
|---|---|---|
| Knie unter geladenem Pop + flacher Landung auf gekippter Kante | `squat`, `single-leg` (exzentrisch **und** explosiv) | `[B]` — Knieband 10,1 %, der höchste Wert aller Disziplinen |
| Rotationskontrolle (Handle Pass, gedrehte Landung) | `core-anti-rot` | `[B]` McGill: Anti-Rotation baut Widerstandsfähigkeit gegen Rotationsstress |
| Explosiver Pop (geladene Kante → Absprung) | `hinge` (explosiv), `squat` (explosiv) | `[P]` Elite Watersports |
| Griff / Finger (Bar durch Rotationen halten; Finger 6,8 %) | `carry`, `pull-h` | `[B]` Verletzungsdaten |

**Korrektur:** „Rotation, Knie, Pop" trifft zu und ist die am besten belegte Zeile der Tabelle (Knieband-Daten). Schärfen: Freestyle braucht am Knie **beides** — explosiv für den Pop, exzentrisch für die harte flache Landung. `eccentricPatterns` und `repProfile: power` schließen sich hier nicht aus (kurze exzentrische Notiz auf den Krafttag-Slots, explosiv auf dem Circuit). `[B]`

### 2.3 Wave / Strapless

| Qualität | Muster | Tag |
|---|---|---|
| Aerob-anaerobe Wiederholungsausdauer (viel Positionieren, gusty onshore) | `endurance`-Profil global | `[P]` Übertrag Wellenreiten (Inertia/Vasa) |
| Strapless-Boardkontrolle, Bottom Turns → einbeinig, frontale Ebene | `single-leg`, `core-anti-lat` | `[B]` — Board nicht fixiert, Kontrolle über Standbein + laterale Rumpfsteifigkeit |
| Hintere Schulter / Skapula-Ausdauer (Bar in böigem Wind, Reaktivgriffe) | `pull-h` | `[P]` Wellenreit-Übertrag: posteriore Schulter schützt die Rotatorenmanschette |
| Rumpf gegen laterale Kräfte rail-to-rail | `core-anti-lat`, `carry` | `[B]` |

**Korrektur:** Fokus-Tabelle sagt „Ausdauer, Schulter, Rumpf" mit betonten Mustern `pull-v`, `push-v`, `core-anti-lat`. **`push-v` streichen** — Wave-Reiter drücken nichts über Kopf; die Schulterqualität ist posteriorer Zug und Skapula-Ausdauer, also `pull-h`, nicht `push-v`. **`single-leg` aufnehmen** — Strapless ist die einbeinigste der fünf Disziplinen. Neue Betonung: `pull-h`, `single-leg`, `core-anti-lat`. `[B]`/`[P]`

### 2.4 Foil (Kitefoil)

| Qualität | Muster | Tag |
|---|---|---|
| Isometrische Beinarbeit (Foil-Trim halten, Dauerkorrekturen, Knie weich als Dämpfer) | `squat` (iso), `single-leg` (iso) | `[P]` kiteworldshop / hydrofoiling |
| Rumpf isometrisch gegen Oberkörper-Kollaps über dem Foil | `core-anti-ext` | `[P]` hydrofoiling.org |
| Obliquen dynamisch gegen die Rotationskräfte des Foils | `core-anti-rot` | `[P]` hydrofoiling.org |
| Explosive Power nur zum An-Pumpen (Start) | `hinge`/`squat` explosiv, **1 Slot** | `[P]` kiteworldshop |

**Korrektur:** „isometrische Bein- und Rumpfarbeit" ist richtig. Ergänzen: **`single-leg` iso** (Foilen ist gestaffelt/einbeinig, nicht symmetrisch) und **`core-anti-rot`** (Obliquen gegen Foil-Drehmoment). Und ein Widerspruch zum reinen Iso-Bild: es braucht **einen** explosiven Slot für den Anfahr-Pump — ein Foil-Plan aus lauter Holds bildet den Sport nicht ab. Deshalb bleibt auf Tag A der `hinge`-Primär-Slot explosiv, auch wenn `repProfile: isometric`. `[B]`/`[P]`

### 2.5 Wing (Wingfoil)

| Qualität | Muster | Tag |
|---|---|---|
| Skapula-Stabilität (Wing zieht nach vorn, Schultern zurückhalten) — meistbeanspruchte Gruppe | `pull-h`, `core-anti-rot` | `[P]` kitewingandfoil / SROKA |
| Griffausdauer Boom/Handles, häufige starke Steuerbewegungen | `carry`, `pull-h` | `[P]` kitewingandfoil |
| Rumpfausdauer (Balance halten, Wing effektiv führen) | `endurance`-Profil, `core-anti-rot` | `[P]` kitewingandfoil |
| Foil-Beinarbeit (identisch zu Foil) | über Basis-Skelett `squat`/`single-leg` | `[B]` |
| Druck/Zug ausbalancieren, sonst Schulterschmerz | `pull-h` als Ausgleich zu `push-h` | `[P]` kitewingandfoil |

**Korrektur:** „Schulter, Griff, Rumpfausdauer" trifft zu. Betonte Muster in der Spec: `carry`, `pull-h`, `push-v`. **`push-v` streichen** (gleiche Begründung wie Wave — die Quellen nennen ausdrücklich *Skapula-Retraktion* und *Druck/Zug-Balance zugunsten von Zug*, nicht Überkopfdrücken). Neue Betonung: `pull-h`, `carry`, `core-anti-rot`. `[P]`

### 2.6 Querschnitts-Korrektur: `push-v` ist in der Fokus-Tabelle überrepräsentiert

`push-v` (Überkopfdrücken) steht bei Wave **und** Wing als betontes Muster, ist aber
bei keiner der fünf Disziplinen eine begrenzende Qualität. Kein Fahrer-Content und
keine Biomechanik nennt Überkopf-Druckkraft als Leistungs- oder Verletzungsfaktor.
`push-v` bleibt im Vokabular und wird auf dem 3-Tage-Circuit trainiert (KB Clean &
Press ist ein legitimer explosiver Ganzkörper-Slot) sowie über die
Equipment-Auflösung — aber **es ist nirgends `emphasis`**. `[B]`

---

## 3. Skelett-Review

`P` = primary, `A` = accessory. Reihenfolge im Skelett = Reihenfolge in der Einheit.

**Sequenzierungs-Regel (`[B]`, NSCA-Standard):** Primär vor Accessory; innerhalb
der Primären das neural anspruchsvollste / explosivste zuerst (`hinge`/`squat`
führen, explosiv vor grindend); Core-Anti-Bewegung **ans Ende** (die Rumpfsteifer
vor den schweren Lifts zu ermüden ist kontraproduktiv — McGill); `carry` als
Finisher.

### 3.1 — 1 Tag (Ganzkörper, `type: 'A'`)

| Slot | Spec | Review | Begründung |
|---|---|---|---|
| 1 | `hinge` P | **bestätigt** P | Posteriore Kette: Edging, Landung, Absprung — das kiterelevanteste Einzelmuster. `[B]` |
| 2 | `squat` P | **bestätigt** P | Knie-dominante Landungsabsorption + Stance. Knie ~24 % aller Verletzungen. `[B]` |
| 3 | `push-h` P | **→ A** (bleibt im Slot, Rolle sinkt) | Auf einem 1×/Woche-Plan reicht ein Accessory-Druck für Schultergesundheit/Balance. `[P]` MACkite |
| 4 | `pull-v` P | **→ `pull-h` P** | **Korrektur 1.** Der Bar-Zug im Kite ist ein Ruder-/Zug-zum-Körper-Muster, kein Klimmzug. Horizontaler Zug balanciert das horizontale Drücken (Schultergesundheit) und trifft die Skapula-Retraktionshaltung, die Fahrer gegen den Kite-Zug halten. `pull-v` braucht mehr Schulterbeweglichkeit und ist als eigener Slot auf den Mehrtage-Plänen besser aufgehoben. `[P]`/`[B]` |
| 5 | `single-leg` A | **bestätigt** A | Jeder Boardsport ist einbeinig-dominant; Asymmetrie; Foil/Strapless. `[B]` |
| 6 | `core-anti-rot` A | **bestätigt** A, als letzter Slot | Wenn nur ein Core-Muster, dann das mit der breitesten Übertragung (Kraftübertragung Kite→Board). `[B]` McGill |

**Deckt es genug ab?** Nein, vollständig kann ein Tag das nicht — `push-v`, `carry`,
`hamstring-curl`, `core-anti-ext`, `core-anti-lat` fehlen. Das ist bei 1×/Woche
unvermeidbar und akzeptabel: das 1-Tage-Skelett priorisiert die vier
Grund-Kraftmuster + einbeinig + Rumpf. Die Disziplin-Betonung (Abschnitt 4) hängt
je einen relevanten Zusatz-Slot an.

### 3.2 — 2 Tage (Referenz, ~ heutige Tag A / Tag B)

**Tag A „Push / Beine" (`type: 'A'`)** — deckt sich exakt mit dem heutigen Seed-Template (Trap-Bar, BSS, Bank/OHP, Nordic negativ, Suitcase Carry):

| Slot | Muster/Rolle | Review |
|---|---|---|
| 1 | `hinge` P | bestätigt — schwerer Primär-Hinge, führt. |
| 2 | `single-leg` A | bestätigt — einbeinige Knie-/Hüftarbeit früh, solange frisch. |
| 3 | `push-h` P | bestätigt — einziger Primär-Druck der Woche. |
| 4 | `hamstring-curl` A | bestätigt — Knieflexor-Exzentrik (Landung/ACL). Default-Tempo 3–4 s exzentrisch. |
| 5 | `carry` A | bestätigt — Finisher, Griff + Anti-Lateralflexion unter Last. |

**Tag B „Zug / Landung" (`type: 'B'`)**

| Slot | Spec | Review | Begründung |
|---|---|---|---|
| 1 | `pull-v` P | **bestätigt** P | Vertikaler Zug hier korrekt als eigener Primär-Slot (anders als 1-Tage-Plan) — Board-Off, Rückenbreite, Zug-Balance. |
| 2 | `squat` P | **bestätigt** P | Bilaterale Knie-Primärarbeit, komplementär zu Tag A `single-leg`. |
| 3 | `pull-h` A | **bestätigt** A | Rudern — Skapula, posteriore Schulter. |
| 4 | `hinge` A (einseitig) | **bestätigt** A | Einseitiger RDL — Anti-Rotation + Hamstring bei geringerer Last als Tag A. |
| 5 | `core-anti-rot` A | **bestätigt** A | Pallof / Bird Dog. |
| 6 | `core-anti-lat` A | **→ `core-anti-ext` A** | **Korrektur 2.** Anti-Extension fehlt in *jedem* Spec-Skelett und ist die kiterelevanteste Rumpfqualität: dem Kite widerstehen, der dich in die Streckung zieht; Board-Off-Kompression; Landung mit noch ziehendem Kite. Anti-Lateralflexion bleibt über den Suitcase Carry auf Tag A abgedeckt (einseitiger Carry ist ein vollwertiger Anti-Lat-Reiz). `[B]` McGill + Zugrichtung |

**Weekly nach Korrektur:** hinge 2–3, squat 1, single-leg 1–2, push-h 1, pull-v 1,
pull-h 2, carry 1, hamstring-curl 1, anti-rot 1, anti-ext 1, anti-lat (via carry) 1.
`push-v` = 0 — bewusst (Abschnitt 2.6), kein Kite-Limiter auf einem 2-Tage-Budget.

### 3.3 — 3 Tage (A + B + Circuit `type: 'KB'`)

| Slot | Spec | Review | Begründung |
|---|---|---|---|
| 1 | `hinge` explosiv P | **bestätigt** P | KB-Swing o. ä. — kitespezifische Hüft-Power, rückenfreundlich bei sauberer Technik. |
| 2 | `push-v` A | **bestätigt** A | KB Clean & Press — der Circuit braucht ein explosives Oberkörper-/Ganzkörperelement; `push-v` ist hier legitim (Abschnitt 2.6 schließt nur die *emphasis* aus, nicht den Slot). |
| 3 | `core-anti-lat` A | **bestätigt** A | KB Windmill / Suitcase Hold. |

**Korrektur 3 (Dosierung, nicht Struktur):** Der Circuit heißt „Circuit" und hat
`type: 'KB'`, aber die beiden explosiven Slots dürfen **nicht** als Metcon mit
kurzer Pause gefahren werden. Ein ermüdeter explosiver Hinge ist ein
LWS-Risiko und verliert die Power-Qualität, um die es geht. Slots 1–2:
**Power-Pacing — 90–120 s Pause, Satz beenden, sobald die Bewegungsgeschwindigkeit
sichtbar abfällt.** Nur der Core-Slot ist zirkelartig. `[B]` NSCA Power-Vorgaben.

### 3.4 — 4 Tage (A + B + Circuit + Tag D)

**Ist Tag D sinnvoll oder besser ein zweiter Beintag? → Beides.** Die Spec-Version
von Tag D („Oberkörper / Grip": `push-h` A · `pull-h` A · `carry` A · `core-anti-rot` A)
hat **keinen einzigen Primär-Slot** — ein reiner Accessory-Tag ist ein Füll-Tag mit
niedrigem Reiz. Und die Verletzungsdaten sagen klar Untere-Extremität (~43 %, Knie
~24 %, Sprunggelenk/Fuß ~19 %): der Sport ist zu ~70 % Beine. Ein 4-Tage-Plan mit
2 Bein- und 2 Oberkörpertagen gewichtet falsch.

**Korrektur 4 — Tag D wird ein echter zweiter Bein-/Rumpftag (`type: 'D'`):**

| Slot | Muster/Rolle | Begründung |
|---|---|---|
| 1 | `single-leg` **P** | Einbeinige Landungskapazität + Inter-Limb-Asymmetrie = die wertvollste Unterkörper-Qualität, die auf A/B nicht primär ist. Knie + Sprunggelenk/Fuß sind die zwei meistverletzten Regionen. `[B]` |
| 2 | `pull-h` A | Behält horizontalen Zug/Skapula (die Wave/Wing-Schulterqualität) im Plan. |
| 3 | `carry` A | Griff-Stimulus, für Wave/Wing der Limiter — verteilt, nicht als schwacher Extra-Tag. `[P]` |
| 4 | `core-anti-ext` A | Zweite Anti-Extension-Exposition/Woche (Finisher). |

Die Griff-/Schulter-Bedürfnisse der Ausdauer-Disziplinen werden über die
Disziplin-Betonung (`pull-h`/`carry` als emphasis → Zusatz-Slot) + das
`endurance`-Wiederholungsprofil getragen, nicht über einen eigenen Schwachtag.

> **Schema-Hinweis:** Das 4-Tage-Skelett braucht einen vierten `type`-Wert.
> `DaySkeleton['type']` (heute `'A' | 'B' | 'KB'`) und `SessionType` um `'D'`
> erweitern — die einzige nötige Schema-Ergänzung. Der Datenblock unten verwendet
> `type: 'D'`.

---

## 4. Disziplin-Profile

### 4.1 Basis-Dosierung (`REP_PROFILE`)

Wird auf **jeden** Slot angewandt, nachdem das Skelett steht; setzt `reps` bzw.
`sec`. `slotOverrides` schlagen das. `carry`-Slots ignorieren `REP_PROFILE`
(immer distanzbasiert, `reps` = Meter aus dem Skelett).

| repProfile | primary | accessory | Default-Tempo-Zusatz |
|---|---|---|---|
| `strength` | 5 Wdh. | 8 Wdh. | — |
| `power` | 3 Wdh. | 5 Wdh. | „explosiv hoch, 2 s exzentrisch" auf primär `squat`/`hinge`/`single-leg` |
| `endurance` | 12 Wdh. | 15 Wdh. | — |
| `isometric` | 6 Wdh. | 10 Wdh. | — |

**`isometric` ist bewusst wdh.-basiert, nicht sekundenbasiert** (Abweichung vom
ersten Entwurf). Grund: ein `sec`-Wert auf einem Slot, der auf eine
wdh.-metrische Übung (z. B. Bulgarian Split Squat) auflöst, ergibt Unsinn. Die
echten Zeit-Holds entstehen bei Foil über `slotOverrides` (`sec: 40` auf `squat`
und `core-anti-ext`) **plus** `exercisePrefer`, das den Slot auf eine
`metric: 'time'`-Übung zieht (`wall-sit`, `hollow-body-hold-strength`). Alle
anderen Foil-Slots laufen mit moderaten Wiederholungen.

Sätze kommen aus dem Skelett (primär 4, `single-leg`-Primär auf Tag D 4,
Circuit-Hinge 5, alle Accessory 3). Die beiden explosiven Circuit-Slots sind fix
**Skelett-Sätze × 4 Wdh.**, unabhängig vom `repProfile` und von den
`slotOverrides` (Abschnitt 3.3). Pause: nicht im Datenmodell — `TemplateExercise`
hat kein Pausenfeld. Richtwerte (Doku, nicht Code): Kraft/Power 150–180 s,
Ausdauer 60–75 s, Holds 90 s, Circuit 90–120 s.

### 4.2 Profile je Disziplin

Jede Tabelle: betonte Muster · Wiederholungsprofil · Exzentrik-Tempo (wo) ·
Slot-Overrides mit konkreten Zahlen. `generateTemplates` zieht daraus ohne weitere
Entscheidung.

#### Big Air

| | |
|---|---|
| **emphasis** | `hinge`, `single-leg`, `hamstring-curl` |
| **repProfile** | `strength` |
| **eccentricPatterns** | `squat`, `single-leg`, `hamstring-curl` — Tempo-Notiz „3–4 s exzentrisch senken, unten nicht ablegen" |
| **Zusatz-Slot** (erstes emphasis-Muster, das am Tag fehlt) | Tag A: keiner (alle drei schon da) · Tag B: `single-leg` A · Tag D: `hinge` A |

Slot-Overrides:

| pattern · role | sets | reps/sec | Tempo | Pause |
|---|---|---|---|---|
| `hamstring-curl` · accessory | 4 | 6 | 3–4 s exzentrisch | 120 s |
| `squat` · primary | 4 | 5 | 3–4 s exzentrisch, explosiv hoch | 180 s |
| `single-leg` · primary/accessory | 4/3 | 6 / 8 je Seite | 3–4 s exzentrisch | 150 s / 90 s |
| `hinge` · primary (Circuit) | 5 | 4 | explosiv aus der Hüfte | 120 s |

#### Freestyle

| | |
|---|---|
| **emphasis** | `single-leg`, `squat`, `core-anti-rot` |
| **repProfile** | `power` |
| **eccentricPatterns** | `squat`, `single-leg` — „3 s exzentrisch, dann explosiv hoch" |
| **Zusatz-Slot** | Tag A: `squat` A · Tag B: `single-leg` A · Tag D: `squat` A |

Slot-Overrides:

| pattern · role | sets | reps/sec | Tempo | Pause |
|---|---|---|---|---|
| `squat` · primary | 4 | 3 | 3 s exzentrisch, explosiv hoch | 165 s |
| `single-leg` · primary | 4 | 4 je Seite | 3 s exzentrisch, explosiv hoch | 150 s |
| `core-anti-rot` · accessory | 3 | 8 je Seite | zügig-reaktiv, kein Zeitlupentempo | 75 s |
| `hinge` · primary (Circuit) | 5 | 3 | explosiv (Pop aus der Grube) | 120 s |

#### Wave

| | |
|---|---|
| **emphasis** | `pull-h`, `single-leg`, `core-anti-lat` |
| **repProfile** | `endurance` |
| **eccentricPatterns** | `single-leg` — nur „2 s exzentrisch kontrolliert" (Turn-Kontrolle), sonst keiner |
| **Zusatz-Slot** | Tag A: `pull-h` A · Tag B: `single-leg` A · Tag D: `core-anti-lat` A |

Slot-Overrides:

| pattern · role | sets | reps/sec | Tempo | Pause |
|---|---|---|---|---|
| `single-leg` · primary/accessory | 3 | 12 je Seite | 2 s exzentrisch | 75 s / 60 s |
| `carry` · accessory | 3 | 60 m je Seite | zügig gehen | 60 s |
| `core-anti-lat` · accessory | 3 | 40 s je Seite | ruhig halten | 45 s |
| `pull-h` · primary/accessory | 3 | 12–15 | zügig | 75 s / 60 s |

#### Foil

| | |
|---|---|
| **emphasis** | `squat`, `single-leg`, `core-anti-ext` |
| **repProfile** | `isometric` |
| **eccentricPatterns** | keiner |
| **Zusatz-Slot** | Tag A: `squat` A (iso) · Tag B: `single-leg` A (iso) · Tag D: `squat` A (iso) |

Slot-Overrides (`exercisePrefer`: `squat → wall-sit`, `core-anti-ext → hollow-body-hold-strength`):

| pattern · role | sets | reps/sec | Tempo |
|---|---|---|---|
| `squat` · (beide) | Skelett | 40 s (`wall-sit`) | statisch, Rumpf fest |
| `core-anti-ext` · (beide) | Skelett | 40 s (`hollow-body-hold-strength`) | LWS flach, Rippen unten |
| `single-leg` · (beide) | Skelett | 10 Wdh. je Seite | 2 s Pause unten, langsam |
| `hinge` · primary (Tag A) | 4 | 5 Wdh. | **explosiv** — der Anfahr-Pump, überschreibt `isometric` |

Der Circuit-`hinge` (Tag 3/4) bleibt über den Circuit-Fix-Klammer explosiv,
unabhängig vom `hinge`-Override.

#### Wing

| | |
|---|---|
| **emphasis** | `pull-h`, `carry`, `core-anti-rot` |
| **repProfile** | `endurance` |
| **eccentricPatterns** | keiner |
| **Zusatz-Slot** | Tag A: `pull-h` A · Tag B: `carry` A · Tag D: `core-anti-rot` A |

Slot-Overrides:

| pattern · role | sets | reps | Tempo |
|---|---|---|---|
| `pull-h` · primary | Skelett | 15 | oben 1 s halten, Schulterblätter zusammen |
| `carry` · (beide) | Skelett | 50 m je Seite | aufrecht, Rippen unten |
| `core-anti-rot` · accessory | Skelett | 12 | oben 1 s halten, ruhig gegen den Zug |

`core-anti-rot` läuft auf `pallof-press` (wdh.-metrisch) → als Wiederholungen
mit Haltevorgabe, nicht als reiner Zeit-Hold.

---

## 5. Saison-Reduktion — Bewertung der `maintain`-Regel

**Spec:** `build` = Sätze wie festgelegt; `maintain` = jede Primärübung −1 Satz
(min. 2), letzter Accessory-Slot je Tag entfällt.

**Bewertung:** Die Richtung stimmt, das Ausmaß auch. −1 Primärsatz + letzter
Accessory weg ≈ 30–40 % Volumenschnitt — das liegt klar im Bereich, in dem
Kraft über eine ganze Saison **gehalten** wird, sofern die Last hoch bleibt
(`[B]` Androulakis-Korakakis; Minimalist-Review). Der eigentliche In-Season-Feind
ist nicht Kraftverlust, sondern **systemische Ermüdung**, wenn zusätzlich viel
gekitet wird, und Zeit.

**Zwei Ergänzungen — beide ohne neue Stellschraube, rein deterministische Deltas:**

1. **Exzentrik-Tempo in `maintain` streichen.** Die `eccentricPatterns`-Slots
   verlieren ihre Tempo-Notiz und laufen kontrolliert-normal. Begründung: 3–4 s
   exzentrische Arbeit erzeugt den meisten Muskelkater und die meiste Rest-Ermüdung
   — schlecht, wenn die Beine fürs Kiten frisch sein sollen. Und in der Kite-Hochsaison
   liefern die harten Landungen den exzentrischen Reiz ohnehin (Spezifität). `[B]`
2. **+30 s Pause auf den verbleibenden Primär-Slots.** Billig, dient dem Ziel
   „frisch fürs Wasser", kostet nichts an Reiz (Kraft-Pausen dürfen lang sein).

**Nicht ändern:** Wiederholungszahl und Last-Intent der Primärübungen bleiben —
genau das hält die Kraft. Reps senken würde `maintain` zu einem De-facto-Detraining
machen. `[B]`

`maintain`-Transform, wie in `applyMaintain` umgesetzt:

```
für jeden Tag:
  jeder primary-Slot:   sets = max(2, sets - 1)
  wenn repProfile !== 'power':  Slot in eccentricPatterns → tempoNote = undefined
  letzten accessory-Slot des Tages entfernen
```

Die „+30 s Pause" aus dem Entwurf entfällt in der Umsetzung — `TemplateExercise`
kennt keine Pause. Bleibt Doku-Richtwert. Der `power`-Vorbehalt: Freestyle behält
seinen explosiv-exzentrischen Pop-Cue auch in `maintain` (Skill-spezifisch), nur
die grindende Big-Air-Exzentrik fällt weg.

---

## 6. `preferGentle` — Zuordnung bestätigt / korrigiert

Ein Satz je Muster: welche Struktur wird entlastet, bei welchem Reizverlust.

| Muster | schonend zuerst | Urteil | Begründung |
|---|---|---|---|
| `squat` | Goblet, Beinpresse | **korrigiert** — Back Squat **raus** aus der Vorziehliste | Front-geladene Kniebeuge senkt die LWS-Kompression ggü. Back Squat; Back Squat ist *nicht* schonender als die Default-Variante (Front Squat / Step-down), also nicht nach vorn ziehen. Goblet/Beinpresse entlasten LWS und Balance-Anforderung bei ~gleichem Quad-Reiz. `[B]` sportscienceinsider |
| `hinge` | Trap-Bar, KB-Kreuzheben, Hip Thrust | **bestätigt** | Trap-Bar senkt LWS-/Hüft-Spitzenmoment signifikant (verlagert Last zum Knie — also *nicht* die schonende Wahl bei Knieproblemen); KB-DL = geringere Absolutlast, aufrechter; Hip Thrust = minimale Wirbelsäulenlast. Reizverlust: weniger Erector-/Hamstring-Arbeit als beim geraden-Stangen-DL. `[B]` Swinton 2011 |
| `single-leg` | Step-up, Ausfallschritt rückwärts | **bestätigt** | Step-up (Schienbein vertikal, konzentrisch-dominant) und Rückwärts-Ausfallschritt belasten das vordere Knie deutlich weniger als Bulgarian Split Squat (Knie weit über langen Hebel nach vorn) oder Pistol (tiefe geladene Knieflexion + Balance). Reizverlust: gering, solange Boxhöhe ≈ Kniehöhe und Last mitgeführt wird. `[B]` |
| `push-h` | Kurzhantel-Bank, Brustpresse | **bestätigt** | Kurzhantel erlaubt neutralere Schulterbahn und sicheres Absetzen; Maschine stützt den Rumpf. Langhantelbank fixiert die Hände und erzeugt unten mehr vordere Schulterlast. Reizverlust: minimal. `[B]` |
| `push-v` | Kurzhantel-Schulterdrücken | **bestätigt** | DB-Press lässt die Schulter in die Skapula-Ebene und außenrotieren; Push Press addiert einen ballistischen Beinantrieb durch die Schulter, Pike Push-up lädt Endgradflexion mit Körpergewicht bei wenig Kontrolle. Reizverlust: kein Beinantrieb, weniger Last als Push Press. `[B]` |
| `pull-v` | assistierter Klimmzug, Latzug (zur Brust) | **bestätigt** | Beide skalieren die Last unter Körpergewicht und begrenzen den Endbereich; Klimmzug mit Zusatzgewicht lädt die Schulter im vollen Hang / Endgrad. Reizverlust: weniger Last am unteren Endpunkt. `[B]` |
| `hamstring-curl` | Beinbeuger-Maschine, Slider Curl | **bestätigt, mit Vorbehalt** | Maschine erlaubt Lastwahl, Slider ist skalierbar über ROM; Nordic Curl = supramaximale exzentrische Knieflexor-Last, hohe Kater-/Krampfrate, lädt das Knie in Flexion. **Reizverlust hier am größten:** Nordics supramaximale Exzentrik ist gerade *die* Hamstring-Präventionsdosis (`[B]`, van-Dyk-Zahl umstritten). Bei `preferGentle` bewusst in Kauf genommen. |

**Muster ohne `GENTLE_FIRST`-Eintrag** (`carry`, `pull-h`, `core-*`): keine
Variante ist unter Last nennenswert gelenkgefährdender als die andere — keine
Umsortierung nötig. `[V]`

---

## 7. Übungspool-Lücken

Fachliche Prüfung der in der Feature-Spec vorgeschlagenen Ergänzungen.

| Vorschlag | Muster | Urteil |
|---|---|---|
| `bodyweight-squat` | `squat` | OK als `none`-Boden, aber **niedriger Reiz** für trainierte Erwachsene → mit Tempo- oder 1½-Wdh.-Notiz versehen. Progression = `pistol-squat` (existiert). |
| `wall-sit` | `squat` (iso) | **gut** — deckt zusätzlich den Foil-`squat`-iso-Slot ab. `metric: 'time'`. |
| `band-good-morning` | `hinge` | OK, aber **`band-pull-through` ist die bessere Wahl**: lädt den Hinge von der Hüfte, nicht die Wirbelsäule als Hebel. Empfehlung: ersetzen oder ergänzen. |
| `bodyweight-single-leg-rdl` | `hinge` | **gut** — einbeinig macht Körpergewicht zum ausreichenden Hinge-Reiz auf `none`. |
| `backpack-carry` | `carry` | **gut**, realistisch. Umgesetzt als `metric: 'reps'` (Meter), nicht `'distance'` — Konvention der übrigen Carries, geringeres UI-Risiko. |
| `ab-wheel` | `core-anti-ext` | **gut** — die Leitübung für Anti-Extension, von Knien skalierbar. |
| `hollow-body-hold-strength` | `core-anti-ext` (iso) | **gut** — eigene ID nötig, da `hollow-body-hold` schon als `category: 'boardoff'` existiert. |
| Ring: `ring-row` (`pull-h`), `ring-pushup` (`push-h`), `ring-split-squat` (`single-leg`), `ring-hamstring-curl` (`hamstring-curl`) | — | **sinnvoll.** Hinweis: `ring-split-squat` ist wegen der Balance-Anforderung **keine** gelenkschonende `single-leg`-Variante — nicht in `GENTLE_FIRST`. |
| `ring-fallout` als `core-anti-rot` | — | **korrigiert** → als **`core-anti-ext`** taggen. Der Ring-Fallout ist eine Anti-Extension-Bewegung. Anti-Rotation auf der `rings`-Stufe läuft über Band-Pallof (Band ist erlaubt) oder `bird-dog`/`dead-bug`. |

**Fehlt in der Liste:**

- **`band-pulldown`** (`pull-v`, `band`) — ohne ihn löst der `pull-v`-**Primär**-Slot
  auf Tag B für die Stufe `none` nicht auf (kein Bar → Slot entfällt). Mit ihm ist
  jeder Primär-Slot auf jeder der vier Stufen besetzt. **Empfohlene Ergänzung.**
- Ein loaded `core-anti-ext`-Eintrag für die `kettlebell`-Stufe (z. B.
  `kb-overhead-march` oder `deadbug-kb-strength`) — nice-to-have; `ab-wheel` /
  `hollow-body-hold-strength` (bodyweight) decken die Stufe schon ab.
- `none`-taugliche `single-leg`-Notiz: `reverse-lunge` ist als `dumbbell` getaggt —
  einen bodyweight-Hinweis oder `bw-reverse-lunge` ergänzen, sonst trägt auf `none`
  nur `pistol-squat` das Muster.

---

## 8. Datenblock

Der Datenblock **ist umgesetzt** in [`src/logic/planGenerator.ts`](../../src/logic/planGenerator.ts)
(Tests: `src/logic/planGenerator.test.ts`). Struktur:

```ts
// Skelett je Tagezahl. PatternSlot ist modul-lokal (kein geteilter Typ).
type PatternSlot = {
  pattern: MovementPattern; role: 'primary' | 'accessory';
  sets: number; reps?: number; sec?: number; tempoNote?: string;
  prefer?: string[];   // Übungs-IDs, die für diesen Slot zuerst versucht werden
};
export const SKELETONS: Record<1 | 2 | 3 | 4, DaySkeleton[]>;

// Basis-Wdh. je repProfile — carry ausgenommen, holds via slotOverrides+exercisePrefer
const REP_PROFILE: Record<'strength'|'power'|'endurance'|'isometric', {
  primary: { reps?: number; sec?: number }; accessory: { reps?: number; sec?: number };
  explosiveTempo?: string;
}>;

export const DISCIPLINE_PROFILES: Record<KiteDiscipline, {
  emphasis: MovementPattern[];
  repProfile: 'strength' | 'power' | 'endurance' | 'isometric';
  eccentricPatterns: MovementPattern[];
  eccentricTempo: string;
  slotOverrides: Array<{ pattern; role?; sets?; reps?; sec?; tempoNote? }>;
  exercisePrefer?: Partial<Record<MovementPattern, string[]>>;
}>;

export const GENTLE_FIRST: Partial<Record<MovementPattern, string[]>>;

// Öffentliche Funktionen
export function seasonMode(sessions, date?): 'build' | 'maintain';
export function gentleBias(profile): boolean;
export function generateTemplates(profile, season, exercises): SessionTemplate[];
export function activeTemplates(settings, sessions, exercises, date?): SessionTemplate[];
```

**Konkrete Zahlen** — Skelett-Sätze × `REP_PROFILE`-Wdh., dann `slotOverrides`:

| Skelett | Slots (Muster · Rolle · Sätze) |
|---|---|
| **1 Tag** (`A`) | hinge P4 · squat P4 · pull-h P4 · push-h A3 · single-leg A3 · core-anti-rot A3 |
| **2 Tage A** | hinge P4 · single-leg A3 · push-h P4 · hamstring-curl A3 · carry A3 (40 m) |
| **2 Tage B** | pull-v P4 · squat P4 · pull-h A3 · hinge A3 (einseitig, `prefer` single-leg-rdl) · core-anti-rot A3 · core-anti-ext A3 |
| **+ Circuit** (`KB`) | hinge P5 explosiv (fix 5×4) · push-v A4 explosiv (fix 4×4) · core-anti-lat A3 |
| **+ Tag D** | single-leg P4 · pull-h A3 · carry A3 (40 m) · core-anti-ext A3 |

`REP_PROFILE`: strength P5/A8 · power P3/A5 (+explosiv-Tempo) · endurance P12/A15 ·
isometric P6/A10. Disziplin-`emphasis` hängt an jeden Primärtag (nicht KB) einen
Accessory-Slot des ersten Musters an, das am Tag fehlt. `slotOverrides` und
`exercisePrefer` je Disziplin: Abschnitt 4.2.

`maintain`: `applyMaintain` — Primär −1 Satz (min. 2), Exzentrik-Tempo weg (außer
`power`), letzter Accessory-Slot je Tag raus.

---

## 9. Abgleich mit der Nachbereitungs-Checkliste

- **Mind. eine begründete Korrektur?** Sechs: (1) 1-Tag `pull-v`→`pull-h`,
  (2) 2-Tag Tag B `core-anti-lat`→`core-anti-ext`, (3) Circuit-Pacing Power statt
  Metcon, (4) 4-Tag Tag D wird echter Beintag mit Primär-Slot, (5) `push-v` aus
  Wave/Wing-emphasis streichen, (6) `back-squat` aus `GENTLE_FIRST[squat]`.
  Plus `maintain`-Gegenvorschlag und Pool-Korrekturen (`band-pulldown`,
  `ring-fallout`-Tag, `bodyweight-split-squat`).
- **Alle `[P]`-Zeilen mit URL?** Ja, Abschnitt 1.1 und 2.
- **Datenblock deckt 5 Disziplinen × 4 Tagezahlen ohne offene Zahl?** Ja — jede
  Zahl kommt aus `SKELETONS` × `REP_PROFILE` × `slotOverrides`; jeder Nutzer hat
  eine Disziplin (Onboarding-Pflichtfeld). Test `planGenerator.test.ts`:
  „fills every skeleton slot on every discipline × tier".
- **Schema-Änderungen?** Nur eine geteilte: `SessionType` und
  `SessionTemplate['type']` bekommen `'D'`. `PatternSlot`/`DaySkeleton` sind
  modul-lokal, Tempo läuft über `TemplateExercise.note` (kein neues Feld). Plus
  additive Seed-Einträge (`band-pulldown`, `bodyweight-split-squat`,
  Ring-Varianten, Bodyweight-/Band-Lücken).
- **Abweichungen Entwurf → Umsetzung:** `isometric` wdh.- statt sekundenbasiert
  (Holds via `exercisePrefer`); Wing/Foil-`core`-Overrides als Wdh. statt `sec`
  wo die Übung wdh.-metrisch ist; `restSec`/Pause nicht im Datenmodell (nur
  Doku-Richtwert); `prefer`/`exercisePrefer` als Auswahl-Hebel ergänzt.
