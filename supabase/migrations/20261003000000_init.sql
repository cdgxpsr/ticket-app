-- 냥냥수첩 initial schema. Data API does not auto-expose tables: explicit GRANTs + RLS below.

create type public.board_kind as enum ('라운지', '챌린지', '질문', '인생 공연');
create type public.friend_status as enum ('pending', 'accepted');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default '냥이',
  avatar jsonb not null default '{}'::jsonb,
  invite_code text not null unique,
  referred_by uuid references public.profiles (id) on delete set null,
  stamps int not null default 0 check (stamps >= 0),
  items text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category text not null default '기타',
  title text not null default '',
  date text not null default '',
  time text not null default '',
  venue text not null default '',
  seat text not null default '',
  image_path text,
  original_path text,
  created_at timestamptz not null default now()
);
create index on public.cards (owner, created_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  card_id uuid references public.cards (id) on delete set null,
  show jsonb not null default '{}'::jsonb,
  rating numeric(2,1) not null check (rating >= 0.5 and rating <= 5 and rating * 2 = floor(rating * 2)),
  text text not null default '',
  created_at timestamptz not null default now()
);
create index on public.reviews (author, created_at desc);

create table public.board_posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  board public.board_kind not null,
  title text not null,
  body text not null default '',
  tag text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.board_posts (board, created_at desc);

-- likes/comments target either a review or a board post (exactly one).
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  review_id uuid references public.reviews (id) on delete cascade,
  post_id uuid references public.board_posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(review_id, post_id) = 1),
  unique (user_id, review_id),
  unique (user_id, post_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  review_id uuid references public.reviews (id) on delete cascade,
  post_id uuid references public.board_posts (id) on delete cascade,
  text text not null check (length(text) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (num_nonnulls(review_id, post_id) = 1)
);

create table public.friendships (
  requester uuid not null references public.profiles (id) on delete cascade,
  addressee uuid not null references public.profiles (id) on delete cascade,
  status public.friend_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);

-- Helpers ---------------------------------------------------------------
create or replace function public.is_friend(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select other = auth.uid() or exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = auth.uid() and f.addressee = other) or (f.addressee = auth.uid() and f.requester = other))
  );
$$;

create or replace function public.gen_invite_code() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
begin
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where invite_code = c);
  end loop;
  return c;
end;
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, invite_code) values (new.id, public.gen_invite_code())
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may not edit invite_code / referred_by / stamps / items directly.
create or replace function public.protect_profile_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_setting('nyang.privileged', true) = 'on' then return new; end if;
  new.invite_code := old.invite_code;
  new.referred_by := old.referred_by;
  new.items := old.items;
  new.stamps := old.stamps;
  return new;
