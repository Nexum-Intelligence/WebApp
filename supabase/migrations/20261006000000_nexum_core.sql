-- NEXUM core schema: tenant data, module queue, chat, vector knowledge base and
-- the SQL interface used by the Claude automation (Supabase MCP).
-- Idempotent: safe to run on a fresh project and on the existing tables.
-- Design: design/02-agent-data-flow.md

create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.company_profiles (
  email       text primary key,
  name        text,
  company     text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists public.company_records (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text not null,
  kind        text not null,
  data        jsonb not null default '{}'::jsonb
);
alter table public.company_records add column if not exists updated_at timestamptz not null default now();
create index if not exists company_records_email_kind_idx on public.company_records (email, kind, created_at desc);

create table if not exists public.module_runs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  email        text not null,
  name         text,
  company      text,
  package_key  text,
  suite_key    text,
  module_key   text not null,
  module_name  text,
  inputs       jsonb not null default '{}'::jsonb,
  status       text  not null default 'queued',
  questions    jsonb,
  result       jsonb,
  lang         text,
  source       text default 'platform'
);
alter table public.module_runs add column if not exists context     jsonb;
alter table public.module_runs add column if not exists retrieved   jsonb;
alter table public.module_runs add column if not exists summary     text;
alter table public.module_runs add column if not exists error       text;
alter table public.module_runs add column if not exists attempts    int not null default 0;
alter table public.module_runs add column if not exists worker      text;
alter table public.module_runs add column if not exists started_at  timestamptz;
alter table public.module_runs add column if not exists finished_at timestamptz;
alter table public.module_runs add column if not exists updated_at  timestamptz not null default now();
create index if not exists module_runs_email_idx on public.module_runs (email, created_at desc);
create index if not exists module_runs_status_idx on public.module_runs (status, created_at);

create table if not exists public.agent_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text not null,
  role        text not null,
  content     text not null
);
alter table public.agent_messages add column if not exists status    text;   -- user msg: pending | answered
alter table public.agent_messages add column if not exists reply_to  uuid;
alter table public.agent_messages add column if not exists context   jsonb;
alter table public.agent_messages add column if not exists retrieved jsonb;
create index if not exists agent_messages_email_idx on public.agent_messages (email, created_at asc);
create index if not exists agent_messages_pending_idx on public.agent_messages (status, created_at) where status = 'pending';

