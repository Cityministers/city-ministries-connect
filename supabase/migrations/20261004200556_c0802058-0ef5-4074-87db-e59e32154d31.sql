ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admins insert site content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));
CREATE POLICY "Admins update site content" ON public.site_content FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));
CREATE POLICY "Admins delete site content" ON public.site_content FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_suspended(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND suspended_at IS NOT NULL)
$$;

-- Block suspended users from creating content at the database level
CREATE OR REPLACE FUNCTION public.block_suspended_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND public.is_suspended(auth.uid()) THEN
    RAISE EXCEPTION 'Your account is suspended.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER block_suspended BEFORE INSERT ON public.user_ministries FOR EACH ROW EXECUTE FUNCTION public.block_suspended_insert();
CREATE TRIGGER block_suspended BEFORE INSERT ON public.user_needs FOR EACH ROW EXECUTE FUNCTION public.block_suspended_insert();
CREATE TRIGGER block_suspended BEFORE INSERT ON public.prayers FOR EACH ROW EXECUTE FUNCTION public.block_suspended_insert();
CREATE TRIGGER block_suspended BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.block_suspended_insert();
CREATE TRIGGER block_suspended BEFORE INSERT ON public.room_posts FOR EACH ROW EXECUTE FUNCTION public.block_suspended_insert();
CREATE TRIGGER block_suspended BEFORE INSERT ON public.neighborhood_videos FOR EACH ROW EXECUTE FUNCTION public.block_suspended_insert();
CREATE TRIGGER block_suspended BEFORE INSERT ON public.churches FOR EACH ROW EXECUTE FUNCTION public.block_suspended_insert();
CREATE TRIGGER block_suspended BEFORE INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.block_suspended_insert();