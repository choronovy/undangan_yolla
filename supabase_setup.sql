-- ==============================================================
-- PANDUAN SQL SUPABASE - UNDANGAN PERNIKAHAN RUDI & YOLLA
-- ==============================================================
-- Langkah:
-- 1. Buka dashboard Supabase (https://supabase.com)
-- 2. Klik menu "SQL Editor" di bilah kiri
-- 3. Tempel (Paste) seluruh baris SQL di bawah ini, lalu klik "Run"
-- ==============================================================

-- 1. Buat Tabel Ucapan & Doa (Wishes)
CREATE TABLE IF NOT EXISTS public.wishes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'hadir',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan Akses (Tamu & Admin bisa membaca, menambah, dan menghapus ucapan)
DROP POLICY IF EXISTS "Allow public read wishes" ON public.wishes;
CREATE POLICY "Allow public read wishes" ON public.wishes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert wishes" ON public.wishes;
CREATE POLICY "Allow public insert wishes" ON public.wishes
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete wishes" ON public.wishes;
CREATE POLICY "Allow public delete wishes" ON public.wishes
    FOR DELETE USING (true);

-- 4. Aktifkan Realtime agar setiap ada ucapan baru, langsung muncul tanpa refresh
ALTER PUBLICATION supabase_realtime ADD TABLE public.wishes;