create table if not exists public.knowledge_chunks (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  source_type   text not null,              -- profile | record | run
  source_id     text not null,              -- section key / record id / run id
  kind          text,                       -- profile section / record kind / module key
  part          int  not null default 0,
  content       text not null,
  content_hash  text not null,
  fts           tsvector generated always as (to_tsvector('simple', content)) stored,
  embedding     extensions.vector(384),
  updated_at    timestamptz not null default now(),
  unique (source_type, source_id, part)
);
create index if not exists knowledge_chunks_email_idx on public.knowledge_chunks (email);
create index if not exists knowledge_chunks_pending_idx on public.knowledge_chunks (updated_at) where embedding is null;
create index if not exists knowledge_chunks_fts_idx on public.knowledge_chunks using gin (fts);
create index if not exists knowledge_chunks_embedding_idx on public.knowledge_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Row level security: the browser never writes tables directly (all writes go
-- through /api with the service role). Users may only read their own rows.
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['company_profiles','company_records','module_runs','agent_messages','knowledge_chunks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('drop policy if exists nexum_read_own on public.%I', t);
    execute format($p$create policy nexum_read_own on public.%I for select to authenticated
                      using (email = (auth.jwt() ->> 'email'))$p$, t);
  end loop;
end $$;
alter table if exists public.leads enable row level security;

-- ---------------------------------------------------------------------------
-- Knowledge chunks: maintained by triggers
-- ---------------------------------------------------------------------------

-- Readable "key: value" text from a jsonb object (nested values as compact JSON).
create or replace function public.nexum_jsonb_text(j jsonb)
returns text language sql immutable as $$
  select coalesce(string_agg(
           initcap(regexp_replace(key, '([a-z])([A-Z])', '\1 \2', 'g')) || ': ' ||
           case jsonb_typeof(value) when 'string' then value #>> '{}' else value::text end,
           E'\n' order by key), '')
  from jsonb_each(case when jsonb_typeof(j) = 'object' then j else '{}'::jsonb end)
  where value is not null and value <> 'null'::jsonb and value <> '""'::jsonb
$$;

-- Replace all chunks of one source with `body`, split into ~1500 char parts.
-- Unchanged parts keep their embedding.
create or replace function public.nexum_put_chunks(p_email text, p_type text, p_id text, p_kind text, p_body text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  size constant int := 1500;
  n int := 0;
  piece text;
  body text := coalesce(btrim(p_body), '');
begin
  if body <> '' then
    n := ceil(length(body)::numeric / size)::int;
    for i in 0 .. n - 1 loop
      piece := substr(body, i * size + 1, size);
      insert into public.knowledge_chunks (email, source_type, source_id, kind, part, content, content_hash)
      values (p_email, p_type, p_id, p_kind, i, piece, md5(piece))
      on conflict (source_type, source_id, part) do update
        set email = excluded.email, kind = excluded.kind, content = excluded.content,
            content_hash = excluded.content_hash, updated_at = now(),
            embedding = case when knowledge_chunks.content_hash = excluded.content_hash
                             then knowledge_chunks.embedding else null end;
    end loop;
  end if;
  delete from public.knowledge_chunks where source_type = p_type and source_id = p_id and part >= n;
end $$;

create or replace function public.nexum_chunk_record() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if tg_op = 'DELETE' then
    delete from public.knowledge_chunks where source_type = 'record' and source_id = old.id::text;
    return old;
  end if;
  if new.kind in ('connectors', 'notifications', 'artifacts') then
    return new;
  end if;
  perform public.nexum_put_chunks(new.email, 'record', new.id::text, new.kind,
    initcap(new.kind) || E'\n' || public.nexum_jsonb_text(new.data));
  return new;
end $$;

drop trigger if exists nexum_chunk_record on public.company_records;
create trigger nexum_chunk_record after insert or update of data, kind or delete on public.company_records
  for each row execute function public.nexum_chunk_record();

-- One chunk per profile section (object values); scalar top-level fields go to "general".
create or replace function public.nexum_chunk_profile() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  flat jsonb := '{}'::jsonb;
  keep text[] := array[]::text[];
begin
  if tg_op = 'DELETE' then
    delete from public.knowledge_chunks where source_type = 'profile' and email = old.email;
    return old;
  end if;
  for r in select key, value from jsonb_each(coalesce(new.data, '{}'::jsonb)) loop
    if jsonb_typeof(r.value) = 'object' then
      perform public.nexum_put_chunks(new.email, 'profile', new.email || ':' || r.key, r.key,
        'Company profile — ' || r.key || E'\n' || public.nexum_jsonb_text(r.value));
      keep := keep || (new.email || ':' || r.key);
    else
      flat := flat || jsonb_build_object(r.key, r.value);
    end if;
  end loop;
  if flat <> '{}'::jsonb then
    perform public.nexum_put_chunks(new.email, 'profile', new.email || ':general', 'general',
      'Company profile' || E'\n' || public.nexum_jsonb_text(flat));
    keep := keep || (new.email || ':general');
  end if;
  delete from public.knowledge_chunks
   where source_type = 'profile' and email = new.email and not (source_id = any (keep));
  return new;
end $$;

drop trigger if exists nexum_chunk_profile on public.company_profiles;
create trigger nexum_chunk_profile after insert or update of data or delete on public.company_profiles
  for each row execute function public.nexum_chunk_profile();

-- Finished results become searchable knowledge for later runs and the chat.
create or replace function public.nexum_result_text(r jsonb) returns text
language sql immutable as $$
  select case
    when r is null then ''
    when jsonb_typeof(r) = 'string' then r #>> '{}'
    when jsonb_typeof(r) = 'object' and r ? 'markdown' then r ->> 'markdown'
    else r::text end
$$;

create or replace function public.nexum_chunk_run() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if tg_op = 'DELETE' then
    delete from public.knowledge_chunks where source_type = 'run' and source_id = old.id::text;
    return old;
  end if;
  if new.status = 'done' then
    perform public.nexum_put_chunks(new.email, 'run', new.id::text, new.module_key,
      coalesce(new.module_name, new.module_key) || ' (result)' || E'\n' || public.nexum_result_text(new.result));
  end if;
  return new;
end $$;

drop trigger if exists nexum_chunk_run on public.module_runs;
create trigger nexum_chunk_run after insert or update of result, status or delete on public.module_runs
  for each row execute function public.nexum_chunk_run();

create or replace function public.nexum_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists nexum_touch on public.module_runs;
create trigger nexum_touch before update on public.module_runs for each row execute function public.nexum_touch();
drop trigger if exists nexum_touch on public.company_records;
create trigger nexum_touch before update on public.company_records for each row execute function public.nexum_touch();

-- ---------------------------------------------------------------------------
-- Retrieval
-- ---------------------------------------------------------------------------

create or replace function public.nexum_match_chunks(p_email text, p_embedding extensions.vector(384), p_k int default 12)
returns table (id uuid, source_type text, kind text, content text, similarity float)
language sql stable security definer set search_path = public, extensions as $$
  select c.id, c.source_type, c.kind, c.content, 1 - (c.embedding <=> p_embedding) as similarity
  from public.knowledge_chunks c
  where c.email = p_email and c.embedding is not null
  order by c.embedding <=> p_embedding
  limit greatest(1, least(coalesce(p_k, 12), 50))
$$;

create or replace function public.nexum_search(p_email text, p_query text, p_k int default 10)
returns table (id uuid, source_type text, kind text, content text, rank real)
language sql stable security definer set search_path = public, extensions as $$
  select c.id, c.source_type, c.kind, c.content, ts_rank(c.fts, q) as rank
  from public.knowledge_chunks c, websearch_to_tsquery('simple', coalesce(p_query, '')) q
  where c.email = p_email and c.fts @@ q
  order by rank desc
  limit greatest(1, least(coalesce(p_k, 10), 50))
$$;

create or replace function public.nexum_records(p_email text, p_kind text, p_limit int default 200)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'created_at', created_at, 'data', data) order by created_at desc), '[]'::jsonb)
  from (select id, created_at, data from public.company_records
        where email = p_email and kind = p_kind and kind <> 'connectors'
        order by created_at desc limit greatest(1, least(coalesce(p_limit, 200), 1000))) s
