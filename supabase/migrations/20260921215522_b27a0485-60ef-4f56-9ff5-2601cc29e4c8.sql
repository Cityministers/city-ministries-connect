alter function public.is_church_moderator(uuid, uuid) security invoker;
revoke execute on function public.is_church_moderator(uuid, uuid) from public;
revoke execute on function public.is_church_moderator(uuid, uuid) from anon;