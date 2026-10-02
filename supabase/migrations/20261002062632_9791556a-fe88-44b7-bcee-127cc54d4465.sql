ALTER TABLE public.room_posts
  ADD COLUMN status text NOT NULL DEFAULT 'approved',
  ADD COLUMN media_path text,
  ADD COLUMN media_type text;

ALTER TABLE public.room_posts ADD CONSTRAINT room_posts_status_chk CHECK (status IN ('pending','approved','hidden'));
ALTER TABLE public.room_posts ADD CONSTRAINT room_posts_media_type_chk CHECK (media_type IS NULL OR media_type IN ('image','video'));

CREATE OR REPLACE FUNCTION public.room_posts_moderation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_admin boolean := private.has_role(auth.uid(), 'admin'::public.app_role);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_id IS NULL AND NOT coalesce(is_admin,false) THEN NEW.status := 'pending';
    ELSIF NEW.parent_id IS NOT NULL THEN NEW.status := 'approved'; NEW.media_path := NULL; NEW.media_type := NULL;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT coalesce(is_admin,false) AND auth.uid() IS NOT NULL THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER room_posts_moderation_trg BEFORE INSERT OR UPDATE ON public.room_posts
FOR EACH ROW EXECUTE FUNCTION public.room_posts_moderation();

DROP POLICY IF EXISTS "Anyone can read room posts" ON public.room_posts;
CREATE POLICY "Anyone can read approved room posts" ON public.room_posts FOR SELECT USING (status = 'approved');
CREATE POLICY "Authors read own room posts" ON public.room_posts FOR SELECT TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Admins read all room posts" ON public.room_posts FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update room posts" ON public.room_posts FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete room posts" ON public.room_posts FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users upload own room media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'room-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own room media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'room-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own room media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'room-media' AND (storage.foldername(name))[1] = auth.uid()::text);