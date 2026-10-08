-- NEXUM: least-privilege access for the Claude automation (DSGVO data minimisation).
-- Requires 20261006000000_nexum_core.sql and 20261007000000_nexum_ops_billing.sql. Idempotent.
--
--  * role `nexum_agent` (created NOLOGIN; enable it yourself with a password):
--      alter role nexum_agent with login password '<strong password>';
--  * it may only EXECUTE the agent interface below — no table, view or schema access
--  * the agent never sees e-mail addresses: jobs and chats are addressed by id, data
--    queries are scoped to the job/chat being worked on, contact data is redacted
--  * every change it causes is in audit_log with actor = nexum_agent
-- Design: design/02-agent-data-flow.md (section "Agent role").

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'nexum_agent') then
    create role nexum_agent nologin noinherit;
  end if;
end $$;
alter role nexum_agent set statement_timeout = '60s';
alter role nexum_agent connection limit 5;

-- ---------------------------------------------------------------------------
-- Redaction helpers
-- ---------------------------------------------------------------------------

-- Masks e-mail addresses, phone numbers and IBANs in free text.
create or replace function public.nexum_redact(t text) returns text
language sql immutable set search_path = public, extensions as $$
  select regexp_replace(
           regexp_replace(
             regexp_replace(coalesce(t, ''), '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email]', 'g'),
             '\m[A-Z]{2}[0-9]{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,4})?\M', '[iban]', 'g'),
           '(?:\+|\m0)[0-9][0-9 ()/-]{6,}[0-9]', '[phone]', 'g')
$$;

