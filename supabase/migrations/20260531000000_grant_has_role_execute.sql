-- Allow authenticated users to evaluate role-based RLS policies.
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon, authenticated;