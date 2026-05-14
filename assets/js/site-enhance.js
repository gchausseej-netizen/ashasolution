/* ASHA Solution — Site enhancements (additive layer, never blocking).
   Two subtle features on top of the existing reveals:
     1. Split-text reveal on [data-split-reveal] headings (blur→focus, stagger)
     2. Counter animation on [data-count] numbers when in view
   All features honor prefers-reduced-motion. */
(function () {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* (Scroll progress bar removida — el usuario reportó que ralentizaba la página) */

  /* ── UTC live clock for hero panel ─────────────────────────── */
  const clockEls = document.querySelectorAll('[data-utc-clock]');
  if (clockEls.length) {
    const tick = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, '0');
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      const s = String(d.getUTCSeconds()).padStart(2, '0');
      const txt = h + ':' + m + ':' + s + ' UTC';
      clockEls.forEach(el => { el.textContent = txt; });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── Split-text reveal (word by word, blur→focus) ───────────── */
  if (!reduceMotion) {
    const splittables = document.querySelectorAll('[data-split-reveal]');
    const wrapWords = (root) => {
      const counter = { i: 0 };
      const walk = (node) => {
        if (node.nodeType === 3) {                          // text node
          const text = node.textContent;
          if (!/\S/.test(text)) return;
          const frag = document.createDocumentFragment();
          const parts = text.split(/(\s+)/);
          parts.forEach(p => {
            if (/\S/.test(p)) {
              const span = document.createElement('span');
              span.className = 'split-word';
              span.style.setProperty('--i', counter.i++);
              span.textContent = p;
              frag.appendChild(span);
            } else {
              frag.appendChild(document.createTextNode(p));
            }
          });
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1 &&
                   !node.classList.contains('split-word') &&
                   !node.hasAttribute('data-split-skip')) {
          Array.from(node.childNodes).forEach(walk);
        }
      };
      walk(root);
    };

    splittables.forEach(el => {
      wrapWords(el);
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              el.classList.add('is-revealed-words');
              io.unobserve(el);
            }
          });
        }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
        io.observe(el);
        // Safety net — never leave a heading hidden
        setTimeout(() => el.classList.add('is-revealed-words'), 3500);
      } else {
        el.classList.add('is-revealed-words');
      }
    });
  } else {
    document.querySelectorAll('[data-split-reveal]').forEach(el => el.classList.add('is-revealed-words'));
  }

  /* ── 3. Counter animation on [data-count] ───────────────────── */
  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = String(target); return; }
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      const cio = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            cio.unobserve(e.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(c => cio.observe(c));
    } else {
      counters.forEach(c => animateCounter(c));
    }
  }
})();
