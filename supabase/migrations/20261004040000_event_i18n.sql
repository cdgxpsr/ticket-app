-- Machine translations of event title/summary, filled by sync-culture:
-- {"en": {"title": "...", "summary": "..."}, "ja": {...}, "zh-Hans": {...}}. null = not translated yet.
alter table public.culture_events add column if not exists i18n jsonb;
create index if not exists culture_events_i18n_missing_idx on public.culture_events (id) where i18n is null;
grant all on public.culture_events to service_role;
