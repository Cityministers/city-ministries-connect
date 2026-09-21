CREATE TABLE public.feedback_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES public.app_feedback(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  delivered BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.feedback_replies TO authenticated;
GRANT ALL ON public.feedback_replies TO service_role;

ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read feedback replies"
ON public.feedback_replies FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can add feedback replies"
ON public.feedback_replies FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) AND sender_id = auth.uid());

CREATE INDEX idx_feedback_replies_feedback ON public.feedback_replies(feedback_id, created_at DESC);