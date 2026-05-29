/* ============================================================
   Daily T Studio — Shared site JS
   Loaded by every page.
   ============================================================ */

(function () {
  'use strict';

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

  // ── Filter bar (collection pages) ────────────────────────────
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length) {
    // Filter all rows AND any matching diy-strip with same data-category
    const filterables = document.querySelectorAll('.print-row, .diy-strip[data-category]');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        filterables.forEach((el) => {
          el.style.display = (f === 'all' || el.dataset.category === f) ? '' : 'none';
        });
      });
    });
  }

  // ── Index page: horizontal carousel dots (work section) ──────
  const track = document.getElementById('track');
  const trackDots = document.querySelectorAll('#dots .dot');
  if (track && trackDots.length) {
    function updateTrackDots() {
      const cards = Array.from(track.children);
      const cx = track.scrollLeft + track.clientWidth / 2;
      let closest = 0;
      let min = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - cx);
        if (d < min) { min = d; closest = i; }
      });
      trackDots.forEach((d, i) => d.classList.toggle('active', i === closest));
    }
    track.addEventListener('scroll', updateTrackDots, { passive: true });
    trackDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const c = Array.from(track.children)[+dot.dataset.i];
        if (c) track.scrollTo({ left: c.offsetLeft - 20, behavior: 'smooth' });
      });
    });
  }
})();
