-- Function to retrieve auth.users.created_at for usage-period anchoring.
-- SECURITY DEFINER allows reading auth.users (not exposed via PostgREST).
-- Used when public.users.created_at is missing (e.g. OAuth users).

CREATE OR REPLACE FUNCTION public.get_auth_user_created_at(user_uuid uuid)
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT created_at FROM auth.users WHERE id = user_uuid LIMIT 1;
$$;
