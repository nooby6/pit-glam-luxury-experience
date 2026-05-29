
-- 1) Booking overlap detection trigger
CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_end timestamptz;
  conflict_id uuid;
BEGIN
  IF NEW.employee_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status IN ('cancelled','no_show') THEN
    RETURN NEW;
  END IF;

  new_end := NEW.start_at + make_interval(mins => NEW.duration_min);

  SELECT id INTO conflict_id
  FROM public.bookings
  WHERE employee_id = NEW.employee_id
    AND status NOT IN ('cancelled','no_show')
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND start_at < new_end
    AND (start_at + make_interval(mins => duration_min)) > NEW.start_at
  LIMIT 1;

  IF conflict_id IS NOT NULL THEN
    RAISE EXCEPTION 'This employee already has a booking that overlaps this time slot.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_overlap_check ON public.bookings;
CREATE TRIGGER bookings_overlap_check
BEFORE INSERT OR UPDATE OF start_at, duration_min, employee_id, status
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_overlap();

-- 2) First-admin promotion (no-op if any admin already exists)
CREATE OR REPLACE FUNCTION public.promote_first_admin(_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_admin uuid;
  target_id uuid;
BEGIN
  SELECT user_id INTO existing_admin FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF existing_admin IS NOT NULL THEN
    RETURN json_build_object('ok', false, 'error', 'An admin already exists. Ask them to promote you.');
  END IF;

  SELECT id INTO target_id FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  IF target_id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'No account found for that email. Sign up first.');
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (target_id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN json_build_object('ok', true, 'user_id', target_id);
END;
$$;

REVOKE ALL ON FUNCTION public.promote_first_admin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_first_admin(text) TO anon, authenticated;
