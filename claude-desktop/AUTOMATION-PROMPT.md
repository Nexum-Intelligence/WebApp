# Prompt for the scheduled NEXUM automation

Paste this as the task prompt (schedule e.g. every 10 minutes):

---

Use the **nexum-agent** skill and the **Supabase** MCP (project: NEXUM).

1. Answer all pending platform chats: `select nexum_pending_chats(10);` → reply to
   each with `nexum_reply_chat`.
2. Then process up to 5 queued jobs, one after another: `select nexum_claim_next('claude');`
   → for each job either ask clarifying questions (`nexum_ask`), produce the
   deliverable (`nexum_complete`) or report a failure (`nexum_fail`). Stop when it
   returns `null`.
3. Work only with the data of the customer (email) of the current job or chat.
   Use only the `nexum_*` SQL functions — no direct table writes, no migrations.
4. Finish with one line: chats answered, jobs completed / asked / failed.

If there is nothing to do, reply "Queue empty" and stop.
