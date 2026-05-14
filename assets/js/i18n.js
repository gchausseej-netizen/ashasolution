/* ASHA Solution — Lightweight i18n
   Reads data-i18n="key.path" and replaces text content.
   Stores selection in localStorage under "asha-lang".
   Initial: ES. Switch instantly via the .lang-switch buttons in header.
*/
(function () {
  'use strict';

  const STORAGE_KEY = 'asha-lang';
  const DEFAULT = 'es';
  const SUPPORTED = ['es', 'en'];

  let dict = null;

  const get = (obj, path) => path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), obj);

  const apply = () => {
    if (!dict) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = get(dict, key);
      if (typeof val === 'string') el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      // format: "attr:key.path; attr2:other.key"
      const spec = el.getAttribute('data-i18n-attr');
      spec.split(';').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (!attr || !key) return;
        const val = get(dict, key);
        if (typeof val === 'string') el.setAttribute(attr, val);
      });
    });
  };

  const setLang = async (lang) => {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT;
    try {
      const r = await fetch(`assets/i18n/${lang}.json`, { cache: 'no-store' });
      if (!r.ok) throw new Error('not ok');
      dict = await r.json();
      document.documentElement.lang = lang;
      localStorage.setItem(STORAGE_KEY, lang);
      // Update toggle buttons
      document.querySelectorAll('.lang-switch__btn').forEach(b => {
        const isActive = b.dataset.lang === lang;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      apply();
    } catch (err) {
      console.warn('i18n: failed to load', lang, err);
    }
  };

  // Wire buttons
  document.querySelectorAll('.lang-switch__btn').forEach(b => {
    b.addEventListener('click', () => setLang(b.dataset.lang));
  });

  // Boot — keep stored choice or default ES
  const stored = localStorage.getItem(STORAGE_KEY) || DEFAULT;
  setLang(stored);
})();
