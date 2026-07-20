# Design

## Quelle

Die Framer-App selbst ist die Referenz. Der Clone nutzt den oeffentlichen
Search-Index und das SSR-HTML als Inhaltsquelle.

## Architektur

- React Single Page App mit kleinem History-API-Router.
- Inhalt liegt strukturiert in `src/content.js`.
- Wiederverwendbare UI in `src/App.jsx`.
- Visuelles System in `src/styles.css`.
- Lokale Framer-Referenzassets liegen in `src/assets/`.
- `scripts/dev-server.mjs` startet den Vite-Server ohne npm-Shim fuer
  stabilere lokale Preview-Starts.
- Die Hauptnavigation ist als Mehrseiten-Routing umgesetzt; neue Routen muessen
  manuell in `App()` registriert werden.

## Gestaltung

- Dunkler Hintergrund (`#0a0a0f`) mit violett/blauen Akzenten.
- Zalando Sans Expanded/Poppins fuer Hero-Headings, Inter fuer UI und Body.
- Runde Panels, feine Linien, dezente Glow- und Grid-Hintergruende.
- Responsive Layouts mit CSS Grid/Flex und Mobile-Navigation.
- Der Hero nutzt ein echtes lokales NEXUM-Logo-Asset, CSS-Shader fuer den
  violetten Vorhang und eine Canvas-Punktkugel mit reduzierter Bewegung bei
  `prefers-reduced-motion`.
- Die Canvas-Kugel nutzt Pointer-Tracking und eine Repulsionsberechnung, um
  den vom Nutzer beschriebenen Maus-Verdrängungseffekt nachzubilden.
- Der Vorhang-Hintergrund nutzt animierte CSS-Gradient-Layer statt eines
  statischen Bilds.
- Die Screenshot-nahen Sektionen verwenden lokale Framer-Bilder:
  gelbe-Blazer-Visual fuer What We Build, Presenter-Visual fuer Diagnose und
  AI-Window-Visual fuer Design.

## Formular

Das Kontaktformular arbeitet lokal. Ein spaeteres Backend kann an der
`ContactPage`-Submit-Logik angebunden werden.
