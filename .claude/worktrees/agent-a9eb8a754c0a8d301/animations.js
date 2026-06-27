/**
 * animations.js — WebAlati Premium Animation Engine
 * Framer Motion-inspired patterns for vanilla HTML/CSS/JS
 * NO logic, data, or functionality modified — purely visual layer
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────
   * 1. SCROLL PROGRESS BAR
   * Updates --scroll-progress CSS var + scaleX on #scroll-progress-bar
   * ───────────────────────────────────────────────────── */
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress-bar');
    if (!bar) return;
    function update() {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? Math.min(scrolled / total, 1) : 0;
      bar.style.transform = `scaleX(${pct})`;
      document.documentElement.style.setProperty('--scroll-progress', pct);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ─────────────────────────────────────────────────────
   * 2. NAVBAR SCROLL SHRINK
   * Adds/removes .navbar--scrolled after 60px to trigger compact state
   * ───────────────────────────────────────────────────── */
  function initNavScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    function update() {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > 60);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ─────────────────────────────────────────────────────
   * 3. SCROLL REVEAL — IntersectionObserver
   * Elements with [data-reveal] start hidden and fade/slide up when visible.
   * [data-reveal-delay="N"] adds N*100ms stagger delay.
   * ───────────────────────────────────────────────────── */
  function initScrollReveal() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Immediately show everything
      document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.revealDelay || '0', 10);
            setTimeout(() => entry.target.classList.add('is-visible'), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
  }

  /* ─────────────────────────────────────────────────────
   * 4. HERO STAGGER REVEAL on DOMContentLoaded
   * Staggers children of .hero-content with small delays
   * ───────────────────────────────────────────────────── */
  function initHeroReveal() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const heroContent = document.querySelector('.hero-content');
    if (!heroContent || prefersReduced) return;

    const children = Array.from(heroContent.children);
    children.forEach((child, i) => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(28px)';
      child.style.transition = `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms`;
      setTimeout(() => {
        child.style.opacity = '1';
        child.style.transform = 'translateY(0)';
      }, 100 + i * 120);
    });
  }

  /* ─────────────────────────────────────────────────────
   * 5. 3D CARD TILT on mouse-move
   * Applies subtle 3D tilt to .tool-card and .category-card on hover.
   * Uses CSS vars --tilt-x --tilt-y via inline style.
   * ───────────────────────────────────────────────────── */
  function initCardTilt() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const MAX_TILT = 6; // degrees

    function attachTilt(card) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateY = ((x - cx) / cx) * MAX_TILT;
        const rotateX = -((y - cy) / cy) * MAX_TILT;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.015)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    }

    // Use a MutationObserver to also tilt dynamically injected cards
    function tiltAll() {
      document.querySelectorAll('.tool-card:not([data-tilt]), .category-card:not([data-tilt])').forEach(card => {
        card.setAttribute('data-tilt', '1');
        attachTilt(card);
      });
    }

    tiltAll();

    const mo = new MutationObserver(tiltAll);
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ─────────────────────────────────────────────────────
   * 6. COUNT-UP ANIMATION for stat numbers
   * Elements with [data-count="N"] animate from 0 → N when visible.
   * ───────────────────────────────────────────────────── */
  function initCountUp() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.countSuffix || '';
          const duration = 1400;
          const start = performance.now();

          function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          }

          if (prefersReduced) {
            el.textContent = target + suffix;
          } else {
            requestAnimationFrame(tick);
          }

          observer.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
  }

  /* ─────────────────────────────────────────────────────
   * 7. CURSOR GLOW EFFECT — subtle ambient glow follows the cursor
   * Adds a soft radial glow on the page that follows mouse, depth effect
   * ───────────────────────────────────────────────────── */
  function initCursorGlow() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let raf;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    function animateGlow() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      document.documentElement.style.setProperty('--cursor-x', `${currentX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${currentY}px`);
      raf = requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }

  /* ─────────────────────────────────────────────────────
   * 8. STAGGER GRID CARDS when injected by script.js
   * Watches for new cards added to #category-tools-container and
   * animates them in with a stagger.
   * ───────────────────────────────────────────────────── */
  function initGridStagger() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    function staggerCards(container) {
      const cards = container.querySelectorAll('.tool-card:not([data-staggered])');
      cards.forEach((card, i) => {
        card.setAttribute('data-staggered', '1');
        card.style.opacity = '0';
        card.style.transform = 'translateY(28px)';
        card.style.transition = `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms`;
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = '';
        }, 60 + i * 50);
      });
    }

    const containers = ['trending-container', 'category-tools-container'];
    containers.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const mo = new MutationObserver(() => staggerCards(el));
      mo.observe(el, { childList: true });
    });
  }

  /* ─────────────────────────────────────────────────────
   * 9. MODAL SPRING ANIMATIONS
   * Hooks into existing modal open/close by watching classList changes.
   * ───────────────────────────────────────────────────── */
  function initModalAnimations() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const modalIds = ['tool-modal', 'newsletter-modal', 'contact-modal', 'success-modal'];
    modalIds.forEach(id => {
      const modal = document.getElementById(id);
      if (!modal) return;

      const content = modal.querySelector('.modal-content');
      if (!content) return;

      // Watch for 'active' class being added/removed
      const mo = new MutationObserver(() => {
        if (modal.classList.contains('active')) {
          content.style.transition = 'none';
          content.style.opacity = '0';
          content.style.transform = 'scale(0.91) translateY(16px)';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              content.style.transition = 'opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)';
              content.style.opacity = '1';
              content.style.transform = 'scale(1) translateY(0)';
            });
          });
        } else {
          content.style.transition = 'opacity 0.2s ease-in, transform 0.2s ease-in';
          content.style.opacity = '0';
          content.style.transform = 'scale(0.95) translateY(8px)';
        }
      });
      mo.observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* ─────────────────────────────────────────────────────
   * INIT — run all modules
   * ───────────────────────────────────────────────────── */
  function init() {
    initScrollProgress();
    initNavScroll();
    initScrollReveal();
    initHeroReveal();
    initCardTilt();
    initCountUp();
    initCursorGlow();
    initGridStagger();
    initModalAnimations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
