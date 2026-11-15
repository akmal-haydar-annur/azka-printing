-- =====================================================
-- UPDATE: fitur Studio Desain baru (editor + upload desain sendiri)
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run
-- Aman dijalankan ulang.
-- =====================================================
alter table order_items
  add column if not exists design_back_url text,   -- file desain sisi belakang
  add column if not exists design_json     jsonb,  -- rincian elemen desain (teks, gambar, bentuk, posisi)
  add column if not exists design_mode     text,   -- 'editor' (dibuat di studio) | 'upload' (upload sendiri)
  add column if not exists design_note     text;   -- catatan pelanggan untuk tim produksi
