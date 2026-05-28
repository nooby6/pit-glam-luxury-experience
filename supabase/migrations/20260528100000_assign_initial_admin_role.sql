INSERT INTO public.user_roles (user_id, role)
VALUES ('20bb61eb-0e49-4efc-91ba-8cacabb9be03', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
