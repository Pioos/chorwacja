-- ============================================================
-- Croatia Bike Camp Tracker – schemat bazy danych Supabase
-- ============================================================

-- Tabela zdjęć
CREATE TABLE IF NOT EXISTS public.photos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url              TEXT NOT NULL,
  author_name      TEXT NOT NULL,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  taken_at         TIMESTAMPTZ,
  matched_distance_m DOUBLE PRECISION,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks przestrzenny (opcjonalny, wymaga rozszerzenia PostGIS)
-- CREATE INDEX photos_geom_idx ON public.photos USING GIST (ST_MakePoint(lng, lat));

-- Indeks na czas (dla sortowania osi czasu)
CREATE INDEX IF NOT EXISTS photos_taken_at_idx ON public.photos (taken_at ASC NULLS LAST);

-- ============================================================
-- Row Level Security (RLS) – wszyscy mogą czytać i pisać
-- Dla 6 znajomych bez pełnego auth wystarczy anonimowy dostęp
-- ============================================================
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Odczyt publiczny"
  ON public.photos FOR SELECT
  USING (true);

CREATE POLICY "Zapis publiczny"
  ON public.photos FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Storage bucket: bike-photos
-- Uruchom to w Supabase Dashboard → Storage → New Bucket
-- lub przez SQL:
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('bike-photos', 'bike-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Polityka odczytu dla bucketa
CREATE POLICY "Publiczny odczyt zdjęć"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bike-photos');

CREATE POLICY "Publiczny upload zdjęć"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bike-photos');

-- ============================================================
-- Realtime – włącz dla tabeli photos
-- (w Supabase Dashboard: Database → Replication → photos)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;
