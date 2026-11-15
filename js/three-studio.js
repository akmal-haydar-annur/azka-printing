// ====================================================================
// three-studio.js - 3D Mockup Studio Engine (Mockey.ai Style)
// Authentic Open-Source 3D T-Shirt GLTF Model + Decal Projection Engine
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
      this.shirtMesh = null;
      this.decalMesh = null;
      this.decalMaterial = null;

      // 2D -> 3D Dynamic Design Canvas Texture
      this.frontCanvas = document.createElement('canvas');
      this.frontCanvas.width = 1024;
      this.frontCanvas.height = 1024;
      this.frontCtx = this.frontCanvas.getContext('2d');
      this.frontTexture = null;

      // State & Colors
      this.bodyColor = '#1f2937';
      this.isAutoRotate = false;
      this.isRendering = false;
      this.renderRequested = false;
      this.initialized = false;
      this.modelLoaded = false;
      this.cachedStudioState = null;
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

      // Scene & Camera (Sudut pandang flattering produk)
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
      this.camera.position.set(0, 0.0, 2.45);

      // OrbitControls dengan Damping Inersia Halus
      const OrbitControls = THREE.OrbitControls || window.OrbitControls;
      if (OrbitControls) {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.06;
        this.controls.enablePan = false;
        this.controls.minDistance = 1.3;
        this.controls.maxDistance = 3.5;
        this.controls.minPolarAngle = Math.PI / 4.2;
        this.controls.maxPolarAngle = Math.PI / 1.75; // Cegah kaos terbalik
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 1.8;
        this.controls.addEventListener('change', () => this.requestRender());
      }

      // Pencahayaan 3-Titik Studio Fotografi
      this.setupLighting();

      // Dynamic Design Canvas Texture
      this.frontTexture = new THREE.CanvasTexture(this.frontCanvas);
      if (THREE.sRGBEncoding) {
        this.frontTexture.encoding = THREE.sRGBEncoding;
      }
      this.frontTexture.anisotropy = 8;

      // Muat Model 3D Kaos Profesional (.GLB)
      this.load3DModel();

      // Resize Handler
      window.addEventListener('resize', () => this.onResize());

      this.initialized = true;
      this.requestRender();
    }

    // 2. Setup Pencahayaan Studio
    setupLighting() {
      const THREE = window.THREE;
      const ambient = new THREE.AmbientLight(0xffffff, 0.95);
      this.scene.add(ambient);

      // Key Light (Kanan Depan Atas)
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
      keyLight.position.set(2.5, 3.5, 2.8);
      this.scene.add(keyLight);

      // Fill Light (Kiri Depan)
      const fillLight = new THREE.DirectionalLight(0xf8fafc, 0.65);
      fillLight.position.set(-2.5, 1.5, 2.0);
      this.scene.add(fillLight);

      // Rim Light (Bahu & Siluet Belakang)
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
      rimLight.position.set(0, 3.0, -2.5);
      this.scene.add(rimLight);
    }

    // 3. Muat Model 3D Kaos Open-Source (shirt_baked.glb)
    load3DModel() {
      const THREE = window.THREE;
      const GLTFLoader = THREE.GLTFLoader || window.GLTFLoader;

      if (!GLTFLoader) {
        console.warn('GLTFLoader is not available. Please load GLTFLoader.js.');
        return;
      }

      const loader = new GLTFLoader();
      // Gunakan Base64 Data URI jika offline / file:/// protocol, atau path lokal
      const modelSource = window.TSHIRT_GLB_DATA || 'assets/models/tshirt.glb';

      loader.load(
        modelSource,
        (gltf) => {
          this.tshirtGroup = gltf.scene;

          // Temukan mesh baju
          this.tshirtGroup.traverse((child) => {
            if (child.isMesh) {
              this.shirtMesh = child;
              // Material PBR Katun Combed Halus
              child.material.roughness = 0.75;
              child.material.metalness = 0.04;
              child.material.color = new THREE.Color(this.bodyColor);
            }
          });

          // Posisikan dan skalakan kaos di tengah viewport
          this.tshirtGroup.scale.set(2.2, 2.2, 2.2);
          this.tshirtGroup.position.set(0, 0.08, 0);
          this.scene.add(this.tshirtGroup);

          this.modelLoaded = true;

          // Inisialisasi decal sablon
          this.updateDecalMesh();

          // Sinkronisasi desain jika sudah ada data studio
          if (this.cachedStudioState) {
            this.syncFromStudioState(this.cachedStudioState);
          }

          this.requestRender();
        },
        undefined,
        (err) => {
          console.error('Failed to load 3D T-shirt model:', err);
        }
      );
    }

    // 4. Sinkronisasi Desain 2D -> 3D
    syncFromStudioState(S) {
      this.cachedStudioState = S;
      if (!this.initialized) return;

      this.bodyColor = S.color ? S.color.hex : '#1f2937';

      // Update warna bahan kaos
      if (this.shirtMesh && this.shirtMesh.material) {
        this.shirtMesh.material.color.set(this.bodyColor);
      }

      if (this.modelLoaded) {
        this.renderDesignToCanvas(S);
        if (this.frontTexture) {
          this.frontTexture.needsUpdate = true;
        }
        if (!this.decalMesh) {
          this.updateDecalMesh();
        }
      }

      this.requestRender();
    }

    // Render Layer Desain (Teks, Logo, Bentuk) ke Kanvas Transparan
    renderDesignToCanvas(S) {
      if (!S) return;
      const ctx = this.frontCtx;
      const w = this.frontCanvas.width;
      const h = this.frontCanvas.height;

      // Bersihkan kanvas (Transparan agar menempel natural di atas kaos)
      ctx.clearRect(0, 0, w, h);

      const side = 'depan';
      const printLeft = w * 0.15;
      const printTop = h * 0.15;
      const printW = w * 0.7;
      const printH = h * 0.7;

      ctx.save();

      if (S.mode === 'editor') {
        const layers = S.sides && S.sides[side] ? S.sides[side] : [];
        layers.forEach((l) => {
          ctx.save();
          const posX = printLeft + l.x * printW;
          const posY = printTop + l.y * printH;

          ctx.translate(posX, posY);
          ctx.rotate(((l.r || 0) * Math.PI) / 180);
          if (l.flip) ctx.scale(-1, 1);
          ctx.globalAlpha = l.o ?? 1;

          const baseSize = (l.s || 20) * (printW / 100);

          if (l.type === 'text') {
            ctx.font = `${l.italic ? 'italic ' : ''}${l.bold ? '700 ' : '400 '}${baseSize * 1.6}px '${l.font || 'Poppins'}', sans-serif`;
            ctx.textAlign = l.align || 'center';
            ctx.textBaseline = 'middle';

            if (l.stroke) {
              ctx.lineWidth = baseSize * 0.16;
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
            const maxDim = Math.min(printW * 0.9, printH * 0.9);
            const aspect = img.naturalHeight / img.naturalWidth;
            let dw = maxDim,
              dh = maxDim * aspect;
            if (dh > maxDim) {
              dh = maxDim;
              dw = dh / aspect;
            }
            ctx.drawImage(img, printLeft + (printW - dw) / 2, printTop + (printH - dh) / 2, dw, dh);
          }
        }
      }

      ctx.restore();
    }

    // Proyeksikan Desain Sablon ke Dada Kaos Menggunakan DecalGeometry
    updateDecalMesh() {
      const THREE = window.THREE;
      if (!this.shirtMesh) return;

      const DecalGeometry = THREE.DecalGeometry || window.DecalGeometry;
      if (!DecalGeometry) {
        // Fallback jika DecalGeometry belum termuat: terapkan sebagai texture map
        this.shirtMesh.material.map = this.frontTexture;
        this.shirtMesh.material.needsUpdate = true;
        this.requestRender();
        return;
      }

      // Hapus decal lama jika ada
      if (this.decalMesh) {
        if (this.shirtMesh) this.shirtMesh.remove(this.decalMesh);
        if (this.tshirtGroup) this.tshirtGroup.remove(this.decalMesh);
        if (this.decalMesh.geometry) this.decalMesh.geometry.dispose();
        this.decalMesh = null;
      }

      // Posisi dada pada model shirt_baked.glb (dalam local mesh space): X: 0, Y: 0.04, Z: 0.15
      const position = new THREE.Vector3(0, 0.04, 0.15);
      const orientation = new THREE.Euler(0, 0, 0);
      const size = new THREE.Vector3(0.20, 0.22, 0.20);

      // Nolkan matrixWorld sementara agar DecalGeometry terproyeksi dalam mesh local space
      const savedMatrix = this.shirtMesh.matrixWorld.clone();
      this.shirtMesh.matrixWorld.identity();

      const decalGeo = new DecalGeometry(this.shirtMesh, position, orientation, size);

      // Pulihkan matrixWorld
      this.shirtMesh.matrixWorld.copy(savedMatrix);

      if (!this.decalMaterial) {
        this.decalMaterial = new THREE.MeshStandardMaterial({
          map: this.frontTexture,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -10,
          polygonOffsetUnits: -10,
          roughness: 0.8
        });
      }

      this.decalMesh = new THREE.Mesh(decalGeo, this.decalMaterial);
      this.shirtMesh.add(this.decalMesh);

      this.requestRender();
    }

    // 5. Ganti Warna Kaos
    setBodyColor(hex) {
      this.bodyColor = hex;
      if (this.shirtMesh && this.shirtMesh.material) {
        this.shirtMesh.material.color.set(hex);
        this.requestRender();
      }
    }

    setNeckColor(hex) {
      this.neckColor = hex;
      // Single-piece mesh model menggunakan warna kaos terpadu
    }

    // 6. Kontrol Kamera: Auto-Rotate, Reset & Zoom
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
        this.camera.position.set(0, 0.0, 2.45);
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

    // 7. Demand-Rendering Engine (Hemat Daya)
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

    // 8. Resize Handler
    onResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = Math.max(this.container.clientWidth || 0, 420);
      const height = Math.max(this.container.clientHeight || 0, 460);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.requestRender();
    }

    // 9. Tangkap Foto 3D
    exportSnapshot() {
      if (!this.renderer || !this.scene || !this.camera) return null;
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement.toDataURL('image/png');
    }

    // 10. Bersihkan Memori GPU
    dispose() {
      this.stopContinuousRender();
      if (this.tshirtGroup) {
        this.tshirtGroup.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
              else child.material.dispose();
            }
          }
        });
      }
      if (this.decalMesh && this.decalMesh.geometry) {
        this.decalMesh.geometry.dispose();
      }
      if (this.frontTexture) this.frontTexture.dispose();
      if (this.renderer) {
        this.renderer.dispose();
        if (this.renderer.domElement && this.renderer.domElement.parentNode) {
          this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
      }
      this.initialized = false;
      this.modelLoaded = false;
    }
  }

  return new Studio3DEngine();
});
