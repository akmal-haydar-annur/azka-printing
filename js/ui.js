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

// Gambar produk (SVG Realistis Apple-Grade & Pola Potong Apparel Terpisah)
function productSVG(category, color = "#1f2937", side = "assembled") {
  const c = color || "#1f2937";

  // Pola Potong Terpisah untuk Apparel (Kaos & Hoodie Sublimasi)
  const patternPieces = {
    depan: `
      <defs>
        <pattern id="cutGridDepan" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(0,0,0,.035)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="200" height="220" fill="#f8fafc"/>
      <rect width="200" height="220" fill="url(#cutGridDepan)"/>

      <!-- Pola Potong Badan Depan (Lekukan Leher Lebih Dalam / Scoop Neck) -->
      <path d="M 72 26 Q 100 66 128 26 L 158 32 Q 152 64 154 90 L 156 208 L 44 208 L 46 90 Q 48 64 42 32 Z" fill="${c}" stroke="rgba(0,0,0,.28)" stroke-width="1.5" stroke-linejoin="round"/>

      <!-- Garis Panduan Kampuh Jahit 1cm (Dashed Seam Allowance) -->
      <path d="M 74 30 Q 100 68 126 30 L 154 36 Q 148 64 150 90 L 152 204 L 48 204 L 50 90 Q 52 64 46 36 Z" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="1" stroke-dasharray="2.5,2.5"/>

      <!-- Detail Lipatan Kelim Bawah (Bottom Hem Stitch) -->
      <line x1="46" y1="202" x2="154" y2="202" stroke="rgba(0,0,0,.22)" stroke-width="1.2" stroke-dasharray="3,2"/>
      <line x1="46" y1="205" x2="154" y2="205" stroke="rgba(0,0,0,.15)" stroke-width="1" stroke-dasharray="3,2"/>

      <!-- Garis Arah Serat Kain (Grainline Arrow) -->
      <path d="M 100 85 L 100 175 M 97 90 L 100 85 L 103 90 M 97 170 L 100 175 L 103 170" stroke="rgba(255,255,255,.45)" stroke-width="1.2" fill="none"/>
      
      <!-- Label Bagian Pola -->
      <text x="100" y="80" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="7" font-weight="700" letter-spacing="1" fill="rgba(255,255,255,.7)">BADAN DEPAN</text>
      <text x="100" y="190" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,.45)">POTONG 1x &bull; SUBLIMASI</text>
    `,
    belakang: `
      <defs>
        <pattern id="cutGridBelakang" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(0,0,0,.035)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="200" height="220" fill="#f8fafc"/>
      <rect width="200" height="220" fill="url(#cutGridBelakang)"/>

      <!-- Pola Potong Badan Belakang (Lekukan Leher Dangkal / Kerung Tinggi) -->
      <path d="M 72 26 Q 100 38 128 26 L 158 32 Q 152 64 154 90 L 156 208 L 44 208 L 46 90 Q 48 64 42 32 Z" fill="${c}" stroke="rgba(0,0,0,.28)" stroke-width="1.5" stroke-linejoin="round"/>

      <!-- Garis Panduan Kampuh Jahit (Seam Allowance) -->
      <path d="M 74 29 Q 100 40 126 29 L 154 35 Q 148 64 150 90 L 152 204 L 48 204 L 50 90 Q 52 64 46 35 Z" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="1" stroke-dasharray="2.5,2.5"/>

      <!-- Bottom Hem Stitch -->
      <line x1="46" y1="202" x2="154" y2="202" stroke="rgba(0,0,0,.22)" stroke-width="1.2" stroke-dasharray="3,2"/>
      <line x1="46" y1="205" x2="154" y2="205" stroke="rgba(0,0,0,.15)" stroke-width="1" stroke-dasharray="3,2"/>

      <!-- Grainline Arrow -->
      <path d="M 100 65 L 100 175 M 97 70 L 100 65 L 103 70 M 97 170 L 100 175 L 103 170" stroke="rgba(255,255,255,.45)" stroke-width="1.2" fill="none"/>

      <!-- Label Bagian Pola -->
      <text x="100" y="60" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="7" font-weight="700" letter-spacing="1" fill="rgba(255,255,255,.7)">BADAN BELAKANG</text>
      <text x="100" y="190" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,.45)">POTONG 1x &bull; SUBLIMASI</text>
    `,
    lengan_kiri: `
      <defs>
        <pattern id="cutGridLk" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(0,0,0,.035)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="200" height="220" fill="#f8fafc"/>
      <rect width="200" height="220" fill="url(#cutGridLk)"/>

      <!-- Pola Potong Lengan Kiri (Bentuk Lonceng / Bell-Shaped Sleeve Cap) -->
      <path d="M 24 116 C 36 82 66 38 100 38 C 134 38 164 82 176 116 L 158 202 Q 100 206 42 202 Z" fill="${c}" stroke="rgba(0,0,0,.28)" stroke-width="1.5" stroke-linejoin="round"/>

      <!-- Seam allowance guide -->
      <path d="M 28 116 C 38 85 68 43 100 43 C 132 43 162 85 172 116 L 154 198 Q 100 202 46 198 Z" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="1" stroke-dasharray="2.5,2.5"/>

      <!-- Cuff Hem Stitch -->
      <line x1="44" y1="196" x2="156" y2="196" stroke="rgba(0,0,0,.22)" stroke-width="1.2" stroke-dasharray="3,2"/>
      <line x1="43" y1="199" x2="157" y2="199" stroke="rgba(0,0,0,.15)" stroke-width="1" stroke-dasharray="3,2"/>

      <!-- Notches Titik Jahit Lengan -->
      <line x1="44" y1="68" x2="38" y2="64" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/>
      <line x1="48" y1="72" x2="42" y2="68" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/>
      <line x1="156" y1="68" x2="162" y2="64" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/>

      <!-- Grainline Arrow -->
      <path d="M 100 80 L 100 170 M 97 85 L 100 80 L 103 85 M 97 165 L 100 170 L 103 165" stroke="rgba(255,255,255,.45)" stroke-width="1.2" fill="none"/>
      
      <text x="100" y="75" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="7" font-weight="700" letter-spacing="1" fill="rgba(255,255,255,.7)">LENGAN KIRI</text>
      <text x="100" y="184" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,.45)">POTONG 1x &bull; SUBLIMASI</text>
    `,
    lengan_kanan: `
      <defs>
        <pattern id="cutGridLkn" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(0,0,0,.035)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="200" height="220" fill="#f8fafc"/>
      <rect width="200" height="220" fill="url(#cutGridLkn)"/>

      <!-- Pola Potong Lengan Kanan (Bentuk Lonceng / Bell-Shaped Mirrored) -->
      <path d="M 24 116 C 36 82 66 38 100 38 C 134 38 164 82 176 116 L 158 202 Q 100 206 42 202 Z" fill="${c}" stroke="rgba(0,0,0,.28)" stroke-width="1.5" stroke-linejoin="round"/>

      <path d="M 28 116 C 38 85 68 43 100 43 C 132 43 162 85 172 116 L 154 198 Q 100 202 46 198 Z" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="1" stroke-dasharray="2.5,2.5"/>

      <line x1="44" y1="196" x2="156" y2="196" stroke="rgba(0,0,0,.22)" stroke-width="1.2" stroke-dasharray="3,2"/>
      <line x1="43" y1="199" x2="157" y2="199" stroke="rgba(0,0,0,.15)" stroke-width="1" stroke-dasharray="3,2"/>

      <!-- Notches Mirrored -->
      <line x1="44" y1="68" x2="38" y2="64" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/>
      <line x1="152" y1="72" x2="158" y2="68" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/>
      <line x1="156" y1="68" x2="162" y2="64" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/>

      <!-- Grainline Arrow -->
      <path d="M 100 80 L 100 170 M 97 85 L 100 80 L 103 85 M 97 165 L 100 170 L 103 165" stroke="rgba(255,255,255,.45)" stroke-width="1.2" fill="none"/>

      <text x="100" y="75" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="7" font-weight="700" letter-spacing="1" fill="rgba(255,255,255,.7)">LENGAN KANAN</text>
      <text x="100" y="184" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,.45)">POTONG 1x &bull; SUBLIMASI</text>
    `,
    kerah: `
      <defs>
        <pattern id="cutGridKerah" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(0,0,0,.035)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="200" height="220" fill="#f8fafc"/>
      <rect width="200" height="220" fill="url(#cutGridKerah)"/>

      <!-- Pola Kerah / Rib Leher Strip -->
      <rect x="20" y="72" width="160" height="76" rx="3" fill="${c}" stroke="rgba(0,0,0,.28)" stroke-width="1.5"/>

      <!-- Garis Lipat Tengah (Fold Line) -->
      <line x1="20" y1="110" x2="180" y2="110" stroke="rgba(255,255,255,.6)" stroke-width="1.2" stroke-dasharray="4,3"/>

      <!-- Tekstur Rajut Rib Vertikal -->
      <g stroke="rgba(0,0,0,.08)" stroke-width="1">
        <line x1="32" y1="72" x2="32" y2="148"/>
        <line x1="44" y1="72" x2="44" y2="148"/>
        <line x1="56" y1="72" x2="56" y2="148"/>
        <line x1="68" y1="72" x2="68" y2="148"/>
        <line x1="80" y1="72" x2="80" y2="148"/>
        <line x1="92" y1="72" x2="92" y2="148"/>
        <line x1="104" y1="72" x2="104" y2="148"/>
        <line x1="116" y1="72" x2="116" y2="148"/>
        <line x1="128" y1="72" x2="128" y2="148"/>
        <line x1="140" y1="72" x2="140" y2="148"/>
        <line x1="152" y1="72" x2="152" y2="148"/>
        <line x1="164" y1="72" x2="164" y2="148"/>
      </g>

      <!-- Panah Tarikan Melar (Stretch Direction) -->
      <path d="M 40 92 L 160 92 M 46 89 L 40 92 L 46 95 M 154 89 L 160 92 L 154 95" stroke="rgba(255,255,255,.65)" stroke-width="1.2" fill="none"/>
      
      <text x="100" y="88" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="6.5" font-weight="700" letter-spacing="1" fill="rgba(255,255,255,.85)">ARAH REGANGAN (STRETCH)</text>
      <text x="100" y="125" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="7" font-weight="700" letter-spacing="1" fill="rgba(255,255,255,.85)">GARIS LIPAT TENGAH (FOLD)</text>
      <text x="100" y="138" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,.5)">KERAH RIB &bull; POTONG 1x (45 x 4 cm)</text>
    `
  };

  // Jika produk apparel dan sisi pola terpisah diminta
  if ((category === "kaos" || category === "hoodie") && patternPieces[side]) {
    return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" role="img">${patternPieces[side]}</svg>`;
  }

  // Tampilan Produk Jadi (Assembled Mockup) - Untuk Katalog, Pesanan & Admin
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

// Render Seluruh 5 Bagian Pola Potong dalam Satu Lembar Kerja (Layout Sheet persis Gambar Referensi)
function allPatternPiecesSVG(color = "#1f2937", sidesContent = {}) {
  const c = color || "#1f2937";
  return `
    <svg viewBox="0 0 460 480" xmlns="http://www.w3.org/2000/svg" role="img" class="pola-utuh-svg" style="width:100%;height:auto;max-height:75vh;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.08);background:#e2e8f0;">
      <!-- Background Meja Potong Industri -->
      <defs>
        <pattern id="masterCutGrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(0,0,0,.04)" stroke-width="0.7"/>
        </pattern>
      </defs>
      <rect width="460" height="480" fill="#e2e8f0"/>
      <rect width="460" height="480" fill="url(#masterCutGrid)"/>

      <!-- Header Spesifikasi Produksi Sublimasi Kaos Olahraga -->
      <rect x="16" y="14" width="428" height="28" rx="4" fill="#0f172a"/>
      <text x="30" y="32" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="10.5" font-weight="800" fill="#ffffff" letter-spacing="1">/// SPORTS T-SHIRT FOR MEN /// LEMBAR POLA POTONG UTUH</text>
      <rect x="385" y="18" width="50" height="20" rx="3" fill="#eab308"/>
      <text x="410" y="32" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="9" font-weight="900" fill="#0f172a">SIZE M</text>

      <!-- 1. Lengan Kiri (Kiri Atas) -->
      <g class="pola-piece-group" data-side="lengan_kiri" transform="translate(24, 52) scale(0.82)" style="cursor:pointer;">
        <path d="M 24 116 C 36 82 66 38 100 38 C 134 38 164 82 176 116 L 158 202 Q 100 206 42 202 Z" fill="${c}" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M 28 116 C 38 85 68 43 100 43 C 132 43 162 85 172 116 L 154 198 Q 100 202 46 198 Z" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1" stroke-dasharray="2,2"/>
        <line x1="44" y1="196" x2="156" y2="196" stroke="rgba(0,0,0,.25)" stroke-width="1" stroke-dasharray="3,2"/>
        <text x="100" y="125" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="9.5" font-weight="700" fill="rgba(255,255,255,.85)" letter-spacing="0.5">LENGAN KIRI</text>
        <text x="100" y="142" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="7" font-weight="600" fill="rgba(255,255,255,.5)">POTONG 1x &bull; KLIK EDIT</text>
      </g>

      <!-- 2. Kerah / Rib Leher (Tengah Vertikal Persis Gambar Referensi) -->
      <g class="pola-piece-group" data-side="kerah" transform="translate(216, 52)" style="cursor:pointer;">
        <rect x="0" y="0" width="28" height="175" rx="3" fill="${c}" stroke="#0f172a" stroke-width="1.8"/>
        <line x1="14" y1="0" x2="14" y2="175" stroke="rgba(255,255,255,.55)" stroke-width="1.2" stroke-dasharray="4,3"/>
        <g stroke="rgba(0,0,0,.1)" stroke-width="1">
          <line x1="0" y1="25" x2="28" y2="25"/>
          <line x1="0" y1="50" x2="28" y2="50"/>
          <line x1="0" y1="75" x2="28" y2="75"/>
          <line x1="0" y1="100" x2="28" y2="100"/>
          <line x1="0" y1="125" x2="28" y2="125"/>
          <line x1="0" y1="150" x2="28" y2="150"/>
        </g>
        <text x="14" y="88" transform="rotate(-90 14 88)" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="7.5" font-weight="700" fill="rgba(255,255,255,.85)" letter-spacing="0.8">KERAH / RIB LEHER</text>
      </g>

      <!-- 3. Lengan Kanan (Kanan Atas) -->
      <g class="pola-piece-group" data-side="lengan_kanan" transform="translate(268, 52) scale(0.82)" style="cursor:pointer;">
        <path d="M 24 116 C 36 82 66 38 100 38 C 134 38 164 82 176 116 L 158 202 Q 100 206 42 202 Z" fill="${c}" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M 28 116 C 38 85 68 43 100 43 C 132 43 162 85 172 116 L 154 198 Q 100 202 46 198 Z" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1" stroke-dasharray="2,2"/>
        <line x1="44" y1="196" x2="156" y2="196" stroke="rgba(0,0,0,.25)" stroke-width="1" stroke-dasharray="3,2"/>
        <text x="100" y="125" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="9.5" font-weight="700" fill="rgba(255,255,255,.85)" letter-spacing="0.5">LENGAN KANAN</text>
        <text x="100" y="142" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="7" font-weight="600" fill="rgba(255,255,255,.5)">POTONG 1x &bull; KLIK EDIT</text>
      </g>

      <!-- 4. Badan Depan (Kiri Bawah) -->
      <g class="pola-piece-group" data-side="depan" transform="translate(18, 235) scale(0.96)" style="cursor:pointer;">
        <path d="M 72 26 Q 100 66 128 26 L 158 32 Q 152 64 154 90 L 156 208 L 44 208 L 46 90 Q 48 64 42 32 Z" fill="${c}" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M 74 30 Q 100 68 126 30 L 154 36 Q 148 64 150 90 L 152 204 L 48 204 L 50 90 Q 52 64 46 36 Z" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1" stroke-dasharray="2,2"/>
        <line x1="46" y1="202" x2="154" y2="202" stroke="rgba(0,0,0,.25)" stroke-width="1" stroke-dasharray="3,2"/>
        <text x="100" y="115" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="10" font-weight="800" fill="rgba(255,255,255,.9)" letter-spacing="0.5">BADAN DEPAN</text>
        <text x="100" y="132" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="7.5" font-weight="600" fill="rgba(255,255,255,.55)">LEHER DALAM &bull; KLIK EDIT</text>
      </g>

      <!-- 5. Badan Belakang (Kanan Bawah) -->
      <g class="pola-piece-group" data-side="belakang" transform="translate(232, 235) scale(0.96)" style="cursor:pointer;">
        <path d="M 72 26 Q 100 38 128 26 L 158 32 Q 152 64 154 90 L 156 208 L 44 208 L 46 90 Q 48 64 42 32 Z" fill="${c}" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M 74 29 Q 100 40 126 29 L 154 35 Q 148 64 150 90 L 152 204 L 48 204 L 50 90 Q 52 64 46 35 Z" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1" stroke-dasharray="2,2"/>
        <line x1="46" y1="202" x2="154" y2="202" stroke="rgba(0,0,0,.25)" stroke-width="1" stroke-dasharray="3,2"/>
        <text x="100" y="115" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="10" font-weight="800" fill="rgba(255,255,255,.9)" letter-spacing="0.5">BADAN BELAKANG</text>
        <text x="100" y="132" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="7.5" font-weight="600" fill="rgba(255,255,255,.55)">LEHER DANGKAL &bull; KLIK EDIT</text>
      </g>

      <!-- Footer Info -->
      <text x="230" y="468" text-anchor="middle" font-family="-apple-system,sans-serif" font-size="7.5" font-weight="600" fill="#64748b">AZKA PRINTING &bull; SUB-ZERO PATTERN CUTTING SPECIFICATION &bull; KLIK BAGIAN MANAPUN UNTUK MENGEDIT</text>
    </svg>
  `;
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
  if (i.design_url) out.push(lk(i.design_url, up ? "File Desain (Depan)" : "Desain Siap Cetak (Depan)"));
  if (i.design_back_url) out.push(lk(i.design_back_url, up ? "File Desain (Belakang)" : "Desain Siap Cetak (Belakang)"));
  Object.entries(dj.sides || {}).forEach(([s, ls]) => {
    const sideName = s === "depan" ? "Depan" : s === "belakang" ? "Belakang" : s === "lengan_kiri" ? "Lengan Kiri" : s === "lengan_kanan" ? "Lengan Kanan" : s;
    (ls || []).filter(l => l.type === "image" && l.url)
      .forEach(l => out.push(lk(l.url, `Gambar asli (${sideName}): ${esc(l.name || "")}`)));
  });
  let h = i.design_mode ? `<br><small>${up ? "Desain upload sendiri" : "Dibuat di studio"}</small>` : "";
  if (out.length) h += `<br><span style="display:inline-flex;gap:12px;flex-wrap:wrap">${out.join("")}</span>`;
  if (i.design_note) h += `<br><small>Catatan: ${esc(i.design_note)}</small>`;
  return h;
}
