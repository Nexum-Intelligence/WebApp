-- Behaviour tests for supabase/migrations/*_nexum_core.sql. Run after bootstrap + migration.
-- Each block raises on failure (psql -v ON_ERROR_STOP=1).
\set QUIET 1
truncate public.company_profiles, public.company_records, public.module_runs, public.agent_messages, public.knowledge_chunks;

-- 1. Record trigger creates searchable chunks; connectors are never embedded.
insert into public.company_records (email, kind, data) values
  ('a@x.de', 'products', '{"name":"Flat White","price":3.9,"recipe":[{"itemId":"1","qty":1}]}'),
  ('a@x.de', 'connectors', '{"key":"stripe","config":{"apiKey":"sk_live_secret"}}'),
  ('b@y.de', 'customers', '{"name":"Hotel Sonne","stage":"Customer","value":12000}');
do $$ begin
  assert (select count(*) from knowledge_chunks where email = 'a@x.de') = 1, 'one chunk for a (connector excluded)';
  assert (select content from knowledge_chunks where email = 'a@x.de') like 'Products%Name: Flat White%', 'readable content';
  assert not exists (select 1 from knowledge_chunks where content like '%sk_live%'), 'no secrets in chunks';
  assert (select embedding is null from knowledge_chunks where email = 'a@x.de'), 'pending embedding';
end $$;

-- 2. Unchanged content keeps its embedding; changed content resets it; delete removes chunks.
update public.knowledge_chunks set embedding = array_fill(0.1, array[384])::extensions.vector where email = 'a@x.de';
update public.company_records set data = data where kind = 'products';
do $$ begin assert (select embedding is not null from knowledge_chunks where email = 'a@x.de'), 'embedding kept'; end $$;
update public.company_records set data = data || '{"price":4.2}' where kind = 'products';
do $$ begin assert (select embedding is null from knowledge_chunks where email = 'a@x.de'), 'embedding reset on change'; end $$;
delete from public.company_records where kind = 'products';
do $$ begin assert (select count(*) from knowledge_chunks where email = 'a@x.de') = 0, 'chunks removed on delete'; end $$;

-- 3. Profile: one chunk per section, scalars in "general", removed sections disappear.
insert into public.company_profiles (email, data) values
  ('a@x.de', '{"basics":{"companyName":"Cafe Nord","industry":"gastro"},"goals":{"goals12m":"2. Standort"},"website":"cafe-nord.de"}');
do $$ begin
  assert (select count(*) from knowledge_chunks where source_type = 'profile' and email = 'a@x.de') = 3, '3 profile chunks';
end $$;
update public.company_profiles set data = data - 'goals' where email = 'a@x.de';
do $$ begin
  assert (select count(*) from knowledge_chunks where source_type = 'profile' and email = 'a@x.de') = 2, 'removed section dropped';
end $$;

-- 4. Long results are split into parts.
insert into public.module_runs (email, module_key, module_name, status, result)
values ('a@x.de', 'swot-analysis', 'SWOT', 'done', to_jsonb(repeat('Staerke ', 500)));
do $$ begin
  assert (select count(*) from knowledge_chunks where source_type = 'run') = 3, 'result split into 3 parts';
end $$;
truncate public.module_runs;

-- 5. Claim → ask → answer → claim → complete (full clarification loop).
insert into public.module_runs (email, module_key, module_name, inputs, lang, created_at)
values ('a@x.de', 'go-to-market', 'Go-to-Market', '{"market":"Hamburg","_context":"COMPANY: Cafe Nord"}', 'de', now() - interval '2 min'),
       ('b@y.de', 'swot-analysis', 'SWOT', '{}', 'en', now() - interval '1 min');
do $$
declare j jsonb; id1 uuid; res jsonb;
begin
  j := nexum_claim_next('test');
  assert j #>> '{run,module_key}' = 'go-to-market', 'oldest first';
  assert j #>> '{run,lang}' = 'de', 'lang passed';
  assert j #>> '{run,inputs,market}' = 'Hamburg', 'inputs passed';
  assert not (j #> '{run,inputs}' ? '_context'), 'internal keys stripped';
  assert j #>> '{context,text}' = 'COMPANY: Cafe Nord', 'context passed';
  assert j #>> '{profile,basics,companyName}' = 'Cafe Nord', 'profile passed';
  id1 := (j #>> '{run,id}')::uuid;
  assert (select status from module_runs where id = id1) = 'running', 'claimed run is running';

  -- second claim gets the other tenant's run, not the same one
  j := nexum_claim_next('test');
  assert j #>> '{run,module_key}' = 'swot-analysis', 'second claim gets next run';
  assert nexum_claim_next('test') is null, 'queue empty';

  perform nexum_ask(id1, '[{"key":"budget","label":"Marketing budget per month?","type":"text"}]');
  assert (select status from module_runs where id = id1) = 'needs_input', 'needs_input';

  -- what /api/module-run PATCH does with the owner's answers
  update module_runs set inputs = inputs || '{"answers":{"budget":"800 EUR"}}', status = 'queued' where id = id1;
  j := nexum_claim_next('test');
  assert (j #>> '{run,id}')::uuid = id1, 're-queued run claimed again';
  assert j #>> '{run,answers,budget}' = '800 EUR', 'answers passed';
  assert j #> '{run,questions}' is not null, 'original questions passed';
  assert (j #>> '{run,attempt}')::int = 2, 'attempt counted';

  res := nexum_complete(id1, E'# GTM-Plan\n\nKanal: Instagram', 'GTM fuer Hamburg',
    '[{"title":"Instagram-Profil optimieren","priority":"high"},{"title":""}]',
    '[{"severity":"recommendation","title":"Budget pruefen","message":"800 EUR reichen fuer 2 Kanaele"}]',
    '{"goals":{"goals12m":"2. Standort 2027"},"basics":{"employees":"6"}}');
  assert (res ->> 'tasks')::int = 1 and (res ->> 'notifications')::int = 1, 'tasks/notes inserted';
  assert (select status from module_runs where id = id1) = 'done', 'done';
  assert (select result ->> 'markdown' from module_runs where id = id1) like '# GTM-Plan%', 'markdown stored';
  assert (select questions from module_runs where id = id1) is null, 'questions cleared';
  assert exists (select 1 from company_records where kind = 'artifacts' and data ->> 'run_id' = id1::text), 'artifact record';
  assert (select data #>> '{basics,companyName}' from company_profiles where email = 'a@x.de') = 'Cafe Nord', 'profile merge keeps fields';
  assert (select data #>> '{basics,employees}' from company_profiles where email = 'a@x.de') = '6', 'profile merge adds fields';
  assert (select data #>> '{goals,goals12m}' from company_profiles where email = 'a@x.de') = '2. Standort 2027', 'profile new section';
  assert exists (select 1 from knowledge_chunks where source_type = 'run' and source_id = id1::text), 'result became knowledge';

  -- completing twice is rejected
  begin perform nexum_complete(id1, 'x'); assert false, 'complete on done must fail';
  exception when raise_exception then null; end;
end $$;

-- 5b. Malformed task rows written by users don't break nexum_complete.
insert into public.company_records (email, kind, data) values ('a@x.de', 'tasks', '{"title":"x","done":""}');
insert into public.module_runs (email, module_key, status) values ('a@x.de', 'daily-tasks', 'queued');
do $$ declare j jsonb; begin
  j := nexum_claim_next('test');
  perform nexum_complete((j #>> '{run,id}')::uuid, 'ok', null, '[{"title":"Neue Aufgabe"},{"title":"x"}]', null, null);
  assert (select count(*) from company_records where kind = 'tasks' and data ->> 'title' = 'x') = 1, 'open task not duplicated';
  assert exists (select 1 from company_records where kind = 'tasks' and data ->> 'title' = 'Neue Aufgabe'), 'new task added';
end $$;

-- 6. Stuck runs are reclaimed; after 3 attempts they fail.
truncate public.module_runs;
insert into public.module_runs (email, module_key, status, started_at, attempts)
values ('a@x.de', 'predictive', 'running', now() - interval '1 hour', 1),
       ('a@x.de', 'kpi-estimation', 'running', now() - interval '1 hour', 3);
do $$ declare j jsonb; begin
  j := nexum_claim_next('test');
  assert j #>> '{run,module_key}' = 'predictive', 'stuck run reclaimed';
  assert (select status from module_runs where module_key = 'kpi-estimation') = 'error', 'gave up after 3 attempts';
end $$;

-- 7. Retrieval: vector match and full-text search stay within the tenant.
truncate public.knowledge_chunks;
insert into public.company_records (email, kind, data) values
  ('a@x.de', 'suppliers', '{"name":"Roesterei Elbe","product":"Kaffeebohnen"}'),
  ('b@y.de', 'suppliers', '{"name":"Kaffee Konkurrenz","product":"Kaffeebohnen"}');
update public.knowledge_chunks set embedding = array_fill(0.2, array[384])::extensions.vector;
do $$ begin
  assert (select count(*) from nexum_search('a@x.de', 'Kaffeebohnen', 10)) = 1, 'fts tenant-scoped';
  assert (select count(*) from nexum_match_chunks('a@x.de', array_fill(0.2, array[384])::extensions.vector, 5)) = 1, 'vector tenant-scoped';
  assert jsonb_array_length(nexum_records('a@x.de', 'suppliers', 10)) = 1, 'records tenant-scoped';
  assert jsonb_array_length(nexum_records('a@x.de', 'connectors', 10)) = 0, 'connectors never returned';
end $$;

-- 8. Chat: pending → reply.
insert into public.agent_messages (email, role, content, status, context)
values ('a@x.de', 'user', 'Wie laeuft der Umsatz?', 'pending', '{"view":"finance"}');
do $$ declare p jsonb; mid uuid; begin
  p := nexum_pending_chats(5);
  assert jsonb_array_length(p) = 1, 'one pending chat';
  mid := (p -> 0 ->> 'message_id')::uuid;
  assert p -> 0 ->> 'view' = 'finance', 'view passed';
  perform nexum_reply_chat(mid, 'Umsatz +12 % zum Vormonat.');
  assert jsonb_array_length(nexum_pending_chats(5)) = 0, 'answered';
  assert exists (select 1 from agent_messages where role = 'assistant' and reply_to = mid), 'reply stored';
end $$;

-- 9. RLS: authenticated users only see their own rows and cannot write; anon sees nothing.
set role authenticated;
select set_config('request.jwt.claims', '{"email":"b@y.de"}', false);
do $$ begin
  assert (select count(*) from company_records) = (select count(*) from company_records where email = 'b@y.de'), 'only own rows';
  assert (select count(*) from company_records) > 0, 'own rows visible';
  begin insert into company_records (email, kind, data) values ('b@y.de', 'tasks', '{}'); assert false, 'insert must fail';
  exception when insufficient_privilege then null; end;
end $$;
do $$ begin
  begin perform nexum_claim_next('evil'); assert false, 'rpc must be forbidden';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role anon;
do $$ begin assert (select count(*) from company_records) = 0, 'anon sees nothing'; end $$;
reset role;

\echo ALL DB TESTS PASSED
