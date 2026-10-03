/* TR Ceviz Bahçesi — hafif etkileşimler */
(function () {
    'use strict';

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
        document.body.style.overflow = '';
    }

    if (navToggle && siteNav) {
        navToggle.addEventListener('click', function () {
            var isOpen = siteNav.classList.toggle('open');
            navToggle.classList.toggle('active', isOpen);
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            navToggle.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
            document.body.style.overflow = isOpen ? 'hidden' : '';
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
        document.body.style.overflow = 'hidden';
        void lightbox.offsetWidth; /* stil hesabını zorla; odaklanabilir olsun */
        if (lightboxClose) lightboxClose.focus();
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
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

    /* ---- Hafif reveal (kütüphanesiz) ---- */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
        revealEls.forEach(function (el) { io.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add('in'); });
    }
})();
