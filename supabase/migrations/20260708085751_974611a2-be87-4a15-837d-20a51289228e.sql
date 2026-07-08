CREATE TABLE public.saved_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id text NOT NULL,
  headline text NOT NULL,
  summary text,
  why_it_matters text,
  why_matters_to_you text,
  category text,
  region text,
  publisher text,
  source_url text,
  section text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_stories TO authenticated;
GRANT ALL ON public.saved_stories TO service_role;

ALTER TABLE public.saved_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own saved" ON public.saved_stories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved" ON public.saved_stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saved" ON public.saved_stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX saved_stories_user_created_idx ON public.saved_stories(user_id, created_at DESC);