$$;

-- ---------------------------------------------------------------------------
-- Automation interface (Claude via Supabase MCP)
-- ---------------------------------------------------------------------------

-- Atomically claim the oldest queued run (or a run stuck in 'running' for > 30 min).
-- Returns null when there is nothing to do.
create or replace function public.nexum_claim_next(p_worker text default 'claude')
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  r public.module_runs;
begin
  -- give up on runs that failed repeatedly
  update public.module_runs set status = 'error', error = coalesce(error, 'Gave up after 3 attempts'), finished_at = now()
   where status = 'running' and started_at < now() - interval '30 minutes' and attempts >= 3;

  select * into r from public.module_runs
   where status = 'queued'
      or (status = 'running' and started_at < now() - interval '30 minutes')
   order by created_at
   limit 1
   for update skip locked;
  if not found then return null; end if;

  update public.module_runs
     set status = 'running', worker = p_worker, started_at = now(), attempts = attempts + 1, error = null
   where id = r.id
  returning * into r;

  return jsonb_build_object(
    'run', jsonb_build_object(
      'id', r.id, 'email', r.email, 'module_key', r.module_key, 'module_name', r.module_name,
      'suite_key', r.suite_key, 'lang', coalesce(r.lang, 'en'), 'attempt', r.attempts,
      'inputs', r.inputs - '_context' - '_company' - 'answers',
      'questions', r.questions, 'answers', r.inputs -> 'answers'),
    'profile', (select data from public.company_profiles where email = r.email),
    'context', coalesce(r.context, jsonb_build_object('text', r.inputs ->> '_context')),
    'retrieved', coalesce(r.retrieved, '[]'::jsonb),
    'previous_result', (select public.nexum_result_text(p.result) from public.module_runs p
                         where p.email = r.email and p.module_key = r.module_key and p.status = 'done' and p.id <> r.id
                         order by p.created_at desc limit 1)
  );
