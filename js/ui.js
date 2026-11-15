// =====================================================
// ui.js - Fungsi bantu yang dipakai semua halaman
// =====================================================
const rupiah = n => "Rp " + Number(n).toLocaleString("id-ID");
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Normalisasi nomor telepon ke format WhatsApp internasional (628...)
function toWANumber(phone) {
  let p = String(phone || "").replace(/\D/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  else if (p.startsWith("8")) p = "628" + p.slice(1);
  return p;
}

// Format tanggal lokal Indonesia
const tgl = d => new Date(d).toLocaleString("id-ID", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
});

// Header + navigasi (dipakai di semua halaman)
function renderHeader(active) {
  const links = [
    ["index.html", "katalog", "Katalog"],
    ["studio.html", "studio", "Studio Desain"],
    ["orders.html", "pesanan", "Lacak Pesanan"]
  ];
  const headerEl = $("#header");
  if (!headerEl) return;
  headerEl.innerHTML = `
    <div class="container header-in">
      <a class="logo" href="index.html">
        <img class="logo-img" src="assets/azka-printing-logo.jpeg" alt="Logo Azka Printing">
        <span class="logo-text">Azka Printing</span>
      </a>
      <nav class="nav-links">
        ${links.map(([h, k, t]) => `<a href="${h}" class="${k === active ? "on" : ""}">${t}</a>`).join("")}
      </nav>
      <div class="header-action">
        <a class="btn primary sm" href="studio.html">Buka Studio ›</a>
      </div>
    </div>`;
}

function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

