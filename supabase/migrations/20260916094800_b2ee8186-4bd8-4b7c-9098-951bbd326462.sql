CREATE TABLE public.churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon_id text NOT NULL DEFAULT 'chapel',
  avatar_url text,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  zip text NOT NULL DEFAULT '',
  lat double precision,
  lng double precision,
  service_times text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'inactive',
  plan_status text NOT NULL DEFAULT 'none',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.churches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.churches TO authenticated;
GRANT ALL ON public.churches TO service_role;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view churches" ON public.churches FOR SELECT USING (true);
CREATE POLICY "Owners can create their church" ON public.churches FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their church" ON public.churches FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners and admins can delete a church" ON public.churches FOR DELETE TO authenticated USING (
  auth.uid() = owner_id
  OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
);

CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON public.churches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.church_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  post_type public.post_kind NOT NULL,
  post_id uuid NOT NULL,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (church_id, post_type, post_id)
);

GRANT SELECT ON public.church_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_posts TO authenticated;
GRANT ALL ON public.church_posts TO service_role;
ALTER TABLE public.church_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved church posts" ON public.church_posts FOR SELECT USING (
  status = 'approved'
  OR requested_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.owner_id = auth.uid())
);
CREATE POLICY "Posters can request to join a church" ON public.church_posts FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid() AND status = 'pending');
CREATE POLICY "Church owners can decide requests" ON public.church_posts FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.owner_id = auth.uid())
);
CREATE POLICY "Posters and church owners can remove a link" ON public.church_posts FOR DELETE TO authenticated USING (
  requested_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.owner_id = auth.uid())
);

CREATE TRIGGER update_church_posts_updated_at BEFORE UPDATE ON public.church_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.church_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL DEFAULT 4900,
  status text NOT NULL DEFAULT 'paid',
  is_mock boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.church_payments TO authenticated;
GRANT ALL ON public.church_payments TO service_role;
ALTER TABLE public.church_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their payments" ON public.church_payments FOR SELECT TO authenticated USING (payer_id = auth.uid());
CREATE POLICY "Owners can record their payments" ON public.church_payments FOR INSERT TO authenticated WITH CHECK (payer_id = auth.uid());

CREATE INDEX idx_church_posts_church ON public.church_posts (church_id, status);
CREATE INDEX idx_churches_status ON public.churches (status);