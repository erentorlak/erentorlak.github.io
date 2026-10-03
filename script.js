/* ============================================================
   TR Ceviz Bahçesi — v4 (2026-10-03)
   (header, menü, lightbox, sipariş, reveal) + 3D ceviz sahnesi
   Sahne: RoomEnvironment stüdyo ortamı, domain-warped kabuk
   geometrisi, koherent prosedürel dokular, sağlam drag etkileşimi
   ============================================================ */
(function () {
    'use strict';

    if (window.console && console.info) console.info('TRC Ceviz — build v8 (clean scan, inner experiment reverted)');

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
        var hint = document.getElementById('walnutHint');
        if (!stage || reduceMotion || saveData || !webglOK()) return;

        var started = false;
        var io = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting && !started) {
                started = true;
                io.disconnect();
                Promise.all([
                    import('https://cdn.jsdelivr.net/npm/three@0.185.0/+esm'),
                    import('https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/loaders/GLTFLoader.js/+esm'),
                    import('https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/environments/RoomEnvironment.js/+esm')
                        .catch(function () { return null; })
                ]).then(function (mods) {
                    build(mods[0], mods[1].GLTFLoader, mods[2] ? mods[2].RoomEnvironment : null);
                }).catch(function () { /* fallback görsel kalır */ });
            }
        }, { rootMargin: '400px' });
        io.observe(stage);

        function build(THREE, GLTFLoader, RoomEnvironment) {
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
                renderer.toneMappingExposure = 1.12;
            }
            if (THREE.SRGBColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
            stage.appendChild(renderer.domElement);

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
            camera.position.set(0, 0.25, 3.6);
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

            /* ---------- Işıklar ---------- */
            scene.add(new THREE.HemisphereLight(0xfff4e0, 0x1d2517, 0.28));

            var key = new THREE.DirectionalLight(0xfff1dc, 2.3);
            key.position.set(3.2, 4.2, 3.4);
            scene.add(key);

            var rim = new THREE.DirectionalLight(0xa9c8ff, 1.3);
            rim.position.set(-4.0, 1.6, -3.2);
            scene.add(rim);

            var fill = new THREE.DirectionalLight(0xffd9a0, 0.32);
            fill.position.set(-2.4, -1.6, 2.6);
            scene.add(fill);

            /* ---------- Gerçek fotogrametri modeli ---------- */
            var holder = new THREE.Group();   /* sürükleme döndürmesi */
            holder.rotation.y = -0.35;
            scene.add(holder);

            /* Temas gölgesi (model yüklenene kadar gizli) */
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
                new THREE.PlaneGeometry(2.6, 2.6),
                new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0 })
            );
            shadowMesh.rotation.x = -Math.PI / 2;
            shadowMesh.position.y = -1.15;
            scene.add(shadowMesh);

            /* ---------- Durum ---------- */
            var yawVel = 0;
            var pitch = 0.06, pitchTarget = 0.06;
            var dragging = false;
            var activePointerId = null;
            var downX = 0, downY = 0, downT = 0, moved = 0, lastMoveT = 0;
            var modelReady = false;
            var wrapper = null;

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

                pitchTarget = Math.max(-0.6, Math.min(0.75, pitchTarget + dy * 0.0016));
            }, { passive: true });

            window.addEventListener('pointerup', function (e) {
                if (e.pointerId !== activePointerId) return;
                endDrag(true);
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

            /* ---------- Model yükle ---------- */
            var loader = new GLTFLoader();
            loader.load('models/walnut.glb', function (gltf) {
                var root = gltf.scene;
                root.traverse(function (o) {
                    if (o.isMesh) {
                        o.material.side = THREE.DoubleSide;
                        if (o.material.map) {
                            o.material.map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
                        }
                    }
                });

                /* Normalizasyon: merkez + ölçek (wrapper deseni) */
                var box = new THREE.Box3().setFromObject(root);
                var center = box.getCenter(new THREE.Vector3());
                var size = box.getSize(new THREE.Vector3());
                var scale = 2.0 / Math.max(size.x, size.y, size.z);

                wrapper = new THREE.Group();
                wrapper.add(root);
                root.position.sub(center);
                wrapper.scale.setScalar(scale);
                holder.add(wrapper);

                shadowMesh.material.opacity = 0.8;
                modelReady = true;

                stage.classList.add('ready');
                if (hint) hint.textContent = 'Sürükleyip döndürün';
            }, undefined, function () {
                /* yükleme hatası: durgun görsel kalır */
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

                if (!perfDone) {
                    if (!perfStart) { perfStart = t; perfFrames = 0; }
                    perfFrames++;
                    if (t - perfStart > 2600) {
                        var avgFps = perfFrames / ((t - perfStart) / 1000);
                        if (avgFps < 34) renderer.setPixelRatio(1);
                        perfDone = true;
                    }
                }

                if (modelReady) {
                    /* atalet + idle dönüş */
                    if (!dragging) {
                        holder.rotation.y += yawVel * dt;
                        yawVel *= Math.exp(-4.0 * dt);
                        if (Math.abs(yawVel) < 0.01) yawVel = 0;
                        holder.rotation.y += dt * 0.1;
                    }

                    pitch += (pitchTarget - pitch) * Math.min(1, dt * 6);
                    holder.rotation.x = pitch;

                    /* hafif süzülme */
                    if (wrapper) wrapper.position.y = Math.sin(t * 0.0009) * 0.03;
                }

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
        }
    }

    initWalnut();
})();
