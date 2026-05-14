/* ASHA — Lenis smooth scroll DESACTIVADO por decisión del usuario.
   El scroll nativo se siente más fluido en este sitio (canvas hero +
   muchos IO observers). Para re-activar: quitar el return de abajo. */
(function () {
  'use strict';
  return;  // ← scroll nativo. Mantengo Lenis cargado por si se reactiva.

  // eslint-disable-next-line no-unreachable
  if (typeof Lenis === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(max-width: 768px)').matches) return;
  if (new URLSearchParams(location.search).has('nofx')) return;

  try {
    const lenis = new Lenis({
      duration: 0.6,                       // RESPONSIVE — el 1.6 era el principal culprit del lag
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,                // sin slowdown extra
      touchMultiplier: 1.5,
    });

    window.__lenis = lenis;

    // Debug indicator — desaparece al hacer click (o tras 8s)
    if (new URLSearchParams(location.search).has('debug')) {
      const dbg = document.createElement('div');
      dbg.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:9999;padding:6px 10px;font:600 11px/1 monospace;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.5);color:#86efac;border-radius:4px;cursor:pointer';
      dbg.textContent = '✓ Lenis · GSAP · Parallax · Velocity · Pin';
      dbg.onclick = () => dbg.remove();
      document.body.appendChild(dbg);
      setTimeout(() => dbg.remove(), 8000);
    }

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Integración GSAP/ScrollTrigger — actualiza ST en cada scroll de Lenis
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      // Sincroniza el ticker (gsap.ticker → lenis.raf)
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    // Anchor links — Lenis se encarga del scrollTo suave
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      a.addEventListener('click', (e) => {
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.4 });
      });
    });
  } catch (err) {
    console.warn('[smooth-scroll] init failed, continuing with native scroll', err);
  }
})();
