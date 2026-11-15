// ====================================================================
// three-studio.js - 3D Mockup Studio Engine (Mockey.ai Style)
// High-performance Three.js 3D Preview with Demand-Rendering & PBR
// ====================================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

class Studio3DEngine {
  constructor() {
    this.container = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.tshirtGroup = null;
    this.bodyMesh = null;
    this.backMesh = null;
    this.neckMesh = null;
    this.bodyMaterial = null;
    this.backMaterial = null;
    this.neckMaterial = null;
    
    // Dynamic UV Canvas Textures (Front & Back)
    this.frontCanvas = document.createElement('canvas');
    this.frontCanvas.width = 1024;
    this.frontCanvas.height = 1024;
    this.frontCtx = this.frontCanvas.getContext('2d');
    this.frontTexture = null;

    this.backCanvas = document.createElement('canvas');
    this.backCanvas.width = 1024;
    this.backCanvas.height = 1024;
    this.backCtx = this.backCanvas.getContext('2d');
    this.backTexture = null;

    this.fabricNormalTexture = null;
    
    // State & Colors
    this.bodyColor = '#1f2937';
    this.neckColor = '#1f2937';
    this.isAutoRotate = false;
    this.isRendering = false;
    this.renderRequested = false;
    this.initialized = false;
  }

  // 1. Inisialisasi Viewport & WebGL Scene
  init(containerEl) {
    if (this.initialized) return;
    this.container = containerEl;
    if (!this.container) return;

    const width = this.container.clientWidth || 440;
    const height = this.container.clientHeight || 480;

    // WebGL Renderer dengan optimasi memori & power
    this.renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 2,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // Untuk export snapshot berkualitas tinggi
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 50);
    this.camera.position.set(0, 0.1, 2.5);

    // OrbitControls dengan Damping (Inersia Halus)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.4;
    this.controls.maxDistance = 3.6;
    this.controls.minPolarAngle = Math.PI / 3.8;
    this.controls.maxPolarAngle = Math.PI / 1.7; // Cegah kaos terbalik
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 1.8;

    // Demand-Rendering: Hanya render saat kamera digerakkan atau scene berubah!
    this.controls.addEventListener('change', () => this.requestRender());

    // Pencahayaan 3-Titik Studio Fotografi
    this.setupLighting();

    // Buat Tekstur Normal Kain Katun Combed Mikro
    this.fabricNormalTexture = this.createFabricNormalMap();

    // Setup Dynamic Canvas Texture
    this.frontTexture = new THREE.CanvasTexture(this.frontCanvas);
    this.frontTexture.colorSpace = THREE.SRGBColorSpace;
    this.frontTexture.anisotropy = 4;

    this.backTexture = new THREE.CanvasTexture(this.backCanvas);
    this.backTexture.colorSpace = THREE.SRGBColorSpace;
    this.backTexture.anisotropy = 4;

    // Bangun Model 3D Kaos Realistis
    this.build3DTShirt();

    // Resize Handler
    window.addEventListener('resize', () => this.onResize());

