CREATE TABLE public.post_translations (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null,
  lang text not null,
  translated text not null,
  created_at timestamptz not null default now(),
  unique (content_hash, lang)
);
GRANT ALL ON public.post_translations TO service_role;
ALTER TABLE public.post_translations ENABLE ROW LEVEL SECURITY;