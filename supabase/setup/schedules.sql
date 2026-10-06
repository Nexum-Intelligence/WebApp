-- One-time setup (Supabase → SQL editor): recurring agent work.
--  * every day 05:30 UTC: "Daily Tasks" for every tenant active in the last 14 days
--  * Mondays: live modules a tenant has used before are refreshed
-- The Claude automation then picks these runs up like any other job.

create extension if not exists pg_cron;

select cron.schedule('nexum-recurring', '30 5 * * *', $$ select public.nexum_schedule_recurring(now()); $$);

-- Check:   select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'nexum-recurring') order by start_time desc limit 5;
-- Remove:  select cron.unschedule('nexum-recurring');
