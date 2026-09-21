CREATE TABLE public.prayers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE,
  short_title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  zip text NOT NULL DEFAULT '',
  lat double precision,
  lng double precision,
  anonymous boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX prayers_church_idx ON public.prayers (church_id, created_at DESC);
CREATE INDEX prayers_public_idx ON public.prayers (created_at DESC) WHERE church_id IS NULL;

GRANT SELECT ON public.prayers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prayers TO authenticated;
GRANT ALL ON public.prayers TO service_role;

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active prayers"
  ON public.prayers FOR SELECT
  USING (status = 'active');

CREATE POLICY "People can post their own prayers"
  ON public.prayers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Posters and church owners can edit prayers"
  ON public.prayers FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id
    OR (church_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.churches c WHERE c.id = prayers.church_id AND c.owner_id = auth.uid()
    ))
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR (church_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.churches c WHERE c.id = prayers.church_id AND c.owner_id = auth.uid()
    ))
  );

CREATE POLICY "Posters and church owners can remove prayers"
  ON public.prayers FOR DELETE TO authenticated
  USING (
    auth.uid() = owner_id
    OR (church_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.churches c WHERE c.id = prayers.church_id AND c.owner_id = auth.uid()
    ))
  );

CREATE TRIGGER update_prayers_updated_at
  BEFORE UPDATE ON public.prayers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();