/**
 * SUPABASE CLOUD DATABASE CONFIGURATION
 * ==============================================================
 * Masukkan kredensial project Supabase Anda di bawah ini:
 * 1. Buka https://supabase.com -> Buka Project Anda
 * 2. Masuk ke Project Settings (ikon gerigi) -> API
 * 3. Salin "Project URL" dan "Project API Keys (anon public)"
 * ==============================================================
 */

const SUPABASE_CONFIG = {
  // Project URL dari dashboard Supabase Anda:
  url: 'https://kahpogezngbjratuhyzl.supabase.co',

  // Publishable Key Anda:
  anonKey: ''
};

// Inisialisasi client Supabase secara global
let supabaseClient = null;

if (
  typeof window !== 'undefined' &&
  typeof window.supabase !== 'undefined' &&
  SUPABASE_CONFIG.url &&
  SUPABASE_CONFIG.url.trim() !== '' &&
  SUPABASE_CONFIG.anonKey &&
  SUPABASE_CONFIG.anonKey.trim() !== '' &&
  !SUPABASE_CONFIG.url.includes('YOUR_SUPABASE')
) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ [Supabase] Berhasil terhubung ke database cloud!');
  } catch (err) {
    console.warn('⚠️ [Supabase] Inisialisasi gagal, beralih ke mode offline/JSON lokal:', err);
  }
}

