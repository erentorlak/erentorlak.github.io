/* TR Ceviz — progressive enhancement.
   Kural: JS çalışmazsa içerik görünür kalır (opacity ile gizleme yok). */
(function () {
  'use strict';

  /* ── mobil menü ── */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('mobil-menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Menüyü aç' : 'Menüyü kapat');
      menu.setAttribute('data-open', String(!open));
    });
  }

  /* ── fade-in (yalnızca hareket izni varsa; sınıf CSS'te de koşullu) ── */
  var fades = document.querySelectorAll('.fade');
  if (fades.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    fades.forEach(function (el) { io.observe(el); });
  }

  /* ── sipariş: miktar seçici + WhatsApp ön-dolgulu mesaj ── */
  var order = document.querySelector('[data-order]');
  if (order) {
    var totalEl = order.querySelector('[data-total]');
    var waEl = order.querySelector('[data-wa]');
    var buttons = order.querySelectorAll('.qty button');
    var current = { kg: 1, price: 390 };

    function render() {
      if (totalEl) totalEl.textContent = current.price.toLocaleString('tr-TR') + ' ₺';
      if (waEl) {
        var msg = 'Merhaba, ' + current.kg + ' kg ceviz (' + current.price.toLocaleString('tr-TR') +
                  ' TL) siparişi vermek istiyorum.';
        waEl.href = 'https://wa.me/905335195222?text=' + encodeURIComponent(msg);
      }
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(Number(b.dataset.kg) === current.kg));
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        current = { kg: Number(b.dataset.kg), price: Number(b.dataset.price) };
        render();
        track('order_select', { kg: current.kg, value: current.price, currency: 'TRY' });
      });
    });
    render();
  }

  /* ── analitik olayları (GA4 yüklenmişse) ── */
  function track(name, params) {
    if (typeof window.trcTrack === 'function') { window.trcTrack(name, params); return; }
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  document.querySelectorAll('a[href^="https://wa.me"]').forEach(function (a) {
    a.addEventListener('click', function () { track('wa_click', { link_url: a.href }); });
  });
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () { track('tel_click', { phone: a.getAttribute('href') }); });
  });
})();
