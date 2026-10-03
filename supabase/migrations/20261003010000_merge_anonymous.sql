-- Moves an anonymous user's data into the caller's (freshly signed-in) account.
-- Needed for Sign in with Apple (signInWithIdToken cannot link to an anonymous user) and for
-- OAuth when the identity already belongs to an existing account.
create or replace function public.merge_anonymous(old_uid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  old_user auth.users%rowtype;
  new_user auth.users%rowtype;
  old_p public.profiles%rowtype;
begin
  if me is null or old_uid is null or old_uid = me then
    raise exception 'invalid merge';
  end if;
  select * into new_user from auth.users where id = me;
  if coalesce(new_user.is_anonymous, false) or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'caller must be a signed-in (non-anonymous) user';
  end if;
  if new_user.last_sign_in_at is null or new_user.last_sign_in_at < now() - interval '10 minutes' then
    raise exception 'caller must have just authenticated';
  end if;
  select * into old_user from auth.users where id = old_uid;
  if not found or not coalesce(old_user.is_anonymous, false) then
    raise exception 'old user is not anonymous';
  end if;

  update public.cards set owner = me where owner = old_uid;
  update public.reviews set author = me where author = old_uid;
  update public.board_posts set author = me where author = old_uid;
  update public.comments set author = me where author = old_uid;
  -- likes: skip duplicates
  delete from public.likes l using public.likes k
    where l.user_id = old_uid and k.user_id = me
      and l.review_id is not distinct from k.review_id and l.post_id is not distinct from k.post_id;
  update public.likes set user_id = me where user_id = old_uid;
  -- friendships: skip duplicates and self-friendships
  delete from public.friendships f where (f.requester = old_uid and f.addressee = me) or (f.addressee = old_uid and f.requester = me);
  delete from public.friendships f where f.requester = old_uid
    and exists (select 1 from public.friendships g where (g.requester = me and g.addressee = f.addressee) or (g.addressee = me and g.requester = f.addressee));
  delete from public.friendships f where f.addressee = old_uid
    and exists (select 1 from public.friendships g where (g.requester = me and g.addressee = f.requester) or (g.addressee = me and g.requester = f.requester));
  update public.friendships set requester = me where requester = old_uid;
  update public.friendships set addressee = me where addressee = old_uid;

  -- profile: carry over stamps, items, avatar, nickname, referrer
  select * into old_p from public.profiles where id = old_uid;
  if found then
    update public.profiles p set
      stamps = p.stamps + old_p.stamps,
      items = array(select distinct unnest(p.items || old_p.items)),
      avatar = case when p.avatar = '{}'::jsonb then old_p.avatar else p.avatar end,
      nickname = case when p.nickname = '냥이' then old_p.nickname else p.nickname end,
      referred_by = coalesce(p.referred_by, nullif(old_p.referred_by, me))
    where p.id = me;
    update public.profiles set referred_by = me where referred_by = old_uid and id <> me;
  end if;

  delete from auth.users where id = old_uid; -- cascades the old profile
end $$;

revoke all on function public.merge_anonymous(uuid) from public, anon;
grant execute on function public.merge_anonymous(uuid) to authenticated;
