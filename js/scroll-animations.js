/* ═══════════════════════════════════════════════════════════════
   LINESBYLIN — scroll-animations.js  v3
   Fixes:
   1. Exit animations removed — elements only animate IN, never
      snap invisible mid-scroll.
   2. Stagger cap raised to 10 for large grids.
   3. Firebase-loaded grids: all dynamic content grids covered
      via MutationObserver (posts-grid, mediahub-grid, mhf-*).
   4. stampCards() helper stamps data-sa-card for CSS keyframe
      stagger — works without an IntersectionObserver.
   Place LAST inside <body>, after all other scripts.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Bail if reduced-motion preferred ──────────────────────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ══════════════════════════════════════════════════════════════
     OBSERVER
     threshold: [0, 0.15]
     Only sets visible=true on enter. Exit is intentionally NOT
     animated — elements stay visible once they've appeared.
     This prevents the jarring snap-to-invisible on scroll-out.
  ══════════════════════════════════════════════════════════════ */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.dataset.saVisible = 'true';
        /* Once visible, stop observing — animation is one-shot */
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: [0, 0.15],
    rootMargin: '0px 0px -30px 0px'
  });

  /* ── Register a single element ──────────────────────────────── */
  function register(el, type, delay) {
    /* Skip if already registered */
    if (el.dataset.sa) return;
    el.dataset.sa = type;
    if (delay) el.dataset.saDelay = String(delay);
    el.dataset.saVisible = 'false';
    observer.observe(el);
  }

  /* ── Stamp data-sa-card indices on a rendered card list ─────── */
  /* CSS keyframe stagger — no observer needed for dynamic content */
  function stampCards(els) {
    Array.from(els).forEach(function (el, i) {
      el.dataset.saCard = String(Math.min(i, 15));
    });
  }

  /* ── Watch a grid for Firebase content insertion ────────────── */
  /* Calls stampCards once real cards appear, then disconnects.    */
  function watchGrid(gridEl, cardSelector) {
    if (!gridEl) return;

    /* Cards already in DOM (static or pre-rendered) */
    var existing = gridEl.querySelectorAll(cardSelector);
    if (existing.length) { stampCards(existing); return; }

    var done = false;
    var mo   = new MutationObserver(function () {
      if (done) return;
      var cards = gridEl.querySelectorAll(cardSelector);
      if (!cards.length) return;
      done = true;
      mo.disconnect();
      /* Tick to let the DOM fully settle before stamping */
      setTimeout(function () {
        stampCards(gridEl.querySelectorAll(cardSelector));
      }, 40);
    });
    mo.observe(gridEl, { childList: true, subtree: true });
  }

  /* ══════════════════════════════════════════════════════════════
     1. SECTION HEADERS & GENERIC BLOCKS — fade-up
  ══════════════════════════════════════════════════════════════ */
  [
    '.section-header',
    '.section-title',
    '.section-subtitle',
    '.about-eyebrow',
    '.about-heading',
    '.about-quote',
    '.about-body',
    '.about-tags',
    '.about-cta',
  ].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      register(el, 'fade-up');
    });
  });

  /* ══════════════════════════════════════════════════════════════
     2. ABOUT SPLIT — image from left, text from right
  ══════════════════════════════════════════════════════════════ */
  var aboutArt  = document.querySelector('#about .about-art');
  var aboutText = document.querySelector('#about .about-text-col');
  if (aboutArt)  register(aboutArt,  'from-left');
  if (aboutText) register(aboutText, 'from-right');

  /* ══════════════════════════════════════════════════════════════
     3. ABOUT STATS — stagger
  ══════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.about-stat').forEach(function (el, i) {
    register(el, 'fade-up', i + 1);
  });

  /* ══════════════════════════════════════════════════════════════
     4. CONTACT SECTION
  ══════════════════════════════════════════════════════════════ */
  var contact = document.getElementById('contact');
  if (contact) {
    var quoteBlock  = contact.querySelector('div');
    if (quoteBlock) register(quoteBlock, 'fade-up');

    var connectRow = contact.querySelectorAll('div')[1];
    if (connectRow) {
      var heading  = connectRow.querySelector('h2');
      var subpara  = connectRow.querySelector('p');
      var rightCol = connectRow.children[1];
      if (heading)  register(heading,  'reveal');
      if (subpara)  register(subpara,  'fade-up', 2);
      if (rightCol) register(rightCol, 'fade-up', 3);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     5. ALL CONTENT GRIDS — static + Firebase-populated
        Uses data-sa-card CSS keyframe stagger for dynamic content.
        Covers every grid across the whole site.
  ══════════════════════════════════════════════════════════════ */
  var CARD_SEL = '.card, .media-card, .beat-card, .code-preview-card, .collection-card-gl, article, .mh-beat-card';

  /* Static / index page grids */
  ['#featured-grid', '#code-preview-grid', '#collections-grid'].forEach(function (sel) {
    watchGrid(document.querySelector(sel), CARD_SEL);
  });

  /* Blog / poems / stories */
  watchGrid(document.getElementById('posts-grid'), CARD_SEL);

  /* Movies / TV shows */
  watchGrid(document.getElementById('mediahub-grid'), CARD_SEL);

  /* MediaHub overview — each sub-section grid */
  ['mhf-movies-grid', 'mhf-tvshows-grid', 'mhf-beats-grid'].forEach(function (id) {
    watchGrid(document.getElementById(id), CARD_SEL);
  });

  /* ══════════════════════════════════════════════════════════════
     6. RE-STAMP on filter / sort / search re-renders
        mediahub.js calls renderGrid() which replaces innerHTML.
        A persistent MutationObserver on the grid wrapper
        re-stamps cards every time the grid is repopulated.
  ══════════════════════════════════════════════════════════════ */
  function watchGridForRerenders(gridEl) {
    if (!gridEl) return;
    var mo = new MutationObserver(function () {
      var cards = gridEl.querySelectorAll(CARD_SEL);
      if (cards.length) stampCards(cards);
    });
    mo.observe(gridEl, { childList: true });
  }

  /* These two grids get re-rendered on every filter change */
  watchGridForRerenders(document.getElementById('mediahub-grid'));
  watchGridForRerenders(document.getElementById('posts-grid'));

  /* ══════════════════════════════════════════════════════════════
     7. MEDIAHUB OVERVIEW section headers — fade-up on scroll
  ══════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.mhf-section-wrap').forEach(function (el, i) {
    var header = el.querySelector('.mhf-section-header');
    if (header) register(header, 'fade-up', Math.min(i + 1, 3));
  });

})();