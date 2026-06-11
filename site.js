/* ============================================================
   Daily T Studio — Shared site JS
   Loaded by every page.
   ============================================================ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Favicons (injected once here → applies to every page) ────
  // Root-relative paths resolve correctly from any page depth
  // (incl. /pages/...). Browsers that support SVG favicons will
  // prefer the crisp /favicon.svg; others fall back to /favicon.ico.
  (function injectFavicons() {
    const head = document.head;
    const icons = [
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/images/medium-favicon.png' }
    ];
    const existing = head.querySelectorAll('link[rel*="icon"]');
    icons.forEach((attrs) => {
      const dup = Array.from(existing).some((l) => l.getAttribute('href') === attrs.href);
      if (dup) return;
      const link = document.createElement('link');
      Object.entries(attrs).forEach(([k, v]) => link.setAttribute(k, v));
      head.appendChild(link);
    });
  })();

  // ── Nav scroll (toggle transparent → solid) ──────────────────
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // ── Reveal-on-scroll animation ───────────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('vis');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.07 });
    reveals.forEach((el) => io.observe(el));
  } else {
    // Fallback: show everything if observer is not supported
    reveals.forEach((el) => el.classList.add('vis'));
  }

  // ── Mobile hamburger menu ────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    const body = document.body;
    function openMenu() {
      mobileMenu.classList.add('open');
      body.classList.add('menu-open');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Close menu');
      mobileMenu.setAttribute('aria-hidden', 'false');
      const firstLink = mobileMenu.querySelector('a');
      if (firstLink) setTimeout(() => firstLink.focus(), 320);
    }
    function closeMenu() {
      mobileMenu.classList.remove('open');
      body.classList.remove('menu-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open menu');
      mobileMenu.setAttribute('aria-hidden', 'true');
      hamburger.focus();
    }
    hamburger.addEventListener('click', () => {
      if (mobileMenu.classList.contains('open')) closeMenu();
      else openMenu();
    });
    mobileMenu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => closeMenu());
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
    });
    // Click on the overlay background (not a link) closes the menu
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) closeMenu();
    });
  }

  // ── Image carousels ──────────────────────────────────────────
  document.querySelectorAll('[data-carousel]').forEach((wrap) => {
    const slides = wrap.querySelector('.carousel-slides');
    const dotEls = wrap.querySelectorAll('.cdot');
    const prev = wrap.querySelector('.c-prev');
    const next = wrap.querySelector('.c-next');
    const count = wrap.querySelectorAll('.carousel-slide').length;
    if (!slides || count === 0) return;

    let cur = 0;
    let startX = 0;
    let dragging = false;

    function goTo(i) {
      cur = ((i % count) + count) % count;
      slides.style.transform = `translateX(-${cur * 100}%)`;
      dotEls.forEach((d, idx) => d.classList.toggle('active', idx === cur));
    }

    if (prev) prev.addEventListener('click', () => goTo(cur - 1));
    if (next) next.addEventListener('click', () => goTo(cur + 1));
    dotEls.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    wrap.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    wrap.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 38) goTo(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });

    wrap.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      dragging = true;
      e.preventDefault();
    });
    window.addEventListener('mouseup', (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 38) goTo(cur + (dx < 0 ? 1 : -1));
    });
  });

  // ── Design spreads (collection pages) ────────────────────────
  // Each design is a native <details>; opening one closes the
  // others (an "open spread" at a time) and scrolls it into view.
  // Wrapped in the View Transitions API when available, with a
  // plain native fallback otherwise.
  document.querySelectorAll('.design-grid').forEach((grid) => {
    const designs = Array.from(grid.querySelectorAll('details.design'));

    function closeOthers(current) {
      designs.forEach((d) => { if (d !== current && d.open) d.open = false; });
    }

    designs.forEach((d) => {
      const summary = d.querySelector('summary');

      // Enhance the toggle with View Transitions when supported
      if (summary && document.startViewTransition && !reducedMotion) {
        summary.addEventListener('click', (e) => {
          e.preventDefault();
          document.startViewTransition(() => {
            d.open = !d.open;
            if (d.open) closeOthers(d);
          });
        });
      }

      d.addEventListener('toggle', () => {
        if (!d.open) return;
        closeOthers(d);
        // Keep the opened spread in view under the fixed nav
        requestAnimationFrame(() => {
          d.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'start'
          });
        });
      });
    });
  });

  // ── Filter bar (collection pages) ────────────────────────────
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    // Filter design spreads, legacy rows AND any matching diy-strip
    const filterables = document.querySelectorAll(
      'details.design[data-category], .print-row, .diy-strip[data-category]'
    );
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        filterables.forEach((el) => {
          const show = (f === 'all' || el.dataset.category === f);
          el.style.display = show ? '' : 'none';
          if (!show && el.tagName === 'DETAILS') el.open = false;
        });
      });
    });
  }

  // ── Sticky "Visit on Etsy" CTA (mobile, collection pages) ────
  const sticky = document.getElementById('sticky-etsy');
  if (sticky) {
    sticky.hidden = false;
    const endEls = document.querySelectorAll('.cta-section, footer');
    const visibleEnds = new Set();

    function updateSticky() {
      sticky.classList.toggle('show', window.scrollY > 360 && visibleEnds.size === 0);
    }

    if ('IntersectionObserver' in window && endEls.length) {
      const ioEnd = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) visibleEnds.add(en.target);
          else visibleEnds.delete(en.target);
        });
        updateSticky();
      }, { rootMargin: '0px 0px 80px 0px' });
      endEls.forEach((el) => ioEnd.observe(el));
    }
    window.addEventListener('scroll', updateSticky, { passive: true });
    updateSticky();
  }

})();
