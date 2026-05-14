/* ASHA Solution — Hero Neural Network
   Custom canvas particle network with mouse repulsion + dynamic links.
   Pairs with #hero-canvas. ~6KB unminified. 60fps target.
*/
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) { canvas.style.display = 'none'; return; }

  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // ── Color palette (driven by tokens) ──────────────────────────
  const COLORS = {
    primary: [220, 38, 38],   // ASHA red
    cyan:    [6, 182, 212],
    purple:  [168, 85, 247],
  };
  const pickColor = (i) => {
    if (i % 11 === 0) return COLORS.cyan;
    if (i % 17 === 0) return COLORS.purple;
    return COLORS.primary;
  };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // ── Tunables (responsive) ─────────────────────────────────────
  let W = 0, H = 0;
  let particleCount, linkDist, mouseRadius;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;

  const tuneFor = (w) => {
    // Slightly denser + livelier — gives the hero more visible animation on
    // the right side without overpowering the H1 column.
    if (w < 700)  { particleCount = 60;  linkDist = 140; mouseRadius = 100; }
    else if (w < 1100) { particleCount = 110; linkDist = 170; mouseRadius = 140; }
    else { particleCount = 175; linkDist = 200; mouseRadius = 180; }
  };

  // ── Particles ──────────────────────────────────────────────────
  let particles = [];
  const spawn = () => {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      const c = pickColor(i);
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.48,
        vy: (Math.random() - 0.5) * 0.48,
        r: Math.random() * 2.0 + 1.2,
        baseColor: c,
        flash: 0, // 0..1, fades to 0 each frame, used for pulses near mouse
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  };

  // ── Resize ─────────────────────────────────────────────────────
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tuneFor(W);
    spawn();
  };

  // ── Mouse tracking with inertia ───────────────────────────────
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

  const onMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    mouse.tx = x; mouse.ty = y; mouse.active = true;
  };
  const onLeave = () => { mouse.active = false; mouse.tx = -9999; mouse.ty = -9999; };

  // ── Animation loop ────────────────────────────────────────────
  let rafId = null;
  let running = false;

  const step = () => {
    // Mouse inertia (eased follow)
    mouse.x += (mouse.tx - mouse.x) * 0.18;
    mouse.y += (mouse.ty - mouse.y) * 0.18;

    ctx.clearRect(0, 0, W, H);

    const mr2 = mouseRadius * mouseRadius;

    // Update + draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Mouse repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < mr2 && mouse.active) {
        const d = Math.sqrt(d2) || 0.001;
        const force = (1 - d / mouseRadius) * 0.6;
        p.vx += (dx / d) * force;
        p.vy += (dy / d) * force;
        p.flash = Math.min(1, p.flash + 0.05);
      }

      // Velocity damping & motion
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.x += p.vx;
      p.y += p.vy;
      p.flash *= 0.94;

      // Bounce on edges
      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > W) { p.x = W; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > H) { p.y = H; p.vy *= -1; }

      // Slow drift if nearly stopped
      if (Math.abs(p.vx) < 0.05 && Math.abs(p.vy) < 0.05) {
        p.vx += (Math.random() - 0.5) * 0.04;
        p.vy += (Math.random() - 0.5) * 0.04;
      }

      // Twinkle (subtle pulsing)
      p.twinkle += 0.04;
      const twinkleAlpha = 0.15 * Math.sin(p.twinkle);

      // Draw particle
      const alpha = 0.75 + p.flash * 0.25 + twinkleAlpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + p.flash * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = rgba(p.baseColor, alpha);
      ctx.fill();

      // Permanent soft glow on every particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3 + p.flash * 4, 0, Math.PI * 2);
      ctx.fillStyle = rgba(p.baseColor, 0.10 + p.flash * 0.25);
      ctx.fill();

      // Bright halo when flashing
      if (p.flash > 0.1) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 12 * p.flash, 0, Math.PI * 2);
        ctx.fillStyle = rgba(p.baseColor, p.flash * 0.22);
        ctx.fill();
      }
    }

    // Links between near particles (O(n²) but n is small)
    const linkDist2 = linkDist * linkDist;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < linkDist2) {
          const t = 1 - d2 / linkDist2;
          // Boost link near mouse
          const mx = (a.x + b.x) * 0.5 - mouse.x;
          const my = (a.y + b.y) * 0.5 - mouse.y;
          const md2 = mx * mx + my * my;
          const boost = (mouse.active && md2 < mr2) ? (1 - md2 / mr2) * 0.6 : 0;
          const alpha = (t * 0.42 + boost * 0.55);
          if (alpha < 0.01) continue;
          // Color of link = average of endpoints
          const c0 = a.baseColor, c1 = b.baseColor;
          const cr = (c0[0] + c1[0]) >> 1;
          const cg = (c0[1] + c1[1]) >> 1;
          const cb = (c0[2] + c1[2]) >> 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.lineWidth = 0.9 + boost * 0.8;
          ctx.stroke();
        }
      }
    }

    if (running) rafId = requestAnimationFrame(step);
  };

  const start = () => {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(step);
  };
  const stop = () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  // ── Pause when hero offscreen, tab hidden, OR during active scroll ──
  const heroEl = document.getElementById('hero');
  let heroVisible = true;
  let isScrolling = false;
  let scrollTimeout = null;

  const resume = () => { if (heroVisible && !isScrolling && !document.hidden) start(); };

  if ('IntersectionObserver' in window && heroEl) {
    new IntersectionObserver((entries) => {
      entries.forEach(en => {
        heroVisible = en.isIntersecting;
        heroVisible ? resume() : stop();
      });
    }, { threshold: 0.05 }).observe(heroEl);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : resume();
  });

  // Pausa durante scroll activo — libera GPU para que el scroll sea fluido
  window.addEventListener('scroll', () => {
    if (!isScrolling) { isScrolling = true; stop(); }
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => { isScrolling = false; resume(); }, 180);
  }, { passive: true });

  // ── Listeners ────────────────────────────────────────────────
  window.addEventListener('resize', resize, { passive: true });
  // Listen on the hero element so the canvas (pointer-events:none) doesn't break it
  if (heroEl) {
    heroEl.addEventListener('mousemove', onMove, { passive: true });
    heroEl.addEventListener('mouseleave', onLeave, { passive: true });
    if (isCoarse) {
      heroEl.addEventListener('touchmove', onMove, { passive: true });
      heroEl.addEventListener('touchend', onLeave, { passive: true });
    }
  }

  resize();
})();