end $$;

create or replace function public.nexum_ask(p_run_id uuid, p_questions jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'questions must be a non-empty JSON array of {key,label,type,options}';
  end if;
  update public.module_runs set status = 'needs_input', questions = p_questions, finished_at = now()
   where id = p_run_id and status = 'running';
  if not found then raise exception 'run % is not running', p_run_id; end if;
end $$;

-- Finish a run in one transaction: result, artifact record, tasks, alerts and an
-- optional profile patch (company research). Arrays may be null.
create or replace function public.nexum_complete(
  p_run_id uuid,
  p_result_md text,
  p_summary text default null,
  p_tasks jsonb default null,          -- [{title, priority:'high|medium|low'}]
  p_notifications jsonb default null,  -- [{severity, title, message, impact?, link?}]
  p_profile_patch jsonb default null   -- {section: {field: value}} merged into company_profiles.data
) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  r public.module_runs;
  t jsonb; n jsonb;
  n_tasks int := 0; n_notes int := 0;
  sec text; val jsonb;
begin
  if coalesce(btrim(p_result_md), '') = '' then raise exception 'result must not be empty'; end if;
  update public.module_runs
     set status = 'done', result = jsonb_build_object('markdown', p_result_md, 'format', 'md'),
         summary = p_summary, questions = null, error = null, finished_at = now()
   where id = p_run_id and status = 'running'
  returning * into r;
  if not found then raise exception 'run % is not running', p_run_id; end if;

  if r.module_key not in ('daily-tasks') then
    insert into public.company_records (email, kind, data)
    values (r.email, 'artifacts', jsonb_build_object(
      'module_key', r.module_key, 'title', coalesce(r.module_name, r.module_key),
      'format', 'md', 'run_id', r.id, 'summary', p_summary, 'created_at', now()));
  end if;

  if jsonb_typeof(p_tasks) = 'array' then
    for t in select * from jsonb_array_elements(p_tasks) loop
      continue when coalesce(t ->> 'title', '') = '';
      -- skip duplicates of still-open tasks
      continue when exists (select 1 from public.company_records
                             where email = r.email and kind = 'tasks'
                               and lower(data ->> 'title') = lower(t ->> 'title')
                               and coalesce(data ->> 'done', 'false') not in ('true', 't', '1', 'yes'));
      insert into public.company_records (email, kind, data)
      values (r.email, 'tasks', jsonb_build_object(
        'title', t ->> 'title', 'priority', coalesce(t ->> 'priority', 'medium'),
        'done', false, 'source', coalesce(r.module_name, r.module_key), 'run_id', r.id));
      n_tasks := n_tasks + 1;
    end loop;
  end if;

  if jsonb_typeof(p_notifications) = 'array' then
    for n in select * from jsonb_array_elements(p_notifications) loop
      continue when coalesce(n ->> 'title', '') = '';
      insert into public.company_records (email, kind, data)
      values (r.email, 'notifications', jsonb_build_object(
        'severity', coalesce(n ->> 'severity', 'info'), 'title', n ->> 'title',
        'message', n ->> 'message', 'impact', n ->> 'impact',
        'link', coalesce(n ->> 'link', 'module:' || r.module_key),
        'read', false, 'run_id', r.id, 'created_at', now()));
      n_notes := n_notes + 1;
    end loop;
  end if;

  if jsonb_typeof(p_profile_patch) = 'object' then
    insert into public.company_profiles (email, data) values (r.email, '{}'::jsonb)
    on conflict (email) do nothing;
    for sec, val in select key, value from jsonb_each(p_profile_patch) loop
      update public.company_profiles
         set data = jsonb_set(data, array[sec],
               case when jsonb_typeof(val) = 'object' and jsonb_typeof(data -> sec) = 'object'
                    then (data -> sec) || val else val end, true),
             updated_at = now()
       where email = r.email;
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'run_id', r.id, 'tasks', n_tasks, 'notifications', n_notes);
end $$;

