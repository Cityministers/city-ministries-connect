ALTER TABLE public.profiles ADD COLUMN country_code text NOT NULL DEFAULT 'US' CHECK (country_code ~ '^[A-Z]{2}$');
ALTER TABLE public.user_ministries ADD COLUMN country_code text NOT NULL DEFAULT 'US' CHECK (country_code ~ '^[A-Z]{2}$');
ALTER TABLE public.user_needs ADD COLUMN country_code text NOT NULL DEFAULT 'US' CHECK (country_code ~ '^[A-Z]{2}$');
ALTER TABLE public.prayers ADD COLUMN country_code text NOT NULL DEFAULT 'US' CHECK (country_code ~ '^[A-Z]{2}$');
ALTER TABLE public.churches ADD COLUMN country_code text NOT NULL DEFAULT 'US' CHECK (country_code ~ '^[A-Z]{2}$');
ALTER TABLE public.neighborhood_videos ADD COLUMN country_code text NOT NULL DEFAULT 'US' CHECK (country_code ~ '^[A-Z]{2}$');
ALTER TABLE public.shape_profiles ADD COLUMN country_code text NOT NULL DEFAULT 'US' CHECK (country_code ~ '^[A-Z]{2}$');
ALTER TABLE public.geo_cache ADD COLUMN country_code text NOT NULL DEFAULT 'US' CHECK (country_code ~ '^[A-Z]{2}$');