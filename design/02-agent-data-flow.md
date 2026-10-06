# Design: Agenten-Datenfluss (Website → Supabase → Claude-Automation → UI)

Stand: 2026-10-06. Ersetzt n8n und den gehosteten `agent-worker` als
primaere Agenten-Runtime (siehe DECISIONS.md, D-2026-10-06).

## Ziel

1. Die Website schreibt alle Kundeninformationen (Profil, Operations-Daten,
   Modul-Auftraege, Chat) in Supabase — nur fuer den verifizierten Nutzer.
2. Supabase haelt daraus automatisch eine **Wissensbasis mit Vektoren**
   (`knowledge_chunks`, pgvector, 384 Dim., Modell `gte-small`).
3. Eine **Claude-Automation** (geplanter Task in Claude Desktop/Cowork oder
   Claude-Code-Routine mit Supabase-MCP) holt Auftraege ab, erzeugt Analysen
   und Artefakte und schreibt sie ueber wenige SQL-Funktionen zurueck.
4. Die UI zeigt Status, Rueckfragen, Ergebnisse, Artefakte, Tasks, Alerts und
   Chat-Antworten automatisch an (Polling).

## Ablauf

```
Browser ──(JWT)──> /api/*  ──service role──> Postgres
                                              │ Trigger
                                              ▼
                                     knowledge_chunks (embedding = null)
                                              │ Edge Function `embed`
                                              │ (pg_cron jede Minute + Kick nach API-Writes)
                                              ▼
                       embeddings + module_runs.retrieved / agent_messages.retrieved
                                              │
Claude-Automation (Supabase MCP) ── select nexum_claim_next('claude') ──┘
      │  liest Kontext + Top-Chunks, recherchiert, schreibt Deliverable
      ├─ nexum_ask(run, questions)          → status needs_input → UI-Formular
      ├─ nexum_complete(run, md, …)         → done + Artefakt + Tasks + Alerts
      ├─ nexum_fail(run, error)             → error
      └─ nexum_pending_chats() / nexum_reply_chat(msg, text)
UI pollt /api/module-run, /api/agent-chat, /api/records → zeigt Ergebnisse
```

## Datenmodell (Migration `supabase/migrations/20261006000000_nexum_core.sql`)

- Bestehende Tabellen bleiben: `company_profiles`, `company_records`,
  `module_runs`, `agent_messages`.
- `module_runs` neu: `context jsonb` (KPI-Snapshot), `retrieved jsonb`
  (Top-k-Chunks), `summary`, `error`, `attempts`, `worker`, `started_at`,
  `finished_at`, `updated_at`.
- `agent_messages` neu: `status` (`pending|answered`), `reply_to`, `retrieved`.
- `knowledge_chunks`: `email, source_type (profile|record|run), source_id,
  kind, part, content, content_hash, fts (tsvector), embedding vector(384)`.
  Gepflegt ausschliesslich durch Trigger; `connectors` (Secrets),
  `notifications` und `artifacts` werden nicht eingebettet.
- Lange Texte (Ergebnisse) werden in ~1500-Zeichen-Teile zerlegt
  (gte-small: max. 512 Token).

## Schnittstelle fuer die Claude-Automation

Nur `security definer`-Funktionen, `execute` nur fuer `service_role`/`postgres`
(MCP verbindet als `postgres`). Die Automation schreibt nie direkt in Tabellen.

| Funktion | Zweck |
|---|---|
| `nexum_claim_next(worker)` | Naechsten Auftrag atomar holen (`FOR UPDATE SKIP LOCKED`), haengende Laeufe (>30 min) neu vergeben, max. 3 Versuche. Liefert Auftrag, Profil, KPI-Kontext, Top-Chunks, Antworten auf Rueckfragen. |
| `nexum_search(email, query, k)` | Volltextsuche in der Wissensbasis eines Kunden. |
| `nexum_records(email, kind, limit)` | Detaildaten einer Collection. |
| `nexum_ask(run_id, questions)` | Rueckfragen stellen (`needs_input`). |
| `nexum_complete(run_id, result_md, summary, tasks, notifications, profile_patch)` | Abschluss in einer Transaktion: Ergebnis, Artefakt-Record, Tasks, Alerts, optional Profil-Ergaenzung (Company Research). |
| `nexum_fail(run_id, error)` | Fehler melden. |
| `nexum_pending_chats(limit)` / `nexum_reply_chat(message_id, reply)` | Asynchroner Chat. |

## Sicherheit

- `lib/auth.js#resolveTenant`: verifizierte JWT-E-Mail; sonst nur mit
  `x-nexum-key == NEXUM_INTERNAL_KEY` (Server-zu-Server) die mitgeschickte
  E-Mail; sonst 401. Ohne Supabase-Konfiguration (Demo) bleibt die lokale
  Fallback-E-Mail erlaubt — dann wird nichts gespeichert.
- RLS auf allen Tabellen aktiv; nur Lese-Policies fuer den eigenen Datensatz
  (`email = auth.jwt()->>'email'`). Schreiben nur ueber die API (service role).
- Connector-Secrets werden in API-Antworten maskiert und bei maskiertem PATCH
  nicht ueberschrieben.
- Supabase-MCP der Automation: eigenes Projekt-Token, nur dieses Projekt
  (`--project-ref`), keine Migrations-Tools im Prompt.

## Embeddings

Edge Function `supabase/functions/embed` nutzt `Supabase.ai.Session('gte-small')`
(laeuft in Supabase, kein externer API-Key). Sie bettet ausstehende Chunks ein
und berechnet fuer neue Auftraege/Chat-Nachrichten die passenden Top-12-Chunks
(`nexum_match_chunks`). Logik in `core.js` (testbar in Node), `index.ts` ist nur
der Adapter.

## UI

- Polling: Laeufe alle 5 s, solange einer `queued|running` ist, sonst 30 s;
  Chat alle 4 s, solange eine Antwort aussteht.
- Ergebnis wird als Markdown gerendert (Ansicht/Bearbeiten), Download `.md`,
  PDF ueber Druckansicht.
- API-Fehler werden angezeigt statt als Erfolg gemeldet.

## Nicht-Ziele (dieser Etappe)

Billing/Plan-Durchsetzung, echte Connector-Synchronisation, Umstellung von
E-Mail auf `user_id` als Mandanten-Schluessel.
