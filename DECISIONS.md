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
