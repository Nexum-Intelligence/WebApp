# NEXUM agents via a Claude automation + Supabase MCP

The platform writes every customer input and job into Supabase. A **scheduled
Claude task** (Claude Desktop / Cowork scheduled task, or a Claude Code routine)
connects to the same Supabase project over MCP, works through the queue with the
`nexum-agent` skill and writes results back. The web UI picks them up
automatically (it polls every 5 s while a job is open).

```
Website ─► Supabase (data, queue, vectors) ◄─► Claude automation (skill + MCP)
   ▲                                                   │
   └──────────── results, tasks, alerts, chat ◄────────┘
```

Design and data model: `design/02-agent-data-flow.md`. SQL interface:
`supabase/migrations/20261006000000_nexum_core.sql` (`nexum_*` functions).

## 1. Connect Supabase (MCP)

Use **one** of:

- **Supabase connector** in Claude (Settings → Connectors → Supabase), scoped to the
  NEXUM project, or
- the local MCP server: merge `claude_desktop_config.json` into Claude Desktop →
  Settings → Developer → Edit Config, then fill in
  - `--project-ref` — Supabase → Project Settings → General → Reference ID
  - `SUPABASE_ACCESS_TOKEN` — Supabase → Account → Access Tokens (create a token
    just for this, so you can revoke it independently)

  Restart Claude Desktop. `--project-ref` limits the server to this project and
  `--features=database` hides unrelated tools. Do **not** add `--read-only` — the
  automation writes results through the `nexum_*` functions. Check Supabase's MCP
  docs if a flag has changed.

## 2. Add the skill

Add `skills/nexum-agent/` (the folder with `SKILL.md`) to Claude's skills. It
contains the interface, the procedure, the deliverable format and the module
catalog. Improve it — and add dedicated skills per module — over time.

## 3. Create the automation

Create a scheduled task (e.g. every 10 minutes during business hours) with the
prompt from `AUTOMATION-PROMPT.md`. The task must have the Supabase MCP/connector
and web search enabled.

Test first by running the prompt once by hand while a module run is queued in the
platform.

## What the customer sees

| Automation does | Platform shows (without reload) |
|---|---|
| `nexum_claim_next` | Status "Running" |
| `nexum_ask` | Question form in the module, toast "needs your input" |
| owner answers | job goes back to the queue with `answers` |
| `nexum_complete` | Rendered result (Markdown, tables), Download .md / PDF, Deliverables card, tasks in Daily Tasks, alert in the bell |
| `nexum_fail` | Status "Error" with reason, "Regenerate" |
| `nexum_reply_chat` | Answer in the agent chat |

## Notes

- Jobs that stay `running` for more than 30 minutes are handed out again
  (max. 3 attempts, then `error`). Always finish with `nexum_complete`,
  `nexum_ask` or `nexum_fail`.
- Several automations can run in parallel — claiming is atomic.
- Do not run the old `agent-worker/` or an n8n workflow against the same queue at
  the same time unless you want them to share the work.
