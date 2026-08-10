# AI Readiness Test — Setup

Der Readiness-Test läuft unter **`/potential-analysis/fragebogen`** (der „PLATFORM"-Button und die Agenten-Sprechblase führen dorthin).

Ablauf für den Besucher: 6 Fragen (Schritt für Schritt) → **Kontakt- & Firmendaten (Pflicht, vor dem Ergebnis)** mit DSGVO-Zustimmung → Ergebnis mit Score, Level, Dimensions-Auswertung und Empfehlungen.

Das **Scoring ist regelbasiert** (keine KI/kein API-Key nötig): jede Antwort gibt 0–3 Punkte, 6 Fragen → max. 18 Punkte → Score 0–100 %. Level: 0–39 % *Explorer*, 40–64 % *Builder*, 65–84 % *Ready*, 85–100 % *Accelerator*.

Jeder Abschluss wird an `POST /api/lead` geschickt → **in Supabase gespeichert** + **als Mail an den Vertrieb** verschickt. Fehlt eine der Konfigurationen, wird dieser Kanal einfach übersprungen (der Test funktioniert trotzdem).

---

## 1) Supabase (Datenbank)

1. Auf https://supabase.com ein Projekt anlegen.
2. Im **SQL Editor** dieses Skript ausführen:

```sql
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text,
  phone text,
  website text,
  industry text,
  challenge text,
  consent boolean default false,
  score int,
  level text,
  dimensions jsonb,
  answers jsonb,
  lang text,
  source text default 'readiness-test'
);

-- RLS an lassen: der Server nutzt den service_role-Key und umgeht RLS.
alter table public.leads enable row level security;
```

3. Unter **Project Settings → API** brauchst du:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** Secret (NICHT der anon-Key!) → `SUPABASE_SERVICE_ROLE_KEY`
     (Nur serverseitig verwenden — steht ausschließlich in den Vercel-Env-Variablen, nie im Frontend.)

## 2) Resend (Lead-Mail an den Vertrieb)

1. Auf https://resend.com anmelden.
2. **API Key** erstellen → `RESEND_API_KEY`.
3. Absender festlegen → `LEAD_FROM_EMAIL`:
   - Zum Testen sofort nutzbar: `NEXUM Readiness <onboarding@resend.dev>`
   - Produktiv: eigene Domain in Resend verifizieren, dann z. B. `NEXUM Readiness <noreply@nexumintelligence.com>`
4. Empfänger (euer Vertrieb) → `SALES_EMAIL`, z. B. `vertrieb@nexumintelligence.com`.

## 3) Vercel — Environment Variables

Vercel → Projekt **nexumintelligence-webapp** → **Settings → Environment Variables** → folgende anlegen (Production + Preview):

| Name | Wert |
|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *service_role Key* |
| `RESEND_API_KEY` | *Resend API Key* |
| `SALES_EMAIL` | `vertrieb@nexumintelligence.com` |
| `LEAD_FROM_EMAIL` | `NEXUM Readiness <onboarding@resend.dev>` |

Danach einmal neu deployen (der letzte Push reicht, oder in Vercel „Redeploy").

---

## Dateien in diesem Commit

- `src/App.jsx` — Readiness-Test-Wizard (`ReadinessTest`) + Route `/potential-analysis/fragebogen`.
- `src/styles.css` — Styles für den Test (`.readiness*`).
- `api/lead.js` — Serverless-Funktion: Supabase-Insert + Resend-Mail.
- `vercel.json` — SPA-Rewrite schließt jetzt `/api/*` aus (sonst würde die Funktion nicht erreichbar sein).

## Hinweise

- **Lokal (`npm run dev`)** gibt es keine `/api`-Funktion — der Test zeigt das Ergebnis trotzdem an, speichert lokal aber nichts. Speicherung/Mail laufen erst auf Vercel mit gesetzten Env-Variablen.
- **DSGVO:** Es gibt eine Pflicht-Checkbox mit Link zur Datenschutzseite; die Zustimmung wird mitgespeichert (`consent`). Bitte die Datenschutzerklärung um den Zweck „Readiness-Test / Kontaktaufnahme" ergänzen.
- **Sprachen:** Der Test ist auf **EN & DE** vollständig; für ES/FR wird aktuell EN angezeigt (kann ich auf Wunsch nachziehen).
- **KI-Analyse später:** Der regelbasierte Score kann jederzeit um einen KI-generierten Analysetext erweitert werden (in `api/lead.js` oder einer eigenen Funktion).
