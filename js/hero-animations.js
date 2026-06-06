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

  // ── Main orchestration ────────────────────────────────────────
  function runHeroAnimation() {
    var hero = document.querySelector('.hero');
    if (!hero || hero.dataset.animated === 'true') return;
    hero.dataset.animated = 'true';

    // Collect elements
    var heroTitle = hero.querySelector('.hero-title');
    var heroLine = hero.querySelector('.hero-title-line');
    var heroSubtitle = hero.querySelector('.hero-subtitle');
    var heroActions = hero.querySelector('.hero-actions');
    var heroRight = hero.querySelector('.hero-right');
    var curveSvg = hero.querySelector('.hero-timeline-curve-svg');
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
