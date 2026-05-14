/* ASHA Solution — Site-wide scroll reveals (safe-by-default v2)
   Pattern: animate ONLY transform (y), never opacity in groups.
   If ScrollTrigger fails to fire, content remains visible.
*/
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  // Single-element reveal — opacity ok here, with safety net below
  const revealOne = (selector) => {
    gsap.utils.toArray(selector).forEach(el => {
      gsap.from(el, {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    });
  };

  // Group reveal — NO opacity, only transform. If trigger fails, content visible.
  const revealGroup = (containerSel, childrenSel, opts = {}) => {
    document.querySelectorAll(containerSel).forEach(container => {
      const children = container.querySelectorAll(childrenSel);
      if (!children.length) return;
      gsap.from(children, {
        y: opts.y || 30,
        duration: opts.duration || 0.7,
        stagger: opts.stagger || 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: container,
          start: opts.start || 'top 85%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    });
  };

  // ── Section headers (text only — opacity ok, easy fade) ─────
  revealOne('.section-title:not(.hero__title)');
  revealOne('.eyebrow:not(.hero__eyebrow)');
  revealOne('.section-lede, .liga__lede');

  // ── Card groups — TRANSFORM ONLY (always visible) ───────────
  revealGroup('.liga__grid', '.persona', { y: 36, stagger: 0.08 });
  revealGroup('.diff', '.metric, .framework', { y: 20, stagger: 0.05 });
  revealGroup('.industries__grid', '.industry-card', { y: 30, stagger: 0.1 });
  revealGroup('.practices__grid', '.practice', { y: 36, stagger: 0.08 });
  revealGroup('.alliances', '.alliance, .partner-level', { y: 24, stagger: 0.04 });
  revealGroup('.clients__grid', '.client-logo', { y: 18, stagger: 0.03 });
  revealGroup('.client-names', 'li', { y: 14, stagger: 0.02 });
  revealGroup('.presence__panel', '.country, .highlight', { y: 22, stagger: 0.05 });
  revealGroup('.how__text', 'p, .promises', { y: 18, stagger: 0.08 });
  // Promise cards — more pronounced so they feel "alive" like the pillars
  revealGroup('.promises', '.promise', { y: 30, duration: 0.8, stagger: 0.09 });

  // ── Final CTA ───────────────────────────────────────────────
  revealOne('.final-cta__title, .final-cta__lede');

  // ── SAFETY NET: force visibility after 2.5s no matter what ──
  setTimeout(() => {
    const force = (sel) => document.querySelectorAll(sel).forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.visibility = 'visible';
    });
    force('.persona, .practice, .industry-card, .alliance, .partner-level, .client-logo, .country, .highlight, .promise, .metric, .framework, .section-title, .eyebrow, .section-lede, .liga__lede, .client-names li');
  }, 2500);

  // Recalculate after images/fonts settle
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
