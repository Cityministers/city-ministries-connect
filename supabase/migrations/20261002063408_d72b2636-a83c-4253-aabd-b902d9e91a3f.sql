CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('church','ministry','need','user')),
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX follows_target_idx ON public.follows (target_type, target_id);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own follows read" ON public.follows FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own follows add" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT (target_type = 'user' AND target_id = auth.uid()));
CREATE POLICY "Own follows remove" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.follower_count(_type text, _id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.follows WHERE target_type = _type AND target_id = _id
$$;
GRANT EXECUTE ON FUNCTION public.follower_count(text, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_followers(_type text, _id uuid, _actor uuid, _title text, _body text, _link text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  SELECT f.user_id, 'follow', left(_title, 200), left(coalesce(_body,''), 300), _link
  FROM public.follows f
  WHERE f.target_type = _type AND f.target_id = _id
    AND (_actor IS NULL OR f.user_id <> _actor)
$$;
REVOKE EXECUTE ON FUNCTION public.notify_followers(text, uuid, uuid, text, text, text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.follow_notify_trg()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE who text;
BEGIN
  IF TG_TABLE_NAME IN ('user_ministries','user_needs','prayers','room_posts') THEN
    SELECT coalesce(display_name,'Someone') INTO who FROM public.profiles WHERE id = coalesce(NEW.owner_id_alias, NULL);
  END IF;
  RETURN NEW;
END $$;
DROP FUNCTION public.follow_notify_trg();

CREATE OR REPLACE FUNCTION public.follow_on_ministry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE who text; kind text := CASE WHEN TG_TABLE_NAME = 'user_needs' THEN 'need' ELSE 'ministry' END;
BEGIN
  SELECT coalesce(display_name,'Someone') INTO who FROM public.profiles WHERE id = NEW.owner_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify_followers('user', NEW.owner_id, NEW.owner_id,
      coalesce(who,'Someone') || ' posted a new ' || kind, NEW.short_title, '/' || CASE WHEN kind='need' THEN 'needs' ELSE 'map' END || '?new=' || NEW.id);
  ELSIF NEW.short_title IS DISTINCT FROM OLD.short_title OR NEW.description IS DISTINCT FROM OLD.description OR NEW.gallery IS DISTINCT FROM OLD.gallery THEN
    PERFORM public.notify_followers(kind, NEW.id, NEW.owner_id,
      NEW.short_title || ' was updated', left(NEW.description, 200), '/' || CASE WHEN kind='need' THEN 'needs' ELSE 'map' END || '?new=' || NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER follow_user_ministries AFTER INSERT OR UPDATE ON public.user_ministries FOR EACH ROW EXECUTE FUNCTION public.follow_on_ministry();
CREATE TRIGGER follow_user_needs AFTER INSERT OR UPDATE ON public.user_needs FOR EACH ROW EXECUTE FUNCTION public.follow_on_ministry();

CREATE OR REPLACE FUNCTION public.follow_on_prayer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE who text;
BEGIN
  IF NEW.status <> 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN RETURN NEW; END IF;
  IF NEW.church_id IS NOT NULL THEN
    PERFORM public.notify_followers('church', NEW.church_id, NEW.owner_id,
      'New prayer request at your church', NEW.short_title, '/church/' || NEW.church_id || '#prayer-wall');
  ELSIF NOT NEW.anonymous THEN
    SELECT coalesce(display_name,'Someone') INTO who FROM public.profiles WHERE id = NEW.owner_id;
    PERFORM public.notify_followers('user', NEW.owner_id, NEW.owner_id,
      coalesce(who,'Someone') || ' posted a prayer', NEW.short_title, '/map?mode=prayer&new=' || NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER follow_prayers AFTER INSERT OR UPDATE OF status ON public.prayers FOR EACH ROW EXECUTE FUNCTION public.follow_on_prayer();

CREATE OR REPLACE FUNCTION public.follow_on_room_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE who text; slug text;
BEGIN
  IF NEW.parent_id IS NOT NULL OR NEW.status <> 'approved' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN RETURN NEW; END IF;
  SELECT coalesce(display_name,'Someone') INTO who FROM public.profiles WHERE id = NEW.author_id;
  SELECT r.slug INTO slug FROM public.rooms r WHERE r.id = NEW.room_id;
  PERFORM public.notify_followers('user', NEW.author_id, NEW.author_id,
    coalesce(who,'Someone') || ' started a new topic', left(NEW.body, 200), '/rooms/' || slug);
  RETURN NEW;
END $$;
CREATE TRIGGER follow_room_posts AFTER INSERT OR UPDATE OF status ON public.room_posts FOR EACH ROW EXECUTE FUNCTION public.follow_on_room_post();

CREATE OR REPLACE FUNCTION public.follow_on_church_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN RETURN NEW; END IF;
  PERFORM public.notify_followers('church', NEW.church_id, NEW.requested_by,
    'New post on a church you follow', 'A new ' || NEW.post_type::text || ' was added to the church board.', '/church/' || NEW.church_id);
  RETURN NEW;
END $$;
CREATE TRIGGER follow_church_posts AFTER INSERT OR UPDATE OF status ON public.church_posts FOR EACH ROW EXECUTE FUNCTION public.follow_on_church_post();

CREATE OR REPLACE FUNCTION public.follow_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.post_type::text IN ('ministry','need') THEN
    PERFORM public.notify_followers(NEW.post_type::text, NEW.post_id, NEW.user_id,
      'New comment on a post you follow', left(NEW.body, 200),
      CASE WHEN NEW.post_type::text = 'need' THEN '/needs?new=' ELSE '/map?new=' END || NEW.post_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER follow_post_comments AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.follow_on_comment();

REVOKE EXECUTE ON FUNCTION public.follow_on_ministry(), public.follow_on_prayer(), public.follow_on_room_post(), public.follow_on_church_post(), public.follow_on_comment() FROM public, anon, authenticated;