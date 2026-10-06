CREATE TABLE public.room_post_saves (
  post_id uuid NOT NULL REFERENCES public.room_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.room_post_saves TO authenticated;
GRANT ALL ON public.room_post_saves TO service_role;
ALTER TABLE public.room_post_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own saves" ON public.room_post_saves FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users add own saves" ON public.room_post_saves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove own saves" ON public.room_post_saves FOR DELETE TO authenticated USING (user_id = auth.uid());