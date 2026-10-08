-- Behaviour tests for supabase/migrations/*_nexum_agent_role.sql (least-privilege agent).
\set QUIET 1
truncate public.company_profiles, public.company_records, public.module_runs, public.agent_messages,
         public.knowledge_chunks, public.subscriptions, public.audit_log;

insert into public.company_profiles (email, data) values
  ('a@x.de', '{"basics":{"companyName":"Cafe Nord","ownerEmail":"inhaber@cafe-nord.de","description":"Ruf an: +49 40 1234567, seit 2019-05-01"}}');
insert into public.company_records (email, kind, data) values
  ('a@x.de', 'customers', '{"name":"Hotel Elbblick","email":"info@elbblick.de","phone":"040 9876543","stage":"Customer","value":2400,"notes":"Kontakt: chef@elbblick.de, IBAN DE89 3704 0044 0532 0130 00"}'),
  ('a@x.de', 'staff', '{"name":"Mara","salary":2400,"phone":"0171 2345678"}'),
  ('b@y.de', 'customers', '{"name":"Fremdkunde","stage":"Customer"}');
insert into public.module_runs (email, module_key, module_name, inputs, created_at)
values ('a@x.de', 'competitor-analysis', 'Competitor Analysis', '{"market":"Hamburg"}', now() - interval '1 min');
insert into public.agent_messages (email, role, content, status) values ('a@x.de', 'user', 'Meine Nummer ist 0171 5554443, Mail lena@cafe-nord.de', 'pending');

-- 1. Redaction helpers
do $$ begin
  assert nexum_redact('Mail info@x.de oder +49 40 1234567, IBAN DE89 3704 0044 0532 0130 00, Datum 2026-10-08, Umsatz 107850')
       = 'Mail [email] oder [phone], IBAN [iban], Datum 2026-10-08, Umsatz 107850', 'redaction keeps dates and amounts';
  assert not (nexum_redact_json('{"email":"a@b.de","phone":"0123 456789","name":"X"}') ? 'email'), 'email key dropped';
end $$;

-- 2. The agent role: interface works, everything else is closed.
set session authorization nexum_agent;
do $$ declare j jsonb; ref uuid; recs jsonb; begin
  begin perform 1 from public.module_runs limit 1; assert false, 'table read must fail';
  exception when insufficient_privilege then null; end;
  begin perform public.nexum_claim_next('x'); assert false, 'raw claim must fail';
  exception when insufficient_privilege then null; end;
  begin perform public.nexum_records('a@x.de', 'customers', 10); assert false, 'email-based records must fail';
  exception when insufficient_privilege then null; end;
  begin perform public.nexum_search('a@x.de', 'Hotel', 10); assert false, 'email-based search must fail';
  exception when insufficient_privilege then null; end;

  j := public.nexum_agent_claim('claude');
  ref := (j #>> '{run,id}')::uuid;
  assert j -> 'run' ? 'id' and not (j -> 'run' ? 'email'), 'no email in run';
  assert j::text not like '%inhaber@cafe-nord.de%' and j::text not like '%1234567%', 'profile redacted';
  assert j #>> '{profile,basics,companyName}' = 'Cafe Nord', 'business data kept';
  assert j #>> '{profile,basics,description}' like '%[phone]%2019-05-01%', 'free text redacted, dates kept';

  recs := public.nexum_agent_records(ref, 'customers', 50);
  assert jsonb_array_length(recs) = 1, 'only own tenant';
  assert not (recs -> 0 -> 'data' ? 'email') and not (recs -> 0 -> 'data' ? 'phone'), 'contact fields dropped';
  assert recs -> 0 #>> '{data,notes}' = 'Kontakt: [email], IBAN [iban]', 'notes redacted';
  assert (recs -> 0 #>> '{data,value}')::int = 2400, 'business values kept';
  begin perform public.nexum_agent_records(ref, 'staff', 10); assert false, 'staff only for HR';
  exception when raise_exception then null; end;
  begin perform public.nexum_agent_records(ref, 'connectors', 10); assert false, 'connectors never';
  exception when raise_exception then null; end;
  begin perform public.nexum_agent_records(gen_random_uuid(), 'customers', 10); assert false, 'unknown ref';
  exception when raise_exception then null; end;
  assert (select count(*) from public.nexum_agent_search(ref, 'Hotel', 10)) = 1, 'search scoped to tenant';
  assert (select count(*) from public.nexum_agent_search(ref, 'Fremdkunde', 10)) = 0, 'other tenant invisible';

  perform public.nexum_complete(ref, '## Ergebnis', 'ok', '[{"title":"Angebot an Hotel senden"}]', null, null);
  begin perform public.nexum_agent_records(ref, 'customers', 10); assert false, 'finished job closes the scope';
  exception when raise_exception then null; end;

  j := public.nexum_agent_pending_chats(5);
  assert jsonb_array_length(j) = 1 and not (j -> 0 ? 'email'), 'chat without email';
  assert j -> 0 ->> 'message' = 'Meine Nummer ist [phone], Mail [email]', 'chat message redacted';
  perform public.nexum_reply_chat((j -> 0 ->> 'message_id')::uuid, 'Danke!');
end $$;
reset session authorization;

-- 3. Audit shows the automation as actor.
do $$ begin
  assert exists (select 1 from audit_log where actor = 'nexum_agent' and table_name = 'module_runs' and changed #>> '{status,to}' = 'done'), 'agent actor in audit';
  assert exists (select 1 from audit_log where actor = 'nexum_agent' and kind = 'tasks' and op = 'insert'), 'task insert by agent audited';
end $$;

-- 4. Browser roles still cannot reach the agent interface.
set role anon;
do $$ begin
  begin perform public.nexum_agent_claim('x'); assert false, 'anon must not claim';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

\echo ALL AGENT TESTS PASSED
