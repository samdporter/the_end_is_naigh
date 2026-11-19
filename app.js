(() => {
  'use strict';

  const slides = Array.from(document.querySelectorAll('.slide'));
  const counterEl = document.getElementById('slide-counter');
  const dotsWrap = document.getElementById('nav-dots');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const notesToggle = document.getElementById('notes-toggle');
  const notesDrawer = document.getElementById('notes-drawer');
  const notesBody = document.getElementById('notes-body');
  const notesClose = document.getElementById('notes-close');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');

  let current = 0;

  slides.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.type = 'button';
    dot.ariaLabel = `Slide ${idx + 1}`;
    dot.addEventListener('click', () => goTo(idx));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll('.dot'));

  function pauseHiddenVideos() {
    slides.forEach((slide, idx) => {
      if (idx !== current) {
        slide.querySelectorAll('video').forEach((v) => v.pause());
      }
    });
  }

  function goTo(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    counterEl.textContent = `${current + 1} / ${slides.length}`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === slides.length - 1;
    notesBody.textContent = slides[current].dataset.notes || 'No notes for this slide.';
    history.replaceState(null, '', `#slide-${current + 1}`);
    pauseHiddenVideos();
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  notesToggle.addEventListener('click', () => notesDrawer.classList.toggle('open'));
  notesClose.addEventListener('click', () => notesDrawer.classList.remove('open'));

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'Escape') {
      lightbox.classList.remove('open');
      notesDrawer.classList.remove('open');
      return;
    }
    if (lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      goTo(current + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goTo(current - 1);
    } else if (e.key === 'n' || e.key === 'N') {
      notesDrawer.classList.toggle('open');
    }
  });

  // Tab switchers
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const container = btn.closest('[data-tabs]');
    if (!container) return;
    const target = btn.dataset.tab;
    container.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
    container.querySelectorAll('.tab-panel').forEach((p) => {
      p.classList.toggle('active', p.dataset.panel === target);
    });
  });

  // Lightbox
  document.addEventListener('click', (e) => {
    const img = e.target.closest('img.zoomable');
    if (!img) return;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = img.dataset.caption || img.alt || '';
    lightbox.classList.add('open');
  });

  lightbox.addEventListener('click', () => lightbox.classList.remove('open'));

  // Hash restore & hashchange
  function syncFromHash() {
    const match = location.hash.match(/^#slide-(\d+)$/);
    goTo(match ? parseInt(match[1], 10) - 1 : 0);
  }
  window.addEventListener('hashchange', syncFromHash);
  syncFromHash();
})();
