-- Regional culture events (영화/공연/전시/축제/액티비티), filled daily by the sync-culture edge function.
create table if not exists public.culture_events (
  id text primary key,               -- source:sourceId
  source text not null,
  category text not null check (category in ('영화','공연','전시','축제','액티비티')),
  title text not null,
  summary text,
  image_url text,
  venue text,
  region text not null check (region in ('전국','서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주')),
  address text,
  start_date date,
  end_date date,
  link_url text,
  lat double precision,
  lng double precision,
  updated_at timestamptz not null default now()
);

create index if not exists culture_events_region_cat_start on public.culture_events (region, category, start_date);

alter table public.culture_events enable row level security;
drop policy if exists culture_events_read on public.culture_events;
create policy culture_events_read on public.culture_events for select to anon, authenticated using (true);

grant usage on schema public to anon, authenticated;
grant select on public.culture_events to anon, authenticated;
-- No insert/update/delete grants: only the service role (edge function) writes.

-- Daily sync at 04:00 KST (= 19:00 UTC). Requires pg_cron + pg_net (Dashboard → Database → Extensions).
-- Run manually in the SQL editor after setting the secrets, replacing <SYNC_SECRET>:
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule('sync-culture-daily', '0 19 * * *', $$
--   select net.http_post(
--     url := 'https://dvrznqbtjwksthzqxnpq.supabase.co/functions/v1/sync-culture',
--     headers := jsonb_build_object('Content-Type','application/json','x-sync-secret','<SYNC_SECRET>'),
--     body := '{}'::jsonb,
--     timeout_milliseconds := 120000
--   );
-- $$);
