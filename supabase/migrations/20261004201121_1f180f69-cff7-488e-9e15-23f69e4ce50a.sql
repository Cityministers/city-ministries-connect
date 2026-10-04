CREATE OR REPLACE FUNCTION public.cms_user_emails()
RETURNS TABLE(id uuid, email text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT u.id, u.email::text, u.created_at FROM auth.users u
$$;
REVOKE EXECUTE ON FUNCTION public.cms_user_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cms_user_emails() TO service_role;