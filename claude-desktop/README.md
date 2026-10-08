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

## 1. Connect the database — restricted role (recommended)

The automation connects as the Postgres role `nexum_agent`
(migration `20261008000000_nexum_agent_role.sql`). That role can **only** execute the
agent interface (`nexum_agent_*`, `nexum_ask`, `nexum_complete`, `nexum_fail`,
`nexum_reply_chat`): no table access, no other project, no migrations. It never sees
e-mail addresses, every query is scoped to the job/chat being worked on, and contact
data is redacted (DSGVO data minimisation). All its changes appear in `audit_log`
with actor `nexum_agent`.

1. **Enable the role** once (Supabase → SQL editor; choose a long random password,
   e.g. a password-manager generated one, and keep it only in the config below):
   ```sql
   alter role nexum_agent with login password '<long random password>';
   ```
2. **Pooler host:** Supabase → *Connect* → *Session pooler* → copy the host
   (looks like `aws-0-eu-west-1.pooler.supabase.com`). The user name is
   `nexum_agent.dsrfvrjoxpftimkbnvbw`.
3. **MCP server:** merge `claude_desktop_config.json` from this folder into Claude
   Desktop → Settings → Developer → Edit Config and fill in password and host.
   It uses [Postgres MCP Pro](https://github.com/crystaldba/postgres-mcp)
   (`uvx postgres-mcp`, needs `uv`). `--access-mode=unrestricted` is required because
   the agent functions write (claim/complete); the role itself is what restricts access.
4. Restart Claude Desktop and check once: `select nexum_agent_pending_chats(1);`
   works, `select * from module_runs limit 1;` fails with *permission denied*.

To revoke access at any time: `alter role nexum_agent nologin;`

**Fallback (not recommended for customer data):** the Supabase MCP server
(`npx @supabase/mcp-server-supabase --project-ref=dsrfvrjoxpftimkbnvbw --features=database`
with a personal access token) also works with the same functions, but runs as
`postgres` with access to everything in your Supabase account.

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
| `nexum_agent_claim` | Status "Running" |
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
