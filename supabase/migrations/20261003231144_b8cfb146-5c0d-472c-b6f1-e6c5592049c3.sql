CREATE TABLE public.neighborhood_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('tour','concern')),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1200),
  city text NOT NULL DEFAULT '' CHECK (char_length(city) <= 120),
  zip text NOT NULL DEFAULT '' CHECK (char_length(zip) <= 20),
  lat double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
  video_path text NOT NULL UNIQUE,
  thumbnail_path text,
  duration_seconds integer NOT NULL CHECK (duration_seconds BETWEEN 60 AND 180),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT neighborhood_video_owner_path CHECK (split_part(video_path, '/', 1) = owner_id::text),
  CONSTRAINT neighborhood_thumbnail_owner_path CHECK (thumbnail_path IS NULL OR split_part(thumbnail_path, '/', 1) = owner_id::text)
);
GRANT SELECT ON public.neighborhood_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.neighborhood_videos TO authenticated;
GRANT ALL ON public.neighborhood_videos TO service_role;
ALTER TABLE public.neighborhood_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors see approved videos" ON public.neighborhood_videos FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Authors see their videos" ON public.neighborhood_videos FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Admins see all videos" ON public.neighborhood_videos FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Members submit their videos" ON public.neighborhood_videos FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND status = 'pending');
CREATE POLICY "Authors remove their videos" ON public.neighborhood_videos FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Admins remove videos" ON public.neighborhood_videos FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins moderate videos" ON public.neighborhood_videos FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER neighborhood_videos_updated BEFORE UPDATE ON public.neighborhood_videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Members upload neighborhood videos in own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'neighborhood-videos' AND (storage.foldername(name))[1] = auth.uid()::text AND (storage.extension(name) IN ('mp4','mov','webm','m4v','jpg','jpeg','png','webp')));
CREATE POLICY "Members read their neighborhood uploads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'neighborhood-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Members remove their neighborhood uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'neighborhood-videos' AND (storage.foldername(name))[1] = auth.uid()::text);