CREATE POLICY "Posters and church owners can see pending prayers"
ON public.prayers FOR SELECT TO authenticated
USING (
  auth.uid() = owner_id
  OR (church_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.churches c WHERE c.id = prayers.church_id AND c.owner_id = auth.uid()
  ))
);

CREATE TABLE IF NOT EXISTS public.church_prayer_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, church_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_prayer_views TO authenticated;
GRANT ALL ON public.church_prayer_views TO service_role;

ALTER TABLE public.church_prayer_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "People manage their own prayer wall visits"
ON public.church_prayer_views FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_church_prayer_views_updated_at
BEFORE UPDATE ON public.church_prayer_views
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();