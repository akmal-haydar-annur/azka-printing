// =====================================================
// db.js - Semua komunikasi dengan database ada di sini.
// Jika Supabase belum diisi -> MODE DEMO (localStorage).
// =====================================================
const CFG = window.APP_CONFIG;
const LIVE = !CFG.SUPABASE_URL.startsWith("ISI_") && !!window.supabase;
const sb = LIVE ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY) : null;

// Data contoh untuk mode demo (sama dengan seed di schema.sql)
const C = {
  hitam: { name: "Hitam", hex: "#1f2937" }, putih: { name: "Putih", hex: "#f8fafc" },
  navy: { name: "Navy", hex: "#1e3a8a" }, merah: { name: "Merah", hex: "#b91c1c" },
  abu: { name: "Abu", hex: "#6b7280" }, krem: { name: "Krem", hex: "#e7dfd0" },
  hijau: { name: "Hijau", hex: "#166534" }, bening: { name: "Bening", hex: "#dbeafe" }
};
const DEMO_PRODUCTS = [
  { id: "p1", sku: "AZ-TS-30S", name: "Kaos Cotton Combed 30s", category: "kaos", description: "Bahan lembut, adem, dan tidak mudah melar. Cocok untuk komunitas & event.", base_price: 55000, has_sizes: true, colors: [C.hitam, C.putih, C.navy, C.merah, C.abu] },
  { id: "p2", sku: "AZ-OS-24S", name: "Kaos Oversized Heavyweight", category: "kaos", description: "Kain tebal 2.8mm, potongan boxy modern, drop shoulder.", base_price: 75000, has_sizes: true, colors: [C.hitam, C.abu, C.krem] },
  { id: "p3", sku: "AZ-HD-330", name: "Hoodie Jumper Fleece 330 GSM", category: "hoodie", description: "Fleece tebal, hangat, dan nyaman dipakai seharian.", base_price: 125000, has_sizes: true, colors: [C.navy, C.hitam, C.hijau, C.abu] },
  { id: "p4", sku: "AZ-MG-11", name: "Mug Enamel 11oz", category: "mug", description: "Mug enamel putih glossy, tahan cuci.", base_price: 28000, has_sizes: false, colors: [C.putih] },
  { id: "p5", sku: "AZ-TB-YKK", name: "Totebag Kanvas Resleting", category: "totebag", description: "Kanvas tebal dengan resleting YKK, muat laptop 14 inci.", base_price: 45000, has_sizes: false, colors: [C.krem, C.hitam] },
  { id: "p6", sku: "AZ-AK-3MM", name: "Akrilik Keychain 3mm", category: "akrilik", description: "Gantungan kunci akrilik 2 sisi, potong sesuai bentuk desain.", base_price: 14500, has_sizes: false, colors: [C.bening] }
];
const DEMO_METHODS = [
  { id: "m1", name: "DTF (Direct to Film)", description: "Warna penuh tanpa batas warna, detail halus", extra_price: 25000 },
  { id: "m2", name: "Sablon Plastisol", description: "Tahan lama, cocok untuk teks & logo solid", extra_price: 20000 },
  { id: "m3", name: "Bordir Komputer", description: "Hasil timbul elegan, tahan lama", extra_price: 35000 }
];

// Produk mode demo: disimpan di localStorage setelah admin mengubahnya
const demoProducts = () => { try { return JSON.parse(localStorage.getItem("azka_products")) || structuredClone(DEMO_PRODUCTS); } catch { return structuredClone(DEMO_PRODUCTS); } };
const saveDemoProducts = a => localStorage.setItem("azka_products", JSON.stringify(a));
const needPerm = () => new Error("Ditolak database. Pastikan sudah login & database/admin_setup.sql sudah dijalankan.");

