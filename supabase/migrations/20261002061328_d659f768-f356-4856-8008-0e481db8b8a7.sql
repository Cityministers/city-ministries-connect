CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'globe',
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rooms TO anon, authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);

INSERT INTO public.rooms (slug, title, description, icon, sort) VALUES
('christian-world-news','Christian World News','Share and discuss news about the Church and believers around the world.','newspaper',1),
('bible-theology','Bible & Theology Questions','Ask questions about Scripture and doctrine, and learn together.','book',2),
('world-missions','World Missions','Missionary updates, prayer needs and ways to support the Gospel worldwide.','globe',3),
('end-times','End Times Conversations','Thoughtful, gracious conversations about prophecy and Christ''s return.','hourglass',4),
('faith-hope-love','Faith, Hope & Love','Encouragement, testimonies and stories of God''s faithfulness.','heart',5);

CREATE TABLE public.room_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.room_posts(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.room_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_posts TO authenticated;
GRANT ALL ON public.room_posts TO service_role;
ALTER TABLE public.room_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read room posts" ON public.room_posts FOR SELECT USING (true);
CREATE POLICY "Users post as themselves" ON public.room_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors edit own" ON public.room_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors delete own" ON public.room_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE TRIGGER room_posts_updated BEFORE UPDATE ON public.room_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX room_posts_room_idx ON public.room_posts(room_id, created_at DESC);

CREATE TABLE public.room_post_likes (
  post_id uuid NOT NULL REFERENCES public.room_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT ON public.room_post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.room_post_likes TO authenticated;
GRANT ALL ON public.room_post_likes TO service_role;
ALTER TABLE public.room_post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read likes" ON public.room_post_likes FOR SELECT USING (true);
CREATE POLICY "Users like as themselves" ON public.room_post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike own" ON public.room_post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);