
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'attendant', 'mechanic', 'inspector');
CREATE TYPE public.inspection_status AS ENUM ('draft', 'in_progress', 'finalized');
CREATE TYPE public.damage_type AS ENUM ('risco','amassado','ralado','trinca','peca_quebrada','peca_faltando','mancha','vidro_trincado','roda_arranhada','farol_danificado','outro');

-- Workshops
CREATE TABLE public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document_type TEXT,
  document_number TEXT,
  responsible_name TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role public.app_role NOT NULL DEFAULT 'attendant',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_workshop ON public.profiles(workshop_id);

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  document_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_workshop ON public.clients(workshop_id);

-- Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  plate TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  year INT,
  color TEXT,
  mileage INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicles_workshop ON public.vehicles(workshop_id);
CREATE INDEX idx_vehicles_plate ON public.vehicles(workshop_id, plate);

-- Inspections
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type TEXT,
  entry_datetime TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.inspection_status NOT NULL DEFAULT 'draft',
  unique_code TEXT NOT NULL UNIQUE,
  version INT NOT NULL DEFAULT 1,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inspections_workshop ON public.inspections(workshop_id);
CREATE INDEX idx_inspections_code ON public.inspections(unique_code);

-- Inspection areas
CREATE TABLE public.inspection_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  has_damage BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_areas_inspection ON public.inspection_areas(inspection_id);

-- Photos
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  inspection_area_id UUID REFERENCES public.inspection_areas(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  marked_url TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_photos_inspection ON public.photos(inspection_id);

-- Damages
CREATE TABLE public.damages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  inspection_area_id UUID REFERENCES public.inspection_areas(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES public.photos(id) ON DELETE SET NULL,
  damage_type public.damage_type NOT NULL,
  description TEXT,
  position_x NUMERIC,
  position_y NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_damages_inspection ON public.damages(inspection_id);

-- Signatures
CREATE TABLE public.signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL UNIQUE REFERENCES public.inspections(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  signature_url TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  unique_code TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  public_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper: get current user's workshop_id (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.current_workshop_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workshop_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = _role)
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_workshops_upd BEFORE UPDATE ON public.workshops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clients_upd BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_vehicles_upd BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_inspections_upd BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_areas_upd BEFORE UPDATE ON public.inspection_areas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Block edits to finalized inspections
CREATE OR REPLACE FUNCTION public.prevent_finalized_edit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE st public.inspection_status;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'finalized' AND NEW.status = 'finalized' THEN
      RAISE EXCEPTION 'Vistoria finalizada não pode ser editada';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_inspections_lock BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.prevent_finalized_edit();

-- Enable RLS
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Workshops policies
CREATE POLICY "View own workshop" ON public.workshops FOR SELECT TO authenticated USING (id = public.current_workshop_id());
CREATE POLICY "Insert own workshop" ON public.workshops FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update workshop" ON public.workshops FOR UPDATE TO authenticated USING (id = public.current_workshop_id() AND public.has_role('admin'));

-- Profiles policies
CREATE POLICY "View profiles in workshop" ON public.profiles FOR SELECT TO authenticated USING (workshop_id = public.current_workshop_id());
CREATE POLICY "Self insert profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR (workshop_id = public.current_workshop_id() AND public.has_role('admin')));

-- Generic workshop-isolated tables
CREATE POLICY "Workshop select clients" ON public.clients FOR SELECT TO authenticated USING (workshop_id = public.current_workshop_id());
CREATE POLICY "Workshop modify clients" ON public.clients FOR ALL TO authenticated USING (workshop_id = public.current_workshop_id()) WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "Workshop select vehicles" ON public.vehicles FOR SELECT TO authenticated USING (workshop_id = public.current_workshop_id());
CREATE POLICY "Workshop modify vehicles" ON public.vehicles FOR ALL TO authenticated USING (workshop_id = public.current_workshop_id()) WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "Workshop select inspections" ON public.inspections FOR SELECT TO authenticated USING (workshop_id = public.current_workshop_id());
CREATE POLICY "Workshop modify inspections" ON public.inspections FOR ALL TO authenticated USING (workshop_id = public.current_workshop_id()) WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "Workshop select areas" ON public.inspection_areas FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id()));
CREATE POLICY "Workshop modify areas" ON public.inspection_areas FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id())) WITH CHECK (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id()));

CREATE POLICY "Workshop select photos" ON public.photos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id()));
CREATE POLICY "Workshop modify photos" ON public.photos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id())) WITH CHECK (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id()));

CREATE POLICY "Workshop select damages" ON public.damages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id()));
CREATE POLICY "Workshop modify damages" ON public.damages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id())) WITH CHECK (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id()));

CREATE POLICY "Workshop select signatures" ON public.signatures FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id()));
CREATE POLICY "Workshop modify signatures" ON public.signatures FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id())) WITH CHECK (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.workshop_id = public.current_workshop_id()));

CREATE POLICY "Workshop select reports" ON public.reports FOR SELECT TO authenticated USING (workshop_id = public.current_workshop_id());
CREATE POLICY "Workshop modify reports" ON public.reports FOR ALL TO authenticated USING (workshop_id = public.current_workshop_id()) WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "Workshop select audit" ON public.audit_logs FOR SELECT TO authenticated USING (workshop_id = public.current_workshop_id());
CREATE POLICY "Workshop insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (workshop_id = public.current_workshop_id());

-- Storage bucket for photos and signatures (public read so reports can render)
INSERT INTO storage.buckets (id, name, public) VALUES ('autoproof', 'autoproof', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read autoproof" ON storage.objects FOR SELECT USING (bucket_id = 'autoproof');
CREATE POLICY "Auth upload autoproof" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'autoproof');
CREATE POLICY "Auth update own autoproof" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'autoproof' AND owner = auth.uid());
CREATE POLICY "Auth delete own autoproof" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'autoproof' AND owner = auth.uid());
