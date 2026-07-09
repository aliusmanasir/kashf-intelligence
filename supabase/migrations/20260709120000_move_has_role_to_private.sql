-- Move has_role out of the exposed API schema (public) into a private schema
-- so it is not callable via PostgREST, while remaining usable inside RLS policies.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
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

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Repoint existing RLS policies from public.has_role to private.has_role.
DROP POLICY IF EXISTS "Signed-in users can read published episodes" ON public.voice_content;
CREATE POLICY "Signed-in users can read published episodes"
  ON public.voice_content FOR SELECT
  TO authenticated
  USING (
    ((published = true) AND ((publish_at IS NULL) OR (publish_at <= now())))
    OR private.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can insert voice content" ON public.voice_content;
CREATE POLICY "Admins can insert voice content"
  ON public.voice_content FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update voice content" ON public.voice_content;
CREATE POLICY "Admins can update voice content"
  ON public.voice_content FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete voice content" ON public.voice_content;
CREATE POLICY "Admins can delete voice content"
  ON public.voice_content FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Now safe to drop the public wrapper so it is no longer exposed via the API.
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
