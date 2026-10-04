-- Public ratings & reviews on culture events (둘러보기 상세), readable by every signed-in user.
create table if not exists public.event_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  text text not null default '' check (char_length(text) <= 1000),
  created_at timestamptz not null default now(),
  unique (event_id, author)
);
create index if not exists event_reviews_event_idx on public.event_reviews (event_id, created_at desc);

alter table public.event_reviews enable row level security;
grant select, insert, update, delete on public.event_reviews to authenticated;
grant all on public.event_reviews to service_role;
create policy event_reviews_read on public.event_reviews for select to authenticated using (true);
create policy event_reviews_insert on public.event_reviews for insert to authenticated with check (author = (select auth.uid()));
create policy event_reviews_update on public.event_reviews for update to authenticated using (author = (select auth.uid())) with check (author = (select auth.uid()));
create policy event_reviews_delete on public.event_reviews for delete to authenticated using (author = (select auth.uid()));

-- Extra images per event, filled on demand by the event-images function.
alter table public.culture_events add column if not exists images text[];
