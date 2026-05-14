/* ASHA — Diferenciador: stagger entrance solamente.
   El parallax JS sobre cada persona fue removido (causaba freeze al entrar
   la sección — 6 RAF loops + listeners por card). Hover CSS basta. */
(function () {
  'use strict';
  const section = document.querySelector('.diferenciador');
  if (!section) return;

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          section.classList.add('is-in');
          io.disconnect();
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -8% 0px' });
    io.observe(section);
  } else {
    section.classList.add('is-in');
  }

  // Fallback: nunca dejar pilares/cards invisibles
  setTimeout(() => section.classList.add('is-in'), 2500);
})();