const DB = {
  live: LIVE,

  // ---------- ADMIN ----------
  async session() { if (!LIVE) return { demo: true }; return (await sb.auth.getSession()).data.session; },
  async login(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error; return data.session;
  },
  async logout() { if (LIVE) await sb.auth.signOut(); },

  async allProducts() {
    if (!LIVE) return demoProducts();
    const { data, error } = await sb.from("products").select("*").order("sort");
    if (error) throw error; return data;
  },
  async saveProduct(p) {
    if (!LIVE) {
      const all = demoProducts(), i = all.findIndex(x => x.id === p.id);
      if (i >= 0) all[i] = { ...all[i], ...p }; else all.push({ ...p, id: "p" + Date.now() });
      return saveDemoProducts(all);
    }
    const { id, ...rest } = p;
    const q = id ? sb.from("products").update(rest).eq("id", id) : sb.from("products").insert(rest);
    const { data, error } = await q.select();
    if (error) throw error; if (!data.length) throw needPerm();
  },
  async deleteProduct(id) {
    if (!LIVE) return saveDemoProducts(demoProducts().filter(x => x.id !== id));
    const { data, error } = await sb.from("products").delete().eq("id", id).select();
    if (error) throw error; if (!data.length) throw needPerm();
  },
  async updateOrderStatus(id, status) {
    if (!LIVE) {
      const all = JSON.parse(localStorage.getItem("azka_orders") || "[]");
      all.forEach(o => { if (o.id === id) o.status = status; });
      return localStorage.setItem("azka_orders", JSON.stringify(all));
    }
    const { data, error } = await sb.from("orders").update({ status }).eq("id", id).select();
    if (error) throw error; if (!data.length) throw needPerm();
  },
  // Foto produk: demo -> data URL, live -> Supabase Storage (folder produk/)
  async uploadProductImage(blob) {
    if (!LIVE) return new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); });
    const path = "produk/" + Date.now() + ".jpg";
    const { error } = await sb.storage.from(CFG.BUCKET).upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return sb.storage.from(CFG.BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async products() {
    if (!LIVE) return demoProducts().filter(p => p.active !== false);
    const { data, error } = await sb.from("products").select("*").eq("active", true).order("sort");
    if (error) throw error;
    return data;
  },

  async methods() {
    if (!LIVE) return DEMO_METHODS;
    const { data, error } = await sb.from("print_methods").select("*").order("sort");
    if (error) throw error;
    return data;
  },

  // ---------- PEMESANAN ----------
  async createOrder(order, items) {
    if (!order.customer_name || !order.customer_phone) {
      throw new Error("Nama dan nomor WhatsApp pelanggan wajib diisi.");
    }
    if (!items || !items.length) {
      throw new Error("Pesanan harus memiliki minimal 1 item.");
    }

    if (LIVE) {
      // Pastikan kolom desain baru sudah ada (database/update_desain.sql) sebelum pesanan dibuat
      const chk = await sb.from("order_items").select("design_json,design_back_url,design_note,design_mode").limit(1);
      if (chk.error) throw new Error("Jalankan database/update_desain.sql di Supabase dulu (kolom desain belum ada).");
    }

    let created;
    if (!LIVE) {
      const all = JSON.parse(localStorage.getItem("azka_orders") || "[]");
      created = { ...order, id: crypto.randomUUID(), created_at: new Date().toISOString(), order_items: items };
      all.unshift(created);
      localStorage.setItem("azka_orders", JSON.stringify(all));
    } else {
      const { data, error } = await sb.from("orders").insert(order).select().single();
      if (error) throw error;
      const rows = items.map(i => ({ ...i, order_id: data.id }));
      const r = await sb.from("order_items").insert(rows);
      if (r.error) throw r.error;
      created = { ...data, order_items: items };
    }

    // Catat nomor pesanan di perangkat ini agar pelanggan bisa melacak dengan mudah
    try {
      const my = JSON.parse(localStorage.getItem("azka_my_orders") || "[]");
      const exists = my.findIndex(x => (typeof x === "string" ? x : x.order_no) === order.order_no);
      const entry = { order_no: order.order_no, created_at: new Date().toISOString(), total: order.total };
      if (exists >= 0) my[exists] = entry; else my.unshift(entry);
      localStorage.setItem("azka_my_orders", JSON.stringify(my.slice(0, 30)));
    } catch (_) {}

    return created;
  },

  // Ambil semua pesanan (khusus Dashboard Admin)
  async orders() {
    if (!LIVE) return JSON.parse(localStorage.getItem("azka_orders") || "[]");
    const { data, error } = await sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  // Lacak 1 pesanan berdasarkan nomor order (untuk halaman publik orders.html)
  async getOrderByNo(orderNo) {
    if (!orderNo) return null;
    const cleanNo = String(orderNo).trim().toUpperCase().replace(/^#/, "");
    if (!LIVE) {
      const all = JSON.parse(localStorage.getItem("azka_orders") || "[]");
      return all.find(o => String(o.order_no).toUpperCase() === cleanNo) || null;
    }
    const { data, error } = await sb.from("orders")
      .select("*, order_items(*)")
      .ilike("order_no", cleanNo)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Daftar pesanan milik perangkat ini (riwayat lokal browser)
  async myOrders() {
    if (!LIVE) {
      return JSON.parse(localStorage.getItem("azka_orders") || "[]");
    }
    const my = JSON.parse(localStorage.getItem("azka_my_orders") || "[]");
    if (!my.length) return [];
    const nos = my.map(m => (typeof m === "string" ? m : m.order_no));
    const { data, error } = await sb.from("orders")
      .select("*, order_items(*)")
      .in("order_no", nos)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("Gagal memuat pesanan lokal:", error);
      return [];
    }
    return data || [];
  },

  // Upload gambar desain ke Supabase Storage, mengembalikan URL publik
  async uploadDesign(file) {
    // Mode demo: simpan sebagai data URL (hanya file kecil) agar thumbnail tampil
    if (!LIVE) return file.size <= 1.5 * 1024 * 1024
      ? new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.onerror = () => r(null); f.readAsDataURL(file); })
      : null;
    const path = Date.now() + "-" + file.name.replace(/[^\w.-]/g, "_");
    const { error } = await sb.storage.from(CFG.BUCKET).upload(path, file);
    if (error) throw error;
    return sb.storage.from(CFG.BUCKET).getPublicUrl(path).data.publicUrl;
  }
};
