ALTER TABLE public.church_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

ALTER TABLE public.church_members
  ALTER COLUMN added_by DROP NOT NULL;

UPDATE public.church_members SET status = 'approved' WHERE status IS NULL;

CREATE POLICY "People can ask to attend a church"
ON public.church_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND added_by IS NULL
  AND status = 'pending'
);

CREATE POLICY "Church owners update their member rows"
ON public.church_members FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.owner_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.owner_id = auth.uid())
);

CREATE POLICY "People can withdraw their own attendance"
ON public.church_members FOR DELETE TO authenticated
USING (user_id = auth.uid());