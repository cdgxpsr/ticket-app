-- Official 예매처 links per event, e.g. [{"name":"인터파크","url":"https://..."}] (from KOPIS detail <relates>).
alter table public.culture_events add column if not exists booking_links jsonb not null default '[]'::jsonb;
grant all on public.culture_events to service_role;
