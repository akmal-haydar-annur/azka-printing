-- =====================================================
-- ADMIN SETUP - jalankan SETELAH schema.sql
-- Supabase > SQL Editor > New query > paste > Run
-- =====================================================

-- 1) Kolom foto produk
alter table products add column if not exists image_url text;

-- 2) Hanya user yang LOGIN (admin) yang boleh mengubah data
drop policy if exists "admin kelola produk" on products;
create policy "admin kelola produk" on products for all to authenticated using (true) with check (true);

drop policy if exists "admin kelola teknik" on print_methods;
create policy "admin kelola teknik" on print_methods for all to authenticated using (true) with check (true);

drop policy if exists "admin ubah pesanan" on orders;
create policy "admin ubah pesanan" on orders for update to authenticated using (true) with check (true);

drop policy if exists "admin hapus pesanan" on orders;
create policy "admin hapus pesanan" on orders for delete to authenticated using (true);

-- 3) Admin boleh mengelola file di bucket 'designs' (foto produk)
drop policy if exists "admin kelola file" on storage.objects;
create policy "admin kelola file" on storage.objects for all to authenticated
  using (bucket_id = 'designs') with check (bucket_id = 'designs');

-- 4) PENTING (lakukan manual di dashboard Supabase):
--    Authentication > Sign In / Providers > Email > matikan "Allow new users to sign up"
--    Authentication > Users > Add user > buat akun admin (email + password).
--    Semua user yang login dianggap admin, jadi jangan biarkan pendaftaran publik terbuka.
