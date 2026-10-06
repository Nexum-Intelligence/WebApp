-- Behaviour tests for supabase/migrations/*_nexum_ops_billing.sql.
\set QUIET 1
truncate public.company_profiles, public.company_records, public.module_runs, public.agent_messages,
         public.knowledge_chunks, public.subscriptions, public.audit_log;

-- 1. POS sale: one transaction, live recipe cost, stock decrement, low-stock signal.
insert into public.company_records (id, email, kind, data) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@x.de', 'inventory', '{"name":"Bohnen","unitCost":0.02,"stock":"100","reorder":60}'),
  ('00000000-0000-0000-0000-0000000000a2', 'a@x.de', 'inventory', '{"name":"Milch","unitCost":0.001,"stock":1000,"reorder":10}'),
  ('00000000-0000-0000-0000-0000000000b1', 'a@x.de', 'products', '{"name":"Flat White","price":"4.20","cost":9,"recipe":[{"itemId":"00000000-0000-0000-0000-0000000000a1","qty":18},{"itemId":"00000000-0000-0000-0000-0000000000a2","qty":150}]}'),
  ('00000000-0000-0000-0000-0000000000b2', 'a@x.de', 'products', '{"name":"Kuchen","price":3.5,"cost":1.2}'),
  ('00000000-0000-0000-0000-0000000000c1', 'b@y.de', 'products', '{"name":"Fremd","price":1}');
do $$ declare r jsonb; begin
  r := nexum_record_sale('a@x.de', '00000000-0000-0000-0000-0000000000b1', 2);
  assert (r #>> '{sale,data,revenue}')::numeric = 8.40, 'revenue';
  assert (r #>> '{sale,data,unitCost}')::numeric = 0.51, 'recipe cost 18*0.02 + 150*0.001';
  assert (r #>> '{sale,data,profit}')::numeric = 7.38, 'profit';
  assert (select (data->>'stock')::numeric from company_records where id = '00000000-0000-0000-0000-0000000000a1') = 64, 'stock 100-36';
  assert (select (data->>'stock')::numeric from company_records where id = '00000000-0000-0000-0000-0000000000a2') = 700, 'stock 1000-300';
  assert jsonb_array_length(r -> 'lowStock') = 0, 'not low yet';
  r := nexum_record_sale('a@x.de', '00000000-0000-0000-0000-0000000000b1', 1);
  assert r #>> '{lowStock,0,name}' = 'Bohnen', 'low stock reported (46 <= 60)';
  assert (select count(*) from company_records where kind = 'transactions' and data->>'category' = 'Sales') = 2, 'income booked per sale';
  r := nexum_record_sale('a@x.de', '00000000-0000-0000-0000-0000000000b2', 3);
  assert (r #>> '{sale,data,cost}')::numeric = 3.6, 'product cost without recipe';
end $$;
do $$ begin
  begin perform nexum_record_sale('a@x.de', '00000000-0000-0000-0000-0000000000c1', 1); assert false, 'other tenant product';
  exception when raise_exception then null; end;
  begin perform nexum_record_sale('a@x.de', '00000000-0000-0000-0000-0000000000b2', 0); assert false, 'zero qty';
  exception when raise_exception then null; end;
end $$;

-- 2. Goods receipt: stock + weighted average cost + stock-purchase transaction; only once.
insert into public.company_records (id, email, kind, data) values
  ('00000000-0000-0000-0000-0000000000d1', 'a@x.de', 'purchases', '{"itemId":"00000000-0000-0000-0000-0000000000a1","itemName":"Bohnen","qty":1000,"unitCost":0.03,"status":"Ordered"}');
do $$ declare r jsonb; begin
  r := nexum_receive_purchase('a@x.de', '00000000-0000-0000-0000-0000000000d1');
  assert r #>> '{purchase,data,status}' = 'Received', 'received';
  assert (r #>> '{inventory,data,stock}')::numeric = 1046, 'stock 46+1000';
  assert (r #>> '{inventory,data,unitCost}')::numeric = round((46*0.02 + 1000*0.03)/1046, 4), 'weighted cost';
  assert (select (data->>'amount')::numeric from company_records where kind = 'transactions' and data->>'category' = 'Purchasing') = 30, 'expense 1000*0.03';
  begin perform nexum_receive_purchase('a@x.de', '00000000-0000-0000-0000-0000000000d1'); assert false, 'double receive';
  exception when raise_exception then null; end;
  begin perform nexum_receive_purchase('b@y.de', '00000000-0000-0000-0000-0000000000d1'); assert false, 'other tenant';
  exception when raise_exception then null; end;
end $$;

-- 3. Audit log: actor from request header, diffs only, connector secrets never logged.
select set_config('request.headers', '{"x-nexum-actor":"a@x.de"}', false);
update public.company_records set data = data || '{"price":4.5}' where id = '00000000-0000-0000-0000-0000000000b2';
update public.company_records set data = data where id = '00000000-0000-0000-0000-0000000000b2';
insert into public.company_records (email, kind, data) values ('a@x.de', 'connectors', '{"config":{"apiKey":"sk_live_x"}}');
select set_config('request.headers', '', false);
do $$ begin
  assert (select count(*) from audit_log where row_id = '00000000-0000-0000-0000-0000000000b2' and op = 'update') = 1, 'no-op update not logged';
  assert (select changed #>> '{price,to}' from audit_log where row_id = '00000000-0000-0000-0000-0000000000b2' and op = 'update') = '4.5', 'diff logged';
  assert (select actor from audit_log where row_id = '00000000-0000-0000-0000-0000000000b2' and op = 'update') = 'a@x.de', 'actor from header';
  assert not exists (select 1 from audit_log where changed::text like '%sk_live%'), 'no secrets in audit';
  assert exists (select 1 from audit_log where table_name = 'company_records' and op = 'insert' and kind = 'sales' and actor = 'postgres'), 'db role as fallback actor';
end $$;

-- 4. Scheduler: daily tasks once per day for active tenants; Mondays refresh used live modules.
truncate public.module_runs;
insert into public.module_runs (email, module_key, module_name, suite_key, status, lang, created_at)
values ('a@x.de', 'predictive', 'Predictive Intelligence', 'intelligence', 'done', 'de', now() - interval '3 days');
do $$ declare r jsonb; monday timestamptz := date_trunc('week', now()) + interval '6 hours'; begin
  r := nexum_schedule_recurring(monday);
  assert (r ->> 'daily')::int = 2, 'daily for both active tenants';
  assert (r ->> 'live')::int = 1, 'live module refreshed on monday';
  assert (select lang from module_runs where module_key = 'daily-tasks' and email = 'a@x.de') = 'de', 'language kept';
  update company_records set updated_at = now() - interval '30 days' where email = 'b@y.de';
  assert (select count(*) from module_runs where module_key = 'daily-tasks' and email = 'b@y.de') = 1;
  r := nexum_schedule_recurring(monday);
  assert (r ->> 'daily')::int = 0 and (r ->> 'live')::int = 0, 'idempotent per day';
  r := nexum_schedule_recurring(monday + interval '1 day');
  assert (r ->> 'live')::int = 0, 'no live refresh on tuesday';
end $$;

-- 5. Permissions: browser roles cannot call booking/scheduler functions or read others' plans.
insert into public.subscriptions (email, package_key) values ('a@x.de', 'growth'), ('b@y.de', 'venture-starter');
set role authenticated;
select set_config('request.jwt.claims', '{"email":"b@y.de"}', false);
do $$ begin
  assert (select count(*) from subscriptions) = 1, 'own plan only';
  begin perform nexum_record_sale('b@y.de', '00000000-0000-0000-0000-0000000000c1', 1); assert false, 'rpc forbidden';
  exception when insufficient_privilege then null; end;
  begin insert into subscriptions (email, package_key) values ('b@y.de', 'enterprise-plus'); assert false, 'no self-upgrade';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

\echo ALL OPS TESTS PASSED
