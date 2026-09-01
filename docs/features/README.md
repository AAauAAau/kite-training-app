# Feature-Specs

Dieser Ordner enthält nur Features, deren Umsetzung konkret geplant ist. Ideen bleiben zunächst in der [Roadmap](../roadmap.md).

Für jedes geplante Feature wird eine eigene Markdown-Datei angelegt, zum Beispiel `exercise-substitution.md`.

## Aufbau einer Spec

```markdown
# Feature-Name

Status: In Planung

## Ziel

Welches Problem wird für den Nutzer gelöst?

## Verhalten

Welche sichtbaren Regeln und Abläufe gelten?

## Nicht-Ziele

Was gehört ausdrücklich nicht zum Feature?

## Datenmodell und Migration

Welche Typen und persistierten Daten ändern sich? Wie bleiben bestehende Daten kompatibel?

## Logik

Welche deterministischen Domain-Regeln werden unter `src/logic/` umgesetzt?

## UI

Welche Screens und Interaktionen ändern sich?

## Tests und Abnahmekriterien

Welche Fälle müssen automatisiert getestet und manuell geprüft werden?
```
