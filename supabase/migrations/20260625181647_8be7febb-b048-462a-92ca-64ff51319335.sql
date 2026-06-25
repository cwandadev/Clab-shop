
-- Backfill: if user already exists, grant admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'tieflab@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Trigger to auto-promote on future signups
CREATE OR REPLACE FUNCTION public.auto_grant_owner_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'tieflab@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_grant_owner_admin_trigger ON auth.users;
CREATE TRIGGER auto_grant_owner_admin_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_grant_owner_admin();
