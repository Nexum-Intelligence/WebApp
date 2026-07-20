# Projektregeln

## Arbeitskontext

Vor Aenderungen folgende Dateien lesen:

1. `PROJECT.yaml`
2. `requirements/`
3. `design/`
4. `TASKS.md`
5. `DECISIONS.md`
6. Relevante Dokumentation unter `docs/`

## Umsetzung

- Aufgaben anhand klarer Abnahmekriterien bearbeiten.
- Anforderungen vor Design und Design vor Code aktualisieren, wenn sich das
  beabsichtigte Verhalten aendert.
- Vorhandene Architektur und Konventionen beibehalten.
- Neue Abhaengigkeiten nur mit dokumentierter Begruendung einfuehren.
- Tests passend zum Risiko der Aenderung ergaenzen.
- Keine Geheimnisse oder personenbezogenen Produktivdaten speichern.

## Abschluss

- Betroffene Tests und statische Pruefungen ausfuehren.
- `TASKS.md` aktualisieren.
- Dauerhafte Entscheidungen in `DECISIONS.md` dokumentieren.
- Status und naechsten Schritt in `PROJECT.yaml` pflegen.
