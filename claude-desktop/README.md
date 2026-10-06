# NEXUM via Claude Desktop + Supabase MCP

Run the NEXUM agents straight from **Claude Desktop** by giving it your Supabase
database over MCP. No separate worker to host — Claude reads the `module_runs`
queue, produces each deliverable, and writes the result back.

Best for **you** working with your business data and running modules on demand.
(For fully unattended, customer-triggered runs 24/7 you'd still use the headless
`agent-worker/` — Claude Desktop is interactive, it doesn't poll in the background.)

## 1. Connect Supabase (MCP)

Claude Desktop → **Settings → Developer → Edit Config** — merge in
`claude_desktop_config.json` from this folder and fill in:

- `--project-ref=YOUR_PROJECT_REF` — Supabase → Project Settings → General → Reference ID.
- `SUPABASE_ACCESS_TOKEN` — Supabase → Account → **Access Tokens** → generate one.

Then **restart Claude Desktop**. You should see the `supabase` tools available.

- To let Claude **write results back**, do NOT add `--read-only`.
- For a safe first test, add `"--read-only"` to the args and only read.
- Confirm the exact flags on Supabase's MCP docs page (they occasionally change).

## 2. Add the skill

Add the **`nexum-agent`** skill (folder `skills/nexum-agent/` with `SKILL.md`) to
Claude Desktop's Skills. It tells Claude the data model, the workflow (queue →
context → deliverable → write back), and every module's deliverables. Refine the
`SKILL.md` any time.

## 3. Run it

Open a chat (ideally a **Project** whose instructions say "use the nexum-agent
skill and the supabase MCP") and prompt, e.g.:

- **Process the queue:** "Process the NEXUM module queue: read `module_runs` where
  status = 'queued', run each with the nexum-agent skill, and write the results
  back."
- **One module:** "Run a SWOT analysis for user `owner@acme.com` using their
  Supabase data, then save it to that run's result."
- **Daily tasks:** "Generate today's tasks for `owner@acme.com` from their live
  data and insert them as company_records kind 'tasks'."
- **Clarify first:** the skill will, when info is missing, write questions to
  `module_runs.questions` and set status `needs_input` — the web UI then shows them,
  the owner answers, and you re-run the queue.

## Flow

1. Owner clicks "Generate" in the web app → a `module_runs` row (queued).
2. You (in Claude Desktop) run "process the queue" → Claude reads the data via the
   Supabase MCP, produces the deliverable, writes `result` + `status='done'` (and
   tasks / notifications / artifacts as needed).
3. The web UI shows the result, tasks and alerts — same tables, no change needed.

## Optional: light automation

Claude Desktop won't poll on its own. If you want it to run itself, use a
**scheduled task** on your machine (or Claude's own scheduling, if available) that
opens the "process the queue" prompt every N minutes — or run the headless
`agent-worker/` for true 24/7.
