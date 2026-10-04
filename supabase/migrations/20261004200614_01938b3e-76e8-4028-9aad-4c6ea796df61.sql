REVOKE EXECUTE ON FUNCTION public.is_suspended(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.block_suspended_insert() FROM PUBLIC, anon, authenticated;