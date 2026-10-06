# Entscheidungen

## 2026-07-09: React/Vite statt Framer-Runtime

Die Originalseite kann nicht als Framer-Projekt exportiert werden. Der Clone
wird deshalb als eigenstaendige React/Vite-App umgesetzt. Dadurch bleibt die
Website bearbeitbar, baubar und auf statischem Hosting deploybar.

## 2026-07-09: Externe Framer-Assets nicht hart kopiert

Der erste Clone konzentriert sich auf Struktur, Texte, Layout und Interaktion.
Asset-URLs koennen spaeter lokal gespiegelt werden, wenn ein komplett
offline-faehiges Paket benoetigt wird.

## 2026-07-10: Eigenen Router und inline Icons nutzen

Der lokale Dev-Server zeigte einen Blank Screen durch einen JSX-Runtime-Fehler
und fragile externe Runtime-Abhaengigkeiten. Die App nutzt nun einen kleinen
History-API-Router und inline SVG-Icons statt `react-router-dom` und
`lucide-react`. Dadurch bleiben die Seiten statisch, schneller und weniger
fehleranfaellig.

## 2026-07-10: Framer-Hero als lokale Canvas/CSS-Implementierung

Die sichtbare Referenz nutzt Framer-Shader/Canvas-Effekte, die nicht als
eigenstaendige Projektdateien exportierbar sind. Der Clone spiegelt das reale
NEXUM-Logo lokal und rekonstruiert den violetten Vorhang sowie die rotierende
Punkt-Kugel mit CSS und Canvas. Dadurch bleiben die wichtigsten Above-the-fold
Effekte ohne Hotlinks und ohne Framer-Runtime verfuegbar.

## 2026-07-10: Mehrseitenrouting statt One-Page-Anker

Die Framer-Quelle verhaelt sich in der Navigation wie eine mehrseitige Website.
Die Hauptnavigation nutzt deshalb echte lokale Routen fuer About, What We Build,
How It Works, Blog und Contact. Seitenabschnitte werden als wiederverwendbare
React-Komponenten aufgebaut, damit Home und die Detailseiten dieselben
Inhaltsbloecke teilen koennen, ohne nur auf `/#anchor` zu verweisen.

## 2026-07-10: Interaktive Maus-Deformation in Canvas

Der Punktball reagiert nun auf Pointer-Bewegungen. Statt eines statischen
Partikel-Screenshots wird jede Frame-Projektion nach der 3D-Rotation um eine
Repulsionszone um den Mauspunkt ergaenzt. Das bildet den beobachteten
Verdrängungseffekt nach und bleibt ohne externe Shader-Runtime lauffaehig.

## 2026-10-06: Agenten-Runtime = geplante Claude-Automation ueber Supabase (D-2026-10-06)

Die Website schreibt alle Kundendaten und Auftraege nach Supabase; eine geplante
Claude-Automation (Supabase-MCP + Skill `nexum-agent`) arbeitet die Queue ab und
schreibt Ergebnisse zurueck. n8n und der gehostete `agent-worker` sind nicht mehr
die primaere Runtime. Gruende: bessere Ergebnisqualitaet durch Skills, Recherche
und Rueckfragen; neue Module brauchen nur Skill-Text statt Workflow-Verdrahtung;
kein eigener Server noetig. Die Automation schreibt ausschliesslich ueber
`security definer`-Funktionen (`nexum_claim_next`, `nexum_ask`, `nexum_complete`,
`nexum_fail`, `nexum_reply_chat`), damit Statusuebergaenge atomar und pruefbar
bleiben. Chat ist dadurch asynchron (Antwort beim naechsten Automationslauf).
Design: `design/02-agent-data-flow.md`.

## 2026-10-06: Wissensbasis mit pgvector und Supabase-gte-small

Kundendaten, Profilabschnitte und fertige Ergebnisse werden per Trigger in
`knowledge_chunks` gespiegelt und von der Edge Function `embed` mit `gte-small`
(384 Dim.) eingebettet — ohne externen Embedding-Anbieter oder API-Key. Die
Retrieval-Ergebnisse werden beim Auftrag vorab berechnet (`module_runs.retrieved`),
weil die Automation per SQL keine Query-Embeddings erzeugen kann; fuer freie Suche
gibt es zusaetzlich Volltextsuche (`nexum_search`).

## 2026-10-06: Mandantentrennung ohne E-Mail-Fallback

`/api` akzeptiert nur noch die E-Mail aus einem verifizierten Supabase-Token,
Server-zu-Server-Aufrufe nur mit `x-nexum-key` (`NEXUM_INTERNAL_KEY`). Der fruehere
Fallback auf die vom Client gesendete E-Mail erlaubte Lesen/Aendern fremder
Mandantendaten und wurde entfernt. RLS ist auf allen Tabellen aktiv (nur Lesen
eigener Zeilen). Connector-Secrets werden maskiert ausgeliefert und nicht
eingebettet. Mandantenschluessel bleibt vorerst die E-Mail (E-Mail-Bestaetigung
in Produktion Pflicht); Umstellung auf `user_id` ist offen.

## 2026-10-06: Lagereinkauf ist kein Aufwand

Wareneingaenge (`transactions.category = "Purchasing"`) zaehlen nicht mehr als
Ausgabe, weil derselbe Wareneinsatz beim Verkauf als Cost of Goods gebucht wird
(vorher doppelt gezaehlt). Sie werden separat als "Stock purchases" angezeigt.
