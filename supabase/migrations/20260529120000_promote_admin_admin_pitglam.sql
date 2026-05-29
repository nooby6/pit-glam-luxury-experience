-- Promote admin@pitglam.co.ke to admin role
DO $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = 'admin@pitglam.co.ke' LIMIT 1;
  IF target_id IS NULL THEN
    RAISE NOTICE 'No user with email admin@pitglam.co.ke found in auth.users';
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Ensured admin role for user %', target_id;
  END IF;
END
$$;