    this.initialized = true;
    this.requestRender();
  }

  // 2. Setup Pencahayaan Studio
  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambient);

    // Key Light (Kanan Depan Atas)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(2.5, 3.5, 2.8);
    this.scene.add(keyLight);

    // Fill Light (Kiri Depan)
    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.55);
    fillLight.position.set(-2.5, 1.5, 2);
    this.scene.add(fillLight);

    // Rim / Back Light (Aksen Tepi Bahu & Siluet)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.65);
    rimLight.position.set(0, 3, -2.5);
    this.scene.add(rimLight);
  }

  // 3. Tekstur Normal Map Serat Kain Katun (Procedural Micro-Weave)
  createFabricNormalMap() {
    const cvs = document.createElement('canvas');
    cvs.width = 128;
    cvs.height = 128;
    const ctx = cvs.getContext('2d');
    const idata = ctx.createImageData(128, 128);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const i = (y * 128 + x) * 4;
        const nx = Math.sin(x * 0.8) * Math.cos(y * 0.8);
        const ny = Math.cos(x * 0.8) * Math.sin(y * 0.8);
        idata.data[i] = 128 + nx * 35;
        idata.data[i + 1] = 128 + ny * 35;
        idata.data[i + 2] = 245;
        idata.data[i + 3] = 255;
      }
    }
    ctx.putImageData(idata, 0, 0);
    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    return tex;
  }

  // 4. Bangun Geometri & Material 3D Kaos Combed Realistis
  build3DTShirt() {
    this.tshirtGroup = new THREE.Group();

    // Material Badan Kaos (PBR dengan roughness kain katun asli)
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      map: this.frontTexture,
      normalMap: this.fabricNormalTexture,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.88,
      metalness: 0.04,
      side: THREE.FrontSide
    });

    // Material Belakang Kaos
    this.backMaterial = new THREE.MeshStandardMaterial({
      map: this.backTexture,
      normalMap: this.fabricNormalTexture,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.88,
      metalness: 0.04,
      side: THREE.FrontSide
    });

    // Material Kerah (Ribbed Collar)
    this.neckMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.neckColor),
      normalMap: this.fabricNormalTexture,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 0.92,
      metalness: 0.02
    });

    // A. Panel Depan Torso + Lengan (Curved Body with Fabric Draping)
    const frontGeo = this.createTorsoGeometry(true);
    this.bodyMesh = new THREE.Mesh(frontGeo, this.bodyMaterial);
    this.tshirtGroup.add(this.bodyMesh);

    // B. Panel Belakang Torso + Lengan
    const backGeo = this.createTorsoGeometry(false);
    this.backMesh = new THREE.Mesh(backGeo, this.backMaterial);
    this.tshirtGroup.add(this.backMesh);

    // C. Kerah Bulat 3D (Torus Ribbing Ring)
    const neckGeo = new THREE.TorusGeometry(0.18, 0.022, 16, 48);
    neckGeo.rotateX(Math.PI / 2.3);
    this.neckMesh = new THREE.Mesh(neckGeo, this.neckMaterial);
    this.neckMesh.position.set(0, 0.44, -0.01);
    this.tshirtGroup.add(this.neckMesh);

    // Posisi dan skala grup
    this.tshirtGroup.position.set(0, -0.08, 0);
    this.scene.add(this.tshirtGroup);
  }

  // Geometri Torso & Lengan Kaos dengan Lipatan Alami & UV Bersih
  createTorsoGeometry(isFront = true) {
    const zDir = isFront ? 1 : -1;
    const width = 0.82;
    const height = 0.98;
    const segmentsX = 40;
    const segmentsY = 40;

    const geo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = 0;

      const normY = (y + height / 2) / height; // 0.0 (bawah) s.d 1.0 (atas)
      const absX = Math.abs(x);

      // 1. Lengkungan Torso 3D (Cylinder-like Body Depth)
      const depthCurve = Math.sqrt(Math.max(0, 1 - (absX / (width * 0.58)) ** 2));
      z += depthCurve * 0.16 * zDir;

      // 2. Dada Atas & Bahu (Shoulder & Chest Puff)
      if (normY > 0.65) {
        const chestFactor = Math.sin((normY - 0.65) / 0.35 * Math.PI);
        if (isFront) z += chestFactor * 0.045; // Dada lebih menonjol di depan
        
        // Bentuk Lengan Mengembang ke Samping
        const sleeveFlare = (normY - 0.65) * 0.48;
        if (x > 0) x += sleeveFlare;
        else x -= sleeveFlare;
      }

      // 3. Potongan Leher / Kerah Kaos
      if (normY > 0.82 && absX < 0.22) {
        const neckCut = Math.cos((absX / 0.22) * (Math.PI / 2));
        y -= neckCut * (isFront ? 0.09 : 0.04);
      }

      // 4. Lipatan Kain Halus (Natural Fabric Wrinkles & Folds)
      const foldWave = Math.sin(x * 9.0 + y * 4.0) * Math.cos(y * 8.0) * 0.007;
      z += foldWave;

      // 5. Pinggang / Waist Fit
      if (normY < 0.45 && normY > 0.05) {
        const waistCurve = Math.sin(normY / 0.45 * Math.PI) * 0.025;
        x *= (1 - waistCurve);
      }

      pos.setXYZ(i, x, y, z);

      // Pemetaan UV: Memetakan bidang dada/punggung secara simetris
      let u = (x / width) + 0.5;
      let v = normY;
      if (!isFront) u = 1 - u; // Mirror UV untuk punggung
      uv.setXY(i, u, v);
    }

    geo.computeVertexNormals();
    return geo;
  }

  // 5. Update Desain Real-Time dari Studio 2D ke Tekstur 3D
  syncFromStudioState(S) {
    if (!this.initialized) return;

    this.bodyColor = S.color ? S.color.hex : '#1f2937';
    this.renderDesignToCanvas('depan', S);
    this.renderDesignToCanvas('belakang', S);

    this.frontTexture.needsUpdate = true;
    this.backTexture.needsUpdate = true;
    this.requestRender();
  }

  // Render Layer 2D (Teks, Gambar, Bentuk, Upload) ke Buffer Canvas UV
  renderDesignToCanvas(side, S) {
    const isFront = side === 'depan';
    const cvs = isFront ? this.frontCanvas : this.backCanvas;
    const ctx = isFront ? this.frontCtx : this.backCtx;
    const w = cvs.width;
    const h = cvs.height;

    // A. Latar Belakang Warna Kain Kaos
    ctx.fillStyle = this.bodyColor;
    ctx.fillRect(0, 0, w, h);

    // B. Shading Bayangan Kain Realistis (Ambient Occlusion Overlay)
    const grad = ctx.createRadialGradient(w / 2, h * 0.4, w * 0.15, w / 2, h * 0.5, w * 0.7);
    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // C. Area Cetak Dada / Punggung (Bounding Box UV Kaos)
    // Area dada Kaos terpetakan di tengah kanvas UV: X 260..764, Y 320..780
    const aDef = S.areaDef ? S.areaDef() : ['std', 'Standar', 33, 30, 34, 34];
    const printLeft = w * 0.28;
    const printTop = h * 0.32;
    const printW = w * 0.44;
    const printH = h * 0.46;

    ctx.save();

    if (S.mode === 'editor') {
      const layers = S.sides && S.sides[side] ? S.sides[side] : [];
      layers.forEach(l => {
        ctx.save();
        const posX = printLeft + l.x * printW;
        const posY = printTop + l.y * printH;

        ctx.translate(posX, posY);
        ctx.rotate((l.r || 0) * Math.PI / 180);
        if (l.flip) ctx.scale(-1, 1);
        ctx.globalAlpha = l.o ?? 1;

        const baseSize = (l.s || 20) * (printW / 100);

        if (l.type === 'text') {
          ctx.font = `${l.italic ? 'italic ' : ''}${l.bold ? '700 ' : '400 '}${baseSize * 1.8}px '${l.font || 'Poppins'}', sans-serif`;
          ctx.textAlign = l.align || 'center';
          ctx.textBaseline = 'middle';

          if (l.stroke) {
            ctx.lineWidth = baseSize * 0.18;
            ctx.strokeStyle = l.strokeColor || '#000000';
            ctx.strokeText(l.text || '', 0, 0);
          }
          ctx.fillStyle = l.color || '#ffffff';
          ctx.fillText(l.text || '', 0, 0);

        } else if (l.type === 'image' && l.src) {
          const img = new Image();
          img.src = l.src;
          if (img.complete && img.naturalWidth) {
            const aspect = img.naturalHeight / img.naturalWidth;
            const iw = baseSize * 2.2;
            const ih = iw * aspect;
            ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
          }
        }
        ctx.restore();
      });

    } else if (S.mode === 'upload') {
      const u = S.up && S.up[side];
      if (u && u.isImg && u.url) {
        const img = new Image();
        img.src = u.url;
        if (img.complete && img.naturalWidth) {
          const maxDim = Math.min(printW * 0.95, printH * 0.95);
          const aspect = img.naturalHeight / img.naturalWidth;
          let dw = maxDim, dh = maxDim * aspect;
          if (dh > maxDim) { dh = maxDim; dw = dh / aspect; }
          ctx.drawImage(img, printLeft + (printW - dw) / 2, printTop + (printH - dh) / 2, dw, dh);
        }
      }
    }

    ctx.restore();
  }

  // 6. Ganti Warna Kerah (Multi-Part Color Customizer)
  setNeckColor(hex) {
    this.neckColor = hex;
    if (this.neckMaterial) {
      this.neckMaterial.color.set(hex);
      this.requestRender();
    }
  }

  // 7. Kontrol Kamera: Auto-Rotate, Reset & Zoom
  toggleAutoRotate(force) {
    this.isAutoRotate = typeof force === 'boolean' ? force : !this.isAutoRotate;
    this.controls.autoRotate = this.isAutoRotate;
    if (this.isAutoRotate) {
      this.startContinuousRender();
    } else {
      this.stopContinuousRender();
    }
    return this.isAutoRotate;
  }

  resetCamera() {
    this.camera.position.set(0, 0.1, 2.5);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.requestRender();
  }

  zoom(direction) {
    const step = direction > 0 ? 0.88 : 1.14;
    this.camera.position.multiplyScalar(step);
    this.controls.update();
    this.requestRender();
  }

  // 8. Demand-Rendering Engine (Hemat Baterai & Nol Beban GPU saat Idle)
  requestRender() {
    if (this.isAutoRotate) return; // Dalam mode rotasi otomatis sudah ditangani loop
    if (!this.renderRequested) {
      this.renderRequested = true;
      requestAnimationFrame(() => {
        if (this.renderer && this.scene && this.camera) {
          this.controls.update();
          this.renderer.render(this.scene, this.camera);
        }
        this.renderRequested = false;
      });
    }
  }

  startContinuousRender() {
    if (this.isRendering) return;
    this.isRendering = true;
    const loop = () => {
      if (!this.isRendering) return;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stopContinuousRender() {
    this.isRendering = false;
    this.requestRender();
  }

  // 9. Resize Handler
  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 440;
    const height = this.container.clientHeight || 480;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.requestRender();
  }

  // 10. Tangkap Foto 3D Resolusi Tinggi (Export Snapshot)
  exportSnapshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  // 11. Bersihkan Memori GPU (Prevent Mobile Memory Leak)
  dispose() {
    this.stopContinuousRender();
    if (this.tshirtGroup) {
      this.tshirtGroup.traverse(child => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        }
      });
    }
    if (this.frontTexture) this.frontTexture.dispose();
    if (this.backTexture) this.backTexture.dispose();
    if (this.fabricNormalTexture) this.fabricNormalTexture.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    this.initialized = false;
  }
}

// Export singleton instance ke window
window.Studio3D = new Studio3DEngine();