create or replace function public.nexum_fail(p_run_id uuid, p_error text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.module_runs set status = 'error', error = left(coalesce(p_error, 'Unknown error'), 2000), finished_at = now()
   where id = p_run_id and status = 'running';
  if not found then raise exception 'run % is not running', p_run_id; end if;
end $$;

create or replace function public.nexum_pending_chats(p_limit int default 10)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(x order by x ->> 'created_at'), '[]'::jsonb) from (
    select jsonb_build_object(
      'message_id', m.id, 'email', m.email, 'message', m.content, 'created_at', m.created_at,
      'view', m.context ->> 'view',
      'history', (select coalesce(jsonb_agg(jsonb_build_object('role', h.role, 'content', h.content) order by h.created_at), '[]'::jsonb)
                    from (select role, content, created_at from public.agent_messages
                           where email = m.email and created_at < m.created_at
                           order by created_at desc limit 10) h),
      'profile', (select data from public.company_profiles where email = m.email),
      'retrieved', coalesce(m.retrieved, '[]'::jsonb)) as x
    from public.agent_messages m
    where m.status = 'pending' and m.role = 'user'
    order by m.created_at
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  ) s
$$;

create or replace function public.nexum_reply_chat(p_message_id uuid, p_reply text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare m public.agent_messages; new_id uuid;
begin
  update public.agent_messages set status = 'answered' where id = p_message_id and status = 'pending'
  returning * into m;
  if not found then raise exception 'message % is not pending', p_message_id; end if;
  insert into public.agent_messages (email, role, content, reply_to)
  values (m.email, 'assistant', p_reply, m.id) returning id into new_id;
  return new_id;
end $$;

-- Backfill the knowledge base from data that existed before this migration.
do $$
declare r record;
begin
  for r in select * from public.company_records c
            where c.kind not in ('connectors', 'notifications', 'artifacts')
              and not exists (select 1 from public.knowledge_chunks k where k.source_type = 'record' and k.source_id = c.id::text) loop
    perform public.nexum_put_chunks(r.email, 'record', r.id::text, r.kind, initcap(r.kind) || E'\n' || public.nexum_jsonb_text(r.data));
  end loop;
  for r in select * from public.module_runs m
            where m.status = 'done'
              and not exists (select 1 from public.knowledge_chunks k where k.source_type = 'run' and k.source_id = m.id::text) loop
    perform public.nexum_put_chunks(r.email, 'run', r.id::text, r.module_key,
      coalesce(r.module_name, r.module_key) || ' (result)' || E'\n' || public.nexum_result_text(r.result));
  end loop;
  update public.company_profiles p set data = p.data
   where not exists (select 1 from public.knowledge_chunks k where k.source_type = 'profile' and k.email = p.email);
end $$;

-- Only the service role / postgres (MCP) may call the automation interface.
do $$
declare f text;
begin
  foreach f in array array[
    'nexum_put_chunks(text,text,text,text,text)',
    'nexum_match_chunks(text,extensions.vector,int)',
    'nexum_search(text,text,int)',
    'nexum_records(text,text,int)',
    'nexum_claim_next(text)',
    'nexum_ask(uuid,jsonb)',
    'nexum_complete(uuid,text,text,jsonb,jsonb,jsonb)',
    'nexum_fail(uuid,text)',
    'nexum_pending_chats(int)',
    'nexum_reply_chat(uuid,text)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
