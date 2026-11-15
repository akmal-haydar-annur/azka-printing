-- =====================================================
-- AZKA PRINTING - Skema Database (Supabase / PostgreSQL)
-- Cara pakai: Supabase > SQL Editor > New query > paste semua > Run
-- =====================================================

-- 1) TABEL PRODUK ------------------------------------
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique not null,
  name        text not null,
  category    text not null,              -- kaos | hoodie | mug | totebag | akrilik
  description text,
  base_price  integer not null,           -- harga dasar per pcs (Rupiah)
  has_sizes   boolean not null default true,
  colors      jsonb not null default '[]',-- [{"name":"Hitam","hex":"#1f2937"}]
  sort        integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 2) TABEL TEKNIK CETAK ------------------------------
create table if not exists print_methods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  extra_price integer not null default 0, -- tambahan biaya per pcs
  sort        integer not null default 0
);

-- 3) TABEL PESANAN -----------------------------------
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  order_no       text unique not null,      -- contoh: AZK-48213
  customer_name  text not null,
  customer_phone text not null,
  status         text not null default 'menunggu_bayar',
                 -- menunggu_bayar | diproduksi | dikirim | selesai
  total          integer not null,
  created_at     timestamptz not null default now()
);

-- 4) TABEL ISI PESANAN -------------------------------
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id),
  product_name text not null,
  method       text not null,
  color        text,
  size_qty     jsonb not null default '{}',  -- {"S":2,"M":5}
  qty          integer not null,
  unit_price   integer not null,
  subtotal     integer not null,
  design_url   text,
  design_text  text,
  design_back_url text,
  design_json  jsonb,
  design_mode  text,
  design_note  text
);

create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_orders_created on orders(created_at desc);

-- 5) KEAMANAN (Row Level Security) -------------------
-- Catatan: ini versi belajar. Pengunjung boleh LIHAT produk,
-- BUAT pesanan, dan LIHAT pesanan. Untuk produksi nyata,
-- tambahkan login (Supabase Auth) agar orang hanya melihat pesanannya sendiri.
alter table products      enable row level security;
alter table print_methods enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;

create policy "produk bisa dibaca semua"  on products      for select using (true);
create policy "teknik bisa dibaca semua"  on print_methods for select using (true);
create policy "pesanan bisa dibaca"       on orders        for select using (true);
create policy "pesanan bisa dibuat"       on orders        for insert with check (true);
create policy "isi pesanan bisa dibaca"   on order_items   for select using (true);
create policy "isi pesanan bisa dibuat"   on order_items   for insert with check (true);

-- 6) STORAGE UNTUK FILE DESAIN -----------------------
insert into storage.buckets (id, name, public)
values ('designs', 'designs', true)
on conflict (id) do nothing;

create policy "desain bisa diupload" on storage.objects
  for insert with check (bucket_id = 'designs');
create policy "desain bisa dilihat" on storage.objects
  for select using (bucket_id = 'designs');

-- 7) DATA AWAL ---------------------------------------
insert into print_methods (name, description, extra_price, sort) values
 ('DTF (Direct to Film)', 'Warna penuh tanpa batas warna, detail halus', 25000, 1),
 ('Sablon Plastisol',     'Tahan lama, cocok untuk teks & logo solid', 20000, 2),
 ('Bordir Komputer',      'Hasil timbul elegan, tahan lama',           35000, 3);

insert into products (sku, name, category, description, base_price, has_sizes, colors, sort) values
 ('AZ-TS-30S', 'Kaos Cotton Combed 30s', 'kaos',
  'Bahan lembut, adem, dan tidak mudah melar. Cocok untuk komunitas & event.', 55000, true,
  '[{"name":"Hitam","hex":"#1f2937"},{"name":"Putih","hex":"#f8fafc"},{"name":"Navy","hex":"#1e3a8a"},{"name":"Merah","hex":"#b91c1c"},{"name":"Abu","hex":"#6b7280"}]', 1),
 ('AZ-OS-24S', 'Kaos Oversized Heavyweight', 'kaos',
  'Kain tebal 2.8mm, potongan boxy modern, drop shoulder.', 75000, true,
  '[{"name":"Hitam","hex":"#1f2937"},{"name":"Abu","hex":"#6b7280"},{"name":"Krem","hex":"#e7dfd0"}]', 2),
 ('AZ-HD-330', 'Hoodie Jumper Fleece 330 GSM', 'hoodie',
  'Fleece tebal, hangat, dan nyaman dipakai seharian.', 125000, true,
  '[{"name":"Navy","hex":"#1e3a8a"},{"name":"Hitam","hex":"#1f2937"},{"name":"Hijau","hex":"#166534"},{"name":"Abu","hex":"#6b7280"}]', 3),
 ('AZ-MG-11', 'Mug Enamel 11oz', 'mug',
  'Mug enamel putih glossy, tahan cuci.', 28000, false,
  '[{"name":"Putih","hex":"#f8fafc"}]', 4),
 ('AZ-TB-YKK', 'Totebag Kanvas Resleting', 'totebag',
  'Kanvas tebal dengan resleting YKK, muat laptop 14 inci.', 45000, false,
  '[{"name":"Krem","hex":"#e7dfd0"},{"name":"Hitam","hex":"#1f2937"}]', 5),
 ('AZ-AK-3MM', 'Akrilik Keychain 3mm', 'akrilik',
  'Gantungan kunci akrilik 2 sisi, potong sesuai bentuk desain.', 14500, false,
  '[{"name":"Bening","hex":"#dbeafe"}]', 6);
