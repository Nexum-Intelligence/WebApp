# Landing page hero — archived 2026-10-08

The NEXUM landing page hero before the switch to the scroll-driven video background:
violet "curtain" background, canvas **particle sphere** with mouse repulsion and the
rotating **NEXUM 3D logo** (mesh from `modelToUsed.stl`).

| File | Content |
|---|---|
| `HeroSphere.jsx` | `ParticleSphere` component (canvas, self-contained) + the original `HeroSection` markup as comment |
| `hero-sphere.css` | hero, curtain, sphere, logo and lite-mode styles incl. keyframes |
| `nexum-model-mesh.json` | reduced triangle mesh of the NEXUM logo |

**Reuse:** copy the three files into `src/`, `import "./hero-sphere.css"` and render
`<ParticleSphere />` inside an element with class `reference-hero` (or adapt the CSS).

**Full page at that time:** `git checkout archive/landing-2026-10-08` (tag) — contains
the complete App, styles and assets exactly as they were live-ready on that day.