end;
$$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Invite reward: sets referred_by once, grants an avatar item to both users, makes them friends.
create or replace function public.claim_invite(code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  inviter uuid;
  reward constant text := 'face:crown';
begin
  if me is null then raise exception 'not authenticated'; end if;
  select id into inviter from public.profiles where invite_code = upper(trim(code));
  if inviter is null or inviter = me then return false; end if;
  perform set_config('nyang.privileged', 'on', true);
  update public.profiles set referred_by = inviter where id = me and referred_by is null;
  if not found then return false; end if;
  update public.profiles set items = array_append(items, reward)
    where id in (me, inviter) and not (reward = any (items));
  insert into public.friendships (requester, addressee, status) values (inviter, me, 'accepted')
    on conflict do nothing;
  return true;
end;
$$;

-- Add friend by invite code (auto-accepted, mirrors current app UX).
create or replace function public.add_friend_by_code(code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  other uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select id into other from public.profiles where invite_code = upper(trim(code));
  if other is null then raise exception 'not_found'; end if;
  if other = me then raise exception 'self'; end if;
  if public.is_friend(other) then raise exception 'already'; end if;
  insert into public.friendships (requester, addressee, status) values (me, other, 'accepted')
    on conflict (requester, addressee) do update set status = 'accepted';
  return other;
end;
$$;

create or replace function public.add_stamps(n int default 1) returns int
language plpgsql security definer set search_path = '' as $$
declare s int;
begin
  if n < 1 or n > 10 then raise exception 'invalid'; end if;
  perform set_config('nyang.privileged', 'on', true);
  update public.profiles set stamps = stamps + n where id = auth.uid() returning stamps into s;
  return s;
end;
$$;

revoke execute on function public.claim_invite(text), public.add_friend_by_code(text), public.add_stamps(int),
  public.is_friend(uuid), public.handle_new_user(), public.gen_invite_code() from public, anon;
grant execute on function public.claim_invite(text), public.add_friend_by_code(text), public.add_stamps(int),
  public.is_friend(uuid) to authenticated;

-- Grants (no anon access to tables) --------------------------------------
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.cards, public.reviews, public.board_posts, public.comments to authenticated;
grant select, insert, delete on public.likes to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;

-- RLS -------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.reviews enable row level security;
alter table public.board_posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.friendships enable row level security;

-- Profiles: any signed-in user can see nickname/avatar (needed for board authors).
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy cards_read on public.cards for select to authenticated using (public.is_friend(owner));
create policy cards_insert on public.cards for insert to authenticated with check (owner = (select auth.uid()));
create policy cards_update on public.cards for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy cards_delete on public.cards for delete to authenticated using (owner = (select auth.uid()));

create policy reviews_read on public.reviews for select to authenticated using (public.is_friend(author));
create policy reviews_insert on public.reviews for insert to authenticated with check (author = (select auth.uid()));
create policy reviews_update on public.reviews for update to authenticated using (author = (select auth.uid())) with check (author = (select auth.uid()));
create policy reviews_delete on public.reviews for delete to authenticated using (author = (select auth.uid()));

create policy posts_read on public.board_posts for select to authenticated using (true);
create policy posts_insert on public.board_posts for insert to authenticated with check (author = (select auth.uid()) and verified = false);
create policy posts_update on public.board_posts for update to authenticated using (author = (select auth.uid())) with check (author = (select auth.uid()));
create policy posts_delete on public.board_posts for delete to authenticated using (author = (select auth.uid()));

-- Likes/comments: visible if the target is visible (RLS on the target applies inside exists()).
create policy likes_read on public.likes for select to authenticated using (
  post_id is not null or exists (select 1 from public.reviews r where r.id = review_id));
create policy likes_insert on public.likes for insert to authenticated with check (
  user_id = (select auth.uid()) and (post_id is not null or exists (select 1 from public.reviews r where r.id = review_id)));
create policy likes_delete on public.likes for delete to authenticated using (user_id = (select auth.uid()));

create policy comments_read on public.comments for select to authenticated using (
  post_id is not null or exists (select 1 from public.reviews r where r.id = review_id));
create policy comments_insert on public.comments for insert to authenticated with check (
  author = (select auth.uid()) and (post_id is not null or exists (select 1 from public.reviews r where r.id = review_id)));
create policy comments_update on public.comments for update to authenticated using (author = (select auth.uid())) with check (author = (select auth.uid()));
create policy comments_delete on public.comments for delete to authenticated using (author = (select auth.uid()));

create policy friendships_read on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester, addressee));
create policy friendships_insert on public.friendships for insert to authenticated
  with check (requester = (select auth.uid()) and status = 'pending');
create policy friendships_accept on public.friendships for update to authenticated
  using (addressee = (select auth.uid())) with check (addressee = (select auth.uid()));
create policy friendships_delete on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester, addressee));

-- Storage: private bucket, files under <uid>/... ----------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tickets', 'tickets', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy tickets_read_own on storage.objects for select to authenticated
  using (bucket_id = 'tickets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy tickets_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'tickets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy tickets_update_own on storage.objects for update to authenticated
  using (bucket_id = 'tickets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy tickets_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'tickets' and (storage.foldername(name))[1] = (select auth.uid())::text);
