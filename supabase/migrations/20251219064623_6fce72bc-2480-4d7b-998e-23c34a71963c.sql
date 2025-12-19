-- Add admin role to user
INSERT INTO public.user_roles (user_id, role)
VALUES ('58d22ffd-d57b-4802-be41-80d05edafa21', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;