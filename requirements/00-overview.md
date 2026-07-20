# Anforderungen

## Zielgruppe

Betreiber der IONYX/NEXUM AI-Agency-Website, der die Framer-Seite nicht
exportieren kann und eine unabhaengige Codebasis benoetigt.

## Soll-Verhalten

- Die App bildet die oeffentliche Framer-Website mit allen erkannten Routen ab.
- Header und Footer bieten dieselben Hauptlinks.
- Die Hauptnavigation fuehrt auf echte Routen statt nur auf One-Page-Anker:
  `/about`, `/what-we-build`, `/how-it-works`, `/blog`, `/contact`.
- Home enthaelt Hero, Trust/Impact, Services, Prozess, Infrastruktur, Why,
  Testimonials, FAQ und CTA.
- Blog enthaelt Uebersicht und vier Artikel.
- Contact enthaelt alle erkannten Formularfelder:
  Name, Email, Company Name, Select Service, Project Budget, Project Details.
- Legal-Seiten zeigen Privacy Policy und Cookie Policy.
- Die erste Bildschirmhoehe bildet die sichtbare Framer-Referenz nach:
  NEXUM-Logo, transparenter Top-Header, violett/blauer Vorhang-Hintergrund,
  animierte Punkt-Kugel, Badge, Headline, Textblock mit blauer Linie und
  leuchtende Pill-Buttons.
- Die Punkt-Kugel reagiert auf Mausbewegung, indem Punkte im Mausbereich
  sichtbar verdraengt werden.
- Der violette Hintergrund/Vorhang besitzt eine laufende Bewegung.
- About, What We Build und How It Works orientieren sich an den bereitgestellten
  Scroll-Screenshots mit Marquee, Karten, echten Bildern und Step-Layouts.

## Abnahmekriterien

- Alle Routen laden ohne JavaScript-Fehler.
- Das Kontaktformular validiert Pflichtfelder und zeigt nach Submit eine
  Bestaetigung.
- Der statische Build ist erzeugbar.
- Die Start-/About-Hero zeigt die animierte Kugel und den violetten
  Hintergrundeffekt.
- `/what-we-build` und `/how-it-works` sind direkt routbar und laden ohne
  JavaScript-Fehler.
- Bekannte Abweichungen zur Framer-Quelle sind dokumentiert.
