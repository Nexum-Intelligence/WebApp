-- NEXUM: leads from the readiness test and the contact form (call requests with
-- preferred weekdays/time slots). Written only by /api/lead with the service role.
-- Idempotent: creates the table or adds the missing columns to an existing one.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.leads
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists company text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists industry text,
  add column if not exists challenge text,
  add column if not exists consent boolean not null default false,
  add column if not exists score numeric,
  add column if not exists level text,
  add column if not exists dimensions jsonb,
  add column if not exists answers jsonb,
  add column if not exists lang text,
  add column if not exists source text,
  add column if not exists topic text,
  add column if not exists budget text,
  add column if not exists preferred_days text[],
  add column if not exists preferred_slots text[],
  add column if not exists timezone text,
  add column if not exists status text not null default 'new';

create index if not exists leads_created_idx on public.leads (created_at desc);

-- No browser access at all: no policies, RLS on, grants revoked.
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
