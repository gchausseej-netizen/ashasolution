/* ASHA Solution — Hero Reveal & Scroll Choreography
   Requires: gsap.min.js, ScrollTrigger.min.js
   - Title reveal word-by-word
   - Eyebrow / subtitle / CTA / trust strip stagger
   - Scroll parallax on canvas + scan line
   - Hero fade-out as user scrolls into Liga
*/
(function () {
  // ── Split title into word spans for stagger (always, even without GSAP) ─
  const title = document.querySelector('.hero__title');
  if (title && !title.dataset.split) {
    const text = title.textContent.trim();
    title.dataset.split = '1';
    title.innerHTML = text
      .split(/(\s+)/)
      .map((tok) => /\s+/.test(tok)
        ? tok
        : `<span class="hero__word"><span class="hero__word-inner">${tok}</span></span>`)
      .join('');
  }

  // No GSAP? Bail safely — content stays visible thanks to CSS defaults.
  if (typeof gsap === 'undefined') return;
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    gsap.set(['.hero__eyebrow', '.hero__title .hero__word-inner', '.hero__subtitle', '.hero__actions', '.hero__trust', '.hero__scroll'], { opacity: 1, y: 0 });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('.hero__eyebrow', { y: 16, opacity: 0, duration: 0.6 })
    .from('.hero__title .hero__word-inner', {
      y: '110%',
      duration: 0.9,
      stagger: 0.05,
      ease: 'power4.out',
    }, '-=0.25')
    .from('.hero__subtitle', { y: 18, opacity: 0, duration: 0.7 }, '-=0.5')
    .from('.hero__actions > *', {
      y: 14, opacity: 0, duration: 0.55, stagger: 0.08,
    }, '-=0.35')
    .from('.hero__trust', { y: 12, opacity: 0, duration: 0.6 }, '-=0.25')
    .from('.hero__scroll', { y: -10, opacity: 0, duration: 0.6 }, '-=0.3');

  // Safety net: if anything goes wrong, force everything visible after 3s
  setTimeout(() => {
    document.querySelectorAll('.hero__word-inner').forEach(el => {
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
    });
  }, 3000);

  // ── Scroll-driven parallax on the hero ────────────────────────
  if (typeof ScrollTrigger === 'undefined') return;

  const hero = document.getElementById('hero');
  const canvas = document.getElementById('hero-canvas');
  const scan = document.querySelector('.hero__scan');
  const inner = document.querySelector('.hero__inner');
  if (!hero) return;

  // Parallax: canvas moves slower (deeper), inner content slightly faster
  if (canvas) {
    gsap.to(canvas, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
  }
  if (scan) {
    gsap.to(scan, {
      yPercent: 30,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
  }
  if (inner) {
    gsap.to(inner, {
      yPercent: -12,
      opacity: 0.0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'center top', end: 'bottom top', scrub: 0.4 },
    });
  }
})();
