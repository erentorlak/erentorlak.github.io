/* ============================================================
   TR Ceviz Bahçesi — etkileşimler & animasyonlar
   ============================================================ */
(function () {
    'use strict';

    var header = document.getElementById('siteHeader');
    var navToggle = document.getElementById('navToggle');
    var siteNav = document.getElementById('siteNav');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isTouch = window.matchMedia('(hover: none)').matches;

    /* ---- Header: kaydırınca daral/arka plan ---- */
    function onScroll() {
        if (window.scrollY > 30) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---- Mobil menü ---- */
    function closeNav() {
        siteNav.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Menüyü aç');
        document.body.style.overflow = '';
    }

    function toggleNav() {
        var isOpen = siteNav.classList.toggle('open');
        navToggle.classList.toggle('active', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        navToggle.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    if (navToggle) {
        navToggle.addEventListener('click', toggleNav);
        siteNav.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', closeNav);
        });
    }

    /* ---- Kaydırma ile beliren (reveal) ---- */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(function (el) { io.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---- Galeri lightbox ---- */
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    var lightboxClose = document.getElementById('lightboxClose');
    var galleries = document.querySelectorAll('#gallery');

    function openLightbox(src, alt) {
        if (!lightbox || !src) return;
        lightboxImg.src = src;
        lightboxImg.alt = alt || 'Büyük fotoğraf';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    galleries.forEach(function (gallery) {
        gallery.querySelectorAll('.gallery-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var src = item.getAttribute('data-src');
                var cap = item.querySelector('.gallery-cap');
                openLightbox(src, cap ? cap.textContent : null);
            });
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    if (lightbox) {
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) closeLightbox();
        });
    }
    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeNav();
            closeLightbox();
        }
    });

    /* ============================================================
       Gelişmiş animasyonlar (GSAP + Lenis + SplitType + countUp)
       ============================================================ */
    var gsapOk = typeof window.gsap !== 'undefined';
    var ScrollTriggerOk = gsapOk && typeof window.ScrollTrigger !== 'undefined';
    var splitOk = typeof window.SplitType !== 'undefined';
    var lenisOk = typeof window.Lenis !== 'undefined';
    var countOk = typeof window.countUp !== 'undefined' && typeof window.countUp.CountUp !== 'undefined';
    var CountUpCls = countOk ? window.countUp.CountUp : null;

    /* ---- Lenis smooth scroll ---- */
    var lenis = null;
    if (lenisOk && !reduceMotion && !isTouch) {
        lenis = new Lenis({
            duration: 1.1,
            easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
            smoothWheel: true,
        });
        if (ScrollTriggerOk) {
            lenis.on('scroll', ScrollTrigger.update);
        }
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    /* ---- GSAP: başlık text reveal (SplitType) ---- */
    if (ScrollTriggerOk) {
        gsap.registerPlugin(ScrollTrigger);

        if (splitOk && !reduceMotion) {
            document.querySelectorAll('[data-split]').forEach(function (el) {
                var St = new SplitType(el, { types: 'lines, words' });
                if (!St.lines) return;
                gsap.fromTo(St.lines,
                    { yPercent: 120, opacity: 0 },
                    {
                        yPercent: 0, opacity: 1, duration: 1,
                        ease: 'power3.out',
                        stagger: 0.08,
                        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
                    }
                );
            });
        }

        /* ---- Görsel clip-path reveal ---- */
        if (!reduceMotion) {
            document.querySelectorAll('.reveal-img').forEach(function (img) {
                gsap.fromTo(img,
                    { clipPath: 'inset(0 0 100% 0)', y: 40 },
                    {
                        clipPath: 'inset(0 0 0% 0)', y: 0, duration: 1.1,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: img, start: 'top 88%', toggleActions: 'play none none none' }
                    }
                );
            });
        }

        /* ---- Hero parallax ---- */
        var heroBg = document.querySelector('.hero-bg');
        if (heroBg && !reduceMotion) {
            gsap.to(heroBg, {
                yPercent: 12,
                ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
            });
        }
    }

    /* ---- CountUp sayaçlar ---- */
    if (countOk && !reduceMotion) {
        document.querySelectorAll('[data-count]').forEach(function (el) {
            var target = parseFloat(el.getAttribute('data-count'));
            var suffix = el.getAttribute('data-suffix') || '';
            var opts = {
                duration: 2.2,
                suffix: suffix,
                separator: target >= 10000 ? '.' : '',
                useGrouping: target >= 10000,
            };
            var counter = new CountUpCls(el, target, opts);
            if (counter.error) return;
            if ('IntersectionObserver' in window) {
                var cio = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            counter.start();
                            cio.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.5 });
                cio.observe(el);
            } else {
                counter.start();
            }
        });
    } else if (countOk) {
        document.querySelectorAll('[data-count]').forEach(function (el) {
            el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
        });
    }

    /* ---- Sticky scroll (shop) ---- */
    if (ScrollTriggerOk && !reduceMotion) {
        var stickyMedia = document.querySelector('.sticky-media');
        if (stickyMedia) {
            gsap.fromTo(stickyMedia,
                { scale: 0.95 },
                { scale: 1, ease: 'none', scrollTrigger: { trigger: '.sticky-scroll', start: 'top top', end: 'bottom bottom', scrub: true } }
            );
        }
    }
})();
