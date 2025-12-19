-- Grant admin role to user
INSERT INTO public.user_roles (user_id, role)
VALUES ('8b5c8bac-360e-45ba-a81c-aaf551b198a4', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;