// =====================================================
// KONFIGURASI - isi dengan data dari Supabase kamu
// (Supabase > Project Settings > API)
// Selama belum diisi, web berjalan dalam MODE DEMO
// (data disimpan di browser saja, tanpa database).
// =====================================================
window.APP_CONFIG = {
  SUPABASE_URL: "ISI_URL_SUPABASE_KAMU",       // contoh: https://abcdxyz.supabase.co
  SUPABASE_ANON_KEY: "ISI_ANON_KEY_KAMU",      // kunci "anon public" (aman dipakai di browser)
  BUCKET: "designs",                           // nama bucket storage (sudah dibuat oleh schema.sql)
  ADMIN_WHATSAPP: "6281234567890"              // nomor WhatsApp admin/CS untuk konfirmasi & bantuan pesanan (format 628xxx)
};
