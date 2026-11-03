-- ==============================================================
-- PANDUAN SQL SUPABASE - UNDANGAN PERNIKAHAN RUDI & YOLLA
-- ==============================================================
-- Langkah Mudah:
-- 1. Buka dashboard Supabase (https://supabase.com)
-- 2. Buka project Anda: kahpogezngbjratuhyzl
-- 3. Klik menu "SQL Editor" di bilah menu kiri
-- 4. Klik "+ New query", lalu tempel (Paste) seluruh kode SQL di bawah ini
-- 5. Klik tombol "Run" (atau tekan Ctrl + Enter)
-- ==============================================================

-- 1. Tabel Ucapan & Doa Restu (Wishes)
CREATE TABLE IF NOT EXISTS public.wishes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'hadir',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Buku Tamu & Generator Undangan (Guests)
CREATE TABLE IF NOT EXISTS public.guests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    category TEXT DEFAULT 'Tamu',
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Data Presensi / Tamu yang Sudah Scan QR (Check-Ins)
CREATE TABLE IF NOT EXISTS public.checkins (
    id TEXT PRIMARY KEY,
    guest_id TEXT,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Tamu',
    ticket_code TEXT,
    checkin_time TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Aktifkan Row Level Security (RLS) pada Ketiga Tabel
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan Akses (Public Read, Insert, Delete)
-- Policies for wishes
DROP POLICY IF EXISTS "Allow public read wishes" ON public.wishes;
CREATE POLICY "Allow public read wishes" ON public.wishes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert wishes" ON public.wishes;
CREATE POLICY "Allow public insert wishes" ON public.wishes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete wishes" ON public.wishes;
CREATE POLICY "Allow public delete wishes" ON public.wishes FOR DELETE USING (true);

-- Policies for guests
DROP POLICY IF EXISTS "Allow public read guests" ON public.guests;
CREATE POLICY "Allow public read guests" ON public.guests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert guests" ON public.guests;
CREATE POLICY "Allow public insert guests" ON public.guests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete guests" ON public.guests;
CREATE POLICY "Allow public delete guests" ON public.guests FOR DELETE USING (true);

-- Policies for checkins
DROP POLICY IF EXISTS "Allow public read checkins" ON public.checkins;
CREATE POLICY "Allow public read checkins" ON public.checkins FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert checkins" ON public.checkins;
CREATE POLICY "Allow public insert checkins" ON public.checkins FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete checkins" ON public.checkins;
CREATE POLICY "Allow public delete checkins" ON public.checkins FOR DELETE USING (true);

-- 6. Aktifkan Realtime Publikasi secara Aman (Tidak akan error jika tabel sudah terdaftar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wishes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wishes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'guests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'checkins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;
  END IF;
END $$;

-- 7. Data Awal Contoh Tamu (Opsional)
INSERT INTO public.guests (id, name, phone, category, url, created_at)
VALUES 
  ('guest_1', 'Dimas Prasetya & Partner', '6281234567890', 'Sahabat', 'index.html?to=Dimas+Prasetya+%26+Partner', NOW()),
  ('guest_2', 'Bpk. Ir. Bambang Hermanto & Keluarga', '6281987654321', 'Keluarga', 'index.html?to=Bpk.+Ir.+Bambang+Hermanto+%26+Keluarga', NOW()),
  ('guest_3', 'Alisa Maharani, S.Kom & Partner', '6285712345678', 'Rekan Kerja', 'index.html?to=Alisa+Maharani%2C+S.Kom+%26+Partner', NOW())
ON CONFLICT (id) DO NOTHING;
