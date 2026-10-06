-- NEXUM: atomic bookings (POS sale, goods receipt), subscriptions (plans),
-- audit log and recurring agent runs. Idempotent. Requires 20261006000000_nexum_core.sql.

-- ---------------------------------------------------------------------------
-- Atomic bookings — called by /api/ops with the service role
-- ---------------------------------------------------------------------------

-- Sale: sales row + income transaction + stock decrement in one transaction.
-- Unit cost comes from the live recipe (inventory unitCost) or the product's cost.
create or replace function public.nexum_record_sale(p_email text, p_product_id uuid, p_qty numeric)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  prod public.company_records;
  line jsonb;
  it public.company_records;
  unit_price numeric; unit_cost numeric := 0; recipe_cost numeric := 0; has_recipe boolean := false;
  rev numeric; cost numeric; sale public.company_records;
  low jsonb := '[]'::jsonb; new_stock numeric;
begin
  if p_qty is null or p_qty <= 0 or p_qty > 100000 then raise exception 'invalid quantity'; end if;
  select * into prod from public.company_records where id = p_product_id and email = p_email and kind = 'products';
  if not found then raise exception 'product not found'; end if;
  unit_price := coalesce(nullif(prod.data ->> 'price', '')::numeric, 0);

  -- lock all recipe items first (consistent order avoids deadlocks)
  perform 1 from public.company_records
   where email = p_email and kind = 'inventory'
     and id::text in (select l ->> 'itemId' from jsonb_array_elements(coalesce(prod.data -> 'recipe', '[]'::jsonb)) l)
   order by id for update;

  for line in select * from jsonb_array_elements(coalesce(prod.data -> 'recipe', '[]'::jsonb)) loop
    select * into it from public.company_records
     where email = p_email and kind = 'inventory' and id::text = line ->> 'itemId';
    continue when not found;
    has_recipe := true;
    recipe_cost := recipe_cost + coalesce(nullif(line ->> 'qty', '')::numeric, 0) * coalesce(nullif(it.data ->> 'unitCost', '')::numeric, 0);
    new_stock := coalesce(nullif(it.data ->> 'stock', '')::numeric, 0) - coalesce(nullif(line ->> 'qty', '')::numeric, 0) * p_qty;
    update public.company_records set data = jsonb_set(data, '{stock}', to_jsonb(new_stock)) where id = it.id;
    if new_stock <= coalesce(nullif(it.data ->> 'reorder', '')::numeric, 0) then
      low := low || jsonb_build_object('id', it.id, 'name', it.data ->> 'name', 'stock', new_stock);
    end if;
  end loop;

  unit_cost := case when has_recipe then recipe_cost else coalesce(nullif(prod.data ->> 'cost', '')::numeric, 0) end;
  rev := round(unit_price * p_qty, 2);
  cost := round(unit_cost * p_qty, 2);

  insert into public.company_records (email, kind, data) values (p_email, 'sales', jsonb_build_object(
    'productId', prod.id, 'productName', prod.data ->> 'name', 'qty', p_qty,
    'unitPrice', unit_price, 'unitCost', round(unit_cost, 4), 'revenue', rev, 'cost', cost, 'profit', rev - cost,
    'date', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')))
  returning * into sale;

  insert into public.company_records (email, kind, data) values (p_email, 'transactions', jsonb_build_object(
    'date', to_char(now(), 'YYYY-MM-DD'), 'type', 'Income', 'category', 'Sales', 'amount', rev,
    'description', p_qty || '× ' || coalesce(prod.data ->> 'name', 'product'), 'saleId', sale.id));

  return jsonb_build_object('sale', jsonb_build_object('id', sale.id, 'created_at', sale.created_at, 'kind', 'sales', 'data', sale.data), 'lowStock', low);
end $$;

-- Goods receipt: status, stock (+ weighted average unit cost) and the stock-purchase
-- transaction in one transaction. Receiving twice is rejected.
create or replace function public.nexum_receive_purchase(p_email text, p_purchase_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  po public.company_records; it public.company_records;
  qty numeric; unit numeric; old_stock numeric; old_cost numeric; new_cost numeric;
begin
  select * into po from public.company_records where id = p_purchase_id and email = p_email and kind = 'purchases' for update;
  if not found then raise exception 'purchase not found'; end if;
  if po.data ->> 'status' = 'Received' then raise exception 'already received'; end if;
  qty := coalesce(nullif(po.data ->> 'qty', '')::numeric, 0);
  unit := coalesce(nullif(po.data ->> 'unitCost', '')::numeric, 0);

  update public.company_records set data = data || jsonb_build_object('status', 'Received', 'receivedAt', to_char(now(), 'YYYY-MM-DD'))
   where id = po.id returning * into po;

  if coalesce(po.data ->> 'itemId', '') <> '' then
    select * into it from public.company_records where email = p_email and kind = 'inventory' and id::text = po.data ->> 'itemId' for update;
    if found then
      old_stock := greatest(coalesce(nullif(it.data ->> 'stock', '')::numeric, 0), 0);
      old_cost := coalesce(nullif(it.data ->> 'unitCost', '')::numeric, 0);
      new_cost := case when old_stock + qty > 0 and unit > 0 then round((old_stock * old_cost + qty * unit) / (old_stock + qty), 4) else old_cost end;
      update public.company_records
         set data = data || jsonb_build_object('stock', coalesce(nullif(it.data ->> 'stock', '')::numeric, 0) + qty, 'unitCost', new_cost)
       where id = it.id returning * into it;
    end if;
  end if;

  insert into public.company_records (email, kind, data) values (p_email, 'transactions', jsonb_build_object(
    'date', to_char(now(), 'YYYY-MM-DD'), 'type', 'Expense', 'category', 'Purchasing', 'amount', round(qty * unit, 2),
    'description', qty || '× ' || coalesce(po.data ->> 'itemName', po.data ->> 'supplier', 'goods'), 'purchaseId', po.id));

  return jsonb_build_object(
    'purchase', jsonb_build_object('id', po.id, 'kind', 'purchases', 'data', po.data),
    'inventory', case when it.id is null then null else jsonb_build_object('id', it.id, 'kind', 'inventory', 'data', it.data) end);
end $$;

-- ---------------------------------------------------------------------------
-- Subscriptions (written by the Stripe webhook / owner via /api/billing)
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
  email                  text primary key,
  package_key            text not null,
  status                 text not null default 'active',   -- active | canceled | past_due
  interval               text,                              -- once | year | manual
  current_period_end     timestamptz,                       -- null = no end (one-time purchase)
  stripe_customer        text,
  stripe_subscription    text,
  updated_at             timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists nexum_read_own on public.subscriptions;
create policy nexum_read_own on public.subscriptions for select to authenticated using (email = (auth.jwt() ->> 'email'));

-- ---------------------------------------------------------------------------
-- Audit log: every change to tenant data, with the actor
-- (/api sends `x-nexum-actor`; the Claude automation shows up as its DB role)
-- ---------------------------------------------------------------------------

create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  email       text,
  actor       text,
  table_name  text not null,
  op          text not null,
  row_id      text,
  kind        text,
  changed     jsonb
);
create index if not exists audit_log_email_idx on public.audit_log (email, at desc);
alter table public.audit_log enable row level security;
drop policy if exists nexum_read_own on public.audit_log;
create policy nexum_read_own on public.audit_log for select to authenticated using (email = (auth.jwt() ->> 'email'));

create or replace function public.nexum_audit() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  hdr jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  actor text := coalesce(hdr ->> 'x-nexum-actor', nullif(auth.jwt() ->> 'email', ''), current_user);
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
    diff := jsonb_build_object('note', 'connector settings changed');   -- never log secrets
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

drop trigger if exists nexum_audit on public.company_records;
create trigger nexum_audit after insert or update or delete on public.company_records for each row execute function public.nexum_audit();
drop trigger if exists nexum_audit on public.company_profiles;
create trigger nexum_audit after insert or update or delete on public.company_profiles for each row execute function public.nexum_audit();
drop trigger if exists nexum_audit on public.module_runs;
create trigger nexum_audit after insert or update or delete on public.module_runs for each row execute function public.nexum_audit();
drop trigger if exists nexum_audit on public.subscriptions;
create trigger nexum_audit after insert or update or delete on public.subscriptions for each row execute function public.nexum_audit();

-- ---------------------------------------------------------------------------
-- Recurring runs (pg_cron, see supabase/setup/schedules.sql)
-- ---------------------------------------------------------------------------

-- Daily: queue "daily-tasks" for every tenant active in the last 14 days (once per day).
-- Mondays: refresh live modules a tenant has used before (if none is open).
create or replace function public.nexum_schedule_recurring(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  n_daily int := 0; n_live int := 0;
begin
  with active as (
    select distinct email from public.company_records where updated_at > p_now - interval '14 days'
    union select distinct email from public.module_runs where created_at > p_now - interval '14 days'
  ), ins as (
    insert into public.module_runs (email, module_key, module_name, suite_key, status, source, lang)
    select a.email, 'daily-tasks', 'Daily Tasks', 'intelligence', 'queued', 'schedule',
           (select lang from public.module_runs l where l.email = a.email and l.lang is not null order by created_at desc limit 1)
      from active a
     where not exists (select 1 from public.module_runs r where r.email = a.email and r.module_key = 'daily-tasks'
                         and r.created_at >= date_trunc('day', p_now))
    returning 1
  ) select count(*) into n_daily from ins;

  if extract(isodow from p_now) = 1 then
    with used as (
      select distinct on (email, module_key) email, module_key, module_name, suite_key, package_key, lang, inputs
        from public.module_runs
       where module_key in ('business-operations', 'predictive', 'opportunity-risk', 'decision-recommendation')
         and status = 'done'
       order by email, module_key, created_at desc
    ), ins as (
      insert into public.module_runs (email, module_key, module_name, suite_key, package_key, status, source, lang, inputs)
      select u.email, u.module_key, u.module_name, u.suite_key, u.package_key, 'queued', 'schedule', u.lang,
             u.inputs - 'answers'
        from used u
       where not exists (select 1 from public.module_runs r where r.email = u.email and r.module_key = u.module_key
                           and (r.status in ('queued', 'running', 'needs_input') or r.created_at >= date_trunc('day', p_now)))
      returning 1
    ) select count(*) into n_live from ins;
  end if;

  return jsonb_build_object('daily', n_daily, 'live', n_live);
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'nexum_record_sale(text,uuid,numeric)',
    'nexum_receive_purchase(text,uuid)',
    'nexum_schedule_recurring(timestamptz)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- let PostgREST pick up new tables/functions right away
notify pgrst, 'reload schema';
