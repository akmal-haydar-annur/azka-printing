// ====================================================================
// three-studio.js - 3D Mockup Studio Engine (Mockey.ai Style)
// High-performance Three.js 3D Preview (UMD Compatible / Zero-CORS)
// ====================================================================

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Studio3D = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class Studio3DEngine {
    constructor() {
      this.container = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.controls = null;
      this.tshirtGroup = null;

      // Meshes
      this.frontMesh = null;
      this.backMesh = null;
      this.leftSleeveMesh = null;
      this.rightSleeveMesh = null;
      this.neckMesh = null;

      // Materials
      this.frontMaterial = null;
      this.backMaterial = null;
      this.sleeveMaterial = null;
      this.neckMaterial = null;

      // 2D -> 3D Dynamic UV Canvas Textures
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

      // Colors & State
      this.bodyColor = '#1f2937';
      this.neckColor = '#1f2937';
      this.isAutoRotate = false;
      this.isRendering = false;
      this.renderRequested = false;
      this.initialized = false;
    }

    // 1. Inisialisasi Viewport & WebGL Scene
    init(containerEl) {
      if (this.initialized) {
        this.onResize();
        this.requestRender();
        return;
      }
      this.container = containerEl;
      if (!this.container) return;

      const THREE = window.THREE;
      if (!THREE) {
        console.error('Three.js library is not loaded on window.');
        return;
      }

      const width = Math.max(this.container.clientWidth || 0, 420);
      const height = Math.max(this.container.clientHeight || 0, 460);

      // WebGL Renderer dengan Tone Mapping & Alpha
      this.renderer = new THREE.WebGLRenderer({
        antialias: (window.devicePixelRatio || 1) < 2,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (THREE.ACESFilmicToneMapping) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
      }
      if (THREE.sRGBEncoding) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      } else if (THREE.SRGBColorSpace) {
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      }

      // Bersihkan kontainer jika ada sisa canvas sebelumnya
      const oldCanvas = this.container.querySelector('canvas');
      if (oldCanvas) oldCanvas.remove();
      this.container.appendChild(this.renderer.domElement);

      // Scene & Camera
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
      this.camera.position.set(0, 0.05, 2.5);

      // OrbitControls
      const OrbitControls = THREE.OrbitControls || window.OrbitControls;
      if (OrbitControls) {
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
        this.controls.addEventListener('change', () => this.requestRender());
      }

      // Pencahayaan Studio 3-Titik
      this.setupLighting();

      // Tekstur Normal Kain Katun Combed
      this.fabricNormalTexture = this.createFabricNormalMap();

      // Setup Dynamic Textures
      this.frontTexture = new THREE.CanvasTexture(this.frontCanvas);
      this.backTexture = new THREE.CanvasTexture(this.backCanvas);
      if (THREE.sRGBEncoding) {
        this.frontTexture.encoding = THREE.sRGBEncoding;
        this.backTexture.encoding = THREE.sRGBEncoding;
      }

      // Bangun Model 3D Kaos Lengkap (Torso Depan, Belakang, Lengan Kiri/Kanan, Kerah)
      this.build3DTShirt();

      // Resize Handler
      window.addEventListener('resize', () => this.onResize());

      this.initialized = true;
      this.requestRender();
    }

    // 2. Setup Pencahayaan Studio
    setupLighting() {
      const THREE = window.THREE;
      const ambient = new THREE.AmbientLight(0xffffff, 0.88);
      this.scene.add(ambient);

      // Key Light (Kanan Depan Atas)
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
      keyLight.position.set(2.5, 3.5, 2.8);
      this.scene.add(keyLight);

      // Fill Light (Kiri Depan)
      const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.6);
      fillLight.position.set(-2.5, 1.5, 2.0);
      this.scene.add(fillLight);

      // Rim Light (Bahu & Siluet Belakang)
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
      rimLight.position.set(0, 3.0, -2.5);
      this.scene.add(rimLight);
    }

    // 3. Tekstur Normal Serat Katun Mikro (Procedural Cross-Weave)
    createFabricNormalMap() {
      const THREE = window.THREE;
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
          idata.data[i] = 128 + nx * 32;
          idata.data[i + 1] = 128 + ny * 32;
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

    // 4. Bangun Model 3D Kaos Volumetrik (True 3D Garment)
    build3DTShirt() {
      const THREE = window.THREE;
      this.tshirtGroup = new THREE.Group();

      // Material Dada Depan (Menerima tekstur desain depan)
      this.frontMaterial = new THREE.MeshStandardMaterial({
        map: this.frontTexture,
        normalMap: this.fabricNormalTexture,
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughness: 0.88,
        metalness: 0.03,
        side: THREE.DoubleSide
      });

      // Material Punggung Belakang (Menerima tekstur desain belakang)
      this.backMaterial = new THREE.MeshStandardMaterial({
        map: this.backTexture,
        normalMap: this.fabricNormalTexture,
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughness: 0.88,
        metalness: 0.03,
        side: THREE.DoubleSide
      });

      // Material Lengan Kaos
      this.sleeveMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.bodyColor),
        normalMap: this.fabricNormalTexture,
        normalScale: new THREE.Vector2(0.4, 0.4),
        roughness: 0.88,
        metalness: 0.03,
        side: THREE.DoubleSide
      });

      // Material Kerah (Rib Neck)
      this.neckMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.neckColor),
        normalMap: this.fabricNormalTexture,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughness: 0.92,
        metalness: 0.02
      });

      // A. Panel Dada Depan (Melengkung Alami)
      const frontGeo = this.createTorsoGeometry(true);
      this.frontMesh = new THREE.Mesh(frontGeo, this.frontMaterial);
      this.tshirtGroup.add(this.frontMesh);

      // B. Panel Punggung Belakang (Di-flip 180° agar menghadap ke belakang)
      const backGeo = this.createTorsoGeometry(false);
      this.backMesh = new THREE.Mesh(backGeo, this.backMaterial);
      this.backMesh.rotation.y = Math.PI; // Hadapkan ke arah belakang
      this.tshirtGroup.add(this.backMesh);

      // C. Lengan Kiri (Volumetrik 3D Silinder Menyerong)
      const leftSleeveGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.34, 24, 8, true);
      leftSleeveGeo.rotateZ(Math.PI / 4.2);
      this.leftSleeveMesh = new THREE.Mesh(leftSleeveGeo, this.sleeveMaterial);
      this.leftSleeveMesh.position.set(-0.46, 0.22, 0.01);
      this.tshirtGroup.add(this.leftSleeveMesh);

      // D. Lengan Kanan (Volumetrik 3D Silinder Menyerong)
      const rightSleeveGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.34, 24, 8, true);
      rightSleeveGeo.rotateZ(-Math.PI / 4.2);
      this.rightSleeveMesh = new THREE.Mesh(rightSleeveGeo, this.sleeveMaterial);
      this.rightSleeveMesh.position.set(0.46, 0.22, 0.01);
      this.tshirtGroup.add(this.rightSleeveMesh);

      // E. Kerah Bulat 3D (Torus Ribbing Ring di bagian leher)
      const neckGeo = new THREE.TorusGeometry(0.18, 0.024, 16, 48);
      neckGeo.rotateX(Math.PI / 2.3);
      this.neckMesh = new THREE.Mesh(neckGeo, this.neckMaterial);
      this.neckMesh.position.set(0, 0.44, 0.0);
      this.tshirtGroup.add(this.neckMesh);

      // Posisikan seluruh kaos di tengah scene
      this.tshirtGroup.position.set(0, -0.06, 0);
      this.scene.add(this.tshirtGroup);
    }

    // Geometri Torso 3D
    createTorsoGeometry(isFront = true) {
      const THREE = window.THREE;
      const width = 0.82;
      const height = 0.98;
      const segmentsX = 36;
      const segmentsY = 36;

      const geo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = 0;

        const normY = (y + height / 2) / height; // 0 (bawah) s.d 1 (atas)
        const absX = Math.abs(x);

        // 1. Lengkungan Kedalaman Badan Torso
        const depthCurve = Math.sqrt(Math.max(0, 1 - (absX / (width * 0.58)) ** 2));
        z += depthCurve * 0.15;

        // 2. Dada & Bahu
        if (normY > 0.65) {
          const chestFactor = Math.sin((normY - 0.65) / 0.35 * Math.PI);
          if (isFront) z += chestFactor * 0.04;
          
          // Bentuk Sambungan Lengan
          const flare = (normY - 0.65) * 0.46;
          if (x > 0) x += flare;
          else x -= flare;
        }

        // 3. Potongan Kerah Leher
        if (normY > 0.82 && absX < 0.22) {
          const neckCut = Math.cos((absX / 0.22) * (Math.PI / 2));
          y -= neckCut * (isFront ? 0.09 : 0.04);
        }

        // 4. Gelombang Lipatan Kain
        const fold = Math.sin(x * 8.0 + y * 4.0) * Math.cos(y * 7.0) * 0.007;
        z += fold;

        // 5. Lekukan Pinggang Bawah
        if (normY < 0.45 && normY > 0.05) {
          const waist = Math.sin(normY / 0.45 * Math.PI) * 0.022;
          x *= (1 - waist);
        }

        pos.setXYZ(i, x, y, z);

        // UV Koordinat: Memetakan area dada secara bersih
        const u = (x / width) + 0.5;
        const v = normY;
        uv.setXY(i, u, v);
      }

      geo.computeVertexNormals();
      return geo;
    }

    // 5. Sinkronisasi Desain 2D -> 3D
    syncFromStudioState(S) {
      if (!this.initialized) return;

      this.bodyColor = S.color ? S.color.hex : '#1f2937';

      // Update warna lengan jika warna badan berubah
      if (this.sleeveMaterial) {
        this.sleeveMaterial.color.set(this.bodyColor);
      }

      this.renderDesignToCanvas('depan', S);
      this.renderDesignToCanvas('belakang', S);

      this.frontTexture.needsUpdate = true;
      this.backTexture.needsUpdate = true;
      this.requestRender();
    }

    // Render Layer Desain ke Kanvas UV
    renderDesignToCanvas(side, S) {
      const isFront = side === 'depan';
      const cvs = isFront ? this.frontCanvas : this.backCanvas;
      const ctx = isFront ? this.frontCtx : this.backCtx;
      const w = cvs.width;
      const h = cvs.height;

      // A. Latar Belakang Warna Kain Kaos
      ctx.fillStyle = this.bodyColor;
      ctx.fillRect(0, 0, w, h);

      // B. Shading Bayangan Kain Realistis
      const grad = ctx.createRadialGradient(w / 2, h * 0.4, w * 0.15, w / 2, h * 0.5, w * 0.7);
      grad.addColorStop(0, 'rgba(255,255,255,0.08)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0.0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // C. Area Cetak Dada / Punggung
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

    // 6. Ganti Warna Kerah
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
      if (this.controls) {
        this.controls.autoRotate = this.isAutoRotate;
      }
      if (this.isAutoRotate) {
        this.startContinuousRender();
      } else {
        this.stopContinuousRender();
      }
      return this.isAutoRotate;
    }

    resetCamera() {
      if (this.camera && this.controls) {
        this.camera.position.set(0, 0.05, 2.5);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        this.requestRender();
      }
    }

    zoom(direction) {
      if (this.camera && this.controls) {
        const step = direction > 0 ? 0.88 : 1.14;
        this.camera.position.multiplyScalar(step);
        this.controls.update();
        this.requestRender();
      }
    }

    // 8. Demand-Rendering Engine
    requestRender() {
      if (this.isAutoRotate) return;
      if (!this.renderRequested) {
        this.renderRequested = true;
        requestAnimationFrame(() => {
          if (this.renderer && this.scene && this.camera) {
            if (this.controls) this.controls.update();
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
        if (this.controls) this.controls.update();
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
      const width = Math.max(this.container.clientWidth || 0, 420);
      const height = Math.max(this.container.clientHeight || 0, 460);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.requestRender();
    }

    // 10. Tangkap Foto 3D
    exportSnapshot() {
      if (!this.renderer || !this.scene || !this.camera) return null;
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement.toDataURL('image/png');
    }

    // 11. Bersihkan Memori GPU
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

  return new Studio3DEngine();
});
