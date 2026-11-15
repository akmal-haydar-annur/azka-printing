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
        <img class="logo-img" src="assets/azka-printing-logo.jpeg" alt="Logo" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'">
        <span class="logo-dot" style="display:none"></span>
        <span class="logo-text">Azka Printing</span>
      </a>
      <nav>${links.map(([h, k, t]) => `<a href="${h}" class="${k === active ? "on" : ""}">${t}</a>`).join("")}</nav>
    </div>`;
}

function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

// Gambar produk (SVG sederhana) berwarna sesuai pilihan warna
function productSVG(category, color = "#1f2937") {
  const line = 'stroke="rgba(0,0,0,.25)" stroke-width="2" stroke-linejoin="round"';
  const shapes = {
    kaos: `<path d="M70 20 L40 35 L10 75 L38 95 L55 80 L55 200 L145 200 L145 80 L162 95 L190 75 L160 35 L130 20 Q100 42 70 20Z" fill="${color}" ${line}/>`,
    hoodie: `<path d="M68 28 L36 42 L8 90 L36 108 L54 92 L54 205 L146 205 L146 92 L164 108 L192 90 L164 42 L132 28 Q100 8 68 28Z" fill="${color}" ${line}/>
             <path d="M72 30 Q100 70 128 30 Q100 12 72 30Z" fill="rgba(0,0,0,.18)"/>
             <rect x="72" y="160" width="56" height="30" rx="6" fill="rgba(0,0,0,.1)"/>`,
    mug: `<rect x="45" y="50" width="90" height="110" rx="10" fill="${color}" ${line}/>
          <path d="M135 75 Q175 75 175 105 Q175 135 135 135" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="10"/>`,
    totebag: `<path d="M70 70 Q70 20 100 20 Q130 20 130 70" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="6"/>
              <path d="M40 70 H160 L170 205 H30Z" fill="${color}" ${line}/>`,
    akrilik: `<circle cx="100" cy="35" r="14" fill="none" stroke="#9ca3af" stroke-width="5"/>
              <rect x="55" y="55" width="90" height="120" rx="22" fill="${color}" fill-opacity=".75" ${line}/>`
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
