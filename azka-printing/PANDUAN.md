# Panduan Azka Printing: Dari Nol sampai Online

Panduan ini menjelaskan cara menjalankan web, membuat database, dan men-deploy-nya agar bisa dibuka siapa saja lewat link. Semua layanan yang dipakai punya paket gratis.

---

## 0. Pahami dulu: web ini terdiri dari apa?

| Bagian | Fungsi | Di mana |
|---|---|---|
| **Frontend** | Tampilan web yang dilihat pengunjung (HTML, CSS, JavaScript) | folder `azka-printing/` |
| **Database** | Tempat menyimpan produk, teknik cetak, dan pesanan | **Supabase** (PostgreSQL online) |
| **Hosting** | Server yang membuat web bisa dibuka lewat internet | **Vercel** (atau Netlify) |

Alurnya: pengunjung membuka web (Vercel), lalu web membaca dan menyimpan data ke Supabase.

### Isi folder project

```
azka-printing/
├── index.html        -> halaman Katalog
├── studio.html       -> halaman Studio Desain + pemesanan
├── orders.html       -> halaman Daftar Pesanan
├── css/style.css     -> semua gaya tampilan
├── js/
│   ├── config.js     -> URL & kunci Supabase (kamu isi sendiri)
│   ├── db.js         -> kode komunikasi dengan database
│   └── ui.js         -> fungsi bantu (format Rupiah, header, gambar produk)
└── database/schema.sql -> perintah membuat tabel di database
```

Project ini sengaja dibuat **tanpa framework dan tanpa install apa pun** (tidak perlu Node, npm, dsb.), supaya mudah dipahami dan diubah.

---

## 1. Coba dulu di komputer (Mode Demo)

Tahap ini belum perlu database.

1. Ekstrak file zip `azka-printing.zip` ke sebuah folder.
2. Klik dua kali `index.html`. Web terbuka di browser.
3. Klik **Desain** pada salah satu produk, atur warna dan jumlah, lalu klik **Pesan Sekarang**.
4. Buka menu **Pesanan**. Pesananmu muncul di sana.

Di pojok atas ada label **Mode Demo**. Artinya data baru disimpan di browser kamu sendiri (localStorage), belum di database sungguhan. Langkah berikutnya menghubungkannya ke database.

> Tips: kalau ada yang tidak jalan saat dibuka langsung, pasang **VS Code** lalu ekstensi **Live Server**. Klik kanan `index.html` lalu pilih *Open with Live Server*.

---

## 2. Membuat database di Supabase

### 2.1 Buat akun dan project
1. Buka **https://supabase.com** lalu klik **Start your project**. Daftar dengan GitHub atau email.
2. Klik **New project**.
3. Isi:
   - **Name**: `azka-printing`
   - **Database Password**: buat password kuat, **simpan** di tempat aman
   - **Region**: pilih yang terdekat (misalnya *Southeast Asia (Singapore)*)
4. Klik **Create new project**, lalu tunggu 1-2 menit sampai siap.

### 2.2 Buat tabel dengan schema.sql
1. Di menu kiri pilih **SQL Editor**, lalu klik **New query**.
2. Buka file `database/schema.sql` dengan Notepad atau VS Code, **salin seluruh isinya**, lalu tempel ke SQL Editor.
3. Klik **Run**. Jika berhasil, muncul tulisan *Success*.

Yang dibuat oleh perintah itu:

| Tabel | Isi |
|---|---|
| `products` | Daftar produk (kaos, hoodie, mug, dst.), harga dasar, warna |
| `print_methods` | Teknik cetak (DTF, sablon, bordir) beserta biaya tambahan |
| `orders` | Data pesanan: no. order, nama, nomor HP, status, total |
| `order_items` | Rincian isi tiap pesanan (produk, warna, ukuran, jumlah) |
| bucket `designs` | Tempat menyimpan file gambar desain yang diupload |

### 2.3 Cek hasilnya
Buka **Table Editor** di menu kiri. Klik tabel `products`, kamu akan melihat 6 produk contoh. Di sinilah nanti kamu bisa **menambah, mengubah, atau menghapus produk** tanpa menyentuh kode.

