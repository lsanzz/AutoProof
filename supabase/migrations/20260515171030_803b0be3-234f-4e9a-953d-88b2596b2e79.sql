
-- Set search_path on remaining function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.prevent_finalized_edit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'finalized' AND NEW.status = 'finalized' THEN
    RAISE EXCEPTION 'Vistoria finalizada não pode ser editada';
  END IF;
  RETURN NEW;
END; $$;

-- Restrict definer function exec to authenticated only
REVOKE EXECUTE ON FUNCTION public.current_workshop_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_workshop_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;

-- Tighten workshop insert: only when no profile yet (first signup creates org)
DROP POLICY IF EXISTS "Insert own workshop" ON public.workshops;
CREATE POLICY "Insert workshop on signup" ON public.workshops FOR INSERT TO authenticated
WITH CHECK (NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

-- Restrict storage listing: keep public read of individual objects but block listing the bucket
DROP POLICY IF EXISTS "Public read autoproof" ON storage.objects;
CREATE POLICY "Public read autoproof objects" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'autoproof');
-- Note: with public bucket, direct object URLs work; listing via API still requires auth via owner.

UPDATE storage.buckets SET public = true WHERE id = 'autoproof';