-- Drops contact / identity fields from a record's data and redacts the rest of its text.
create or replace function public.nexum_redact_json(j jsonb) returns jsonb
language sql immutable set search_path = public, extensions as $$
  select coalesce(jsonb_object_agg(key,
           case when jsonb_typeof(value) = 'string' then to_jsonb(public.nexum_redact(value #>> '{}')) else value end), '{}'::jsonb)
  from jsonb_each(case when jsonb_typeof(j) = 'object' then j else '{}'::jsonb end)
  where key !~* '(e-?mail|phone|mobile|tel|fax|iban|bic|address|street|zip|postal|birth|tax|ssn|passport|apikey|api_key|token|secret|password)'
$$;

-- Tenant of the job (running module run) or chat (pending message) the agent works on.
create or replace function public.nexum_scope_email(p_ref uuid) returns text
language sql stable security definer set search_path = public, extensions as $$
  select coalesce(
    (select email from public.module_runs where id = p_ref and status = 'running'),
    (select email from public.agent_messages where id = p_ref and status = 'pending' and role = 'user'))
$$;

-- ---------------------------------------------------------------------------
-- Agent interface (no e-mail in, no e-mail out)
-- ---------------------------------------------------------------------------

create or replace function public.nexum_agent_claim(p_worker text default 'claude')
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare j jsonb;
begin
  j := public.nexum_claim_next(p_worker);
  if j is null then return null; end if;
  return jsonb_build_object(
    'run', (j -> 'run') - 'email',
    'profile', public.nexum_redact_json_deep(j -> 'profile'),
    'context', jsonb_build_object('text', public.nexum_redact(j #>> '{context,text}'), 'data', (j #> '{context,data}') - 'email'),
    'retrieved', (select coalesce(jsonb_agg(jsonb_set(c, '{content}', to_jsonb(public.nexum_redact(c ->> 'content')))), '[]'::jsonb)
                    from jsonb_array_elements(coalesce(j -> 'retrieved', '[]'::jsonb)) c),
    'previous_result', public.nexum_redact(j ->> 'previous_result'));
end $$;

-- Profile = { section: { field: value } } — redact each section.
create or replace function public.nexum_redact_json_deep(j jsonb) returns jsonb
language sql immutable set search_path = public, extensions as $$
  select case when jsonb_typeof(j) <> 'object' then j else
    (select coalesce(jsonb_object_agg(key, case when jsonb_typeof(value) = 'object' then public.nexum_redact_json(value)
                                                 when jsonb_typeof(value) = 'string' then to_jsonb(public.nexum_redact(value #>> '{}'))
                                                 else value end), '{}'::jsonb)
       from jsonb_each(j)
      where key !~* '(e-?mail|phone|mobile|iban|address|street|birth|tax|password|token)') end
$$;

-- Keyword search in the knowledge base of the job/chat's tenant only.
create or replace function public.nexum_agent_search(p_ref uuid, p_query text, p_k int default 10)
returns table (kind text, source_type text, content text, rank real)
language plpgsql stable security definer set search_path = public, extensions as $$
declare e text := public.nexum_scope_email(p_ref);
begin
  if e is null then raise exception 'unknown or finished job/chat %', p_ref; end if;
  return query select s.kind, s.source_type, public.nexum_redact(s.content), s.rank from public.nexum_search(e, p_query, p_k) s;
end $$;

-- Detail records of the job/chat's tenant, contact fields removed. Staff details only
-- for HR modules; connectors never.
create or replace function public.nexum_agent_records(p_ref uuid, p_kind text, p_limit int default 200)
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare
  e text := public.nexum_scope_email(p_ref);
  mod text := (select module_key from public.module_runs where id = p_ref);
begin
  if e is null then raise exception 'unknown or finished job/chat %', p_ref; end if;
  if p_kind = 'connectors' then raise exception 'not available'; end if;
  if p_kind = 'staff' and coalesce(mod, '') not in ('hr-planning', 'functional-specialist') then
    raise exception 'staff details are only available to HR modules — use context.data.staff for totals';
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', r ->> 'id', 'created_at', r ->> 'created_at', 'data', public.nexum_redact_json(r -> 'data'))), '[]'::jsonb)
            from jsonb_array_elements(public.nexum_records(e, p_kind, p_limit)) r);
end $$;

create or replace function public.nexum_agent_pending_chats(p_limit int default 10)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  select coalesce(jsonb_agg(
           (c - 'email' - 'profile' - 'retrieved')
           || jsonb_build_object(
                'message', public.nexum_redact(c ->> 'message'),
                'profile', public.nexum_redact_json_deep(c -> 'profile'),
                'retrieved', (select coalesce(jsonb_agg(jsonb_set(x, '{content}', to_jsonb(public.nexum_redact(x ->> 'content')))), '[]'::jsonb)
                                from jsonb_array_elements(coalesce(c -> 'retrieved', '[]'::jsonb)) x))), '[]'::jsonb)
  from jsonb_array_elements(public.nexum_pending_chats(p_limit)) c
$$;

-- ---------------------------------------------------------------------------
-- Audit: the database session user identifies the automation (security definer
-- functions run as their owner, so current_user would always be the owner).
-- ---------------------------------------------------------------------------

create or replace function public.nexum_audit() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  hdr jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  actor text := coalesce(hdr ->> 'x-nexum-actor', nullif(auth.jwt() ->> 'email', ''), session_user::text);
  rec jsonb := to_jsonb(coalesce(new, old));
  before jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) -> 'data' end;
  after  jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) -> 'data' end;
  diff jsonb;
begin
  if tg_table_name = 'module_runs' then
    before := case when tg_op <> 'INSERT' then jsonb_build_object('status', old.status) end;
    after  := case when tg_op <> 'DELETE' then jsonb_build_object('status', new.status) end;
    if tg_op = 'UPDATE' and old.status = new.status then return new; end if;
  end if;
  if rec ->> 'kind' = 'connectors' then
    diff := jsonb_build_object('note', 'connector settings changed');
  elsif tg_op = 'UPDATE' then
    select jsonb_object_agg(k, jsonb_build_object('from', before -> k, 'to', after -> k)) into diff
      from (select key k from jsonb_each(coalesce(before, '{}'::jsonb)) union select key from jsonb_each(coalesce(after, '{}'::jsonb))) keys
     where (before -> k) is distinct from (after -> k);
    if diff is null then return new; end if;
  else
    diff := coalesce(after, before);
  end if;
  insert into public.audit_log (email, actor, table_name, op, row_id, kind, changed)
  values (rec ->> 'email', actor, tg_table_name, lower(tg_op), coalesce(rec ->> 'id', rec ->> 'email'),
          coalesce(rec ->> 'kind', rec ->> 'module_key'), diff);
  return coalesce(new, old);
end $$;

-- ---------------------------------------------------------------------------
-- Grants: the agent role gets exactly the agent interface + the id-based writers.
-- ---------------------------------------------------------------------------

revoke all on schema public from nexum_agent;
grant usage on schema public to nexum_agent;
revoke all on all tables in schema public from nexum_agent;
revoke all on all sequences in schema public from nexum_agent;
revoke all on all functions in schema public from nexum_agent;

do $$
declare f text;
begin
  -- helpers: nobody calls these directly from the browser
  foreach f in array array[
    'nexum_scope_email(uuid)', 'nexum_redact(text)', 'nexum_redact_json(jsonb)', 'nexum_redact_json_deep(jsonb)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
  -- the agent interface
  foreach f in array array[
    'nexum_agent_claim(text)', 'nexum_agent_search(uuid,text,int)', 'nexum_agent_records(uuid,text,int)',
    'nexum_agent_pending_chats(int)',
    'nexum_ask(uuid,jsonb)', 'nexum_complete(uuid,text,text,jsonb,jsonb,jsonb)', 'nexum_fail(uuid,text)',
    'nexum_reply_chat(uuid,text)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role, nexum_agent', f);
  end loop;
end $$;

-- functions created later must not leak to the agent role by default
alter default privileges in schema public revoke execute on functions from public;

notify pgrst, 'reload schema';
