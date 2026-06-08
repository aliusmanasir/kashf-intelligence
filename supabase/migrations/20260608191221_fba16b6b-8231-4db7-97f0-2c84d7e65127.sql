
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Voice content
CREATE TYPE public.voice_content_type AS ENUM ('podcast', 'video', 'analysis');

CREATE TABLE public.voice_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  show_name text,
  description text,
  content_type public.voice_content_type NOT NULL DEFAULT 'podcast',
  thumbnail_url text,
  media_url text,
  duration text,
  published boolean NOT NULL DEFAULT false,
  publish_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.voice_content TO authenticated;
GRANT ALL ON public.voice_content TO service_role;
ALTER TABLE public.voice_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read published episodes"
  ON public.voice_content FOR SELECT
  TO authenticated
  USING (
    (published = true AND (publish_at IS NULL OR publish_at <= now()))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can insert voice content"
  ON public.voice_content FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update voice content"
  ON public.voice_content FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete voice content"
  ON public.voice_content FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_voice_content_updated_at
  BEFORE UPDATE ON public.voice_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