// Gambar produk (SVG Realistis Apple-Grade) berwarna sesuai pilihan warna
function productSVG(category, color = "#1f2937") {
  const c = color || "#1f2937";
  const shapes = {
    kaos: `
      <!-- Base Shirt Body -->
      <path d="M68 22 L38 38 L10 76 L36 96 L54 82 L54 204 Q100 208 146 204 L146 82 L164 96 L190 76 L162 38 L132 22 Q100 44 68 22Z" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- Soft Fabric Shading Overlay (Left / Right drapes) -->
      <path d="M54 82 L54 204 Q68 206 82 204 L72 82Z" fill="rgba(0,0,0,.08)"/>
      <path d="M146 82 L146 204 Q132 206 118 204 L128 82Z" fill="rgba(0,0,0,.08)"/>
      <!-- Shoulder Highlights -->
      <path d="M38 38 L68 22 Q100 44 132 22 L162 38 L152 46 Q100 32 48 46Z" fill="rgba(255,255,255,.12)"/>
      <!-- Left & Right Sleeve Creases -->
      <path d="M38 38 L10 76 L36 96 L46 72Z" fill="rgba(0,0,0,.07)"/>
      <path d="M162 38 L190 76 L164 96 L154 72Z" fill="rgba(0,0,0,.07)"/>
      <path d="M10 76 L36 96" stroke="rgba(0,0,0,.2)" stroke-width="2"/>
      <path d="M190 76 L164 96" stroke="rgba(0,0,0,.2)" stroke-width="2"/>
      <!-- Collar Inner Shadow & Ribbing -->
      <path d="M70 23 Q100 48 130 23 Q100 12 70 23Z" fill="rgba(0,0,0,.35)"/>
      <path d="M70 23 Q100 48 130 23 Q100 38 70 23Z" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>
      <path d="M72 26 Q100 44 128 26" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1" stroke-dasharray="2,2"/>
      <!-- Bottom Hem Stitch -->
      <path d="M55 198 Q100 202 145 198" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="1.5" stroke-dasharray="3,2"/>
    `,
    hoodie: `
      <!-- Base Hoodie Body -->
      <path d="M68 26 L36 42 L8 92 L36 110 L54 94 L54 186 L50 206 L150 206 L146 186 L146 94 L164 110 L192 92 L164 42 L132 26 Q100 6 68 26Z" fill="${c}" stroke="rgba(0,0,0,.18)" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- Sleeve Shading -->
      <path d="M36 42 L8 92 L36 110 L48 88Z" fill="rgba(0,0,0,.1)"/>
      <path d="M164 42 L192 92 L164 110 L152 88Z" fill="rgba(0,0,0,.1)"/>
      <!-- Hood Volume and Inside Neck Depth -->
      <path d="M66 26 Q100 62 134 26 Q100 4 66 26Z" fill="rgba(0,0,0,.38)"/>
      <path d="M68 28 Q100 58 132 28 Q100 16 68 28Z" fill="${c}"/>
      <path d="M72 28 Q100 52 128 28" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
      <!-- Kangaroo Pouch Pocket -->
      <path d="M68 142 L132 142 L140 186 L60 186Z" fill="${c}" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/>
      <path d="M68 142 L60 186" stroke="rgba(0,0,0,.3)" stroke-width="2" stroke-linecap="round"/>
      <path d="M132 142 L140 186" stroke="rgba(0,0,0,.3)" stroke-width="2" stroke-linecap="round"/>
      <path d="M68 142 H132" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>
      <!-- Drawstrings with Silver Metal Aglets -->
      <path d="M88 44 Q84 75 82 108" fill="none" stroke="#e5e7eb" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="80.5" y="106" width="3" height="7" rx="1.5" fill="#9ca3af" stroke="#4b5563" stroke-width="0.5"/>
      <path d="M112 44 Q116 75 118 108" fill="none" stroke="#e5e7eb" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="116.5" y="106" width="3" height="7" rx="1.5" fill="#9ca3af" stroke="#4b5563" stroke-width="0.5"/>
      <!-- Ribbed Waistband & Cuffs -->
      <rect x="50" y="186" width="100" height="20" rx="3" fill="rgba(0,0,0,.12)"/>
      <line x1="50" y1="186" x2="150" y2="186" stroke="rgba(0,0,0,.15)" stroke-width="1.5"/>
      <rect x="10" y="90" width="26" height="20" rx="3" transform="rotate(-30 10 90)" fill="rgba(0,0,0,.1)"/>
      <rect x="164" y="103" width="26" height="20" rx="3" transform="rotate(30 164 103)" fill="rgba(0,0,0,.1)"/>
    `,
    mug: `
      <!-- Mug Drop Shadow -->
      <ellipse cx="90" cy="180" rx="46" ry="10" fill="rgba(0,0,0,.1)"/>
      <!-- Mug Handle (Back/Outer) -->
      <path d="M130 70 C175 70 178 145 130 145" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round"/>
      <path d="M130 70 C175 70 178 145 130 145" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="14" stroke-linecap="round"/>
      <path d="M130 74 C165 74 168 141 130 141" fill="none" stroke="${c}" stroke-width="10"/>
      <!-- Mug Body -->
      <path d="M48 60 H132 V162 C132 174 122 180 90 180 C58 180 48 174 48 162 Z" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width="1.5"/>
      <!-- Ceramic Cylindrical 3D Light & Shadow Overlay -->
      <path d="M48 60 H72 V176 C60 174 48 168 48 162 Z" fill="rgba(255,255,255,.2)"/>
      <path d="M112 60 H132 V162 C132 168 124 174 112 176 Z" fill="rgba(0,0,0,.12)"/>
      <!-- Mug Rim Ellipse (Top Depth) -->
      <ellipse cx="90" cy="60" rx="42" ry="12" fill="${c}" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/>
      <ellipse cx="90" cy="60" rx="38" ry="10" fill="rgba(0,0,0,.18)"/>
      <!-- Glossy Reflection Highlight Streak -->
      <path d="M62 68 L60 168" stroke="rgba(255,255,255,.45)" stroke-width="4" stroke-linecap="round"/>
      <path d="M70 70 L69 164" stroke="rgba(255,255,255,.2)" stroke-width="1.5" stroke-linecap="round"/>
    `,
    totebag: `
      <!-- Drop Shadow -->
      <ellipse cx="100" cy="204" rx="68" ry="8" fill="rgba(0,0,0,.08)"/>
      <!-- Handles -->
      <path d="M68 85 C68 18 132 18 132 85" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="9" stroke-linecap="round"/>
      <path d="M68 85 C68 18 132 18 132 85" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
      <path d="M68 85 C68 20 132 20 132 85" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2" stroke-linecap="round"/>
      <!-- Bag Body -->
      <path d="M38 75 H162 L172 198 C172 203 166 205 100 205 C34 205 28 203 28 198 Z" fill="${c}" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>
      <!-- Bag Depth & Creases -->
      <path d="M28 198 L38 75 L52 82 L42 202 Z" fill="rgba(0,0,0,.08)"/>
      <path d="M172 198 L162 75 L148 82 L158 202 Z" fill="rgba(0,0,0,.12)"/>
      <!-- Top Hem & Stitching -->
      <rect x="36" y="73" width="128" height="12" rx="2" fill="rgba(0,0,0,.08)"/>
      <line x1="38" y1="85" x2="162" y2="85" stroke="rgba(0,0,0,.2)" stroke-width="1.5" stroke-dasharray="3,2"/>
      <!-- Handle Stitch Patches -->
      <rect x="64" y="76" width="10" height="16" rx="2" fill="rgba(0,0,0,.15)"/>
      <rect x="126" y="76" width="10" height="16" rx="2" fill="rgba(0,0,0,.15)"/>
    `,
    akrilik: `
      <!-- Shadow -->
      <ellipse cx="100" cy="196" rx="46" ry="10" fill="rgba(0,0,0,.1)"/>
      <!-- Metal Keyring & Chain -->
      <circle cx="100" cy="30" r="16" fill="none" stroke="#d1d5db" stroke-width="5"/>
      <circle cx="100" cy="30" r="16" fill="none" stroke="#9ca3af" stroke-width="4"/>
      <circle cx="100" cy="30" r="14" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="1.5"/>
      <!-- Chain Link Connector -->
      <rect x="97" y="44" width="6" height="12" rx="3" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/>
      <circle cx="100" cy="62" r="5" fill="#f3f4f6" stroke="#6b7280" stroke-width="2"/>
      <!-- Translucent Glossy Acrylic Body -->
      <rect x="52" y="52" width="96" height="136" rx="22" fill="${c}" fill-opacity=".82" stroke="rgba(255,255,255,.7)" stroke-width="2"/>
      <!-- Beveled Border Highlight -->
      <rect x="55" y="55" width="90" height="130" rx="19" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="1.5"/>
      <!-- Glossy Reflection Diagonal Streaks -->
      <path d="M56 120 L110 54 H124 L56 138 Z" fill="rgba(255,255,255,.35)"/>
      <path d="M58 148 L138 68 H144 L60 162 Z" fill="rgba(255,255,255,.18)"/>
    `
  };
  return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" role="img">${shapes[category] || shapes.kaos}</svg>`;
}

