REVOKE ALL ON FUNCTION public.merge_applications(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_applications(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.merge_applications(uuid, uuid) TO authenticated;