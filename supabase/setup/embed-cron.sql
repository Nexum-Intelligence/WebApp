-- One-time setup (Supabase → SQL editor), after deploying the `embed` Edge Function.
-- Calls the function every minute so new data is embedded even when no /api write
-- kicked it (e.g. results written by the Claude automation).
-- Replace the two placeholders; the values are stored encrypted in Vault, not here.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'nexum_project_url');
select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'nexum_service_key');

select cron.schedule(
  'nexum-embed',
  '* * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'nexum_project_url') || '/functions/v1/embed',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'nexum_service_key')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 5000
  )
  where exists (select 1 from public.knowledge_chunks where embedding is null)
     or exists (select 1 from public.module_runs where status = 'queued' and retrieved is null)
     or exists (select 1 from public.agent_messages where status = 'pending' and retrieved is null);
  $$
);

-- Check:   select * from cron.job_run_details order by start_time desc limit 5;
-- Remove:  select cron.unschedule('nexum-embed');
