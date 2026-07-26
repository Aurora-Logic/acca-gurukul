(function () {
  'use strict';

  function injectRawHtml(htmlString, targetParent) {
    if (!htmlString || !htmlString.trim()) return;
    var trimmed = htmlString.trim();

    // If text does not contain HTML tags, treat as direct script text
    if (trimmed.indexOf('<') === -1) {
      var s = document.createElement('script');
      s.text = trimmed;
      targetParent.appendChild(s);
      return;
    }

    var temp = document.createElement('div');
    temp.innerHTML = trimmed;

    Array.from(temp.childNodes).forEach(function (node) {
      if (node.nodeType === 1) { // Element node
        if (node.tagName && node.tagName.toLowerCase() === 'script') {
          var script = document.createElement('script');
          Array.from(node.attributes).forEach(function (attr) {
            script.setAttribute(attr.name, attr.value);
          });
          script.text = node.innerHTML || node.textContent;
          targetParent.appendChild(script);
        } else {
          targetParent.appendChild(node.cloneNode(true));
        }
      } else if (node.nodeType === 3 && node.textContent.trim()) { // Text node
        var textScript = document.createElement('script');
        textScript.text = node.textContent;
        targetParent.appendChild(textScript);
      }
    });
  }

  function initGoogleTag(tagId, customScript) {
    if (customScript && customScript.trim()) {
      injectRawHtml(customScript, document.head);
    }

    if (tagId && tagId.trim()) {
      var id = tagId.trim();
      if (id.indexOf('GTM-') === 0) {
        // Google Tag Manager
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer',id);
      } else {
        // Global Site Tag / GA4 (G- / GT-)
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(){ window.dataLayer.push(arguments); }
        window.gtag = window.gtag || gtag;
        gtag('js', new Date());
        gtag('config', id);
      }
    }
  }

  function initMetaPixel(pixelId, customScript) {
    if (customScript && customScript.trim()) {
      injectRawHtml(customScript, document.head);
    }

    if (pixelId && pixelId.trim()) {
      var id = pixelId.trim();
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      window.fbq('init', id);
      window.fbq('track', 'PageView');
    }
  }

  fetch('/api/public_tracking.php')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data || data.error) return;

      // Google Tag
      if (data.google_tag_enabled || (data.google_tag_script && data.google_tag_script.trim())) {
        initGoogleTag(data.google_tag_id, data.google_tag_script);
      }

      // Meta Pixel
      if (data.meta_pixel_enabled || (data.meta_pixel_script && data.meta_pixel_script.trim())) {
        initMetaPixel(data.meta_pixel_id, data.meta_pixel_script);
      }

      // Custom Head Script
      if (data.custom_head_script) {
        injectRawHtml(data.custom_head_script, document.head);
      }

      // Custom Body Script
      if (data.custom_body_script) {
        if (document.body) {
          injectRawHtml(data.custom_body_script, document.body);
        } else {
          document.addEventListener('DOMContentLoaded', function () {
            injectRawHtml(data.custom_body_script, document.body);
          });
        }
      }
    })
    .catch(function (err) {
      console.warn('Tracking tags initialization skipped or failed:', err);
    });
})();
