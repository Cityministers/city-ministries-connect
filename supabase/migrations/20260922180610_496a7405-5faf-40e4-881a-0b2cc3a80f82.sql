CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
SELECT cron.schedule(
  'meetup-reminders-hourly',
  '7 * * * *',
  $$ SELECT net.http_post(
       url := 'https://project--88f94627-527d-40d9-bcec-aba6511ef576.lovable.app/api/public/meetup-reminders',
       headers := '{"Content-Type":"application/json","apikey":"sb_publishable_PNBYJECRJwb0yq9MaNCftA_gvqB6nLn"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);