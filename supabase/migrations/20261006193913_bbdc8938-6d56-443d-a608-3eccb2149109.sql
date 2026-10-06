CREATE TABLE public.member_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  meetup_id uuid NOT NULL REFERENCES public.meetup_requests(id) ON DELETE CASCADE,
  punctuality smallint NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
  communication smallint NOT NULL CHECK (communication BETWEEN 1 AND 5),
  kindness smallint NOT NULL CHECK (kindness BETWEEN 1 AND 5),
  reliability smallint NOT NULL CHECK (reliability BETWEEN 1 AND 5),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  status text NOT NULL DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meetup_id, reviewer_id)
);
GRANT SELECT ON public.member_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_reviews TO authenticated;
GRANT ALL ON public.member_reviews TO service_role;
ALTER TABLE public.member_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible reviews public" ON public.member_reviews FOR SELECT USING (status = 'visible' OR reviewer_id = auth.uid() OR private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Reviewer inserts" ON public.member_reviews FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid() AND reviewee_id <> auth.uid());
CREATE POLICY "Reviewer edits within 14 days or admin" ON public.member_reviews FOR UPDATE TO authenticated USING ((reviewer_id = auth.uid() AND created_at > now() - interval '14 days') OR private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admin deletes" ON public.member_reviews FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.validate_member_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m record;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NOT private.has_role(auth.uid(),'admin'::public.app_role) THEN
      NEW.status := OLD.status; NEW.reviewer_id := OLD.reviewer_id; NEW.reviewee_id := OLD.reviewee_id; NEW.meetup_id := OLD.meetup_id;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;
  SELECT * INTO m FROM public.meetup_requests WHERE id = NEW.meetup_id;
  IF m IS NULL OR m.status <> 'accepted' OR m.meet_at > now() THEN
    RAISE EXCEPTION 'You can review only after an accepted meetup has happened';
  END IF;
  IF NOT ((m.requester_id = NEW.reviewer_id AND m.recipient_id = NEW.reviewee_id) OR (m.recipient_id = NEW.reviewer_id AND m.requester_id = NEW.reviewee_id)) THEN
    RAISE EXCEPTION 'Not part of this meetup';
  END IF;
  NEW.status := 'visible';
  INSERT INTO public.notifications(user_id, kind, title, body, link)
  VALUES (NEW.reviewee_id, 'review', 'You received a new review', left(NEW.note, 140), '/profile');
  RETURN NEW;
END $$;
CREATE TRIGGER member_reviews_validate BEFORE INSERT OR UPDATE ON public.member_reviews FOR EACH ROW EXECUTE FUNCTION public.validate_member_review();