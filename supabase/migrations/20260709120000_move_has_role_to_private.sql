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

-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

-- voice_content
DROP POLICY IF EXISTS "Admins can insert voice content" ON public.voice_content;
CREATE POLICY "Admins can insert voice content"
  ON public.voice_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update voice content" ON public.voice_content;
CREATE POLICY "Admins can update voice content"
  ON public.voice_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by AND private.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = created_by AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete voice content" ON public.voice_content;
CREATE POLICY "Admins can delete voice content"
  ON public.voice_content FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by AND private.has_role(auth.uid(), 'admin'));

-- Now safe to drop the public wrapper so it is no longer exposed via the API.
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
