ALTER TABLE public.rooms ADD COLUMN status text NOT NULL DEFAULT 'approved', ADD COLUMN created_by uuid;
ALTER TABLE public.rooms ALTER COLUMN status SET DEFAULT 'pending';
DROP POLICY "Anyone can view rooms" ON public.rooms;
CREATE POLICY "Anyone can view approved rooms" ON public.rooms FOR SELECT USING (status = 'approved' OR created_by = auth.uid() OR private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Members create pending rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND status = 'pending');
CREATE POLICY "Admins update rooms" ON public.rooms FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins delete rooms" ON public.rooms FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));
GRANT INSERT, UPDATE, DELETE ON public.rooms TO authenticated;

CREATE TABLE public.room_memberships (
  user_id uuid NOT NULL,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, room_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_memberships TO authenticated;
GRANT ALL ON public.room_memberships TO service_role;
ALTER TABLE public.room_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own room memberships" ON public.room_memberships FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());