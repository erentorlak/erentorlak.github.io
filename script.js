/* ============================================================
   TR Ceviz Bahçesi — etkileşimler
   ============================================================ */
(function () {
    'use strict';

    var header = document.getElementById('siteHeader');
    var navToggle = document.getElementById('navToggle');
    var siteNav = document.getElementById('siteNav');

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
})();
