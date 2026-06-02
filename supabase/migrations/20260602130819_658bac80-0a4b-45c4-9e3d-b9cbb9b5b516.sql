REVOKE EXECUTE ON FUNCTION public.promote_first_admin(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.promote_first_admin(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.promote_first_admin(text) TO service_role;