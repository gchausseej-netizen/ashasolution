/* ASHA — Full-page scroll system.
   Snap between .fp-section elements with wheel/touch/keyboard.
   Safety:
     - desktop only (≥1024px); mobile keeps native scroll
     - ?nofp=1 desactiva por completo
     - prefers-reduced-motion → no smooth, salto instantáneo
*/
(function () {
  'use strict';

  const wrap = document.getElementById('fp-wrap');
  const dotsList = document.querySelector('.fp-dots__list');
  if (!wrap || !dotsList) return;

  const sections = Array.from(wrap.querySelectorAll('.fp-section'));
  if (!sections.length) return;

  const params = new URLSearchParams(location.search);
  if (params.has('nofp')) return;

  const isDesktop = () => window.innerWidth >= 1024;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let currentIndex = 0;
  let isAnimating = false;
  const COOLDOWN = 1000;
  const DURATION = 1000;
  let cooldownTimer = null;

  /* ── Auto-tag grids/cards with data-fp-anim + delays ────────── */
  const autoTag = (selectorList, opts = {}) => {
    sections.forEach(sec => {
      selectorList.forEach(sel => {
        const items = sec.querySelectorAll(sel);
        items.forEach((el, i) => {
          if (el.hasAttribute('data-fp-anim')) return;
          el.setAttribute('data-fp-anim', '');
          el.style.setProperty('--fp-d', String((opts.start || 0) + i * (opts.step || 1)));
        });
      });
    });
  };
  // Section headers (eyebrow + title + lede)
  autoTag(['.eyebrow', '.section-title', '.section-lede', '.diferenciador__lede',
           '.liga-section-head', '.diferenciador__head > *', '.industries__head > *',
           '.presence__head > *', '.alliances__head > *', '.clients__head > *',
           '.section-head > *', '.final-cta__title', '.final-cta__lede'],
    { start: 0, step: 1 });
  // Grids — stagger per card starting after the header
  autoTag(['.persona'], { start: 2, step: 1 });
  autoTag(['.industry-card'], { start: 3, step: 1 });
  autoTag(['.practice'], { start: 2, step: 1 });
  autoTag(['.alliance-card'], { start: 2, step: 0.3 });
  autoTag(['.client-logo'], { start: 2, step: 0.2 });
  autoTag(['.country'], { start: 2, step: 0.4 });
  autoTag(['.highlight'], { start: 4, step: 1 });
  autoTag(['.framework'], { start: 8, step: 0.15 });
  autoTag(['.diferenciador__cta'], { start: 12, step: 0 });
  autoTag(['.presence__globe-wrap'], { start: 2, step: 0 });

  /* ── Build dots ─────────────────────────────────────────────── */
  sections.forEach((sec, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fp-dot';
    btn.setAttribute('aria-label', sec.dataset.sectionName || ('Sección ' + (i + 1)));
    btn.dataset.fpIndex = String(i);
    const tip = document.createElement('span');
    tip.className = 'fp-dot__tip';
    tip.textContent = sec.dataset.sectionName || ('Sección ' + (i + 1));
    btn.appendChild(tip);
    btn.addEventListener('click', () => goTo(i));
    li.appendChild(btn);
    dotsList.appendChild(li);
  });
  const dots = Array.from(dotsList.querySelectorAll('.fp-dot'));

  const updateDots = () => {
    dots.forEach((d, i) => d.classList.toggle('is-active', i === currentIndex));
  };
  const updateActiveSection = () => {
    sections.forEach((sec, i) => sec.classList.toggle('is-active', i === currentIndex));
  };

  /* ── Enable/disable mode ────────────────────────────────────── */
  const enable = () => {
    document.body.classList.add('fp-enabled');
    document.documentElement.style.setProperty('--fp-index', String(currentIndex));
    updateDots();
    updateActiveSection();
  };
  const disable = () => {
    document.body.classList.remove('fp-enabled');
    document.documentElement.style.setProperty('--fp-index', '0');
  };

  if (isDesktop()) enable();
  else disable();
  // El hero arranca siempre activo (sus elementos visibles desde el inicio)
  if (sections[0]) sections[0].classList.add('is-active');

  // Reaccionar a resize
  let resizeRaf = null;
  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      if (isDesktop()) enable();
      else disable();
    });
  });

  /* ── Navigation ─────────────────────────────────────────────── */
  const goTo = (i) => {
    if (!isDesktop()) return;
    if (isAnimating) return;
    if (i < 0 || i >= sections.length) return;
    if (i === currentIndex) return;
    isAnimating = true;
    currentIndex = i;
    document.documentElement.style.setProperty('--fp-index', String(currentIndex));
    updateDots();
    // Update active class slightly delayed so the new section is visible before its anims fire
    setTimeout(updateActiveSection, 200);
    // Update hash for deeplinking (without scrolling)
    const sec = sections[i];
    if (sec.id) {
      history.replaceState(null, '', '#' + sec.id);
    }
    // Cooldown
    clearTimeout(cooldownTimer);
    cooldownTimer = setTimeout(() => { isAnimating = false; }, reduceMotion ? 50 : COOLDOWN);
  };
  const next = () => goTo(currentIndex + 1);
  const prev = () => goTo(currentIndex - 1);

  /* ── Wheel ──────────────────────────────────────────────────── */
  let wheelLast = 0;
  window.addEventListener('wheel', (e) => {
    if (!isDesktop()) return;
    if (isAnimating) { e.preventDefault(); return; }
    const now = Date.now();
    if (now - wheelLast < 80) return;        // dedupe trackpad spikes
    wheelLast = now;
    if (Math.abs(e.deltaY) < 12) return;     // ignore micro-wheels
    if (e.deltaY > 0) next();
    else prev();
    e.preventDefault();
  }, { passive: false });

  /* ── Touch ──────────────────────────────────────────────────── */
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (!isDesktop()) return;
    const dy = touchStartY - (e.changedTouches[0].clientY);
    if (Math.abs(dy) < 50) return;
    if (dy > 0) next();
    else prev();
  }, { passive: true });

  /* ── Keyboard ───────────────────────────────────────────────── */
  window.addEventListener('keydown', (e) => {
    if (!isDesktop()) return;
    // Don't intercept while typing in inputs
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { next(); e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { prev(); e.preventDefault(); }
    else if (e.key === 'Home') { goTo(0); e.preventDefault(); }
    else if (e.key === 'End') { goTo(sections.length - 1); e.preventDefault(); }
  });

  /* ── Anchor links inside the page jump to section by id ─────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    a.addEventListener('click', (e) => {
      const target = document.querySelector(href);
      if (!target) return;
      // Find the fp-section that is or contains the target
      const sec = target.closest('.fp-section') || (target.classList.contains('fp-section') ? target : null);
      if (!sec) return;
      const idx = sections.indexOf(sec);
      if (idx < 0) return;
      e.preventDefault();
      goTo(idx);
    });
  });

  /* ── Initial deep-link from URL hash ────────────────────────── */
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      const sec = target.closest('.fp-section') || (target.classList.contains('fp-section') ? target : null);
      if (sec) {
        const idx = sections.indexOf(sec);
        if (idx > 0) {
          currentIndex = idx;
          document.documentElement.style.setProperty('--fp-index', String(currentIndex));
          updateDots();
          updateActiveSection();
        }
      }
    }
  }

  // Expose for debugging
  window.__fp = { goTo, next, prev };
})();
