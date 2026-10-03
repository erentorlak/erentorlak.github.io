/* ============================================================
   TR Ceviz Bahçesi — etkileşim & animasyon katmanı
   Strateji: progressive enhancement; her efekt opsiyonel,
   cihaz/tercih kapılarından geçer, hata halinde site çalışır.
   ============================================================ */
(function () {
    'use strict';

    /* ---- Ortam kapıları ---- */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isFinePointer = window.matchMedia('(pointer: fine)').matches;
    var isTouch = window.matchMedia('(hover: none)').matches;
    var conn = navigator.connection || {};
    var saveData = !!conn.saveData;
    var lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
                   (navigator.deviceMemory && navigator.deviceMemory <= 4);
    var hasGSAP = typeof window.gsap !== 'undefined';
    var hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
    var hasSplitText = hasGSAP && typeof window.SplitText !== 'undefined';
    var hasLenis = typeof window.Lenis !== 'undefined';

    if (hasGSAP && hasScrollTrigger) { try { gsap.registerPlugin(ScrollTrigger); } catch (e) {} }
    if (hasGSAP && hasSplitText) { try { gsap.registerPlugin(SplitText); } catch (e) {} }

    /* ---- Scroll kilidi (menü/lightbox/preloader ortak) ---- */
    var lenis = null;
    function lockScroll() {
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
    }
    function unlockScroll() {
        document.body.style.overflow = '';
        if (lenis) lenis.start();
    }

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

    /* ============================================================
       1) PRELOADER — index'te, oturumda bir kez
       ============================================================ */
    var preloaderEl = document.getElementById('preloader');
    function runPreloader(done) {
        if (!preloaderEl) { done(); return; }

        var isFirstVisit = true;
        try { isFirstVisit = !sessionStorage.getItem('trcvz-intro'); } catch (e) {}

        if (reduceMotion || !isFirstVisit) {
            preloaderEl.remove();
            done();
            return;
        }

        document.body.classList.add('is-loading');
        lockScroll();

        var countEl = document.getElementById('preloaderCount');
        var start = performance.now();
        var DUR = 850;

        function tick(now) {
            var p = Math.min(1, (now - start) / DUR);
            var eased = 1 - Math.pow(1 - p, 3);
            if (countEl) countEl.textContent = String(Math.round(eased * 100));
            if (p < 1) {
                requestAnimationFrame(tick);
            } else {
                try { sessionStorage.setItem('trcvz-intro', '1'); } catch (e) {}
                preloaderEl.classList.add('done');
                document.body.classList.remove('is-loading');
                unlockScroll();
                setTimeout(function () { preloaderEl.remove(); }, 950);
                done();
            }
        }
        requestAnimationFrame(tick);
    }

    /* ============================================================
       2) LENIS + GSAP — smooth scroll & scroll hikâyesi
       ============================================================ */
    if (hasLenis && hasGSAP && hasScrollTrigger && !reduceMotion && !isTouch) {
        lenis = new Lenis({ autoRaf: false, duration: 1.05, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
    }

    /* Split başlıklar */
    function initSplits(playHero) {
        var els = document.querySelectorAll('[data-split]');
        if (!hasSplitText || !hasScrollTrigger || reduceMotion || !els.length) { playHero(); return; }

        function init() {
            var heroTween = null;
            els.forEach(function (el) {
                var isHero = !!el.closest('.hero');
                try {
                    var split = new SplitText(el, { type: 'lines', linesClass: 'split-line', aria: 'auto' });
                    var tween = gsap.from(split.lines, {
                        yPercent: 120,
                        opacity: 0,
                        duration: 1,
                        ease: 'power3.out',
                        stagger: 0.08,
                        paused: true
                    });
                    if (isHero) {
                        heroTween = tween;
                    } else {
                        ScrollTrigger.create({
                            trigger: el,
                            start: 'top 85%',
                            once: true,
                            onEnter: function () { tween.play(); }
                        });
                    }
                } catch (e) {}
            });
            playHero(heroTween);
        }

        if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
            document.fonts.ready.then(init);
        } else {
            init();
        }
    }

    /* Hafif reveal (IntersectionObserver — GSAP'siz de çalışır) */
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
       3) HERO PARTİKÜLLERİ — Canvas 2D (sıfır bağımlılık)
       ============================================================ */
    function initParticles() {
        var canvas = document.getElementById('heroCanvas');
        if (!canvas || reduceMotion || saveData) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var hero = canvas.parentElement;
        var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
        var w = 0, h = 0, running = true;
        var COUNT = (window.innerWidth < 720 ? 28 : 55);
        var parts = [];

        function resize() {
            w = hero.offsetWidth; h = hero.offsetHeight;
            canvas.width = Math.round(w * DPR);
            canvas.height = Math.round(h * DPR);
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }

        function spawn(initial) {
            return {
                x: Math.random() * w,
                y: initial ? Math.random() * h : h + 10,
                r: 0.8 + Math.random() * 2,
                vy: -0.15 - Math.random() * 0.35,
                vx: (Math.random() - 0.5) * 0.15,
                a: 0.06 + Math.random() * 0.22,
                sw: Math.random() * Math.PI * 2,
                sa: 0.2 + Math.random() * 0.5
            };
        }

        function seed() {
            parts = [];
            for (var i = 0; i < COUNT; i++) parts.push(spawn(true));
        }

        var t = 0;
        function frame() {
            if (running) {
                t++;
                ctx.clearRect(0, 0, w, h);
                for (var i = 0; i < parts.length; i++) {
                    var p = parts[i];
                    p.y += p.vy;
                    p.x += p.vx + Math.sin(t * 0.01 * p.sa + p.sw) * 0.18;
                    if (p.y < -12 || p.x < -14 || p.x > w + 14) parts[i] = spawn(false);
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, 6.2832);
                    ctx.fillStyle = 'rgba(247, 243, 239, ' + p.a.toFixed(3) + ')';
                    ctx.fill();
                }
            }
            requestAnimationFrame(frame);
        }

        resize();
        seed();
        frame();

        window.addEventListener('resize', function () { resize(); seed(); }, { passive: true });

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                running = entries[0].isIntersecting;
            }, { threshold: 0 }).observe(hero);
        }
        document.addEventListener('visibilitychange', function () {
            running = !document.hidden;
        });
    }

    /* ============================================================
       4) CUSTOM CURSOR — yalnız hassas işaretçi (desktop)
       ============================================================ */
    function initCursor() {
        if (!isFinePointer || isTouch || reduceMotion) return;

        var dot = document.createElement('div');
        dot.className = 'cursor-dot';
        dot.setAttribute('aria-hidden', 'true');
        var ring = document.createElement('div');
        ring.className = 'cursor-ring';
        ring.setAttribute('aria-hidden', 'true');
        ring.innerHTML = '<span></span>';
        document.body.appendChild(dot);
        document.body.appendChild(ring);
        document.documentElement.classList.add('has-cursor');

        var mx = -100, my = -100, rx = -100, ry = -100;
        var shown = false;

        window.addEventListener('mousemove', function (e) {
            mx = e.clientX; my = e.clientY;
            if (!shown) { shown = true; rx = mx; ry = my; dot.style.opacity = '1'; ring.style.opacity = '1'; }
            var interactive = e.target && e.target.closest && e.target.closest('a, button, .gallery-item, .qty-btn, input, [role="button"]');
            ring.classList.toggle('is-hover', !!interactive);
        }, { passive: true });

        function loop() {
            rx += (mx - rx) * 0.16;
            ry += (my - ry) * 0.16;
            dot.style.transform = 'translate(' + (mx - 3) + 'px, ' + (my - 3) + 'px)';
            ring.style.transform = 'translate(' + (rx - 18) + 'px, ' + (ry - 18) + 'px)';
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);

        document.addEventListener('mouseleave', function () {
            dot.style.opacity = '0'; ring.style.opacity = '0'; shown = false;
        });
        document.addEventListener('mouseenter', function () {
            if (shown) { dot.style.opacity = '1'; ring.style.opacity = '1'; }
        });
    }

    /* ============================================================
       5) 3D CEVİZ — three.js (lazy, kapılı)
       ============================================================ */
    function webglOK() {
        try {
            var c = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
        } catch (e) { return false; }
    }

    function initWalnut() {
        var stage = document.getElementById('walnutStage');
        if (!stage || reduceMotion || saveData || lowPower || !webglOK()) return;

        var started = false;
        var io = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting && !started) {
                started = true;
                io.disconnect();
                import('https://cdn.jsdelivr.net/npm/three@0.185.0/+esm')
                    .then(build)
                    .catch(function () { /* fallback img kalır */ });
            }
        }, { rootMargin: '350px' });
        io.observe(stage);

        function build(THREE) {
            var w = stage.clientWidth || 400, h = stage.clientHeight || 400;

            var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
            renderer.setSize(w, h);
            renderer.domElement.className = 'walnut-canvas';
            stage.appendChild(renderer.domElement);

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
            camera.position.set(0, 0, 3.35);

            /* Prosedürel ceviz geometrisi: küre + kabuk kırışıklığı + orta çizgi */
            var geo = new THREE.SphereGeometry(1, 128, 96);
            var pos = geo.attributes.position;
            var v = new THREE.Vector3();
            for (var i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i);
                var x = v.x, y = v.y, z = v.z;
                var r = 1;
                r += 0.045 * Math.sin(x * 3.0 + y * 2.0) * Math.cos(y * 3.2 + z * 1.6) * Math.sin(z * 3.6 + x * 2.4);
                r += 0.02 * Math.sin(x * 9.0 + y * 7.0) * Math.cos(z * 8.0);
                r -= 0.075 * Math.exp(-Math.pow(x / 0.10, 2));   /* dikiş oluğu */
                r -= 0.12 * Math.pow(Math.max(0, -y), 1.6);      /* sivri dip */
                v.normalize().multiplyScalar(r);
                v.y *= 1.14; v.x *= 0.98; v.z *= 0.98;
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            geo.computeVertexNormals();

            /* Prosedürel bump dokusu */
            var bc = document.createElement('canvas');
            bc.width = bc.height = 256;
            var bctx = bc.getContext('2d');
            bctx.fillStyle = '#808080';
            bctx.fillRect(0, 0, 256, 256);
            for (var pass = 0; pass < 3; pass++) {
                var size = 1 << (pass + 1);
                for (var k = 0; k < 1600; k++) {
                    var g = 128 + (Math.random() * 2 - 1) * (42 >> pass);
                    bctx.fillStyle = 'rgba(' + (g | 0) + ',' + (g | 0) + ',' + (g | 0) + ',0.5)';
                    bctx.fillRect(Math.random() * 256, Math.random() * 256, size, size);
                }
            }
            var bump = new THREE.CanvasTexture(bc);
            bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
            bump.repeat.set(3, 3);

            var mat = new THREE.MeshStandardMaterial({
                color: 0x8a6a47,
                roughness: 0.82,
                metalness: 0.06,
                bumpMap: bump,
                bumpScale: 0.02
            });
            var mesh = new THREE.Mesh(geo, mat);
            scene.add(mesh);

            scene.add(new THREE.HemisphereLight(0xfff4e0, 0x1e2a18, 0.9));
            var key = new THREE.DirectionalLight(0xffe9c8, 2.4);
            key.position.set(3, 4, 3);
            scene.add(key);
            var rim = new THREE.DirectionalLight(0x9fc4ff, 1.0);
            rim.position.set(-4, -1, -3);
            scene.add(rim);
            var fill = new THREE.DirectionalLight(0xfff0d0, 0.5);
            fill.position.set(-2, 3, 2);
            scene.add(fill);

            /* Etkileşim: otomatik dönüş + sürükleme */
            var targetRY = 0.4, targetRX = -0.1;
            var curRY = targetRY, curRX = targetRX;
            var dragging = false, lastX = 0, lastY = 0, userTouched = false;

            stage.addEventListener('pointerdown', function (e) {
                dragging = true; userTouched = true;
                lastX = e.clientX; lastY = e.clientY;
                try { stage.setPointerCapture(e.pointerId); } catch (err) {}
            });
            window.addEventListener('pointermove', function (e) {
                if (!dragging) return;
                targetRY += (e.clientX - lastX) * 0.008;
                targetRX += (e.clientY - lastY) * 0.006;
                targetRX = Math.max(-1.1, Math.min(1.1, targetRX));
                lastX = e.clientX; lastY = e.clientY;
            });
            window.addEventListener('pointerup', function () { dragging = false; });

            var visible = true;
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
            }, { threshold: 0 }).observe(stage);

            function loop() {
                requestAnimationFrame(loop);
                if (!visible || document.hidden) return;
                if (!dragging && !userTouched) targetRY += 0.004;
                curRY += (targetRY - curRY) * 0.08;
                curRX += (targetRX - curRX) * 0.08;
                mesh.rotation.y = curRY;
                mesh.rotation.x = curRX;
                renderer.render(scene, camera);
            }
            requestAnimationFrame(loop);

            window.addEventListener('resize', function () {
                w = stage.clientWidth; h = stage.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            }, { passive: true });

            stage.classList.add('ready');
        }
    }

    /* ============================================================
       6) SHADER ZEMİN — OGL (lazy, kapılı)
       ============================================================ */
    function initShaderBg() {
        var host = document.getElementById('shaderBg');
        if (!host || reduceMotion || saveData || lowPower || !webglOK()) return;

        var started = false;
        var io = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting && !started) {
                started = true;
                io.disconnect();
                import('https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm')
                    .then(build)
                    .catch(function () {});
            }
        }, { rootMargin: '250px' });
        io.observe(host);

        function build(OGL) {
            var renderer = new OGL.Renderer({
                alpha: true,
                antialias: false,
                dpr: Math.min(window.devicePixelRatio || 1, 1.25) * 0.6
            });
            var gl = renderer.gl;
            host.appendChild(gl.canvas);

            var geometry = new OGL.Triangle(gl);
            var program = new OGL.Program(gl, {
                vertex: 'attribute vec2 position; attribute vec2 uv; varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 0, 1); }',
                fragment: [
                    'precision highp float;',
                    'varying vec2 vUv;',
                    'uniform float uTime;',
                    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }',
                    'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
                    ' float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));',
                    ' return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }',
                    'float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.05; a*=0.5; } return v; }',
                    'void main(){',
                    ' vec2 p = vUv * vec2(3.0, 2.2);',
                    ' float t = uTime * 0.045;',
                    ' float n = fbm(p + vec2(t, -t*0.7));',
                    ' float n2 = fbm(p * 1.8 - vec2(t*0.6, t*0.4));',
                    ' vec3 c1 = vec3(0.14, 0.19, 0.12);',
                    ' vec3 c2 = vec3(0.22, 0.29, 0.19);',
                    ' vec3 c3 = vec3(0.97, 0.78, 0.01);',
                    ' vec3 col = mix(c1, c2, smoothstep(0.2, 0.8, n));',
                    ' col = mix(col, c3, smoothstep(0.72, 1.0, n2) * 0.12);',
                    ' gl_FragColor = vec4(col, 1.0);',
                    '}'
                ].join('\n'),
                uniforms: { uTime: { value: 0 } }
            });
            var mesh = new OGL.Mesh(gl, { geometry: geometry, program: program });

            var visible = true;
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
            }, { threshold: 0 }).observe(host);

            var last = 0;
            function loop(t) {
                requestAnimationFrame(loop);
                if (!visible || document.hidden) return;
                if (t - last < 33) return; /* ~30fps sınırı */
                last = t;
                program.uniforms.uTime.value = t * 0.001;
                renderer.render({ scene: mesh });
            }
            requestAnimationFrame(loop);

            function resize() {
                renderer.setSize(host.clientWidth, host.clientHeight);
            }
            resize();
            window.addEventListener('resize', resize, { passive: true });
        }
    }

    /* ============================================================
       BOOT
       ============================================================ */
    initParticles();
    initCursor();
    initWalnut();
    initShaderBg();

    runPreloader(function () {
        initSplits(function (heroTween) {
            if (heroTween) heroTween.play();
        });
    });
})();
