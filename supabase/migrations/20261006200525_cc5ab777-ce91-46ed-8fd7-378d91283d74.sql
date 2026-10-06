CREATE TABLE public.ministry_type_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ministry_type text NOT NULL CHECK (char_length(ministry_type) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ministry_type)
);

GRANT SELECT, INSERT, DELETE ON public.ministry_type_follows TO authenticated;
GRANT ALL ON public.ministry_type_follows TO service_role;

ALTER TABLE public.ministry_type_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own ministry type follows"
ON public.ministry_type_follows FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Members add own ministry type follows"
ON public.ministry_type_follows FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members remove own ministry type follows"
ON public.ministry_type_follows FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX ministry_type_follows_type_idx
ON public.ministry_type_follows (ministry_type);

CREATE OR REPLACE FUNCTION public.notify_ministry_type_followers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> 'active' OR NEW.icon_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, kind, title, body, link)
  SELECT DISTINCT f.user_id,
    'follow',
    'New ' || NEW.short_title || ' ministry near you',
    left(coalesce(NEW.description, ''), 300),
    '/map?new=' || NEW.id
  FROM public.ministry_type_follows f
  JOIN public.profiles p ON p.id = f.user_id
  WHERE f.ministry_type = NEW.icon_id
    AND f.user_id <> NEW.owner_id
    AND (
      (btrim(coalesce(p.zip, '')) <> '' AND lower(btrim(p.zip)) = lower(btrim(NEW.zip)))
      OR
      (btrim(coalesce(p.city, '')) <> '' AND lower(btrim(p.city)) = lower(btrim(NEW.city)))
    );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_ministry_type_followers_on_post
AFTER INSERT OR UPDATE OF status ON public.user_ministries
FOR EACH ROW EXECUTE FUNCTION public.notify_ministry_type_followers();

REVOKE EXECUTE ON FUNCTION public.notify_ministry_type_followers() FROM public, anon, authenticated;