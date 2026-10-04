CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.alert_admin_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://project--88f94627-527d-40d9-bcec-aba6511ef576.lovable.app/api/public/activity-alert',
      body := jsonb_build_object('table', TG_TABLE_NAME, 'id', NEW.id),
      headers := '{"Content-Type":"application/json"}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','user_ministries','user_needs','prayers','churches','room_posts','neighborhood_videos','abuse_reports','app_feedback'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS alert_admin_activity ON public.%I', t);
    EXECUTE format('CREATE TRIGGER alert_admin_activity AFTER INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.alert_admin_activity()', t);
  END LOOP;
END $$;