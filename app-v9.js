/* ============================================================
   TR Ceviz Bahçesi — v10 (2026-10-03)
   header · mobil menü · lightbox · sipariş seçici · reveal
   ============================================================ */
(function () {
    'use strict';

    /* ---- Ortam kapıları ---- */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        var wasOpen = siteNav.classList.contains('open');
        siteNav.classList.remove('open');
        if (navToggle) {
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'Menüyü aç');
        }
        if (wasOpen) unlockScroll();
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

    function openLightbox(src, alt) {
        if (!lightbox || !lightboxImg || !src) return;
        lastTrigger = document.activeElement;
        lightboxImg.src = src;
        lightboxImg.alt = alt || 'Büyük fotoğraf';
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
        function activate() {
            var img = item.querySelector('img');
            openLightbox(item.getAttribute('data-src'), img ? img.alt : null);
        }
        item.addEventListener('click', activate);
        item.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate();
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


})();
