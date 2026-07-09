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

DROP POLICY IF EXISTS "Admins can upload to kashf media buckets" ON storage.objects;
CREATE POLICY "Admins can upload to kashf media buckets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    (bucket_id = ANY (ARRAY['kashf-thumbnails'::text, 'kashf-media'::text]))
    AND private.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can update kashf media buckets" ON storage.objects;
CREATE POLICY "Admins can update kashf media buckets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    (bucket_id = ANY (ARRAY['kashf-thumbnails'::text, 'kashf-media'::text]))
    AND private.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can delete from kashf media buckets" ON storage.objects;
CREATE POLICY "Admins can delete from kashf media buckets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    (bucket_id = ANY (ARRAY['kashf-thumbnails'::text, 'kashf-media'::text]))
    AND private.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);