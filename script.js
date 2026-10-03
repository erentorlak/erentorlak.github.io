/* TR Ceviz Bahçesi — hafif etkileşimler */
(function () {
    'use strict';

    var header = document.getElementById('siteHeader');
    var navToggle = document.getElementById('navToggle');
    var siteNav = document.getElementById('siteNav');

    /* Header scroll */
    function onScroll() {
        if (header) {
            if (window.scrollY > 30) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Mobil menü */
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

    /* Galeri lightbox */
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    var lightboxClose = document.getElementById('lightboxClose');

    function openLightbox(src) {
        if (!lightbox || !lightboxImg || !src) return;
        lightboxImg.src = src;
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

    document.querySelectorAll('.gallery-item').forEach(function (item) {
        item.addEventListener('click', function () {
            openLightbox(item.getAttribute('data-src'));
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
            closeNav();
            closeLightbox();
        }
    });
})();