### 2.4 Ambil URL dan kunci API
1. Buka **Project Settings** (ikon gerigi) lalu **API**. Di versi terbaru namanya bisa **Data API** atau **API Keys**.
2. Salin dua hal:
   - **Project URL**, contoh `https://abcdxyz.supabase.co`
   - Kunci **anon public** (di tampilan baru bisa bernama *publishable key*)
3. Buka `js/config.js` lalu ganti isinya:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://abcdxyz.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi....",
  BUCKET: "designs"
};
```

> **Penting:** hanya pakai kunci `anon` / `publishable`. **Jangan pernah** memakai kunci `service_role` / `secret` di file web ini, karena kunci itu memberi akses penuh ke database dan semua orang bisa melihatnya.

### 2.5 Tes dengan database sungguhan
1. Buka ulang `index.html`. Label **Mode Demo** harus hilang.
2. Buat satu pesanan lewat Studio Desain.
3. Buka Supabase, **Table Editor**, tabel `orders`. Pesananmu harus muncul di sana. 🎉

Kalau gagal, lihat bagian **Troubleshooting** di bawah.

---

## 3. Upload project ke GitHub

Vercel mengambil kode dari GitHub, jadi project perlu disimpan di sana dulu.

### Cara termudah (tanpa perintah git)
1. Buat akun di **https://github.com**.
2. Klik **+** di kanan atas lalu **New repository**.
3. Nama: `azka-printing`, pilih **Public** atau **Private**, lalu klik **Create repository**.
4. Klik tautan **uploading an existing file**.
5. Seret **seluruh isi** folder `azka-printing` (index.html, studio.html, orders.html, folder css, js, database) ke halaman itu.
6. Klik **Commit changes**.

> Pastikan `index.html` berada di **paling atas** repository, bukan di dalam sub-folder lagi.

### Cara alternatif (git di terminal)
```bash
cd azka-printing
git init
git add .
git commit -m "versi pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/azka-printing.git
git push -u origin main
```

> Kunci `anon` memang aman dipublikasikan, tetapi jangan masukkan password database atau kunci rahasia lain ke GitHub.

---

## 4. Deploy ke Vercel

1. Buka **https://vercel.com** lalu **Sign Up** dengan akun GitHub.
2. Klik **Add New...** lalu **Project**.
3. Pilih repository `azka-printing` lalu klik **Import**.
4. Pengaturan:
   - **Framework Preset**: `Other`
   - **Build Command** dan **Output Directory**: biarkan kosong
5. Klik **Deploy**. Tunggu sekitar 30 detik.
6. Vercel memberi alamat seperti `https://azka-printing.vercel.app`. Buka, web kamu sudah online. 🚀

### Alternatif: Netlify (paling mudah)
1. Buka **https://app.netlify.com/drop**.
2. Seret folder `azka-printing` ke halaman itu. Selesai, kamu langsung dapat link.

### Memperbarui web setelah online
Ubah file, lalu upload ulang atau `git push` ke GitHub. Vercel otomatis men-deploy versi terbaru dalam hitungan detik.

### Domain sendiri (opsional)
Di Vercel buka **Settings, Domains** lalu tambahkan domain yang kamu beli, misalnya `azkaprinting.com`.

---

## 5. Mengelola data sehari-hari

| Mau apa | Caranya |
|---|---|
| Tambah atau ubah produk | Supabase, Table Editor, `products`, lalu edit baris |
| Ubah harga teknik cetak | Table Editor, `print_methods` |
| Sembunyikan produk | Ubah kolom `active` menjadi `false` |
| Ubah status pesanan | Table Editor, `orders`, ubah kolom `status` menjadi `diproduksi`, `dikirim`, atau `selesai` |
| Lihat file desain pelanggan | **Storage**, bucket `designs` |

Contoh warna pada produk (kolom `colors`) berformat JSON:
```json
[{"name":"Hitam","hex":"#1f2937"},{"name":"Putih","hex":"#f8fafc"}]
```

---

## 6. Catatan keamanan (wajib dibaca)

Versi ini dibuat untuk **belajar dan prototipe**. Saat ini siapa pun yang membuka web bisa **melihat semua pesanan** (nama dan nomor HP pelanggan) lewat halaman Pesanan. Itu diatur oleh *policy* di `schema.sql`.

