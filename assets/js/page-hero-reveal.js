/* ASHA Solution — Page Hero Reveal
   Mirrors the home hero-reveal.js choreography on the metodologia page-hero:
   - Title splits into word spans with vertical slide-up
   - Eyebrow / lede / actions / constellation stagger after
   Bails safely if GSAP is missing — CSS defaults keep content visible.
*/
(function () {
  'use strict';

  const hero  = document.querySelector('.page-hero--league');
  if (!hero) return;

  const title = hero.querySelector('.page-hero__title');

  // Split title into word spans for stagger (always, even without GSAP)
  if (title && !title.dataset.split) {
    title.dataset.split = '1';
    // Walk top-level nodes (preserves the .accent <span> wrapping)
    const wrap = (txt) => txt
      .split(/(\s+)/)
      .map((tok) => /\s+/.test(tok)
        ? tok
        : `<span class="page-hero__word"><span class="page-hero__word-inner">${tok}</span></span>`)
      .join('');
    const frag = document.createDocumentFragment();
    Array.from(title.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const tmp = document.createElement('span');
        tmp.innerHTML = wrap(node.textContent);
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Recurse into element (e.g. <span class="accent">)
        const inner = node.innerHTML;
        node.innerHTML = wrap(inner);
        frag.appendChild(node);
      }
    });
    title.innerHTML = '';
    title.appendChild(frag);
  }

  if (typeof gsap === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    gsap.set([
      '.page-hero--league .page-hero__eyebrow',
      '.page-hero--league .page-hero__word-inner',
      '.page-hero--league .page-hero__lede',
      '.page-hero--league .page-hero__actions',
      '.page-hero--league .liga-constellation',
    ], { opacity: 1, y: 0 });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('.page-hero--league .page-hero__eyebrow', { y: 16, opacity: 0, duration: 0.6 })
    .from('.page-hero--league .page-hero__word-inner', {
      y: '110%',
      duration: 0.9,
      stagger: 0.05,
      ease: 'power4.out',
    }, '-=0.25')
    .from('.page-hero--league .page-hero__lede', { y: 18, opacity: 0, duration: 0.7 }, '-=0.5')
    .from('.page-hero--league .page-hero__actions > *', {
      y: 14, opacity: 0, duration: 0.55, stagger: 0.08,
    }, '-=0.35')
    .from('.page-hero--league .liga-constellation', { y: 16, opacity: 0, duration: 0.6 }, '-=0.45');

  // Safety net: force visible after 3s
  setTimeout(() => {
    document.querySelectorAll('.page-hero--league .page-hero__word-inner').forEach(el => {
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
    });
  }, 3000);
})();
