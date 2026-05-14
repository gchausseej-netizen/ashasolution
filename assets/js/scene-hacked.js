/* ASHA Solution — Scene cyber + "¿Cómo lo hacemos?" fusionados.
   Animación ONE-SHOT: attack → rescue → safe. Después se queda en safe.
   Botón discreto .scene-hacked__replay permite re-disparar. */
(function () {
  'use strict';
  const scene = document.getElementById('scene-hacked');
  if (!scene) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const video = scene.querySelector('.scene-hacked__hero');
  const replayBtn = scene.querySelector('.scene-hacked__replay');

  // Estado inicial visible = safe (Asha aparece, código apagado)
  scene.classList.add('is-safe');

  let played = false;
  let timers = [];
  const clearTimers = () => { timers.forEach(t => clearTimeout(t)); timers = []; };

  const setState = (s) => {
    scene.classList.remove('is-attack', 'is-rescue', 'is-safe');
    scene.classList.add('is-' + s);
  };

  const T_ATTACK = 2400;
  const T_RESCUE = 1800;

  const play = () => {
    if (reduceMotion) { setState('safe'); return; }
    clearTimers();
    setState('attack');
    timers.push(setTimeout(() => setState('rescue'), T_ATTACK));
    timers.push(setTimeout(() => {
      setState('safe');
      if (!video) return;
      if (typeof video.play === 'function') {
        // <video> element — restart playback
        video.currentTime = 0; video.play().catch(() => {});
      } else if (video.tagName === 'IMG') {
        // Animated WebP — restart by re-setting src (forces decode loop reset)
        const s = video.src; video.src = ''; video.src = s;
      }
    }, T_ATTACK + T_RESCUE));
  };

  // Dispara una vez al entrar al viewport
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !played) {
          played = true;
          play();
          io.disconnect();
        }
      });
    }, { threshold: 0.35 });
    io.observe(scene);
  } else {
    play();
  }

  // Botón de replay
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      played = true;
      play();
    });
  }
})();
