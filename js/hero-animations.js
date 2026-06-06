/**
 * Hero Section – Premium Page Load Animations
 * ─────────────────────────────────────────────
 * Orchestrates a cinematic entrance sequence:
 *   1. Hero title lines slide up + fade in (staggered)
 *   2. Gold underline expands from left
 *   3. Subtitle fades in
 *   4. CTA button slides up
 *   5. SVG curve draws itself along the path
 *   6. Timeline items cascade in one-by-one
 *   7. Hero right image reveals with a subtle scale + fade
 *
 * Also dynamically positions the 9 timeline nodes exactly on the
 * bezier arc at all desktop viewport sizes, recalculating on resize.
 */

(function () {
  'use strict';

  // ── Utilities ──────────────────────────────────────────────────
  function addReadyClass(el, delay) {
    if (!el) return;
    setTimeout(function () {
      el.classList.add('hero-anim-ready');
    }, delay);
  }

  // ── SVG path draw ─────────────────────────────────────────────
  function animateCurveDraw(svg, delay) {
    if (!svg) return;
    var path = svg.querySelector('path');
    if (!path) return;

    // Measure total path length and set up the dash
    var length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.style.transition = 'none';

    // Force reflow so the browser registers the initial state
    path.getBoundingClientRect();

    setTimeout(function () {
      path.style.transition =
        'stroke-dashoffset 1.4s cubic-bezier(0.65, 0, 0.35, 1)';
      path.style.strokeDashoffset = '0';
    }, delay);
  }

  // ── Dynamic bezier node positioning ───────────────────────────
  // Places each .timeline-item so its icon centre lands precisely
  // on the quadratic bezier  M 140,30 Q -70,280 140,530
  // which lives in a 160 × 560 viewBox rendered at 38.1% of the
  // container width × 100% of the container height.
  function positionTimelineNodes() {
    var container = document.querySelector('.hero-timeline');
    if (!container) return;
    // Tablet / mobile use CSS flow layout — skip
    if (window.innerWidth <= 1200) return;

    var W = container.offsetWidth;
    var H = container.offsetHeight;
    if (!W || !H) return;

    // SVG occupies 38.1 % of the container width at full height
    var svgW = W * 0.381;

    // Icon size drives the centre-offset calculation
    var icon = container.querySelector('.timeline-icon');
    var iconPx = icon ? icon.offsetWidth : 32;

    var items = container.querySelectorAll('.timeline-item');
    var last  = items.length - 1;

    items.forEach(function (el, i) {
      var t = i / last;
      var u = 1 - t;

      // Quadratic bezier: P0=(140,30)  P1=(-70,280)  P2=(140,530)
      var xVB = u*u*140 + 2*u*t*(-70) + t*t*140;
      var yVB = u*u*30  + 2*u*t*280   + t*t*530;

      // Map viewBox coords to container pixels
      var xPx = (xVB / 160) * svgW;
      var yPx = (yVB / 560) * H;

      // Position so the icon centre sits on the arc point
      el.style.left = ((xPx - iconPx / 2) / W * 100).toFixed(3) + '%';
      el.style.top  = ((yPx - iconPx / 2) / H * 100).toFixed(3) + '%';
    });
  }

  // ── Main orchestration ────────────────────────────────────────
  function runHeroAnimation() {
    var hero = document.querySelector('.hero');
    if (!hero || hero.dataset.animated === 'true') return;
    hero.dataset.animated = 'true';

    // Collect elements
    var heroTitle    = hero.querySelector('.hero-title');
    var heroLine     = hero.querySelector('.hero-title-line');
    var heroSubtitle = hero.querySelector('.hero-subtitle');
    var heroActions  = hero.querySelector('.hero-actions');
    var heroRight    = hero.querySelector('.hero-right');
    var curveSvg     = hero.querySelector('.hero-timeline-curve-svg');
    var timelineItems = hero.querySelectorAll('.timeline-item');

    // ── Tier 1: Title (stagger each line via <br> wrapping) ──
    // Wrap each text segment of the title in a span for individual animation
    if (heroTitle && !heroTitle.dataset.wrapped) {
      heroTitle.dataset.wrapped = 'true';
      var html = heroTitle.innerHTML;
      // Split on <br> / <br/> / <br /> and wrap each segment
      var segments = html.split(/<br\s*\/?>/gi);
      heroTitle.innerHTML = segments
        .map(function (seg, i) {
          return (
            '<span class="hero-title-segment" style="animation-delay:' +
            (200 + i * 120) +
            'ms">' +
            seg.trim() +
            '</span>'
          );
        })
        .join('');
    }

    // ── Position nodes on the arc before they become visible ──
    positionTimelineNodes();

    // ── Tier 2: Underline ──
    addReadyClass(heroLine, 650);

    // ── Tier 3: Subtitle ──
    addReadyClass(heroSubtitle, 850);

    // ── Tier 4: CTA button ──
    addReadyClass(heroActions, 1050);

    // ── Tier 5: SVG curve draw ──
    animateCurveDraw(curveSvg, 900);

    // ── Tier 6: Timeline items cascade ──
    timelineItems.forEach(function (item, idx) {
      addReadyClass(item, 1000 + idx * 100);
    });

    // ── Tier 7: Hero right image ──
    addReadyClass(heroRight, 800);
  }

  // ── Resize handler: reposition nodes on viewport change ──────
  var _rafId;
  window.addEventListener('resize', function () {
    cancelAnimationFrame(_rafId);
    _rafId = requestAnimationFrame(positionTimelineNodes);
  });

  // Fire on DOMContentLoaded (covers initial page load)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      // Slight RAF delay to let the browser paint first
      requestAnimationFrame(function () {
        requestAnimationFrame(runHeroAnimation);
      });
    });
  } else {
    requestAnimationFrame(function () {
      requestAnimationFrame(runHeroAnimation);
    });
  }
})();
