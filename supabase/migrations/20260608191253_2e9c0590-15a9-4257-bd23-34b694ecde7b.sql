
CREATE POLICY "Signed-in users can read kashf media buckets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id IN ('kashf-thumbnails', 'kashf-media'));

CREATE POLICY "Admins can upload to kashf media buckets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('kashf-thumbnails', 'kashf-media')
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update kashf media buckets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('kashf-thumbnails', 'kashf-media')
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete from kashf media buckets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('kashf-thumbnails', 'kashf-media')
    AND public.has_role(auth.uid(), 'admin')
  );
