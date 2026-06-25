
-- User preferences for personalization
CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  education text,
  interests text[] NOT NULL DEFAULT '{}',
  goals text[] NOT NULL DEFAULT '{}',
  countries text[] NOT NULL DEFAULT '{}',
  region_preset text NOT NULL DEFAULT 'global',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own preferences" ON public.user_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own preferences" ON public.user_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own preferences" ON public.user_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own preferences" ON public.user_preferences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Reading activity (Kashf Intelligence Score signal source)
CREATE TABLE public.reading_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id text,
  headline text,
  category text,
  region text,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.reading_activity TO authenticated;
GRANT ALL ON public.reading_activity TO service_role;

ALTER TABLE public.reading_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own activity" ON public.reading_activity
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own activity" ON public.reading_activity
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own activity" ON public.reading_activity
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX reading_activity_user_recent ON public.reading_activity (user_id, created_at DESC);
