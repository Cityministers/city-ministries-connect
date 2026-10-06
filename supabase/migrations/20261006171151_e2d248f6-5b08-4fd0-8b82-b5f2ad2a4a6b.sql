CREATE TABLE public.volunteer_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  display_name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  zip text NOT NULL DEFAULT '',
  country_code text NOT NULL DEFAULT 'US',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.volunteer_signups TO anon;
GRANT SELECT, INSERT, DELETE ON public.volunteer_signups TO authenticated;
GRANT ALL ON public.volunteer_signups TO service_role;
ALTER TABLE public.volunteer_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Volunteer list is public" ON public.volunteer_signups FOR SELECT USING (true);
CREATE POLICY "Join list as self" ON public.volunteer_signups FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_demo = false);
CREATE POLICY "Leave list as self" ON public.volunteer_signups FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.volunteer_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  location text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  zip text NOT NULL DEFAULT '',
  country_code text NOT NULL DEFAULT 'US',
  lat double precision,
  lng double precision,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.volunteer_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_projects TO authenticated;
GRANT ALL ON public.volunteer_projects TO service_role;
ALTER TABLE public.volunteer_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved projects public" ON public.volunteer_projects FOR SELECT USING (status = 'approved' OR owner_id = auth.uid() OR private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Members post pending projects" ON public.volunteer_projects FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins update projects" ON public.volunteer_projects FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Owner or admin deletes" ON public.volunteer_projects FOR DELETE TO authenticated USING (owner_id = auth.uid() OR private.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER volunteer_projects_updated BEFORE UPDATE ON public.volunteer_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER block_suspended BEFORE INSERT ON public.volunteer_projects FOR EACH ROW EXECUTE FUNCTION public.block_suspended_insert();

CREATE TABLE public.volunteer_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.volunteer_projects(id) ON DELETE CASCADE,
  signup_id uuid NOT NULL REFERENCES public.volunteer_signups(id) ON DELETE CASCADE,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, signup_id)
);
GRANT SELECT ON public.volunteer_rsvps TO anon;
GRANT SELECT, INSERT, DELETE ON public.volunteer_rsvps TO authenticated;
GRANT ALL ON public.volunteer_rsvps TO service_role;
ALTER TABLE public.volunteer_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVPs public" ON public.volunteer_rsvps FOR SELECT USING (true);
CREATE POLICY "RSVP as self" ON public.volunteer_rsvps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.volunteer_signups s WHERE s.id = signup_id AND s.user_id = auth.uid()));
CREATE POLICY "Cancel own RSVP" ON public.volunteer_rsvps FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_volunteers_on_project()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  SELECT s.user_id, 'volunteer', 'RSVP: new group volunteer project', left(NEW.title || ' — ' || NEW.location, 300), '/volunteer?project=' || NEW.id
  FROM public.volunteer_signups s
  WHERE s.user_id IS NOT NULL AND s.user_id <> NEW.owner_id
    AND (lower(btrim(s.city)) = lower(btrim(NEW.city)) OR (s.zip <> '' AND s.zip = NEW.zip));
  RETURN NEW;
END $$;
CREATE TRIGGER notify_volunteers AFTER INSERT OR UPDATE ON public.volunteer_projects FOR EACH ROW EXECUTE FUNCTION public.notify_volunteers_on_project();

-- sample data
INSERT INTO public.volunteer_signups (id, user_id, display_name, city, zip, is_demo) VALUES
('a0000000-0000-4000-8000-000000000001','9c908915-55ef-44be-855b-db35192bf15a','Andre Whitfield','Portland','97205',true),
('a0000000-0000-4000-8000-000000000002','776d497c-c67b-4695-a18e-0f26590370ae','Kim Park','Portland','97209',true),
('a0000000-0000-4000-8000-000000000003','6e73fcc7-420f-48b9-8a33-516bdc4dd507','Josh Rivera','Portland','97214',true),
('a0000000-0000-4000-8000-000000000004','c2193147-c9b3-4d9f-90a7-b9bf90a7c901','Bethany Cole','Portland','97202',true),
('a0000000-0000-4000-8000-000000000005','5eba46e9-79e4-4848-b0f1-381fd65d0ac3','Tony Nguyen','Portland','97211',true),
('a0000000-0000-4000-8000-000000000006','4649281b-d7a2-4877-ac66-cd8a1079bbf3','Grace Okafor','Portland','97212',true),
('a0000000-0000-4000-8000-000000000007','8624d9bf-42c0-4eac-b433-af9b48b82e9f','Sam Byrne','Portland','97205',true),
('a0000000-0000-4000-8000-000000000008','8308d01b-3921-42fb-a3e4-290ad87904fe','Lena Foster','Portland','97210',true),
('a0000000-0000-4000-8000-000000000009','bd4c2026-574e-40b9-9e5d-e4dda53c3a71','Paul Mendoza','Portland','97217',true),
('a0000000-0000-4000-8000-000000000010','7acb1ed9-f2ee-4ee0-8dc5-6131490addc7','Maria Delgado','Portland','97206',true),
('a0000000-0000-4000-8000-000000000011',NULL,'Hannah Brooks','Portland','97213',true),
('a0000000-0000-4000-8000-000000000012',NULL,'Marcus Lee','Portland','97215',true);

INSERT INTO public.volunteer_projects (id, owner_id, title, description, starts_at, location, city, zip, lat, lng, status) VALUES
('b0000000-0000-4000-8000-000000000001','9c908915-55ef-44be-855b-db35192bf15a','Laurelhurst Park Cleanup','Pick up litter, clear leaves from paths and freshen the flower beds. Gloves, bags and coffee provided.', now() + interval '9 days','Laurelhurst Park, SE Cesar E Chavez Blvd & Stark St','Portland','97214',45.5219,-122.6262,'approved'),
('b0000000-0000-4000-8000-000000000002','4649281b-d7a2-4877-ac66-cd8a1079bbf3','Food Bank Packing Night','Sort and pack family food boxes for neighbors across the city. Great for small groups and teens.', now() + interval '14 days','Oregon Food Bank, 7900 NE 33rd Dr','Portland','97211',45.5786,-122.6331,'approved'),
('b0000000-0000-4000-8000-000000000003','6e73fcc7-420f-48b9-8a33-516bdc4dd507','Alberta Street Mural Repaint','Help repaint a faded community mural. No art skills needed — we will tape, prime and roll color together.', now() + interval '21 days','NE Alberta St & 15th Ave','Portland','97211',45.5590,-122.6505,'approved');

INSERT INTO public.volunteer_rsvps (project_id, signup_id, user_id) VALUES
('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','9c908915-55ef-44be-855b-db35192bf15a'),
('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','776d497c-c67b-4695-a18e-0f26590370ae'),
('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','6e73fcc7-420f-48b9-8a33-516bdc4dd507'),
('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000004','c2193147-c9b3-4d9f-90a7-b9bf90a7c901'),
('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000005','5eba46e9-79e4-4848-b0f1-381fd65d0ac3'),
('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000006','4649281b-d7a2-4877-ac66-cd8a1079bbf3'),
('b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000007','8624d9bf-42c0-4eac-b433-af9b48b82e9f'),
('b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001','9c908915-55ef-44be-855b-db35192bf15a');