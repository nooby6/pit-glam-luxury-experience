-- Grant execute on has_role so RLS policies referencing it don't fail
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- Allow any authenticated user to view and manage bookings (calendar access)
DROP POLICY IF EXISTS "staff view bookings" ON public.bookings;
DROP POLICY IF EXISTS "staff create bookings" ON public.bookings;
DROP POLICY IF EXISTS "staff update bookings" ON public.bookings;
DROP POLICY IF EXISTS "admins delete bookings" ON public.bookings;

CREATE POLICY "authenticated view bookings"
  ON public.bookings FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated create bookings"
  ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated update bookings"
  ON public.bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated delete bookings"
  ON public.bookings FOR DELETE TO authenticated USING (true);
