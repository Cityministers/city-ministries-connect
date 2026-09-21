alter table public.church_members add column if not exists role text not null default 'member';

create or replace function public.is_church_moderator(_church_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.church_members
    where church_id = _church_id
      and user_id = _user_id
      and role = 'moderator'
      and status = 'approved'
  )
$$;

grant execute on function public.is_church_moderator(uuid, uuid) to authenticated;

-- Moderators get the same prayer powers as the church owner.
drop policy "Posters and church owners can edit prayers" on public.prayers;
create policy "Posters and church moderators can edit prayers"
on public.prayers for update to authenticated
using (
  auth.uid() = owner_id
  or (
    church_id is not null
    and (
      exists (select 1 from churches c where c.id = prayers.church_id and c.owner_id = auth.uid())
      or public.is_church_moderator(prayers.church_id, auth.uid())
    )
  )
)
with check (
  auth.uid() = owner_id
  or (
    church_id is not null
    and (
      exists (select 1 from churches c where c.id = prayers.church_id and c.owner_id = auth.uid())
      or public.is_church_moderator(prayers.church_id, auth.uid())
    )
  )
);

drop policy "Posters and church owners can remove prayers" on public.prayers;
create policy "Posters and church moderators can remove prayers"
on public.prayers for delete to authenticated
using (
  auth.uid() = owner_id
  or (
    church_id is not null
    and (
      exists (select 1 from churches c where c.id = prayers.church_id and c.owner_id = auth.uid())
      or public.is_church_moderator(prayers.church_id, auth.uid())
    )
  )
);

drop policy "Posters and church owners can see pending prayers" on public.prayers;
create policy "Posters and church moderators can see pending prayers"
on public.prayers for select to authenticated
using (
  auth.uid() = owner_id
  or (
    church_id is not null
    and (
      exists (select 1 from churches c where c.id = prayers.church_id and c.owner_id = auth.uid())
      or public.is_church_moderator(prayers.church_id, auth.uid())
    )
  )
);