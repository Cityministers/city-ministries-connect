ALTER TABLE public.user_ministries ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.user_ministries ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE public.user_needs ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.user_needs ADD COLUMN IF NOT EXISTS lng double precision;

CREATE TABLE IF NOT EXISTS public.geo_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_key text NOT NULL UNIQUE,
  city text NOT NULL DEFAULT '',
  zip text NOT NULL DEFAULT '',
  lat double precision,
  lng double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.geo_cache TO anon;
GRANT SELECT ON public.geo_cache TO authenticated;
GRANT ALL ON public.geo_cache TO service_role;

ALTER TABLE public.geo_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Place cache is readable by everyone"
  ON public.geo_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TRIGGER update_geo_cache_updated_at
  BEFORE UPDATE ON public.geo_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();