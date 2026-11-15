// ====================================================================
// three-studio.js - 3D Mockup Studio Engine (Mockey.ai Style)
// Authentic Multi-Zone GLTF Model + Direct On-3D Editing Engine
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

  // Konfigurasi posisi dan dimensi proyektor Decal per zona pada model shirt_baked.glb
  const ZONE_DECAL_CONFIG = {
    depan: {
      std: { pos: [0, 0.04, 0.15], rot: [0, 0, 0], size: [0.22, 0.24, 0.20] },
      saku: { pos: [-0.07, 0.06, 0.14], rot: [0, 0, 0], size: [0.11, 0.11, 0.16] },
      dada_kanan: { pos: [0.07, 0.06, 0.14], rot: [0, 0, 0], size: [0.11, 0.11, 0.16] },
      besar: { pos: [0, -0.01, 0.145], rot: [0, 0, 0], size: [0.25, 0.32, 0.22] },
      full: { pos: [0, -0.01, 0.145], rot: [0, 0, 0], size: [0.25, 0.32, 0.22] }
    },
    belakang: {
      std: { pos: [0, 0.02, -0.125], rot: [0, Math.PI, 0], size: [0.24, 0.28, 0.20] },
      saku: { pos: [0, 0.13, -0.12], rot: [0, Math.PI, 0], size: [0.12, 0.07, 0.15] },
      besar: { pos: [0, -0.02, -0.125], rot: [0, Math.PI, 0], size: [0.26, 0.34, 0.22] },
      full: { pos: [0, -0.02, -0.125], rot: [0, Math.PI, 0], size: [0.26, 0.34, 0.22] }
    },
    lengan_kiri: {
      std: { pos: [-0.24, 0.07, -0.018], rot: [0, -Math.PI / 2, 0], size: [0.11, 0.11, 0.16] },
      besar: { pos: [-0.24, 0.05, -0.018], rot: [0, -Math.PI / 2, 0], size: [0.10, 0.18, 0.16] }
    },
    lengan_kanan: {
      std: { pos: [0.24, 0.07, -0.018], rot: [0, Math.PI / 2, 0], size: [0.11, 0.11, 0.16] },
      besar: { pos: [0.24, 0.05, -0.018], rot: [0, Math.PI / 2, 0], size: [0.10, 0.18, 0.16] }
    }
  };

  // Pustaka Bentuk Geometris (SVG Path2D Data)
  const BUILTIN_SHAPES = {
    kotak: ["Kotak", "M5 5H95V95H5Z"],
    bulat: ["Lingkaran", "M50 5a45 45 0 1 0 0 90a45 45 0 1 0 0-90Z"],
    segitiga: ["Segitiga", "M50 6L95 92H5Z"],
    ketupat: ["Belah ketupat", "M50 4L96 50L50 96L4 50Z"],
    bintang: ["Bintang", "M50 5L61.8 36.8 95.6 38.2 69 59.2 78.2 91.8 50 73 21.8 91.8 31 59.2 4.4 38.2 38.2 36.8Z"],
    hati: ["Hati", "M50 90C20 66 6 48 6 30 6 16 17 6 30 6 40 6 47 12 50 19 53 12 60 6 70 6 83 6 94 16 94 30 94 48 80 66 50 90Z"],
    petir: ["Petir", "M58 4L18 56H46L40 96L82 40H54Z"],
    mahkota: ["Mahkota", "M8 78L14 28 34 50 50 18 66 50 86 28 92 78Z"],
    garis: ["Garis", "M4 44H96V56H4Z"]
  };

  class Studio3DEngine {
    constructor() {
      this.container = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.controls = null;
      this.tshirtGroup = null;
      this.shirtMesh = null;

      // Multi-Zona Canvases & Decals (depan, belakang, lengan_kiri, lengan_kanan)
      this.activeSide = 'depan';
      this.zones = {
        depan: this.createZoneData('depan'),
        belakang: this.createZoneData('belakang'),
        lengan_kiri: this.createZoneData('lengan_kiri'),
        lengan_kanan: this.createZoneData('lengan_kanan')
      };

      // Raycaster & Interaksi Langsung di atas 3D
      this.raycaster = null;
      this.mouse = null;
      this.isDragging = false;
      this.draggedLayer = null;
      this.dragStartUV = null;
      this.dragStartLayerPos = null;
      this.hoveredZone = null;

      // Callbacks ke UI Studio
      this.onZoneSelect = null;
      this.onSurfaceClick = null;
      this.onLayerSelect = null;
      this.onLayerMove = null;
      this.onFileDrop = null;

      // State & Colors
      this.bodyColor = '#1f2937';
      this.neckColor = '#1f2937';
      this.isAutoRotate = false;
      this.isRendering = false;
      this.renderRequested = false;
      this.initialized = false;
      this.modelLoaded = false;
      this.cachedStudioState = null;
    }

    createZoneData(name) {
      const cv = document.createElement('canvas');
      cv.width = 1024;
      cv.height = 1024;
      return {
        name,
        canvas: cv,
        ctx: cv.getContext('2d'),
        texture: null,
        decalMesh: null,
        decalMaterial: null,
        hasContent: false
      };
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

      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

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
        this.controls.maxPolarAngle = Math.PI / 1.75;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 1.8;
        this.controls.addEventListener('change', () => this.requestRender());
      }

      // Pencahayaan 3-Titik Studio Fotografi
      this.setupLighting();

      // Dynamic Design Canvas Textures untuk Setiap Zona
      Object.values(this.zones).forEach((z) => {
        z.texture = new THREE.CanvasTexture(z.canvas);
        if (THREE.sRGBEncoding) z.texture.encoding = THREE.sRGBEncoding;
        z.texture.anisotropy = 8;
      });

      // Muat Model 3D Kaos Profesional (.GLB)
      this.load3DModel();

      // Pasang Event Interaksi Langsung di atas 3D (Click, Drag, Drop)
      this.setupDirectInteraction();

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
      const modelSource = window.TSHIRT_GLB_DATA || 'assets/models/tshirt.glb';

      loader.load(
        modelSource,
        (gltf) => {
          this.tshirtGroup = gltf.scene;

          this.tshirtGroup.traverse((child) => {
            if (child.isMesh) {
              this.shirtMesh = child;
              child.material.roughness = 0.75;
              child.material.metalness = 0.04;
              child.material.color = new THREE.Color(this.bodyColor);
            }
          });

          this.tshirtGroup.scale.set(2.2, 2.2, 2.2);
          this.tshirtGroup.position.set(0, 0.08, 0);
          this.scene.add(this.tshirtGroup);

          this.modelLoaded = true;

          // Inisialisasi decal sablon multi-zona
          this.updateAllDecals();

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

    // 4. Deteksi Zona Permukaan Kaos dari Koordinat Mesh Lokal
    classifySurfaceZone(localPoint) {
      if (localPoint.x < -0.17) return 'lengan_kiri';
      if (localPoint.x > 0.17) return 'lengan_kanan';
      if (localPoint.z < -0.02) return 'belakang';
      return 'depan';
    }

    // 5. Interaksi Langsung pada Model 3D (Raycasting, Dragging & File Drop)
    setupDirectInteraction() {
      const canvasEl = this.renderer.domElement;
      if (!canvasEl) return;

      const updateMouseCoords = (e) => {
        const rect = canvasEl.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      };

      // Pointer Down: Hanya memulai drag jika pointer menekan objek yang sedang TERPILIH (Selected).
      // Jika area yang diklik bukan objek terpilih atau belum ada objek dipilih, aktifkan rotasi 3D OrbitControls.
      canvasEl.addEventListener('pointerdown', (e) => {
        if (!this.shirtMesh || !this.camera) return;
        updateMouseCoords(e);
        this.pointerDownPos = { x: e.clientX, y: e.clientY };

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.shirtMesh, false);

        if (intersects.length > 0) {
          const hit = intersects[0];
          const localPoint = this.shirtMesh.worldToLocal(hit.point.clone());
          const detectedZone = this.classifySurfaceZone(localPoint);

          const state = this.cachedStudioState;
          const selId = state && state.sel ? state.sel : null;
          const layers = state && state.sides && state.sides[detectedZone] ? state.sides[detectedZone] : [];

          // Hit test terhadap layer elemen (dalam rentang koordinat 0..1)
          let normX = 0.5, normY = 0.5;
          if (detectedZone === 'depan') {
            normX = (localPoint.x + 0.12) / 0.24;
            normY = (0.16 - localPoint.y) / 0.24;
          } else if (detectedZone === 'belakang') {
            normX = (-localPoint.x + 0.12) / 0.24;
            normY = (0.16 - localPoint.y) / 0.24;
          } else if (detectedZone === 'lengan_kiri') {
            normX = (localPoint.z + 0.06) / 0.12;
            normY = (0.12 - localPoint.y) / 0.12;
          } else if (detectedZone === 'lengan_kanan') {
            normX = (-localPoint.z + 0.06) / 0.12;
            normY = (0.12 - localPoint.y) / 0.12;
          }

          normX = Math.max(0.05, Math.min(0.95, normX));
          normY = Math.max(0.05, Math.min(0.95, normY));

          // 1. Cek apakah yang diklik adalah objek yang SEDANG TERPILIH (Selected) atau layer lain pada permukaan
          const selectedLayer = selId ? layers.find((l) => String(l.id) === String(selId)) : null;
          let clickedLayer = null;

          // Cek hit ke selectedLayer terlebih dahulu
          if (selectedLayer) {
            const aspect = selectedLayer.ratio || 1;
            const sizeBase = ((selectedLayer.s || 30) / 100) * 0.7;
            const halfW = Math.max(0.08, sizeBase);
            const halfH = Math.max(0.08, sizeBase * aspect);
            const lx = typeof selectedLayer.x === 'number' && !isNaN(selectedLayer.x) ? selectedLayer.x : 0.5;
            const ly = typeof selectedLayer.y === 'number' && !isNaN(selectedLayer.y) ? selectedLayer.y : 0.5;
            if (Math.abs(normX - lx) <= halfW * 1.5 && Math.abs(normY - ly) <= halfH * 1.5) {
              clickedLayer = selectedLayer;
            }
          }

          // Jika tidak mengenai selectedLayer, cek apakah mengenai layer lain di zona ini
          if (!clickedLayer && layers.length > 0) {
            for (let i = layers.length - 1; i >= 0; i--) {
              const l = layers[i];
              const aspect = l.ratio || 1;
              const sizeBase = ((l.s || 30) / 100) * 0.7;
              const halfW = Math.max(0.08, sizeBase);
              const halfH = Math.max(0.08, sizeBase * aspect);
              const lx = typeof l.x === 'number' && !isNaN(l.x) ? l.x : 0.5;
              const ly = typeof l.y === 'number' && !isNaN(l.y) ? l.y : 0.5;
              if (Math.abs(normX - lx) <= halfW * 1.5 && Math.abs(normY - ly) <= halfH * 1.5) {
                clickedLayer = l;
                break;
              }
            }
          }

          if (clickedLayer) {
            // Objek terkena klik -> Masuk mode DRAG objek, nonaktifkan rotasi 3D OrbitControls
            this.isDragging = true;
            this.draggedLayer = clickedLayer;
            const lx = typeof clickedLayer.x === 'number' && !isNaN(clickedLayer.x) ? clickedLayer.x : 0.5;
            const ly = typeof clickedLayer.y === 'number' && !isNaN(clickedLayer.y) ? clickedLayer.y : 0.5;
            this.dragStartUV = { x: normX, y: normY };
            this.dragStartLayerPos = { x: lx, y: ly };
            if (this.controls) this.controls.enabled = false;
            canvasEl.style.cursor = 'grabbing';
            if (this.onLayerSelect) this.onLayerSelect(clickedLayer);
          } else {
            // Area yang diklik adalah kaos kosong di luar layer apapun -> Rotasi 3D bebas
            this.isDragging = false;
            this.draggedLayer = null;
            if (this.controls) this.controls.enabled = true;

            if (detectedZone !== this.activeSide) {
              this.activeSide = detectedZone;
              if (this.onZoneSelect) this.onZoneSelect(detectedZone);
            }
          }
        }
      });

      // Pointer Move: Menggeser layer sablon secara real-time di atas lengkungan baju
      canvasEl.addEventListener('pointermove', (e) => {
        if (!this.shirtMesh || !this.camera) return;
        updateMouseCoords(e);

        if (this.isDragging && this.draggedLayer) {
          this.raycaster.setFromCamera(this.mouse, this.camera);
          const intersects = this.raycaster.intersectObject(this.shirtMesh, false);
          if (intersects.length > 0) {
            const hit = intersects[0];
            const localPoint = this.shirtMesh.worldToLocal(hit.point.clone());
            const zone = this.activeSide;

            let curX = 0.5, curY = 0.5;
            if (zone === 'depan') {
              curX = (localPoint.x + 0.12) / 0.24;
              curY = (0.16 - localPoint.y) / 0.24;
            } else if (zone === 'belakang') {
              curX = (-localPoint.x + 0.12) / 0.24;
              curY = (0.16 - localPoint.y) / 0.24;
            } else if (zone === 'lengan_kiri') {
              curX = (localPoint.z + 0.06) / 0.12;
              curY = (0.12 - localPoint.y) / 0.12;
            } else if (zone === 'lengan_kanan') {
              curX = (-localPoint.z + 0.06) / 0.12;
              curY = (0.12 - localPoint.y) / 0.12;
            }

            const deltaX = curX - this.dragStartUV.x;
            const deltaY = curY - this.dragStartUV.y;

            const startX = typeof this.dragStartLayerPos.x === 'number' && !isNaN(this.dragStartLayerPos.x) ? this.dragStartLayerPos.x : 0.5;
            const startY = typeof this.dragStartLayerPos.y === 'number' && !isNaN(this.dragStartLayerPos.y) ? this.dragStartLayerPos.y : 0.5;

            this.draggedLayer.x = Math.max(0.05, Math.min(0.95, startX + deltaX));
            this.draggedLayer.y = Math.max(0.05, Math.min(0.95, startY + deltaY));

            if (this.cachedStudioState) {
              this.renderZoneToCanvas(this.cachedStudioState, zone);
              const zData = this.zones[zone];
              if (zData && zData.texture) zData.texture.needsUpdate = true;
              this.requestRender();
            }

            if (this.onLayerMove) this.onLayerMove(this.draggedLayer);
          }
        } else {
          // Hover Detection: Cek apakah kursor berada di atas objek apapun pada baju
          this.raycaster.setFromCamera(this.mouse, this.camera);
          const intersects = this.raycaster.intersectObject(this.shirtMesh, false);
          if (intersects.length > 0) {
            const hit = intersects[0];
            const localPoint = this.shirtMesh.worldToLocal(hit.point.clone());
            const detectedZone = this.classifySurfaceZone(localPoint);
            const state = this.cachedStudioState;
            const layers = state && state.sides && state.sides[detectedZone] ? state.sides[detectedZone] : [];

            let isOverLayer = false;
            if (layers.length > 0) {
              let normX = 0.5, normY = 0.5;
              if (detectedZone === 'depan') {
                normX = (localPoint.x + 0.12) / 0.24;
                normY = (0.16 - localPoint.y) / 0.24;
              } else if (detectedZone === 'belakang') {
                normX = (-localPoint.x + 0.12) / 0.24;
                normY = (0.16 - localPoint.y) / 0.24;
              } else if (detectedZone === 'lengan_kiri') {
                normX = (localPoint.z + 0.06) / 0.12;
                normY = (0.12 - localPoint.y) / 0.12;
              } else if (detectedZone === 'lengan_kanan') {
                normX = (-localPoint.z + 0.06) / 0.12;
                normY = (0.12 - localPoint.y) / 0.12;
              }

              for (let i = layers.length - 1; i >= 0; i--) {
                const l = layers[i];
                const aspect = l.ratio || 1;
                const sizeBase = ((l.s || 30) / 100) * 0.7;
                const halfW = Math.max(0.08, sizeBase);
                const halfH = Math.max(0.08, sizeBase * aspect);
                const lx = typeof l.x === 'number' && !isNaN(l.x) ? l.x : 0.5;
                const ly = typeof l.y === 'number' && !isNaN(l.y) ? l.y : 0.5;
                if (Math.abs(normX - lx) <= halfW * 1.5 && Math.abs(normY - ly) <= halfH * 1.5) {
                  isOverLayer = true;
                  break;
                }
              }
            }

            canvasEl.style.cursor = isOverLayer ? 'move' : 'default';
          } else {
            canvasEl.style.cursor = 'default';
          }
        }
      });

      // Pointer Up & Pointer Cancel: Selesaikan drag dan aktifkan kembali OrbitControls
      const onPointerEnd = (e) => {
        if (this.isDragging) {
          this.isDragging = false;
          this.draggedLayer = null;
          if (this.controls) this.controls.enabled = true;
          canvasEl.style.cursor = 'default';
          this.requestRender();
        } else if (this.pointerDownPos && e) {
          // Deteksi apakah aksi pointer adalah klik/tap biasa (bukan drag kamera 3D)
          const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
          if (dist < 6) {
            if (this.potentialSelectLayer) {
              if (this.onLayerSelect) this.onLayerSelect(this.potentialSelectLayer);
            }
          }
        }
        this.potentialSelectLayer = null;
        if (this.controls) this.controls.enabled = true;
      };

      canvasEl.addEventListener('pointerup', onPointerEnd);
      canvasEl.addEventListener('pointercancel', onPointerEnd);
      canvasEl.addEventListener('pointerleave', onPointerEnd);

      // Drag and Drop File Langsung ke Viewport 3D
      canvasEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        canvasEl.classList.add('v3d-dragover');
      });

      canvasEl.addEventListener('dragleave', () => {
        canvasEl.classList.remove('v3d-dragover');
      });

      canvasEl.addEventListener('drop', (e) => {
        e.preventDefault();
        canvasEl.classList.remove('v3d-dragover');
        if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files[0]) return;

        const file = e.dataTransfer.files[0];
        updateMouseCoords(e);
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.shirtMesh, false);

        let targetZone = this.activeSide;
        if (intersects.length > 0) {
          const hit = intersects[0];
          const localPoint = this.shirtMesh.worldToLocal(hit.point.clone());
          targetZone = this.classifySurfaceZone(localPoint);
        }

        if (this.onFileDrop) {
          this.onFileDrop(file, targetZone);
        }
      });
    }

    // 6. Sinkronisasi Data Desain Studio State ke Semua Zona 3D
    syncFromStudioState(S) {
      this.cachedStudioState = S;
      if (!this.initialized) return;

      this.bodyColor = S.color ? S.color.hex : '#1f2937';
      if (this.shirtMesh && this.shirtMesh.material) {
        this.shirtMesh.material.color.set(this.bodyColor);
      }

      if (this.modelLoaded) {
        ['depan', 'belakang', 'lengan_kiri', 'lengan_kanan'].forEach((zone) => {
          this.renderZoneToCanvas(S, zone);
          const zData = this.zones[zone];
          if (zData && zData.texture) {
            zData.texture.needsUpdate = true;
          }
          this.updateZoneDecal(zone, S.area);
        });
      }

      this.requestRender();
    }

    // Render Layer Desain ke Kanvas Transparan Tertentu
    renderZoneToCanvas(S, side) {
      if (!S) return;
      const zData = this.zones[side];
      if (!zData) return;

      const ctx = zData.ctx;
      const w = zData.canvas.width;
      const h = zData.canvas.height;

      ctx.clearRect(0, 0, w, h);

      const printLeft = w * 0.12;
      const printTop = h * 0.12;
      const printW = w * 0.76;
      const printH = h * 0.76;

      ctx.save();

      const layers = S.sides && S.sides[side] ? S.sides[side] : [];
      zData.hasContent = layers.length > 0 || (S.up && !!S.up[side]);

      if (S.mode === 'editor') {
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
            ctx.font = `${l.italic ? 'italic ' : ''}${l.bold ? '700 ' : '400 '}${baseSize * 1.5}px '${l.font || 'Poppins'}', sans-serif`;
            ctx.textAlign = l.align || 'center';
            ctx.textBaseline = 'middle';

            if (l.stroke) {
              ctx.lineWidth = baseSize * 0.16;
              ctx.strokeStyle = l.strokeColor || '#000000';
              ctx.strokeText(l.text || '', 0, 0);
            }
            ctx.fillStyle = l.color || '#ffffff';
            ctx.fillText(l.text || '', 0, 0);
          } else if ((l.type === 'image' || l.type === 'brush') && (l.src || l.dataUrl)) {
            const imgSrc = l.src || l.dataUrl;
            let img = l.img;
            if (!img || !(img instanceof HTMLImageElement)) {
              img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = imgSrc;
              l.img = img;
            }
            if (img.complete && img.naturalWidth) {
              const aspect = l.ratio || (img.naturalHeight / img.naturalWidth) || 1;
              const iw = baseSize * 2.2;
              const ih = iw * aspect;
              ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
            } else {
              img.onload = () => {
                this.renderZoneToCanvas(this.cachedStudioState, side);
                if (zData.texture) zData.texture.needsUpdate = true;
                this.requestRender();
              };
            }
          } else if (l.type === 'shape') {
            const shapesMap = window.SHAPES || BUILTIN_SHAPES;
            const shapeDef = shapesMap && (shapesMap[l.shape] || shapesMap.kotak);
            if (shapeDef) {
              const sw = baseSize * 2.0;
              ctx.save();
              ctx.translate(-sw / 2, -sw / 2);
              ctx.scale(sw / 100, sw / 100);
              try {
                const p = new Path2D(shapeDef[1]);
                if (l.fill) {
                  ctx.fillStyle = l.color || '#4338ca';
                  ctx.fill(p);
                } else {
                  ctx.strokeStyle = l.color || '#4338ca';
                  ctx.lineWidth = 7;
                  ctx.lineJoin = 'round';
                  ctx.stroke(p);
                }
              } catch (err) {
                console.warn('Shape draw error:', err);
              }
              ctx.restore();
            }
          }

          // Visual feedback: Garis putus-putus seleksi & titik sudut pada objek yang aktif (selected)
          if (S.sel && l.id === S.sel) {
            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = Math.max(2, baseSize * 0.04);
            ctx.setLineDash([5, 4]);

            let bboxW = baseSize * 2.0;
            let bboxH = baseSize * 2.0;
            if (l.type === 'text') {
              const textMetrics = ctx.measureText(l.text || '');
              bboxW = Math.max(baseSize * 1.2, textMetrics.width + baseSize * 0.4);
              bboxH = baseSize * 1.6;
            } else if (l.type === 'image' || l.type === 'brush') {
              const aspect = l.ratio || (l.img && l.img.naturalWidth ? l.img.naturalHeight / l.img.naturalWidth : 1);
              bboxW = baseSize * 2.2;
              bboxH = bboxW * aspect;
            } else if (l.type === 'shape') {
              bboxW = baseSize * 2.0;
              bboxH = baseSize * 2.0;
            }

            const pad = 6;
            const rx = -(bboxW / 2 + pad);
            const ry = -(bboxH / 2 + pad);
            const rw = bboxW + pad * 2;
            const rh = bboxH + pad * 2;

            ctx.strokeRect(rx, ry, rw, rh);

            // Titik pegangan sudut (corner anchors)
            ctx.setLineDash([]);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 1.8;
            const dotR = 3.5;
            const corners = [
              [rx, ry],
              [rx + rw, ry],
              [rx, ry + rh],
              [rx + rw, ry + rh]
            ];
            corners.forEach(([cx, cy]) => {
              ctx.beginPath();
              ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
            ctx.restore();
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
          } else {
            img.onload = () => {
              this.renderZoneToCanvas(this.cachedStudioState, side);
              if (zData.texture) zData.texture.needsUpdate = true;
              this.requestRender();
            };
          }
        }
      }

      ctx.restore();
    }

    // 7. Update Decal Mesh untuk Zona Tertentu
    updateZoneDecal(side, areaKey = 'std') {
      const THREE = window.THREE;
      if (!this.shirtMesh) return;

      const DecalGeometry = THREE.DecalGeometry || window.DecalGeometry;
      if (!DecalGeometry) return;

      const zData = this.zones[side];
      if (!zData) return;

      // Konfigurasi proyektor decal untuk zona ini
      const sideConfigs = ZONE_DECAL_CONFIG[side] || ZONE_DECAL_CONFIG.depan;
      const cfg = sideConfigs[areaKey] || sideConfigs.std;

      // Hapus decal lama untuk zona ini
      if (zData.decalMesh) {
        if (this.shirtMesh) this.shirtMesh.remove(zData.decalMesh);
        if (zData.decalMesh.geometry) zData.decalMesh.geometry.dispose();
        zData.decalMesh = null;
      }

      const position = new THREE.Vector3(...cfg.pos);
      const orientation = new THREE.Euler(...cfg.rot);
      const size = new THREE.Vector3(...cfg.size);

      // Nolkan matrixWorld sementara agar DecalGeometry terproyeksi dalam mesh local space
      const savedMatrix = this.shirtMesh.matrixWorld.clone();
      this.shirtMesh.matrixWorld.identity();

      const decalGeo = new DecalGeometry(this.shirtMesh, position, orientation, size);
      this.shirtMesh.matrixWorld.copy(savedMatrix);

      if (!zData.decalMaterial) {
        zData.decalMaterial = new THREE.MeshStandardMaterial({
          map: zData.texture,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -10,
          polygonOffsetUnits: -10,
          roughness: 0.8
        });
      }

      zData.decalMesh = new THREE.Mesh(decalGeo, zData.decalMaterial);
      this.shirtMesh.add(zData.decalMesh);

      this.requestRender();
    }

    updateAllDecals() {
      ['depan', 'belakang', 'lengan_kiri', 'lengan_kanan'].forEach((zone) => {
        this.updateZoneDecal(zone, this.cachedStudioState ? this.cachedStudioState.area : 'std');
      });
    }

    // 8. Kontrol Kamera Cepat (Preset Angles)
    setCameraAngle(angleKey) {
      if (!this.camera || !this.controls) return;
      this.activeSide = angleKey;

      const targets = {
        depan: [0, 0.0, 2.45],
        belakang: [0, 0.0, -2.45],
        lengan_kiri: [-2.45, 0.04, 0],
        lengan_kanan: [2.45, 0.04, 0]
      };

      const pos = targets[angleKey] || targets.depan;
      this.camera.position.set(pos[0], pos[1], pos[2]);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      this.requestRender();
    }

    setBodyColor(hex) {
      this.bodyColor = hex;
      if (this.shirtMesh && this.shirtMesh.material) {
        this.shirtMesh.material.color.set(hex);
        this.requestRender();
      }
    }

    setNeckColor(hex) {
      this.neckColor = hex;
    }

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
      this.setCameraAngle('depan');
    }

    zoom(direction) {
      if (this.camera && this.controls) {
        const step = direction > 0 ? 0.88 : 1.14;
        this.camera.position.multiplyScalar(step);
        this.controls.update();
        this.requestRender();
      }
    }

    // 9. Tangkap Snapshot Foto 3D
    exportSnapshot() {
      if (!this.renderer || !this.scene || !this.camera) return null;
      const prevSel = this.cachedStudioState ? this.cachedStudioState.sel : null;
      if (prevSel) {
        this.cachedStudioState.sel = null;
        ['depan', 'belakang', 'lengan_kiri', 'lengan_kanan'].forEach((z) => {
          this.renderZoneToCanvas(this.cachedStudioState, z);
          if (this.zones[z]?.texture) this.zones[z].texture.needsUpdate = true;
        });
      }
      this.renderer.render(this.scene, this.camera);
      const url = this.renderer.domElement.toDataURL('image/png');
      if (prevSel) {
        this.cachedStudioState.sel = prevSel;
        ['depan', 'belakang', 'lengan_kiri', 'lengan_kanan'].forEach((z) => {
          this.renderZoneToCanvas(this.cachedStudioState, z);
          if (this.zones[z]?.texture) this.zones[z].texture.needsUpdate = true;
        });
      }
      return url;
    }

    // Tangkap Mockup Visual untuk Angle Tertentu (Depan, Belakang, Lengan)
    exportAngleSnapshot(angleKey) {
      if (!this.renderer || !this.scene || !this.camera) return null;
      const prevPos = this.camera.position.clone();
      const prevSel = this.cachedStudioState ? this.cachedStudioState.sel : null;
      if (prevSel) {
        this.cachedStudioState.sel = null;
        ['depan', 'belakang', 'lengan_kiri', 'lengan_kanan'].forEach((z) => {
          this.renderZoneToCanvas(this.cachedStudioState, z);
          if (this.zones[z]?.texture) this.zones[z].texture.needsUpdate = true;
        });
      }

      this.setCameraAngle(angleKey);
      this.renderer.render(this.scene, this.camera);
      const url = this.renderer.domElement.toDataURL('image/png');

      // Kembalikan posisi kamera semula
      this.camera.position.copy(prevPos);
      if (prevSel) {
        this.cachedStudioState.sel = prevSel;
        ['depan', 'belakang', 'lengan_kiri', 'lengan_kanan'].forEach((z) => {
          this.renderZoneToCanvas(this.cachedStudioState, z);
          if (this.zones[z]?.texture) this.zones[z].texture.needsUpdate = true;
        });
      }
      if (this.controls) this.controls.update();
      this.requestRender();

      return url;
    }

    // 10. Demand-Rendering Engine
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

    onResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = Math.max(this.container.clientWidth || 0, 420);
      const height = Math.max(this.container.clientHeight || 0, 460);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.requestRender();
    }

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
      Object.values(this.zones).forEach((z) => {
        if (z.decalMesh && z.decalMesh.geometry) z.decalMesh.geometry.dispose();
        if (z.texture) z.texture.dispose();
      });
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
