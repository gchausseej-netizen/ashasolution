/* ASHA — Scroll FX v2: velocity + parallax (perf-optimized).
   FIX CRÍTICO: el decay() infinito anterior corría RAF a 60fps siempre,
   incluso con scroll quieto. Ahora solo corre durante actividad.
   Safety switches:
     - prefers-reduced-motion → off
     - ?nofx=1 en URL         → off */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (new URLSearchParams(location.search).has('nofx')) return;

  const root = document.documentElement;

  /* ── Scroll velocity (solo RAF durante scroll, no infinito) ── */
  let lastScroll = window.scrollY;
  let easedVelocity = 0;
  let scrollRaf = null;
  let decayRaf = null;
  let lastScrollTime = 0;

  const VEL_CAP = 60;
  const EASE_IN = 0.25;
  const EASE_OUT = 0.18;

  const setVars = () => {
    const n = Math.max(-1, Math.min(1, easedVelocity / VEL_CAP));
    root.style.setProperty('--scroll-velocity', n.toFixed(3));
    root.style.setProperty('--scroll-velocity-abs', Math.abs(n).toFixed(3));
  };

  const onScroll = () => {
    const current = window.scrollY;
    const v = current - lastScroll;
    lastScroll = current;
    easedVelocity += (v - easedVelocity) * EASE_IN;
    setVars();
    lastScrollTime = performance.now();
    scrollRaf = null;
    // Si hay velocidad significativa, arranca decay
    if (Math.abs(easedVelocity) > 0.5 && !decayRaf) {
      decayRaf = requestAnimationFrame(decay);
    }
  };

  // Decay corre SOLO mientras hay velocidad, luego se detiene
  function decay() {
    if (Math.abs(easedVelocity) <= 0.3) {
      easedVelocity = 0;
      setVars();
      decayRaf = null;
      return;
    }
    easedVelocity *= (1 - EASE_OUT);
    setVars();
    decayRaf = requestAnimationFrame(decay);
  }

  window.addEventListener('scroll', () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll);
  }, { passive: true });

  /* ── Multi-layer parallax (solo cuando hay scroll) ─────────── */
  const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
  if (parallaxEls.length) {
    let pRaf = null;
    const updateParallax = () => {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const center = rect.top + rect.height / 2;
        const progress = (center - vh / 2) / vh;
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        const translateY = -progress * speed * 100;
        el.style.setProperty('--parallax-y', translateY.toFixed(2) + 'px');
      });
      pRaf = null;
    };
    window.addEventListener('scroll', () => {
      if (!pRaf) pRaf = requestAnimationFrame(updateParallax);
    }, { passive: true });
    updateParallax();
  }
})();
