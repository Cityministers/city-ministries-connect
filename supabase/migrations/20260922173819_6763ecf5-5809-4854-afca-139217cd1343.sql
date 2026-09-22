CREATE TABLE public.meetup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  meet_at timestamptz NOT NULL,
  location text NOT NULL CHECK (char_length(location) BETWEEN 1 AND 200),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  response_note text CHECK (response_note IS NULL OR char_length(response_note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meetup_requests_conversation_idx ON public.meetup_requests(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.meetup_requests TO authenticated;
GRANT ALL ON public.meetup_requests TO service_role;
ALTER TABLE public.meetup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view meetups" ON public.meetup_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
CREATE POLICY "Requesters create their own meetups" ON public.meetup_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');
CREATE POLICY "Recipients answer meetups" ON public.meetup_requests FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE TRIGGER update_meetup_requests_updated_at BEFORE UPDATE ON public.meetup_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();