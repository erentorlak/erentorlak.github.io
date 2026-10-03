/* ============================================================
   TR Ceviz Bahçesi — etkileşim katmanı
   (header, menü, lightbox, sipariş, reveal) + 3D ceviz sahnesi
   ============================================================ */
(function () {
    'use strict';

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
       3D CEVİZ — three.js, yalnız bu site'ın imza anı
       İki kabuk yarısı + beyin kıvrımlı iç, aç/kapa, sürükle-döndür
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
        if (!stage || reduceMotion || saveData || lowPower || !webglOK()) return;

        var started = false;
        var io = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting && !started) {
                started = true;
                io.disconnect();
                import('https://cdn.jsdelivr.net/npm/three@0.185.0/+esm')
                    .then(build)
                    .catch(function () { /* fallback görsel kalır */ });
            }
        }, { rootMargin: '400px' });
        io.observe(stage);

        function build(THREE) {
            var w = stage.clientWidth || 460;
            var h = stage.clientHeight || 460;

            /* ---------- Renderer ---------- */
            var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            renderer.setSize(w, h);
            renderer.domElement.className = 'walnut-canvas';
            if (THREE.ACESFilmicToneMapping !== undefined) {
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.08;
            }
            if (THREE.SRGBColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
            stage.appendChild(renderer.domElement);

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
            camera.position.set(0, 0.42, 3.7);
            camera.lookAt(0, 0, 0);

            /* ---------- Stüdyo ortamı (PMREM) ---------- */
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
                ectx.fillStyle = 'rgba(255,236,200,0.55)';
                ectx.beginPath(); ectx.ellipse(100, 20, 14, 6, 0, 0, Math.PI * 2); ectx.fill();
                var envTex = new THREE.CanvasTexture(envCanvas);
                envTex.mapping = THREE.EquirectangularReflectionMapping;
                if (THREE.SRGBColorSpace !== undefined) envTex.colorSpace = THREE.SRGBColorSpace;
                var pmrem = new THREE.PMREMGenerator(renderer);
                scene.environment = pmrem.fromEquirectangular(envTex).texture;
                pmrem.dispose();
                envTex.dispose();
            } catch (e) {}

            /* ---------- Işıklar ---------- */
            scene.add(new THREE.HemisphereLight(0xfff4e0, 0x1d2517, 0.5));

            var key = new THREE.DirectionalLight(0xffe8c8, 2.3);
            key.position.set(3.2, 4.2, 3.4);
            scene.add(key);

            var rim = new THREE.DirectionalLight(0xa9c8ff, 1.6);
            rim.position.set(-4.0, 1.6, -3.2);
            scene.add(rim);

            var fill = new THREE.DirectionalLight(0xffd9a0, 0.55);
            fill.position.set(-2.4, -1.6, 2.6);
            scene.add(fill);

            /* ---------- Prosedürel dokular ---------- */
            function rgba(r, g, b, a) { return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }

            function paintOrganic(size, base, dark, light, streaks, speckles) {
                var c = document.createElement('canvas');
                c.width = c.height = size;
                var ctx = c.getContext('2d');
                ctx.fillStyle = base;
                ctx.fillRect(0, 0, size, size);

                for (var i = 0; i < 240; i++) {
                    var x = Math.random() * size, y = Math.random() * size;
                    var r = 10 + Math.random() * 76;
                    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
                    var col = Math.random() < 0.5 ? dark : light;
                    g.addColorStop(0, rgba(col[0], col[1], col[2], 0.04 + Math.random() * 0.1));
                    g.addColorStop(1, rgba(col[0], col[1], col[2], 0));
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
                }

                for (var s = 0; s < streaks; s++) {
                    var sx = Math.random() * size, sy = Math.random() * size;
                    var len = 26 + Math.random() * 130;
                    var wid = 0.8 + Math.random() * 2.6;
                    ctx.save();
                    ctx.translate(sx, sy);
                    ctx.rotate((Math.random() - 0.5) * 0.55);
                    ctx.fillStyle = rgba(dark[0], dark[1], dark[2], 0.03 + Math.random() * 0.08);
                    ctx.fillRect(-wid / 2, -len / 2, wid, len);
                    ctx.restore();
                }

                for (var k = 0; k < speckles; k++) {
                    var px = Math.random() * size, py = Math.random() * size;
                    var t = Math.random() < 0.5 ? dark : light;
                    ctx.fillStyle = rgba(t[0], t[1], t[2], 0.07 + Math.random() * 0.07);
                    ctx.fillRect(px, py, 1 + Math.random() * 1.6, 1 + Math.random() * 1.6);
                }
                return c;
            }

            /* Kabuk dokusu: kahve tonları, mottling + çizikler */
            var shellCanvas = paintOrganic(512, '#8a6a47', [58, 38, 18], [178, 142, 96], 150, 2400);
            /* İç (çekirdek) dokusu: açık tan, kıvrım fırçaları */
            var kernelCanvas = paintOrganic(512, '#c9a86e', [140, 102, 56], [232, 204, 152], 380, 3000);

            function makeTex(canvas, repeat) {
                var t = new THREE.CanvasTexture(canvas);
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                if (repeat) t.repeat.set(repeat, repeat);
                if (THREE.SRGBColorSpace !== undefined) t.colorSpace = THREE.SRGBColorSpace;
                return t;
            }

            var shellTex = makeTex(shellCanvas, 2.2);
            var kernelTex = makeTex(kernelCanvas, 2.0);

            /* ---------- Geometri deformasyonu ---------- */
            function shellDeform(geo) {
                var pos = geo.attributes.position;
                var v = new THREE.Vector3();
                for (var i = 0; i < pos.count; i++) {
                    v.fromBufferAttribute(pos, i);
                    var n = v.clone().normalize();
                    var x = n.x, y = n.y, az = Math.abs(n.z);
                    var r = 1;

                    /* kırışıklıklar — dikey uzatılmış */
                    r += 0.030 * (Math.sin(x * 3.1 + Math.sin(y * 2.3) * 1.7) * Math.cos(y * 2.7 + az * 2.2) * Math.sin(az * 3.4 + x * 1.9));
                    r += 0.014 * (Math.sin(x * 8.7 + 1.1) * Math.cos(y * 6.4 + 2.2) * Math.sin(az * 7.9));
                    r += 0.006 * (Math.sin(x * 17.3 + 0.4) * Math.cos(y * 15.1) * Math.sin(az * 16.7 + 1.3));

                    /* dikiş çıkıntısı (z≈0 düzleminde) */
                    r += 0.022 * Math.exp(-Math.pow(az / 0.14, 2));

                    /* dip noktası (konik) */
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
                    /* genel oran: hafif dikey uzun */
                    v.x *= 0.94; v.y *= 1.14; v.z *= 0.94;
                    pos.setXYZ(i, v.x, v.y, v.z);
                }
                geo.computeVertexNormals();
                return geo;
            }

            function kernelDeform(geo) {
                var pos = geo.attributes.position;
                var v = new THREE.Vector3();
                for (var i = 0; i < pos.count; i++) {
                    v.fromBufferAttribute(pos, i);
                    var n = v.clone().normalize();
                    var x = n.x, y = n.y, az = Math.abs(n.z);
                    var r = 1;

                    /* beyin kıvrımları — sık ve derin */
                    r += 0.028 * (Math.sin(x * 9.3 + Math.sin(y * 7.1) * 1.4) * Math.cos(y * 8.2 + az * 6.6) * Math.sin(az * 9.8 + x * 5.7));
                    r += 0.012 * (Math.sin(x * 19.1) * Math.cos(y * 17.6 + 1.2) * Math.sin(az * 18.4 + 2.1));
                    r += 0.005 * (Math.sin(x * 33.7 + 0.7) * Math.cos(y * 31.3) * Math.sin(az * 32.9));

                    /* orta yarık (dikiş düzlemi) */
                    r -= 0.20 * Math.exp(-Math.pow(az / 0.16, 2));

                    v.set(x, y, n.z < 0 ? -az : az).normalize().multiplyScalar(r);
                    pos.setXYZ(i, v.x, v.y, v.z);
                }
                geo.computeVertexNormals();
                return geo;
            }

            /* ---------- Mesh'ler ---------- */
            var shellMat = new THREE.MeshStandardMaterial({
                map: shellTex,
                bumpMap: shellTex,
                bumpScale: 0.55,
                color: 0xffffff,
                roughness: 0.58,
                metalness: 0.03,
                side: THREE.DoubleSide,
                envMapIntensity: 0.9
            });

            var kernelMat = new THREE.MeshStandardMaterial({
                map: kernelTex,
                bumpMap: kernelTex,
                bumpScale: 0.5,
                color: 0xffffff,
                roughness: 0.7,
                metalness: 0.0,
                envMapIntensity: 0.6
            });

            var shellGeoFront = shellDeform(new THREE.SphereGeometry(1, 96, 64, 0, Math.PI));
            var shellGeoBack = shellDeform(new THREE.SphereGeometry(1, 96, 64, Math.PI, Math.PI));
            var kernelGeo = kernelDeform(new THREE.SphereGeometry(0.78, 80, 56));

            var walnut = new THREE.Group();

            var shellFront = new THREE.Mesh(shellGeoFront, shellMat);
            var shellBack = new THREE.Mesh(shellGeoBack, shellMat);
            var kernel = new THREE.Mesh(kernelGeo, kernelMat);
            kernel.scale.set(0.86, 1.0, 0.62);

            walnut.add(shellFront);
            walnut.add(shellBack);
            walnut.add(kernel);

            var holder = new THREE.Group();   /* sürükleme döndürmesi */
            holder.add(walnut);
            scene.add(holder);

            /* Temas gölgesi — derinlik hissi */
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

            /* ---------- Etkileşim ---------- */
            var open = false;
            var openT = 0;              /* animasyon değeri 0..1 */
            var yawVel = 0;             /* atalet */
            var pitch = 0.08, pitchTarget = 0.08;
            var dragging = false;
            var downX = 0, downY = 0, downT = 0, moved = 0;

            function setOpen(next) {
                open = next;
                if (toggleLabel) toggleLabel.textContent = open ? 'Kabuğu Kapat' : 'Kabuğu Aç';
                if (toggleBtn) toggleBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
                if (hint) hint.textContent = open ? 'Kapatmak için dokunun' : 'Sürükleyin · dokununca açılır';
            }

            if (toggleBtn) {
                toggleBtn.addEventListener('click', function () { setOpen(!open); });
            }

            stage.addEventListener('pointerdown', function (e) {
                dragging = true;
                moved = 0;
                downX = e.clientX; downY = e.clientY;
                downT = performance.now();
                stage.classList.add('dragging');
                try { stage.setPointerCapture(e.pointerId); } catch (err) {}
            });
            window.addEventListener('pointermove', function (e) {
                if (!dragging) return;
                var dx = e.clientX - downX;
                var dy = e.clientY - downY;
                moved += Math.abs(dx) + Math.abs(dy);
                downX = e.clientX; downY = e.clientY;
                yawVel += dx * 0.0022;
                pitchTarget = Math.max(-0.55, Math.min(0.7, pitchTarget + dy * 0.0016));
            });
            window.addEventListener('pointerup', function () {
                if (!dragging) return;
                dragging = false;
                stage.classList.remove('dragging');
                if (moved < 8 && performance.now() - downT < 450) {
                    setOpen(!open);
                }
            });

            /* ---------- Render döngüsü ---------- */
            var visible = true;
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
            }, { threshold: 0 }).observe(stage);

            var last = 0;
            /* adaptif kalite izleme */
            var perfStart = 0, perfFrames = 0, perfDone = false;

            function loop(t) {
                requestAnimationFrame(loop);
                if (!visible || document.hidden) return;
                if (!last) last = t;
                var dt = Math.min((t - last) / 1000, 0.05);
                last = t;

                /* düşük FPS tespiti → kaliteyi düşür (yalnız bir kez) */
                if (!perfDone) {
                    if (!perfStart) { perfStart = t; perfFrames = 0; }
                    perfFrames++;
                    if (t - perfStart > 2600) {
                        var avgFps = perfFrames / ((t - perfStart) / 1000);
                        if (avgFps < 34) {
                            renderer.setPixelRatio(1);
                        }
                        perfDone = true;
                    }
                }

                /* aç/kapa yumuşak geçiş */
                var target = open ? 1 : 0;
                openT += (target - openT) * Math.min(1, dt * 5);
                var e = openT * openT * (3 - 2 * openT);   /* smoothstep */

                /* kabuk yarıları */
                shellFront.position.z = e * 0.92;
                shellFront.rotation.x = -e * 0.42;
                shellBack.position.z = -e * 0.92;
                shellBack.rotation.x = e * 0.42;

                /* iç: açılırken hafif büyü ve dön */
                kernel.scale.set(0.86 + e * 0.06, 1.0 + e * 0.04, 0.62 + e * 0.05);
                kernel.rotation.y += (1 - e) * 0.0 + dt * 0.12;

                /* sürükleme ataleti + taban dönüş */
                holder.rotation.y += yawVel + dt * 0.22 * (1 - e * 0.45);
                yawVel *= 0.94;
                pitch += (pitchTarget - pitch) * Math.min(1, dt * 6);
                holder.rotation.x = pitch;

                /* hafif süzülme */
                walnut.position.y = Math.sin(t * 0.0009) * 0.045;
                walnut.rotation.z = Math.sin(t * 0.0006) * 0.02;

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