Sebelum dipakai untuk bisnis sungguhan:
1. Aktifkan **Supabase Auth** (login email atau Google).
2. Tambahkan kolom `user_id` di tabel `orders`.
3. Ubah policy agar pelanggan hanya bisa melihat pesanannya sendiri (`using (auth.uid() = user_id)`).
4. Halaman admin untuk mengubah status pesanan dibuat terpisah dan dilindungi login.

Pembayaran online (Midtrans, Xendit) juga belum ada. Saat ini pesanan berstatus *Menunggu Bayar* dan penagihan dilakukan manual lewat WhatsApp.

---

## 7. Troubleshooting

| Masalah | Penyebab dan solusi |
|---|---|
| Label **Mode Demo** masih muncul | `config.js` belum diisi atau masih berisi `ISI_...`. Isi lalu refresh dengan Ctrl+F5 |
| "Gagal memuat data: Invalid API key" | Kunci salah salin. Salin ulang kunci **anon/publishable** |
| Produk kosong padahal sudah diisi | Policy belum terbuat. Jalankan ulang `schema.sql` (kalau ada error "already exists", abaikan) |
| "new row violates row-level security" | Policy insert belum ada. Jalankan ulang bagian nomor 5 di `schema.sql` |
| Upload desain gagal | Bucket `designs` belum terbuat. Jalankan bagian nomor 6 di `schema.sql` |
| Vercel menampilkan 404 | `index.html` tidak berada di root repository |
| Perubahan tidak muncul setelah deploy | Tekan Ctrl+F5 untuk membersihkan cache browser |
| Cek error detail | Tekan F12 di browser lalu buka tab **Console** |

---

## 8. Ide pengembangan berikutnya

1. Login pelanggan (Supabase Auth)
2. Halaman admin untuk mengubah status pesanan
3. Tombol "Pesan via WhatsApp" yang otomatis berisi rincian pesanan
4. Pembayaran online (Midtrans atau Xendit)
5. Foto produk asli (upload ke Storage lalu simpan URL di tabel `products`)
6. Fitur menggeser dan memperbesar desain di preview

Kalau mau lanjut ke salah satunya, tinggal minta. 😊

---

## 9. Dashboard Admin (`admin.html`)

Buka `admin.html` (misalnya `https://azka-printing.vercel.app/admin.html`). Isinya:
- **Pesanan**: pantau pesanan, ubah status (Menunggu Bayar, Diproduksi, Dikirim, Selesai), unduh file desain, dan hubungi pelanggan lewat WhatsApp.
- **Produk**: tambah, edit, sembunyikan, dan hapus produk di etalase, lengkap dengan foto, warna, dan harga.

**Mode Demo:** langsung bisa dipakai tanpa login. Data hanya tersimpan di browser ini.

**Mode Database (Supabase):**
1. Jalankan `database/admin_setup.sql` di SQL Editor.
2. Supabase, Authentication, Sign In / Providers, Email: **matikan "Allow new users to sign up"**.
3. Supabase, Authentication, Users, Add user: buat email dan password admin.
4. Buka `admin.html` lalu masuk dengan akun itu.

> Semua akun yang bisa login dianggap admin, jadi jangan buka pendaftaran publik.


---

## Update: Studio Desain baru

**Desain Sendiri** - pelanggan bisa menambah banyak teks (8 font, warna, garis tepi), gambar/logo, dan bentuk, lalu menyeret, memutar, memperbesar, dan mengatur transparansi. Ada template cepat, pilihan sisi **Depan/Belakang**, dan pilihan **area cetak** (kecil/standar/besar/full). Hasilnya dibuat jadi file PNG transparan siap cetak.

**Sudah punya desain? Upload di sini** - pelanggan upload file jadi (PNG, JPG, SVG, WEBP, PDF, AI, PSD, CDR, EPS, maks 15 MB) untuk sisi depan dan/atau belakang, plus catatan untuk tim.

**Yang perlu dilakukan (mode database Supabase):** jalankan `database/update_desain.sql` sekali di SQL Editor. Tanpa itu, pesanan dari studio akan ditolak dengan pesan pengingat. Mode Demo tidak perlu apa-apa.

**Biaya sisi belakang:** ubah `BACK_SURCHARGE` di bagian atas script `studio.html` (default 0 = gratis).
