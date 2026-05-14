// ASHA Solution — site interactions

(function () {
  'use strict';

  // ---------- Consent banner ----------
  const consent = document.getElementById('liquid-consent-container');
  const btnAccept = document.getElementById('btn-consent-accept');
  const btnDecline = document.getElementById('btn-consent-decline');
  const cookieName = 'dataConsentStatus';

  function setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const d = new Date();
      d.setTime(d.getTime() + days * 86400000);
      expires = '; expires=' + d.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
  }

  function getCookie(name) {
    const eq = name + '=';
    const parts = document.cookie.split(';');
    for (let i = 0; i < parts.length; i++) {
      let c = parts[i].trim();
      if (c.indexOf(eq) === 0) return c.substring(eq.length);
    }
    return null;
  }

  function closeConsent() {
    consent.classList.remove('is-visible');
    setTimeout(() => { consent.style.display = 'none'; }, 550);
  }

  if (consent) {
    if (!getCookie(cookieName)) {
      consent.style.display = 'flex';
      setTimeout(() => consent.classList.add('is-visible'), 500);
    } else {
      consent.style.display = 'none';
    }
    btnAccept && btnAccept.addEventListener('click', () => { setCookie(cookieName, 'accepted', 365); closeConsent(); });
    btnDecline && btnDecline.addEventListener('click', () => { setCookie(cookieName, 'declined', 365); closeConsent(); });
  }

  // ---------- Sticky header shadow ----------
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 30) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');

    const top = document.getElementById('scroll-top');
    if (top) {
      if (window.scrollY > 400) top.classList.add('is-visible');
      else top.classList.remove('is-visible');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  const mToggle = document.getElementById('mobileMenuToggle');
  const mClose = document.getElementById('mobileMenuClose');
  const mWrap = document.getElementById('mobileMenuWrapper');

  if (mToggle && mWrap) {
    mToggle.addEventListener('click', () => mWrap.classList.add('is-open'));
  }
  if (mClose && mWrap) {
    mClose.addEventListener('click', (e) => { e.preventDefault(); mWrap.classList.remove('is-open'); });
  }
  if (mWrap) {
    mWrap.querySelector('.mobile-menu-overlay').addEventListener('click', () => mWrap.classList.remove('is-open'));
    mWrap.querySelectorAll('.mobile-menu-list a').forEach(a => a.addEventListener('click', () => mWrap.classList.remove('is-open')));
  }

  // ---------- Animated headline rotator (legacy fade) ----------
  const rotator = document.getElementById('headlineRotator');
  if (rotator) {
    const items = rotator.querySelectorAll('.rotator-text');
    let idx = 0;
    setInterval(() => {
      items[idx].classList.remove('active');
      idx = (idx + 1) % items.length;
      items[idx].classList.add('active');
    }, 2500);
  }

  // ---------- Typewriter rotator ----------
  const typed = document.getElementById('headlineTyped');
  if (typed) {
    const textEl = typed.querySelector('.typed-text');
    let words;
    try { words = JSON.parse(typed.getAttribute('data-words')); } catch (_) { words = []; }
    if (words.length) {
      const TYPE_MS = 90;
      const ERASE_MS = 50;
      const HOLD_MS = 1800;
      let wi = 0, ci = 0, erasing = false;

      const tick = () => {
        const word = words[wi];
        if (!erasing) {
          ci++;
          textEl.textContent = word.slice(0, ci);
          if (ci >= word.length) {
            erasing = true;
            return setTimeout(tick, HOLD_MS);
          }
          return setTimeout(tick, TYPE_MS);
        } else {
          ci--;
          textEl.textContent = word.slice(0, ci);
          if (ci <= 0) {
            erasing = false;
            wi = (wi + 1) % words.length;
            return setTimeout(tick, 280);
          }
          return setTimeout(tick, ERASE_MS);
        }
      };
      tick();
    }
  }

  // ---------- Hero sparkle particles ----------
  const canvas = document.getElementById('heroSparkles');
  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = window.devicePixelRatio || 1;
    let particles = [];

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.min(70, Math.floor(w * h / 22000));
      particles = Array.from({ length: target }, () => spawn());
    };

    const spawn = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18 - 0.05,
      a: Math.random() * 0.5 + 0.15,
      twPhase: Math.random() * Math.PI * 2,
    });

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        const tw = (Math.sin(t * 0.002 + p.twPhase) + 1) / 2;
        const alpha = p.a * (0.4 + tw * 0.6);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 230, ${alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
  }

  // ---------- Reveal-on-scroll for fadeIn elements ----------
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.differentiator, .industries, .practices-grid, .clients, .big-cta, .cta-image-section')
    .forEach(el => observer.observe(el));

  // ---------- Animated counters (stat cards) ----------
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    const animateCounter = (el) => {
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      const duration = 2200;
      const start = performance.now();
      el.textContent = '0';
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(eased * target).toString();
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => cObserver.observe(c));
  }

  // ---------- Form handlers (CSIRT, Bolsa) ----------
  ['csirtForm', 'bolsaForm'].forEach(id => {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHTML = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Enviando…</span>';
        submitBtn.disabled = true;
      }
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>¡Solicitud recibida!</span>';
          setTimeout(() => {
            form.reset();
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
          }, 2400);
        }
      }, 900);
    });
  });

})();