// ----- Tampilan desain pada item pesanan (dipakai orders.html & admin.html) -----
const isImgUrl = u => !!u && (/^data:image\//.test(u) || /\.(png|jpe?g|svg|webp|gif)(\?|$)/i.test(u));
const fileExt = u => { const m = String(u || "").match(/\.([a-z0-9]{2,4})(\?|$)/i); return m ? m[1].toUpperCase() : "FILE"; };

function designThumb(i, cat) {
  const dj = i.design_json || {}, u = i.design_url || i.design_back_url;
  if (u && isImgUrl(u)) {
    const bg = dj.mode === "editor" && /^#[0-9a-f]{6}$/i.test(dj.hex || "") ? `background:${dj.hex};` : "";
    return `<div class="thumb" style="${bg}"><img src="${esc(u)}" alt="" style="max-width:100%;max-height:100%"></div>`;
  }
  if (u) return `<div class="thumb"><span class="fileext">${esc(fileExt(u))}</span></div>`;
  return `<div class="thumb">${productSVG(cat || "kaos", "#9ca3af")}</div>`;
}

// Keterangan singkat (pelanggan)
function designBadge(i) {
  if (!i.design_url && !i.design_back_url) return "";
  const sisi = i.design_url && i.design_back_url ? "depan + belakang" : i.design_back_url ? "belakang" : "depan";
  return `<br><small>${i.design_mode === "upload" ? "Desain upload sendiri" : "Dibuat di studio"} (${sisi})</small>`;
}

// Tautan unduh + catatan (admin)
function designLinks(i) {
  const dj = i.design_json || {}, up = dj.mode === "upload", out = [];
  const lk = (u, t) => `<a class="dl" href="${esc(u)}" target="_blank" rel="noopener" download>${t}</a>`;
  if (i.design_url) out.push(lk(i.design_url, up ? "Unduh file desain (depan)" : "Unduh desain siap cetak (depan)"));
  if (i.design_back_url) out.push(lk(i.design_back_url, up ? "Unduh file desain (belakang)" : "Unduh desain siap cetak (belakang)"));
  Object.entries(dj.sides || {}).forEach(([s, ls]) => (ls || []).filter(l => l.type === "image" && l.url)
    .forEach(l => out.push(lk(l.url, `Gambar asli (${s}): ${esc(l.name || "")}`))));
  let h = i.design_mode ? `<br><small>${up ? "Desain upload sendiri" : "Dibuat di studio"}</small>` : "";
  if (out.length) h += `<br><span style="display:inline-flex;gap:12px;flex-wrap:wrap">${out.join("")}</span>`;
  if (i.design_note) h += `<br><small>Catatan: ${esc(i.design_note)}</small>`;
  return h;
}
