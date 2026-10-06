/* TR Ceviz — ölçüm katmanı.
   ID'ler girilene kadar hiçbir şey yüklemez (KVKK açısından da temiz:
   onay olmadan üçüncü taraf çerezi yazılmaz).

   ETKİNLEŞTİRMEK İÇİN: aşağıdaki iki değeri doldur, siteyi yeniden yayınla.
   GA4 ID örneği: 'G-XXXXXXXXXX' · Meta Pixel örneği: '123456789012345'      */
window.TRCEVIZ_ANALYTICS = {
  ga4: '',        // ← Google Analytics 4 Measurement ID
  metaPixel: ''   // ← Meta (Facebook) Pixel ID
};

(function () {
  'use strict';
  var cfg = window.TRCEVIZ_ANALYTICS;
  var loaded = { ga4: false, meta: false };

  /* ── Google Analytics 4 ── */
  if (cfg.ga4) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + cfg.ga4;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', cfg.ga4);   // NOT: anonymize_ip GA4'te yok (Universal Analytics kalıntısı)
    loaded.ga4 = true;
  }

  /* ── Meta Pixel ── */
  if (cfg.metaPixel) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', cfg.metaPixel);
    window.fbq('track', 'PageView');
    loaded.meta = true;
  }

  /* ── Tek arayüz: app.js bu fonksiyonu çağırır ── */
  window.trcTrack = function (name, params) {
    if (loaded.ga4 && typeof window.gtag === 'function') window.gtag('event', name, params || {});
    if (loaded.meta && typeof window.fbq === 'function') {
      var map = { wa_click: 'Contact', tel_click: 'Contact', order_select: 'AddToCart' };
      var std = map[name];
      if (std) window.fbq('track', std, params || {});
      else window.fbq('trackCustom', name, params || {});
    }
  };

  /* ── Durum bilgisi (teşhis için konsola yazar) ── */
  if (location.search.indexOf('trc-analytics-check') > -1) {
    console.info('[trceviz] ölçüm durumu →', {
      ga4: loaded.ga4 ? 'etkin' : 'ID girilmedi',
      metaPixel: loaded.meta ? 'etkin' : 'ID girilmedi'
    });
  }
})();
