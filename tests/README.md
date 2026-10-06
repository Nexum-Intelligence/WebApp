# Tests

| Command | What | Needs |
|---|---|---|
| `pnpm test` | Unit: Markdown renderer (incl. XSS), tenant resolution, secret masking, retrieval query | Node |
| `pnpm test:db` | SQL behaviour of `supabase/migrations/*`: chunk triggers, claim/ask/complete loop, stuck runs, tenant-scoped search, chat, RLS | Docker |
| `pnpm test:e2e` | API functions → PostgREST → Postgres → embed function → automation SQL → API reads | Docker |

## Local Supabase stand-in (one-time)

```
docker run -d --name nexum-pg -e POSTGRES_PASSWORD=postgres -p 54329:5432 pgvector/pgvector:pg16
pnpm test:db          # applies tests/db/bootstrap.sql + migrations, runs tests/db/test.sql
docker run -d --name nexum-rest -p 54331:3000 \
  -e PGRST_DB_URI="postgres://authenticator:authpass@host.docker.internal:54329/postgres" \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon -e PGRST_DB_EXTRA_SEARCH_PATH=extensions \
  -e PGRST_JWT_SECRET="nexum-local-test-secret-0123456789abcdef" postgrest/postgrest
pnpm test:e2e
```

`tests/e2e/harness.mjs` adds a proxy on port 54330 that serves `/rest/v1`
(PostgREST), a minimal `/auth/v1` (accounts `a@x.de` / `b@y.de`, password
`test1234`) and `/functions/v1/embed` (the real `core.js` with a deterministic fake
embedding).

## Click-through in the browser

```
node tests/e2e/stack.mjs        # keeps the stand-in running
# .env.local: VITE_SUPABASE_URL/SUPABASE_URL=http://127.0.0.1:54330,
#   VITE_SUPABASE_ANON_KEY/SUPABASE_ANON_KEY=local-anon,
#   SUPABASE_SERVICE_ROLE_KEY=<printed by stack.mjs>
pnpm dev:full
```

Then sign in as `a@x.de`, start a module and play the automation by hand:

```
docker exec -i nexum-pg psql -U postgres -c "select nexum_claim_next('me')"
docker exec -i nexum-pg psql -U postgres -c "select nexum_complete('<run id>', \$md\$## Result\$md\$, 'summary', null, null, null)"
```
