ALTER TABLE public.user_needs ADD COLUMN met_at timestamptz, ADD COLUMN met_by uuid;
ALTER TABLE public.user_needs ADD CONSTRAINT user_needs_met_state_check CHECK ((status = 'met' AND met_at IS NOT NULL) OR (status <> 'met' AND met_at IS NULL AND met_by IS NULL));
CREATE OR REPLACE FUNCTION public.complete_user_need(_need_id uuid, _helper_conversation_id uuid, _replies jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n public.user_needs%ROWTYPE; item jsonb; convo uuid; recipient uuid; body text; sent_to uuid[] := ARRAY[]::uuid[]; helper uuid; author_name text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT * INTO n FROM public.user_needs WHERE id = _need_id FOR UPDATE;
  IF NOT FOUND OR n.owner_id <> auth.uid() THEN RAISE EXCEPTION 'Need not found'; END IF;
  IF n.status <> 'active' THEN RAISE EXCEPTION 'This need is already closed'; END IF;
  IF jsonb_typeof(_replies) IS DISTINCT FROM 'array' OR jsonb_array_length(_replies) > 100 THEN RAISE EXCEPTION 'Invalid messages'; END IF;
  IF _helper_conversation_id IS NOT NULL THEN
    SELECT cp.user_id INTO helper FROM public.conversations c JOIN public.conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id <> n.owner_id
    WHERE c.id = _helper_conversation_id AND c.post_type = 'need' AND c.post_id = _need_id
      AND EXISTS (SELECT 1 FROM public.conversation_participants mine WHERE mine.conversation_id = c.id AND mine.user_id = n.owner_id)
    LIMIT 1;
    IF helper IS NULL THEN RAISE EXCEPTION 'That helper is not connected to this need'; END IF;
  END IF;
  SELECT coalesce(display_name, 'A neighbor') INTO author_name FROM public.profiles WHERE id = n.owner_id;
  FOR item IN SELECT value FROM jsonb_array_elements(_replies) LOOP
    IF jsonb_typeof(item) <> 'object' OR (item->>'conversationId') IS NULL OR (item->>'body') IS NULL THEN RAISE EXCEPTION 'Invalid reply'; END IF;
    BEGIN convo := (item->>'conversationId')::uuid; EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Invalid conversation'; END;
    body := btrim(item->>'body');
    IF length(body) < 1 OR length(body) > 1000 THEN RAISE EXCEPTION 'Reply must be 1–1000 characters'; END IF;
    SELECT cp.user_id INTO recipient FROM public.conversations c JOIN public.conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id <> n.owner_id
    WHERE c.id = convo AND c.post_type = 'need' AND c.post_id = _need_id
      AND EXISTS (SELECT 1 FROM public.conversation_participants mine WHERE mine.conversation_id = c.id AND mine.user_id = n.owner_id)
    LIMIT 1;
    IF recipient IS NULL OR recipient = ANY(sent_to) THEN RAISE EXCEPTION 'Reply must go to one person connected to this need'; END IF;
    sent_to := array_append(sent_to, recipient);
    INSERT INTO public.messages (conversation_id, sender_id, body) VALUES (convo, n.owner_id, body);
    UPDATE public.conversations SET last_message_at = now() WHERE id = convo;
    INSERT INTO public.notifications (user_id, kind, title, body, link)
      VALUES (recipient, 'message', author_name || ' sent you a message', left(body, 140), '/messages/' || convo);
  END LOOP;
  UPDATE public.user_needs SET status = 'met', met_at = now(), met_by = helper WHERE id = _need_id;
END $$;
REVOKE ALL ON FUNCTION public.complete_user_need(uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_user_need(uuid, uuid, jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.reopen_user_need(_need_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  UPDATE public.user_needs SET status = 'active', met_at = NULL, met_by = NULL WHERE id = _need_id AND owner_id = auth.uid() AND status = 'met';
  IF NOT FOUND THEN RAISE EXCEPTION 'Met need not found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.reopen_user_need(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reopen_user_need(uuid) TO authenticated;