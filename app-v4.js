/* ============================================================
   TR Ceviz Bahçesi — v4 (2026-10-03)
   (header, menü, lightbox, sipariş, reveal) + 3D ceviz sahnesi
   Sahne: RoomEnvironment stüdyo ortamı, domain-warped kabuk
   geometrisi, koherent prosedürel dokular, sağlam drag etkileşimi
   ============================================================ */
(function () {
    'use strict';

    if (window.console && console.info) console.info('TRC Ceviz — build v4');

    /* ---- Ortam kapıları ---- */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var conn = navigator.connection || {};
    var saveData = !!conn.saveData;
    var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
                   (navigator.deviceMemory && navigator.deviceMemory <= 4);

    /* ---- Scroll kilidi ---- */
    function lockScroll() { document.body.style.overflow = 'hidden'; }
    function unlockScroll() { document.body.style.overflow = ''; }

    /* ---- Header scroll ---- */
    var header = document.getElementById('siteHeader');
    function onScroll() {
        if (!header) return;
        if (window.scrollY > 30) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---- Mobil menü ---- */
    var navToggle = document.getElementById('navToggle');
    var siteNav = document.getElementById('siteNav');

    function closeNav() {
        if (!siteNav) return;
        siteNav.classList.remove('open');
        if (navToggle) {
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'Menüyü aç');
        }
        unlockScroll();
    }

    if (navToggle && siteNav) {
        navToggle.addEventListener('click', function () {
            var isOpen = siteNav.classList.toggle('open');
            navToggle.classList.toggle('active', isOpen);
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            navToggle.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
            if (isOpen) lockScroll(); else unlockScroll();
        });
        siteNav.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', closeNav);
        });
    }

    /* ---- Galeri lightbox ---- */
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    var lightboxClose = document.getElementById('lightboxClose');
    var lastTrigger = null;

    function openLightbox(src) {
        if (!lightbox || !lightboxImg || !src) return;
        lastTrigger = document.activeElement;
        lightboxImg.src = src;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        lockScroll();
        void lightbox.offsetWidth;
        if (lightboxClose) lightboxClose.focus();
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        unlockScroll();
        if (lastTrigger && typeof lastTrigger.focus === 'function') {
            lastTrigger.focus();
            lastTrigger = null;
        }
    }

    document.querySelectorAll('.gallery-item').forEach(function (item) {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        if (!item.getAttribute('aria-label')) {
            item.setAttribute('aria-label', 'Fotoğrafı büyüt');
        }
        item.addEventListener('click', function () {
            openLightbox(item.getAttribute('data-src'));
        });
        item.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(item.getAttribute('data-src'));
            }
        });
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) {
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) closeLightbox();
        });
    }
    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (siteNav && siteNav.classList.contains('open')) closeNav();
            closeLightbox();
        }
    });

    /* ---- Sipariş: miktar seçici + WhatsApp linki ---- */
    var qtyOptions = document.getElementById('qtyOptions');
    if (qtyOptions) {
        var orderTotal = document.getElementById('orderTotal');
        var waOrder = document.getElementById('waOrder');
        var PHONE = '905335195222';

        function formatTL(n) {
            return n.toLocaleString('tr-TR') + ' ₺';
        }

        function updateOrder(btn) {
            if (!btn) return;
            var kg = btn.getAttribute('data-kg');
            var price = parseInt(btn.getAttribute('data-price'), 10);
            if (!isFinite(price) || price <= 0) return;

            qtyOptions.querySelectorAll('.qty-btn').forEach(function (b) {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            if (orderTotal) orderTotal.textContent = formatTL(price);

            if (waOrder) {
                var msg = 'Merhaba, ' + kg + ' kg ceviz (' + formatTL(price).replace(' ₺', ' TL') + ') siparişi vermek istiyorum.';
                waOrder.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg);
            }
        }

        qtyOptions.querySelectorAll('.qty-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { updateOrder(btn); });
        });
        updateOrder(qtyOptions.querySelector('.qty-btn.active') || qtyOptions.querySelector('.qty-btn'));
    }

    /* ---- Hafif reveal ---- */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
        if (reduceMotion) {
            revealEls.forEach(function (el) { el.classList.add('in'); });
        } else {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
            revealEls.forEach(function (el) { io.observe(el); });
        }
    } else {
        revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    /* ============================================================
       3D CEVİZ — three.js
       ============================================================ */
    function webglOK() {
        try {
            var c = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
        } catch (e) { return false; }
    }

    function initWalnut() {
        var stage = document.getElementById('walnutStage');
        var view = stage ? stage.closest('.walnut-view') : null;
        var toggleBtn = document.getElementById('walnutToggle');
        var toggleLabel = document.getElementById('walnutToggleLabel');
        var hint = document.getElementById('walnutHint');
        if (!stage || reduceMotion || saveData || !webglOK()) return;

        var started = false;
        var io = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting && !started) {
                started = true;
                io.disconnect();
                Promise.all([
                    import('https://cdn.jsdelivr.net/npm/three@0.185.0/+esm'),
                    import('https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/environments/RoomEnvironment.js/+esm')
                        .catch(function () { return null; })
                ]).then(function (mods) {
                    build(mods[0], mods[1] ? mods[1].RoomEnvironment : null);
                }).catch(function () { /* fallback görsel kalır */ });
            }
        }, { rootMargin: '400px' });
        io.observe(stage);

        function build(THREE, RoomEnvironment) {
            var quality = lowPower ? 'low' : 'high';
            var w = stage.clientWidth || 460;
            var h = stage.clientHeight || 460;

            /* ---------- Renderer ---------- */
            var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1 : 1.5));
            renderer.setSize(w, h);
            renderer.domElement.className = 'walnut-canvas';
            if (THREE.ACESFilmicToneMapping !== undefined) {
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.18;
            }
            if (THREE.SRGBColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
            stage.appendChild(renderer.domElement);

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
            camera.position.set(0, 0.42, 3.7);
            camera.lookAt(0, 0, 0);

            /* ---------- Stüdyo ortamı ---------- */
            var envReady = false;
            if (RoomEnvironment) {
                try {
                    var pmrem = new THREE.PMREMGenerator(renderer);
                    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
                    pmrem.dispose();
                    envReady = true;
                } catch (e) {}
            }
            if (!envReady) {
                /* yedek: basit gradient equirect */
                try {
                    var envCanvas = document.createElement('canvas');
                    envCanvas.width = 128; envCanvas.height = 64;
                    var ectx = envCanvas.getContext('2d');
                    var eg = ectx.createLinearGradient(0, 0, 0, 64);
                    eg.addColorStop(0, '#fdf4e3');
                    eg.addColorStop(0.45, '#93a37e');
                    eg.addColorStop(1, '#1b2215');
                    ectx.fillStyle = eg;
                    ectx.fillRect(0, 0, 128, 64);
                    ectx.fillStyle = 'rgba(255,255,255,0.95)';
                    ectx.beginPath(); ectx.ellipse(38, 12, 22, 9, 0, 0, Math.PI * 2); ectx.fill();
                    var envTex = new THREE.CanvasTexture(envCanvas);
                    envTex.mapping = THREE.EquirectangularReflectionMapping;
                    if (THREE.SRGBColorSpace !== undefined) envTex.colorSpace = THREE.SRGBColorSpace;
                    var pm2 = new THREE.PMREMGenerator(renderer);
                    scene.environment = pm2.fromEquirectangular(envTex).texture;
                    pm2.dispose();
                    envTex.dispose();
                } catch (e) {}
            }

            /* ---------- Işıklar (env üstüne ince rig) ---------- */
            scene.add(new THREE.HemisphereLight(0xfff4e0, 0x1d2517, 0.25));

            var key = new THREE.DirectionalLight(0xfff1dc, 2.2);
            key.position.set(3.2, 4.2, 3.4);
            scene.add(key);

            var rim = new THREE.DirectionalLight(0xa9c8ff, 1.3);
            rim.position.set(-4.0, 1.6, -3.2);
            scene.add(rim);

            var fill = new THREE.DirectionalLight(0xffd9a0, 0.35);
            fill.position.set(-2.4, -1.6, 2.6);
            scene.add(fill);

            /* ---------- Prosedürel gürültü ---------- */
            function makeNoise3D(seed) {
                function hash(x, y, z) {
                    var n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed) * 43758.5453123;
                    return n - Math.floor(n);
                }
                function fade(t) { return t * t * (3 - 2 * t); }
                return function (x, y, z) {
                    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
                    var xf = x - xi, yf = y - yi, zf = z - zi;
                    var u = fade(xf), v = fade(yf), wv = fade(zf);
                    var c000 = hash(xi, yi, zi), c100 = hash(xi + 1, yi, zi);
                    var c010 = hash(xi, yi + 1, zi), c110 = hash(xi + 1, yi + 1, zi);
                    var c001 = hash(xi, yi, zi + 1), c101 = hash(xi + 1, yi, zi + 1);
                    var c011 = hash(xi, yi + 1, zi + 1), c111 = hash(xi + 1, yi + 1, zi + 1);
                    var x00 = c000 + (c100 - c000) * u, x10 = c010 + (c110 - c010) * u;
                    var x01 = c001 + (c101 - c001) * u, x11 = c011 + (c111 - c011) * u;
                    var y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
                    return y0 + (y1 - y0) * wv;
                };
            }
            var noise = makeNoise3D(17.3);

            function fbm(x, y, z, oct) {
                var s = 0, a = 0.5, f = 1, n = 0;
                for (var i = 0; i < oct; i++) {
                    s += a * noise(x * f, y * f, z * f);
                    n += a; f *= 2.03; a *= 0.5;
                }
                return s / n;
            }
            function ridged(x, y, z, oct) {
                var s = 0, a = 0.5, f = 1, n = 0;
                for (var i = 0; i < oct; i++) {
                    var v = noise(x * f, y * f, z * f);
                    v = 1 - Math.abs(v * 2 - 1);
                    v *= v;
                    s += a * v; n += a; f *= 2.11; a *= 0.5;
                }
                return s / n;
            }
            /* domain-warped ridged — organik kırışıklık */
            function shellField(x, y, z, oct) {
                var az = Math.abs(z);
                var q1 = fbm(x * 1.4 + 11.7, y * 1.4 + 33.1, az * 1.4 + 7.3, 2) - 0.5;
                var q2 = fbm(x * 1.4 + 47.9, y * 1.4 + 19.3, az * 1.4 + 61.1, 2) - 0.5;
                return ridged(x * 2.4 + q1 * 2.0, y * 1.5 + q2 * 2.0, az * 2.4 + q1 * 1.5, oct);
            }
            function kernelField(x, y, z, oct) {
                var az = Math.abs(z);
                var q1 = fbm(x * 2.2 + 5.1, y * 2.2 + 71.3, az * 2.2 + 3.7, 2) - 0.5;
                return ridged(x * 4.5 + q1 * 2.5, y * 3.6 + q1 * 2.5, az * 4.5, oct);
            }

            /* ---------- Doku üretimi (height + albedo koherent) ---------- */
            function lerpColor(c1, c2, t) {
                return [
                    Math.round(c1[0] + (c2[0] - c1[0]) * t),
                    Math.round(c1[1] + (c2[1] - c1[1]) * t),
                    Math.round(c1[2] + (c2[2] - c1[2]) * t)
                ];
            }
            function ramp(c1, c2, c3, t) {
                if (t < 0.5) return lerpColor(c1, c2, t * 2);
                return lerpColor(c2, c3, (t - 0.5) * 2);
            }

            function generateMaps(size, kind) {
                var isShell = kind === 'shell';
                var dark = isShell ? [74, 52, 28] : [138, 100, 55];
                var mid  = isShell ? [138, 106, 71] : [201, 168, 110];
                var light = isShell ? [186, 152, 104] : [232, 208, 160];

                var hCanvas = document.createElement('canvas');
                hCanvas.width = hCanvas.height = size;
                var hCtx = hCanvas.getContext('2d');
                var hImg = hCtx.createImageData(size, size);
                var hD = hImg.data;

                var aCanvas = document.createElement('canvas');
                aCanvas.width = aCanvas.height = size;
                var aCtx = aCanvas.getContext('2d');
                var aImg = aCtx.createImageData(size, size);
                var aD = aImg.data;

                var i = 0;
                for (var y = 0; y < size; y++) {
                    var theta = (y + 0.5) / size * Math.PI;
                    var st = Math.sin(theta), ct = Math.cos(theta);
                    for (var x = 0; x < size; x++) {
                        var phi = (x + 0.5) / size * Math.PI;
                        var px = -Math.cos(phi) * st;
                        var py = ct;
                        var pz = Math.sin(phi) * st;
                        var az = Math.abs(pz);

                        var hVal;
                        if (isShell) {
                            hVal = shellField(px, py, pz, 4) * 0.78 +
                                   fbm(px * 9.0, py * 4.5, az * 9.0, 3) * 0.22;
                        } else {
                            hVal = kernelField(px, py, pz, 4) * 0.72 +
                                   fbm(px * 16.0, py * 13.0, az * 16.0, 3) * 0.28;
                        }
                        if (hVal < 0) hVal = 0;
                        if (hVal > 1) hVal = 1;

                        var v = Math.round(hVal * 255);
                        hD[i] = v; hD[i + 1] = v; hD[i + 2] = v; hD[i + 3] = 255;

                        var jitter = (noise(px * 37.0 + 5.0, py * 37.0, az * 37.0) - 0.5) * 0.12;
                        var col = ramp(dark, mid, light, Math.max(0, Math.min(1, hVal + jitter)));
                        aD[i] = col[0]; aD[i + 1] = col[1]; aD[i + 2] = col[2]; aD[i + 3] = 255;

                        i += 4;
                    }
                }
                hCtx.putImageData(hImg, 0, 0);
                aCtx.putImageData(aImg, 0, 0);
                return { height: hCanvas, albedo: aCanvas };
            }

            var texSize = quality === 'low' ? 256 : 384;
            var shellMaps = generateMaps(texSize, 'shell');
            var kernelMaps = generateMaps(texSize, 'kernel');

            function makeTex(canvas, srgb) {
                var t = new THREE.CanvasTexture(canvas);
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                if (srgb && THREE.SRGBColorSpace !== undefined) t.colorSpace = THREE.SRGBColorSpace;
                return t;
            }

            var shellAlbedo = makeTex(shellMaps.albedo, true);
            var shellBump = makeTex(shellMaps.height, false);
            var kernelAlbedo = makeTex(kernelMaps.albedo, true);
            var kernelBump = makeTex(kernelMaps.height, false);

            /* ---------- Geometri ---------- */
            function shellDeform(geo, oct) {
                var pos = geo.attributes.position;
                var v = new THREE.Vector3();
                for (var i = 0; i < pos.count; i++) {
                    v.fromBufferAttribute(pos, i);
                    var n = v.clone().normalize();
                    var x = n.x, y = n.y, z = n.z;
                    var az = Math.abs(z);
                    var r = 1;

                    r += 0.12 * (shellField(x, y, z, oct) - 0.45);
                    r += 0.035 * (fbm(x * 9.0, y * 4.5, az * 9.0, 3) - 0.5);

                    /* dikiş çıkıntısı */
                    r += 0.022 * Math.exp(-Math.pow(az / 0.13, 2));

                    /* sivri dip */
                    if (y < -0.42) {
                        var t = (-y - 0.42) / 0.58;
                        var narrow = 1 - 0.55 * t * t;
                        x *= narrow; az *= narrow;
                    }
                    /* tepe hafif basıklık */
                    if (y > 0.72) {
                        var s = (y - 0.72) / 0.28;
                        r -= 0.05 * s * s;
                    }

                    v.set(x, y, n.z < 0 ? -az : az).normalize().multiplyScalar(r);
                    v.x *= 0.94; v.y *= 1.14; v.z *= 0.94;
                    pos.setXYZ(i, v.x, v.y, v.z);
                }
                geo.computeVertexNormals();
                return geo;
            }

            function kernelDeform(geo, oct) {
                var pos = geo.attributes.position;
                var v = new THREE.Vector3();
                for (var i = 0; i < pos.count; i++) {
                    v.fromBufferAttribute(pos, i);
                    var n = v.clone().normalize();
                    var x = n.x, y = n.y, z = n.z;
                    var az = Math.abs(z);
                    var r = 1;

                    r += 0.07 * (kernelField(x, y, z, oct) - 0.45);
                    r += 0.025 * (fbm(x * 16.0, y * 13.0, az * 16.0, 3) - 0.5);

                    /* orta yarık */
                    r -= 0.22 * Math.exp(-Math.pow(az / 0.14, 2));

                    v.set(x, y, n.z < 0 ? -az : az).normalize().multiplyScalar(r);
                    pos.setXYZ(i, v.x, v.y, v.z);
                }
                geo.computeVertexNormals();
                return geo;
            }

            var shellSeg = quality === 'low' ? [72, 48] : [96, 64];
            var kernelSeg = quality === 'low' ? [64, 44] : [84, 60];
            var shellOct = quality === 'low' ? 3 : 4;

            var shellGeoFront = shellDeform(new THREE.SphereGeometry(1, shellSeg[0], shellSeg[1], 0, Math.PI), shellOct);
            var shellGeoBack = shellDeform(new THREE.SphereGeometry(1, shellSeg[0], shellSeg[1], Math.PI, Math.PI), shellOct);
            var kernelGeo = kernelDeform(new THREE.SphereGeometry(0.78, kernelSeg[0], kernelSeg[1]), shellOct);

            /* ---------- Materyaller ---------- */
            var shellMat = new THREE.MeshPhysicalMaterial({
                map: shellAlbedo,
                bumpMap: shellBump,
                bumpScale: 0.05,
                roughness: 0.6,
                metalness: 0.02,
                clearcoat: 0.3,
                clearcoatRoughness: 0.55,
                side: THREE.DoubleSide,
                envMapIntensity: 1.0
            });

            var kernelMat = new THREE.MeshPhysicalMaterial({
                map: kernelAlbedo,
                bumpMap: kernelBump,
                bumpScale: 0.04,
                roughness: 0.45,
                metalness: 0.0,
                clearcoat: 0.2,
                clearcoatRoughness: 0.5,
                envMapIntensity: 1.15
            });

            /* ---------- Sahne düzeni ---------- */
            var walnut = new THREE.Group();
            var shellFront = new THREE.Mesh(shellGeoFront, shellMat);
            var shellBack = new THREE.Mesh(shellGeoBack, shellMat);
            var kernel = new THREE.Mesh(kernelGeo, kernelMat);
            kernel.scale.set(0.86, 1.0, 0.62);

            walnut.add(shellFront);
            walnut.add(shellBack);
            walnut.add(kernel);

            var holder = new THREE.Group();
            holder.add(walnut);
            holder.rotation.y = -0.4;
            scene.add(holder);

            /* Temas gölgesi */
            var shadowCanvas = document.createElement('canvas');
            shadowCanvas.width = shadowCanvas.height = 128;
            var sctx = shadowCanvas.getContext('2d');
            var sgrad = sctx.createRadialGradient(64, 64, 8, 64, 64, 62);
            sgrad.addColorStop(0, 'rgba(0,0,0,0.5)');
            sgrad.addColorStop(0.65, 'rgba(0,0,0,0.14)');
            sgrad.addColorStop(1, 'rgba(0,0,0,0)');
            sctx.fillStyle = sgrad;
            sctx.fillRect(0, 0, 128, 128);
            var shadowTex = new THREE.CanvasTexture(shadowCanvas);
            var shadowMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2.7, 2.7),
                new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.85 })
            );
            shadowMesh.rotation.x = -Math.PI / 2;
            shadowMesh.position.y = -1.34;
            scene.add(shadowMesh);

            /* ---------- Durum ---------- */
            var open = false;
            var openT = 0;
            var yawVel = 0;
            var pitch = 0.08, pitchTarget = 0.08;
            var dragging = false;
            var activePointerId = null;
            var downX = 0, downY = 0, downT = 0, moved = 0, lastMoveT = 0;

            function setOpen(next) {
                open = next;
                if (toggleLabel) toggleLabel.textContent = open ? 'Kabuğu Kapat' : 'Kabuğu Aç';
                if (toggleBtn) toggleBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
                if (hint) hint.textContent = open ? 'Kapatmak için dokunun' : 'Sürükleyin · dokununca açılır';
            }

            if (toggleBtn) {
                toggleBtn.addEventListener('click', function () { setOpen(!open); });
            }

            /* ---------- Sağlam drag ---------- */
            function endDrag(keepInertia) {
                if (!dragging) return;
                dragging = false;
                var pid = activePointerId;
                activePointerId = null;
                stage.classList.remove('dragging');
                if (pid !== null) {
                    try { stage.releasePointerCapture(pid); } catch (err) {}
                }
                if (!keepInertia) yawVel = 0;
            }

            stage.addEventListener('pointerdown', function (e) {
                if (!e.isPrimary) return;
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                if (activePointerId !== null) return;
                dragging = true;
                activePointerId = e.pointerId;
                moved = 0;
                downX = e.clientX; downY = e.clientY;
                downT = performance.now();
                lastMoveT = downT;
                yawVel = 0;
                stage.classList.add('dragging');
                try { stage.setPointerCapture(e.pointerId); } catch (err) {}
            });

            window.addEventListener('pointermove', function (e) {
                if (!dragging || e.pointerId !== activePointerId) return;
                /* kayıp pointerup sigortası: fare basılı değilse drag bitti */
                if (e.pointerType === 'mouse' && e.buttons === 0) {
                    endDrag(false);
                    return;
                }
                var now = performance.now();
                var dt = Math.max(0.001, (now - lastMoveT) / 1000);
                lastMoveT = now;

                var dx = e.clientX - downX;
                var dy = e.clientY - downY;
                downX = e.clientX; downY = e.clientY;
                moved += Math.abs(dx) + Math.abs(dy);

                var dYaw = dx * 0.0042;
                holder.rotation.y += dYaw;

                var instVel = dYaw / dt;
                if (instVel > 8) instVel = 8;
                if (instVel < -8) instVel = -8;
                yawVel = yawVel * 0.6 + instVel * 0.4;

                pitchTarget = Math.max(-0.55, Math.min(0.7, pitchTarget + dy * 0.0016));
            }, { passive: true });

            window.addEventListener('pointerup', function (e) {
                if (e.pointerId !== activePointerId) return;
                var wasClick = moved < 8 && performance.now() - downT < 450;
                endDrag(true);
                if (wasClick) setOpen(!open);
            });

            window.addEventListener('pointercancel', function (e) {
                if (e.pointerId !== activePointerId) return;
                endDrag(false);
            });

            stage.addEventListener('lostpointercapture', function (e) {
                if (e.pointerId === activePointerId) endDrag(false);
            });

            window.addEventListener('blur', function () {
                if (dragging) endDrag(false);
            });

            document.addEventListener('visibilitychange', function () {
                if (document.hidden && dragging) endDrag(false);
            });

            /* ---------- Render döngüsü ---------- */
            var visible = true;
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
            }, { threshold: 0 }).observe(stage);

            var last = 0;
            var perfStart = 0, perfFrames = 0, perfDone = false;

            function loop(t) {
                requestAnimationFrame(loop);
                if (!visible || document.hidden) return;
                if (!last) last = t;
                var dt = Math.min((t - last) / 1000, 0.05);
                last = t;

                /* adaptif kalite: ilk 2.6 sn'de düşük FPS → DPR düş */
                if (!perfDone) {
                    if (!perfStart) { perfStart = t; perfFrames = 0; }
                    perfFrames++;
                    if (t - perfStart > 2600) {
                        var avgFps = perfFrames / ((t - perfStart) / 1000);
                        if (avgFps < 34) renderer.setPixelRatio(1);
                        perfDone = true;
                    }
                }

                /* aç/kapa geçişi */
                var target = open ? 1 : 0;
                openT += (target - openT) * Math.min(1, dt * 4.2);
                var e = openT * openT * (3 - 2 * openT);

                shellFront.position.z = e * 0.95;
                shellFront.rotation.x = -e * 0.45;
                shellBack.position.z = -e * 0.95;
                shellBack.rotation.x = e * 0.45;

                kernel.scale.set(0.86 + e * 0.06, 1.0 + e * 0.04, 0.62 + e * 0.05);
                kernel.rotation.y += dt * 0.12;

                /* kamera açılınca hafif geri çekil */
                var camZ = 3.7 + e * 0.4;
                camera.position.z += (camZ - camera.position.z) * Math.min(1, dt * 3);

                /* atalet + idle dönüş */
                if (!dragging) {
                    holder.rotation.y += yawVel * dt;
                    yawVel *= Math.exp(-4.0 * dt);
                    if (Math.abs(yawVel) < 0.01) yawVel = 0;
                    holder.rotation.y += dt * 0.12 * (1 - e * 0.5);
                }

                pitch += (pitchTarget - pitch) * Math.min(1, dt * 6);
                holder.rotation.x = pitch;

                /* hafif süzülme */
                walnut.position.y = Math.sin(t * 0.0009) * 0.04;
                walnut.rotation.z = Math.sin(t * 0.0006) * 0.018;

                renderer.render(scene, camera);
            }
            requestAnimationFrame(loop);

            /* ---------- Yeniden boyutlandırma ---------- */
            function resize() {
                w = stage.clientWidth; h = stage.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            }
            window.addEventListener('resize', resize, { passive: true });

            /* ---------- Hazır ---------- */
            stage.classList.add('ready');
            if (view) view.classList.add('ready');
            if (hint) hint.textContent = 'Sürükleyin · dokununca açılır';
        }
    }

    initWalnut();
})();
