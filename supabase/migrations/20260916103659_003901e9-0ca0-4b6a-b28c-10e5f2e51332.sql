CREATE TABLE public.church_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (church_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_members TO authenticated;
GRANT ALL ON public.church_members TO service_role;

ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church owners read their trusted posters"
ON public.church_members FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.owner_id = auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Church owners add trusted posters"
ON public.church_members FOR INSERT TO authenticated
WITH CHECK (
  added_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.owner_id = auth.uid())
);

CREATE POLICY "Church owners remove trusted posters"
ON public.church_members FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.owner_id = auth.uid())
);