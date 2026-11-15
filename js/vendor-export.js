// ====================================================================
// vendor-export.js - Production Tech Pack & 300 DPI Artwork Exporter
// Azka Printing Professional Apparel Customization Pipeline
// ====================================================================

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.VendorExport = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 1 cm in pixels at 300 DPI (300 / 2.54)
  const PX_PER_CM_300DPI = 300 / 2.54; // ~118.11 px/cm

  // Dimensi fisik riil standar zona sablon (cm)
  const ZONE_DIMENSIONS = {
    depan: {
      saku: { name: 'Dada Kiri / Saku', w: 10, h: 10, offsetNeck: 7 },
      std: { name: 'Tengah Dada (A4)', w: 21, h: 29.7, offsetNeck: 6 },
      besar: { name: 'Depan Penuh (A3)', w: 29.7, h: 42, offsetNeck: 5 },
      full: { name: 'Depan Oversize (A3+)', w: 32, h: 48, offsetNeck: 4 }
    },
    belakang: {
      saku: { name: 'Punggung Atas (Nape)', w: 8, h: 4, offsetNeck: 3 },
      std: { name: 'Punggung Tengah (A4)', w: 21, h: 29.7, offsetNeck: 6 },
      besar: { name: 'Punggung Penuh (A3)', w: 29.7, h: 42, offsetNeck: 6 },
      full: { name: 'Punggung Oversize (A3+)', w: 32, h: 48, offsetNeck: 5 }
    },
    lengan_kiri: {
      std: { name: 'Lengan Kiri Standar', w: 8, h: 8, offsetShoulder: 3 },
      besar: { name: 'Lengan Kiri Vertikal', w: 6, h: 22, offsetShoulder: 3 }
    },
    lengan_kanan: {
      std: { name: 'Lengan Kanan Standar', w: 8, h: 8, offsetShoulder: 3 },
      besar: { name: 'Lengan Kanan Bendera/Patch', w: 8, h: 5, offsetShoulder: 3 }
    }
  };

  class VendorExportService {
    // 1. Dapatkan dimensi cm riil untuk suatu zona
    getZoneDimension(side, areaKey = 'std') {
      const sideZones = ZONE_DIMENSIONS[side] || ZONE_DIMENSIONS.depan;
      return sideZones[areaKey] || sideZones.std || { name: side, w: 21, h: 29.7, offsetNeck: 6 };
    }

    // 2. Render Artwork Siap Cetak Skala 1:1 Resolusi 300 DPI (Transparan)
    async render300DPIArtwork(layers = [], widthCm = 21, heightCm = 29.7, shapesMap = {}) {
      const W = Math.round(widthCm * PX_PER_CM_300DPI);
      const H = Math.round(heightCm * PX_PER_CM_300DPI);

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Pastikan kanvas transparan murni
      ctx.clearRect(0, 0, W, H);

      // Preload custom web fonts jika ada layer teks
      if (document.fonts) {
        const textLayers = layers.filter((l) => l.type === 'text');
        const fontsToLoad = new Set(textLayers.map((l) => l.font || 'Poppins'));
        await Promise.all(
          [...fontsToLoad].map((font) =>
            document.fonts.load(`bold 100px "${font}"`).catch(() => {})
          )
        );
      }

      for (const l of layers) {
        ctx.save();
        const posX = l.x * W;
        const posY = l.y * H;

        ctx.translate(posX, posY);
        ctx.rotate(((l.r || 0) * Math.PI) / 180);
        if (l.flip) ctx.scale(-1, 1);
        ctx.globalAlpha = l.o ?? 1;

        if (l.type === 'text') {
          const fontSize = ((l.s || 20) / 100) * W;
          const fontName = l.font || 'Poppins';
          const isItalic = l.italic ? 'italic ' : '';
          const isBold = l.bold ? '700 ' : '400 ';
          ctx.font = `${isItalic}${isBold}${fontSize}px "${fontName}", sans-serif`;
          ctx.textBaseline = 'middle';
          ctx.textAlign = l.align || 'center';
          ctx.lineJoin = 'round';
          ctx.fillStyle = l.color || '#ffffff';

          const lines = (l.text || '').split('\n');
          const lineHeight = fontSize * 1.18;
          const maxLineWidth = Math.max(...lines.map((t) => ctx.measureText(t).width));
          const alignOffset = l.align === 'left' ? -maxLineWidth / 2 : l.align === 'right' ? maxLineWidth / 2 : 0;

          lines.forEach((t, i) => {
            const lineY = (i - (lines.length - 1) / 2) * lineHeight;
            if (l.stroke) {
              ctx.lineWidth = fontSize * 0.12;
              ctx.strokeStyle = l.strokeColor || '#000000';
              ctx.strokeText(t, alignOffset, lineY);
            }
            ctx.fillText(t, alignOffset, lineY);
          });
        } else if (l.type === 'image' || l.type === 'brush') {
          const sizeW = ((l.s || 30) / 100) * W;
          const ratio = l.ratio || (l.img ? l.img.naturalHeight / l.img.naturalWidth : 1);
          const sizeH = sizeW * ratio;

          let imageObj = l.img;
          const imgSrc = l.src || l.dataUrl;
          if (!imageObj && imgSrc) {
            imageObj = await new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = () => resolve(null);
              img.src = imgSrc;
            });
          }

          if (imageObj && imageObj.naturalWidth) {
            ctx.drawImage(imageObj, -sizeW / 2, -sizeH / 2, sizeW, sizeH);
          }
        } else if (l.type === 'shape' && shapesMap[l.shape]) {
          const sizeW = ((l.s || 30) / 100) * W;
          ctx.translate(-sizeW / 2, -sizeW / 2);
          ctx.scale(sizeW / 100, sizeW / 100);

          const pathStr = shapesMap[l.shape][1];
          const path = new Path2D(pathStr);
          if (l.fill) {
            ctx.fillStyle = l.color || '#f97316';
            ctx.fill(path);
          } else {
            ctx.strokeStyle = l.color || '#111827';
            ctx.lineWidth = 7;
            ctx.lineJoin = 'round';
            ctx.stroke(path);
          }
        }

        ctx.restore();
      }

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve({ blob, canvas, widthPx: W, heightPx: H }), 'image/png');
      });
    }

    // 3. Buat Lembar Kerja Produksi (Production Tech Pack Sheet)
    // Menghasilkan canvas resolusi tinggi A4 (2480 x 3508 piksel)
    async generateTechPackCanvas(orderData) {
      const W = 2480;
      const H = 3508;
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext('2d');

      // Background Lembar Tech Pack
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Header Brand
      ctx.fillStyle = '#1e3a1f'; // Hijau Azka Printing
      ctx.fillRect(0, 0, W, 220);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 72px "Poppins", sans-serif';
      ctx.fillText('AZKA PRINTING - PRODUCTION TECH PACK', 100, 115);

      ctx.font = '400 36px "Poppins", sans-serif';
      ctx.fillStyle = '#bbf7d0';
      ctx.fillText('LEMBAR KERJA STANDAR PRODUKSI KONVEKSI & SABLON', 100, 175);

      // Info Box Order & Vendor
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(100, 260, W - 200, 240);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.strokeRect(100, 260, W - 200, 240);

      const oNo = orderData.order_no || 'AZK-SAMPLE';
      const custName = orderData.customer_name || 'Pelanggan Azka';
      const custPhone = orderData.customer_phone || '-';
      const prodName = orderData.product_name || 'Kaos Cotton Combed 30s';
      const colorName = orderData.color || 'Hitam';
      const method = orderData.method || 'DTF (Direct to Film)';
      const totalQty = orderData.qty || 1;

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 42px "Poppins", sans-serif';
      ctx.fillText(`NO. ORDER: ${oNo}`, 140, 335);

      ctx.font = '400 34px "Poppins", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`Pelanggan: ${custName} (${custPhone})`, 140, 395);
      ctx.fillText(`Tanggal Dibuat: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`, 140, 450);

      ctx.fillText(`Produk: ${prodName}`, 1250, 335);
      ctx.fillText(`Bahan & Warna: ${colorName} (${orderData.colorHex || '#1f2937'})`, 1250, 395);
      ctx.fillText(`Metode Sablon: ${method}`, 1250, 450);

      // Tabel Ukuran & Jumlah Pcs
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 38px "Poppins", sans-serif';
      ctx.fillText('RINCIAN UKURAN & KUANTITAS POTONG / JAHIT', 100, 560);

      const sizeQty = orderData.size_qty || { M: totalQty };
      const sizes = Object.entries(sizeQty);
      const colW = (W - 200) / Math.max(sizes.length + 1, 4);

      // Header Tabel
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(100, 590, W - 200, 70);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(100, 590, W - 200, 70);

      ctx.font = '700 32px "Poppins", sans-serif';
      ctx.fillStyle = '#1e293b';

      sizes.forEach(([s], idx) => {
        ctx.fillText(`Size ${s}`, 100 + idx * colW + 40, 638);
      });
      ctx.fillText('TOTAL PCS', 100 + sizes.length * colW + 40, 638);

      // Isi Tabel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(100, 660, W - 200, 80);
      ctx.strokeRect(100, 660, W - 200, 80);

      ctx.font = '700 36px "Poppins", sans-serif';
      ctx.fillStyle = '#0f172a';
      sizes.forEach(([, q], idx) => {
        ctx.fillText(`${q} pcs`, 100 + idx * colW + 40, 715);
      });
      ctx.fillStyle = '#15803d';
      ctx.fillText(`${totalQty} PCS`, 100 + sizes.length * colW + 40, 715);

      // Area Mockup Visual 4 Sudut (Depan, Belakang, Lengan Kiri, Lengan Kanan)
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 38px "Poppins", sans-serif';
      ctx.fillText('PANDUAN POSISI & DIMENSI SABLON (TOLERANSI UKURAN FISIK)', 100, 810);

      const boxW = (W - 240) / 2;
      const boxH = 920;

      // Kotak Mockup Depan
      this.drawMockupBox(ctx, 100, 840, boxW, boxH, 'TAMPAK DEPAN', orderData.frontMockupImg, orderData.frontDims);

      // Kotak Mockup Belakang
      this.drawMockupBox(ctx, 140 + boxW, 840, boxW, boxH, 'TAMPAK BELAKANG', orderData.backMockupImg, orderData.backDims);

      // Kotak Tambahan (Lengan Kiri & Kanan jika ada)
      const subBoxW = (W - 240) / 2;
      const subBoxH = 650;
      this.drawMockupBox(
        ctx,
        100,
        1800,
        subBoxW,
        subBoxH,
        'LENGAN KIRI',
        orderData.leftSleeveMockupImg,
        orderData.leftSleeveDims
      );
      this.drawMockupBox(
        ctx,
        140 + subBoxW,
        1800,
        subBoxW,
        subBoxH,
        'LENGAN KANAN',
        orderData.rightSleeveMockupImg,
        orderData.rightSleeveDims
      );

      // Petunjuk Teknis Finishing Konveksi (QC Checklist)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(100, 2500, W - 200, 880);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(100, 2500, W - 200, 880);

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 40px "Poppins", sans-serif';
      ctx.fillText('PETUNJUK TEKNIS FINISHING & QUALITY CONTROL (QC)', 140, 2570);

      ctx.font = '400 32px "Poppins", sans-serif';
      ctx.fillStyle = '#334155';
      const instructions = [
        '1. Bahan Kain: Cotton Combed 30s Reaktif 100% Cotton, tekstur lembut, gramasi 150-160 GSM.',
        '2. Standar Jahitan: Jahit rantai pundak bis leher, overdeck 3 jarum pada keliman bawah & lengan.',
        '3. Posisi Sablon: Pastikan jarak sablon dari lingkar kerah terendah sesuai dengan garis ukur (toleransi ±0.5 cm).',
        '4. Parameter Cetak DTF: Press awal kain 160°C selama 5 detik, press transfer 160°C selama 15 detik.',
        '5. Finishing Curing: Setelah kupas film (cold/warm peel), lakukan press penutup dengan teflon 160°C selama 10 detik.',
        '6. Uji Kelenturan & Cuci: Sablon harus menyatu rata dengan serat kain, tidak retak saat ditarik normal.',
        '7. Packaging: Setrika uap rapi, pasang hangtag Azka Printing, bungkus plastik polybag bening tebal per potong.'
      ];

      instructions.forEach((ins, idx) => {
        ctx.fillText(ins, 140, 2640 + idx * 60);
      });

      // Catatan Khusus Pelanggan
      if (orderData.design_note) {
        ctx.fillStyle = '#fef2f2';
        ctx.fillRect(140, 3080, W - 280, 160);
        ctx.strokeStyle = '#fca5a5';
        ctx.strokeRect(140, 3080, W - 280, 160);

        ctx.fillStyle = '#991b1b';
        ctx.font = '700 32px "Poppins", sans-serif';
        ctx.fillText('CATATAN KHUSUS DARI PEMESAN:', 170, 3135);
        ctx.font = '400 30px "Poppins", sans-serif';
        ctx.fillText(orderData.design_note, 170, 3190);
      }

      // Footer
      ctx.font = '400 28px "Poppins", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Dokumen ini dibuat otomatis oleh Sistem Azka Printing Customizer Studio.', 100, 3440);
      ctx.fillText('Hubungi bagian produksi jika ada keraguan posisi cetak.', 1500, 3440);

      return cv;
    }

    // Helper: Menggambar kotak mockup visual dengan garis dimensi sentimeter
    drawMockupBox(ctx, x, y, w, h, title, mockupImg, dims) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Judul Box
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 32px "Poppins", sans-serif';
      ctx.fillText(title, x + 30, y + 55);

      // Gambar Mockup
      if (mockupImg) {
        const pad = 80;
        const availW = w - pad * 2;
        const availH = h - 220;
        const aspect = mockupImg.height / mockupImg.width;
        let dw = availW;
        let dh = dw * aspect;
        if (dh > availH) {
          dh = availH;
          dw = dh / aspect;
        }
        const imgX = x + (w - dw) / 2;
        const imgY = y + 80 + (availH - dh) / 2;
        ctx.drawImage(mockupImg, imgX, imgY, dw, dh);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 28px "Poppins", sans-serif';
        ctx.fillText('Tidak ada desain pada sisi ini (Polos)', x + 60, y + h / 2);
      }

      // Keterangan Dimensi & Jarak Jahitan
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + 2, y + h - 110, w - 4, 108);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(x + 2, y + h - 110, w - 4, 108);

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 28px "Poppins", sans-serif';
      if (dims) {
        ctx.fillText(`Area Cetak: ${dims.name} (${dims.w} x ${dims.h} cm)`, x + 25, y + h - 65);
        ctx.font = '400 26px "Poppins", sans-serif';
        ctx.fillStyle = '#475569';
        const offsetText = dims.offsetNeck
          ? `Jarak dari kerah: ${dims.offsetNeck} cm`
          : dims.offsetShoulder
          ? `Jarak dari jahitan bahu: ${dims.offsetShoulder} cm`
          : 'Toleransi simetris ±0.5 cm';
        ctx.fillText(offsetText, x + 25, y + h - 25);
      } else {
        ctx.fillText('Sisi ini polos (tidak ada sablon)', x + 25, y + h - 45);
      }
    }

    // 4. Unduh Bundel Lengkap Vendor (.ZIP / Multi-Download)
    async exportVendorBundle(orderData, shapesMap = {}) {
      const JSZip = window.JSZip;
      const orderNo = orderData.order_no || 'AZK-' + Date.now();
      const zip = JSZip ? new JSZip() : null;

      const results = { files: [] };

      // 1. Generate 300 DPI Transparent Artwork untuk setiap sisi yang ada layer
      const sides = ['depan', 'belakang', 'lengan_kiri', 'lengan_kanan'];
      for (const s of sides) {
        const layers = orderData.sides ? orderData.sides[s] : [];
        if (layers && layers.length > 0) {
          const dims = this.getZoneDimension(s, orderData.area);
          const artwork = await this.render300DPIArtwork(layers, dims.w, dims.h, shapesMap);
          const fileName = `print_${s}_${dims.w}x${dims.h}cm_300dpi.png`;

          results.files.push({ name: fileName, blob: artwork.blob });
          if (zip) zip.file(fileName, artwork.blob);
        }
      }

      // 2. Generate Lembar Tech Pack
      const techPackCanvas = await this.generateTechPackCanvas(orderData);
      const techPackBlob = await new Promise((res) => techPackCanvas.toBlob(res, 'image/png'));
      const techPackName = `TechPack-${orderNo}.png`;
      results.files.push({ name: techPackName, blob: techPackBlob });
      if (zip) zip.file(techPackName, techPackBlob);

      // 3. Generate Berkas Instruksi Teks
      const textInstructions = `=====================================================
LEMBAR INSTRUKSI PRODUKSI - AZKA PRINTING
=====================================================
Nomor Pesanan : ${orderData.order_no || '-'}
Nama Pemesan  : ${orderData.customer_name || '-'}
WhatsApp      : ${orderData.customer_phone || '-'}
Produk        : ${orderData.product_name || '-'}
Bahan & Warna : ${orderData.color || '-'} (${orderData.colorHex || '-'})
Metode Cetak  : ${orderData.method || '-'}
Total Pesanan : ${orderData.qty || 1} Pcs

RINCIAN UKURAN:
${Object.entries(orderData.size_qty || {})
  .map(([s, q]) => ` - Size ${s}: ${q} pcs`)
  .join('\n')}

CATATAN KHUSUS:
${orderData.design_note || 'Tidak ada catatan khusus.'}

DAFTAR BERKAS CETAK 300 DPI:
${results.files.map((f) => ` - ${f.name}`).join('\n')}
=====================================================`;

      if (zip) {
        zip.file(`instruksi_produksi_${orderNo}.txt`, textInstructions);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = `Paket_Vendor_${orderNo}.zip`;
        a.click();
      } else {
        // Fallback: Download individual files
        results.files.forEach((f) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(f.blob);
          a.download = f.name;
          a.click();
        });
      }

      return results;
    }
  }

  return new VendorExportService();
});

