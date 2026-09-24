-- Revoke EXECUTE permission on public.rls_auto_enable() from anon and authenticated roles
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO postgres, service_role;
