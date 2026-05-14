/* ASHA — Hero mouse parallax (lerp damping, ±15px max).
   Reads cursor position relative to .hero center and writes
   --mx / --my custom props with smooth easing. CSS applies
   the transform on .hero__bg-img / .hero__floating. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const hero = document.getElementById('hero');
  if (!hero) return;

  const MAX = 15;   // px amplitude
  const EASE = 0.08; // lerp factor

  let targetX = 0, targetY = 0;
  let currX = 0, currY = 0;
  let raf = null, active = false;
  let leaving = false; // flag: cuando true, al converger a 0 reanuda Ken Burns

  const tick = () => {
    currX += (targetX - currX) * EASE;
    currY += (targetY - currY) * EASE;
    hero.style.setProperty('--mx', currX.toFixed(2) + 'px');
    hero.style.setProperty('--my', currY.toFixed(2) + 'px');
    if (Math.abs(targetX - currX) > 0.05 || Math.abs(targetY - currY) > 0.05) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
      // Si veníamos saliendo y ya regresamos a (0,0), liberar el Ken Burns
      if (leaving) {
        leaving = false;
        active = false;
        hero.removeAttribute('data-mouse-active');
      }
    }
  };

  const onMove = (e) => {
    leaving = false;
    const r = hero.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2; // -1..1
    const ny = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    targetX = nx * MAX;
    targetY = ny * MAX;
    if (!active) {
      active = true;
      hero.setAttribute('data-mouse-active', '1');
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const onLeave = () => {
    targetX = 0; targetY = 0;
    leaving = true; // al converger, tick() removerá data-mouse-active y resumirá Ken Burns
    if (!raf) raf = requestAnimationFrame(tick);
  };

  hero.addEventListener('mousemove', onMove, { passive: true });
  hero.addEventListener('mouseleave', onLeave, { passive: true });
})();
