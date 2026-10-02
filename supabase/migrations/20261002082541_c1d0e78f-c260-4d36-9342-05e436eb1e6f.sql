create or replace function public.get_site_activity_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with metrics as (
    select 1 as ord, 'accounts' as key, 'New accounts' as label,
      count(*) filter (where created_at >= now() - interval '1 day') as today,
      count(*) filter (where created_at >= now() - interval '7 days') as week,
      count(*) filter (where created_at >= now() - interval '30 days') as month,
      count(*) as total
    from profiles where is_demo = false
    union all
    select 2, 'ministries', 'Ministries posted',
      count(*) filter (where m.created_at >= now() - interval '1 day'),
      count(*) filter (where m.created_at >= now() - interval '7 days'),
      count(*) filter (where m.created_at >= now() - interval '30 days'),
      count(*)
    from user_ministries m
    join profiles p on p.id = m.owner_id and p.is_demo = false
    where m.status <> 'removed'
    union all
    select 3, 'needs', 'Needs posted',
      count(*) filter (where n.created_at >= now() - interval '1 day'),
      count(*) filter (where n.created_at >= now() - interval '7 days'),
      count(*) filter (where n.created_at >= now() - interval '30 days'),
      count(*)
    from user_needs n
    join profiles p on p.id = n.owner_id and p.is_demo = false
    where n.status <> 'removed'
    union all
    select 4, 'prayers', 'Prayers posted',
      count(*) filter (where pr.created_at >= now() - interval '1 day'),
      count(*) filter (where pr.created_at >= now() - interval '7 days'),
      count(*) filter (where pr.created_at >= now() - interval '30 days'),
      count(*)
    from prayers pr
    join profiles p on p.id = pr.owner_id and p.is_demo = false
    union all
    select 5, 'churches', 'Churches added',
      count(*) filter (where c.created_at >= now() - interval '1 day'),
      count(*) filter (where c.created_at >= now() - interval '7 days'),
      count(*) filter (where c.created_at >= now() - interval '30 days'),
      count(*)
    from churches c
    join profiles p on p.id = c.owner_id and p.is_demo = false
    union all
    select 6, 'room_topics', 'Room topics',
      count(*) filter (where rp.created_at >= now() - interval '1 day'),
      count(*) filter (where rp.created_at >= now() - interval '7 days'),
      count(*) filter (where rp.created_at >= now() - interval '30 days'),
      count(*)
    from room_posts rp
    join profiles p on p.id = rp.author_id and p.is_demo = false
    where rp.parent_id is null and rp.status = 'approved'
    union all
    select 7, 'room_replies', 'Room replies',
      count(*) filter (where rp.created_at >= now() - interval '1 day'),
      count(*) filter (where rp.created_at >= now() - interval '7 days'),
      count(*) filter (where rp.created_at >= now() - interval '30 days'),
      count(*)
    from room_posts rp
    join profiles p on p.id = rp.author_id and p.is_demo = false
    where rp.parent_id is not null and rp.status = 'approved'
    union all
    select 8, 'post_comments', 'Post comments',
      count(*) filter (where pc.created_at >= now() - interval '1 day'),
      count(*) filter (where pc.created_at >= now() - interval '7 days'),
      count(*) filter (where pc.created_at >= now() - interval '30 days'),
      count(*)
    from post_comments pc
    join profiles p on p.id = pc.user_id and p.is_demo = false
    union all
    select 9, 'meetups', 'Meetups requested',
      count(*) filter (where mr.created_at >= now() - interval '1 day'),
      count(*) filter (where mr.created_at >= now() - interval '7 days'),
      count(*) filter (where mr.created_at >= now() - interval '30 days'),
      count(*)
    from meetup_requests mr
    join profiles p on p.id = mr.requester_id and p.is_demo = false
    union all
    select 10, 'messages', 'Messages sent',
      count(*) filter (where msg.created_at >= now() - interval '1 day'),
      count(*) filter (where msg.created_at >= now() - interval '7 days'),
      count(*) filter (where msg.created_at >= now() - interval '30 days'),
      count(*)
    from messages msg
    join profiles p on p.id = msg.sender_id and p.is_demo = false
    union all
    select 11, 'feedback', 'Feedback received',
      count(*) filter (where f.created_at >= now() - interval '1 day'),
      count(*) filter (where f.created_at >= now() - interval '7 days'),
      count(*) filter (where f.created_at >= now() - interval '30 days'),
      count(*)
    from app_feedback f
    union all
    select 12, 'abuse_open', 'Open abuse reports',
      count(*) filter (where ar.created_at >= now() - interval '1 day'),
      count(*) filter (where ar.created_at >= now() - interval '7 days'),
      count(*) filter (where ar.created_at >= now() - interval '30 days'),
      count(*)
    from abuse_reports ar
    where ar.status in ('new', 'reviewing')
  ),
  recent as (
    select 'ministry' as type, m.short_title as title,
      coalesce(p.display_name, 'Member') as author, m.created_at as at
    from user_ministries m
    join profiles p on p.id = m.owner_id and p.is_demo = false
    where m.status <> 'removed'
    union all
    select 'need', n.short_title, coalesce(p.display_name, 'Member'), n.created_at
    from user_needs n
    join profiles p on p.id = n.owner_id and p.is_demo = false
    where n.status <> 'removed'
    union all
    select 'prayer', pr.short_title, coalesce(p.display_name, 'Member'), pr.created_at
    from prayers pr
    join profiles p on p.id = pr.owner_id and p.is_demo = false
    union all
    select 'room', coalesce(nullif(rp.title, ''), left(rp.body, 60)), coalesce(p.display_name, 'Member'), rp.created_at
    from room_posts rp
    join profiles p on p.id = rp.author_id and p.is_demo = false
    where rp.parent_id is null and rp.status = 'approved'
    union all
    select 'church', c.name, coalesce(p.display_name, 'Member'), c.created_at
    from churches c
    join profiles p on p.id = c.owner_id and p.is_demo = false
  )
  select jsonb_build_object(
    'stats', coalesce((select jsonb_agg(to_jsonb(x)) from (select key, label, today, week, month, total from metrics order by ord) x), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(to_jsonb(r)) from (select type, title, author, at from recent order by at desc limit 30) r), '[]'::jsonb)
  );
$$;

revoke all on function public.get_site_activity_stats() from public, anon;
grant execute on function public.get_site_activity_stats() to authenticated;