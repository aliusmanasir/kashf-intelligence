-- Restore EXECUTE on has_role for authenticated.
-- This function is SECURITY DEFINER with a locked search_path and is referenced
-- by RLS policies on public.voice_content. Without EXECUTE on the calling role,
-- every SELECT/INSERT/UPDATE/DELETE that triggers the policy fails with
-- "permission denied for function has_role". Re-granting is safe because the
-- function only reads user_roles for the supplied user_id.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
