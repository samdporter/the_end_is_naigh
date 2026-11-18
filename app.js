/**
 * The End is N-AI-gh: Amodei is Coming, Look Busy
 * Interactive Presentation Engine & Telemetry Simulation
 */
(() => {
  'use strict';

  /* ==========================================================================
   * Helpers
   * ========================================================================== */

  const qsAny = (selectors, root = document) => {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  };

  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const isEditableTarget = (target) => {
    if (!target || !(target instanceof Element)) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    );
  };

  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  /* ==========================================================================
   * 1. Slide Deck Navigation
   * ========================================================================== */

  function initDeckNavigation() {
    const slides = qsa('.slide');
    if (slides.length === 0) return null;

    const progressFill = qsAny([
      '#deck-progress',
      '.deck-progress',
      '#progress-fill',
      '#progress-bar',
      '.progress-fill',
      '.progress-bar-fill',
      '[data-progress-bar]'
    ]);
    const counterEl = qsAny(['#slide-counter', '.slide-counter', '[data-slide-counter]']);
    const navDotsEl = qsAny(['#nav-dots', '.nav-dots', '[data-nav-dots]']);
    const prevBtns = qsa('#prev-btn, #prev-slide, .prev-slide, [data-slide-nav="prev"], [data-nav="prev"]');
    const nextBtns = qsa('#next-btn, #next-slide, .next-slide, [data-slide-nav="next"], [data-nav="next"]');

    const notesDrawer = qsAny([
      '#notes-drawer',
      '#speaker-notes',
      '.notes-drawer',
      '[data-notes-drawer]'
    ]);
    const notesContent = notesDrawer
      ? qsAny(
          ['#notes-body', '.notes-drawer-body', '#notes-content', '.notes-content', '.notes-body', '[data-notes-body]'],
          notesDrawer
        ) || notesDrawer
      : null;
    const notesLabel = notesDrawer
      ? qsAny(['#notes-slide-label', '.notes-slide-label', '[data-notes-label]'], notesDrawer)
      : null;
    const notesCloseBtns = notesDrawer
      ? qsa('#notes-close, .notes-close, [data-notes-close]', notesDrawer)
      : [];
    const notesToggleBtns = qsa('#toggle-notes, #notes-toggle, .notes-toggle, [data-toggle-notes]');

    let currentIndex = 0;

    // Build or bind navigation dots
    let dots = [];
    if (navDotsEl) {
      dots = qsa('.nav-dot, button', navDotsEl);
      if (dots.length !== slides.length) {
        navDotsEl.innerHTML = '';
        dots = slides.map((slide, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'nav-dot';
          btn.dataset.slideTarget = String(idx);
          const title =
            slide.dataset.title ||
            slide.querySelector('h1, h2')?.textContent?.trim() ||
            `Slide ${idx + 1}`;
          btn.setAttribute('aria-label', `Go to slide ${idx + 1}: ${title}`);
          btn.title = `${idx + 1}. ${title}`;
          navDotsEl.appendChild(btn);
          return btn;
        });
      }
      dots.forEach((dot, idx) => {
        const parsedTarget =
          dot.dataset.slideTarget !== undefined ? parseInt(dot.dataset.slideTarget, 10) : idx;
        const targetIdx = Number.isNaN(parsedTarget) ? idx : parsedTarget;
        dot.addEventListener('click', () => goToSlide(targetIdx));
      });
    }

    function updateSpeakerNotes(slide, idx) {
      if (notesLabel) {
        notesLabel.textContent = `SPEAKER NOTES // SLIDE ${String(idx + 1).padStart(2, '0')}`;
      }
      if (!notesContent) return;
      const inlineNotes = slide.querySelector('.speaker-notes, aside.notes, [data-speaker-notes]');
      const html = inlineNotes
        ? inlineNotes.innerHTML
        : slide.dataset.notes
          ? `<p>${escapeHtml(slide.dataset.notes)}</p>`
          : `<p class="muted">No speaker notes for slide ${idx + 1}. Wing it with quiet British confidence.</p>`;
      notesContent.innerHTML = html;
    }

    function toggleNotes(forceState) {
      if (!notesDrawer) return;
      const isOpen = notesDrawer.classList.contains('open') || notesDrawer.classList.contains('active');
      const nextOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
      notesDrawer.classList.toggle('open', nextOpen);
      notesDrawer.classList.toggle('active', nextOpen);
      if (notesDrawer.hasAttribute('hidden') && nextOpen) {
        notesDrawer.removeAttribute('hidden');
      }
      notesDrawer.setAttribute('aria-hidden', String(!nextOpen));
      notesToggleBtns.forEach((btn) => {
        btn.classList.toggle('active', nextOpen);
        btn.setAttribute('aria-pressed', String(nextOpen));
        btn.setAttribute('aria-expanded', String(nextOpen));
      });
    }

    notesToggleBtns.forEach((btn) => {
      btn.addEventListener('click', () => toggleNotes());
    });

    notesCloseBtns.forEach((btn) => {
      btn.addEventListener('click', () => toggleNotes(false));
    });

    function goToSlide(rawIndex, { updateHash = true } = {}) {
      const nextIndex = Math.max(0, Math.min(slides.length - 1, rawIndex));
      currentIndex = nextIndex;

      slides.forEach((slide, idx) => {
        const isActive = idx === nextIndex;
        slide.classList.toggle('active', isActive);
        slide.classList.toggle('prev', idx < nextIndex);
        slide.classList.toggle('next', idx > nextIndex);
        slide.classList.toggle('is-past', idx < nextIndex);
        slide.classList.toggle('is-future', idx > nextIndex);
        slide.setAttribute('aria-hidden', String(!isActive));
        if (isActive && slide.scrollTop > 0) {
          slide.scrollTop = 0;
        }
      });

      if (progressFill) {
        const pct = ((nextIndex + 1) / slides.length) * 100;
        progressFill.style.width = `${pct.toFixed(2)}%`;
      }

      if (counterEl) {
        const cur = String(nextIndex + 1).padStart(2, '0');
        const tot = String(slides.length).padStart(2, '0');
        counterEl.textContent = `${cur} / ${tot}`;
      }

      dots.forEach((dot, idx) => {
        const parsedTarget =
          dot.dataset.slideTarget !== undefined ? parseInt(dot.dataset.slideTarget, 10) : idx;
        const targetIdx = Number.isNaN(parsedTarget) ? idx : parsedTarget;
        const isActive = targetIdx === nextIndex;
        dot.classList.toggle('active', isActive);
        if (isActive) {
          dot.setAttribute('aria-current', 'step');
        } else {
          dot.removeAttribute('aria-current');
        }
      });

      prevBtns.forEach((btn) => {
        btn.disabled = nextIndex === 0;
      });
      nextBtns.forEach((btn) => {
        btn.disabled = nextIndex === slides.length - 1;
      });

      updateSpeakerNotes(slides[nextIndex], nextIndex);

      if (updateHash) {
        const targetHash = `#slide-${nextIndex + 1}`;
        if (window.location.hash !== targetHash) {
          try {
            history.replaceState(null, '', targetHash);
          } catch {
            window.location.hash = targetHash;
          }
        }
      }

      document.dispatchEvent(
        new CustomEvent('slidechange', {
          detail: {
            index: nextIndex,
            total: slides.length,
            slide: slides[nextIndex]
          }
        })
      );
    }

    function nextSlide() {
      if (currentIndex < slides.length - 1) goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      if (currentIndex > 0) goToSlide(currentIndex - 1);
    }

    prevBtns.forEach((btn) => btn.addEventListener('click', prevSlide));
    nextBtns.forEach((btn) => btn.addEventListener('click', nextSlide));

    function parseHashIndex() {
      const hash = window.location.hash || '';
      const match = hash.match(/^#(?:slide-)?(\d+)$/i);
      if (!match) return 0;
      const parsed = parseInt(match[1], 10) - 1;
      return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(slides.length - 1, parsed));
    }

    window.addEventListener('hashchange', () => {
      goToSlide(parseHashIndex(), { updateHash: false });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      const lightbox = document.getElementById('lightbox');
      const openModal = qsAny([
        '#dino-modal.open',
        '#dino-modal.active',
        '#iframe-modal.open',
        '#iframe-modal.active',
        '.modal.open',
        '.modal.active'
      ]);
      const lightboxOpen =
        lightbox &&
        (lightbox.classList.contains('open') ||
          lightbox.classList.contains('active') ||
          (!lightbox.hasAttribute('hidden') && lightbox.style.display === 'flex'));

      if (e.key === 'Escape') {
        if (lightboxOpen) {
          document.dispatchEvent(new CustomEvent('presentation:close-lightbox'));
          return;
        }
        if (openModal) {
          document.dispatchEvent(new CustomEvent('presentation:close-modal'));
          return;
        }
        if (notesDrawer && (notesDrawer.classList.contains('open') || notesDrawer.classList.contains('active'))) {
          toggleNotes(false);
        }
        return;
      }

      // Pause deck navigation while an overlay is open
      if (lightboxOpen || openModal) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        toggleNotes();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
        return;
      }

      if (e.key === ' ') {
        const tag = e.target instanceof Element ? e.target.tagName : '';
        if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY' || tag === 'VIDEO') return;
        e.preventDefault();
        nextSlide();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        goToSlide(slides.length - 1);
      }
    });

    // Touch swipe navigation
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let ignoreSwipe = false;

    document.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length !== 1) {
          ignoreSwipe = true;
          return;
        }
        const target = e.target instanceof Element ? e.target : null;
        ignoreSwipe = Boolean(
          target && target.closest('canvas, video, input, textarea, [data-no-swipe]')
        );
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      },
      { passive: true }
    );

    document.addEventListener(
      'touchend',
      (e) => {
        if (ignoreSwipe || e.changedTouches.length !== 1) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dt = Date.now() - touchStartTime;

        if (dt < 750 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) {
          if (dx < 0) nextSlide();
          else prevSlide();
        }
      },
      { passive: true }
    );

    // Initialize starting slide
    const initialFromActive = slides.findIndex((s) => s.classList.contains('active'));
    const initialIndex = window.location.hash ? parseHashIndex() : Math.max(0, initialFromActive);
    goToSlide(initialIndex, { updateHash: Boolean(window.location.hash) || initialIndex > 0 });

    return {
      goToSlide,
      nextSlide,
      prevSlide,
      getCurrentIndex: () => currentIndex
    };
  }

  /* ==========================================================================
   * 2. Generic Interactive Tab Switchers ([data-tab-group], [data-tab], [data-tab-target])
   * ========================================================================== */

  function initTabSwitchers() {
    const TAB_BTN_SELECTOR = '[data-tab-target], [data-tab]';
    const getTabTarget = (btn) => btn.dataset.tabTarget || btn.dataset.tab || '';

    function activateTab(btn) {
      const targetId = getTabTarget(btn);
      if (!targetId) return;

      const groupContainer = btn.closest('[data-tab-group]');
      const groupName = btn.dataset.tabGroup || groupContainer?.dataset.tabGroup || '';

      // Locate sibling tab buttons in the same logical group
      let groupButtons = [];
      if (groupContainer) {
        groupButtons = qsa(TAB_BTN_SELECTOR, groupContainer).filter(
          (candidate) => candidate.closest('[data-tab-group]') === groupContainer
        );
      } else if (groupName) {
        groupButtons = qsa(
          `[data-tab-group="${CSS.escape(groupName)}"][data-tab-target], ` +
            `[data-tab-group="${CSS.escape(groupName)}"][data-tab]`
        );
      }

      if (groupButtons.length === 0) {
        groupButtons = [btn];
      }

      groupButtons.forEach((tabBtn) => {
        const active = tabBtn === btn;
        tabBtn.classList.toggle('active', active);
        tabBtn.setAttribute('aria-selected', String(active));
      });

      // Locate corresponding panels
      const targetNames = new Set(groupButtons.map((b) => getTabTarget(b)).filter(Boolean));
      let panels = [];

      if (groupContainer) {
        panels = qsa('[data-tab-panel], .tab-panel', groupContainer).filter(
          (p) => p.closest('[data-tab-group]') === groupContainer
        );
      }

      if (panels.length === 0 && groupName) {
        panels = qsa(
          `[data-tab-group="${CSS.escape(groupName)}"][data-tab-panel], ` +
            `[data-tab-group="${CSS.escape(groupName)}"] .tab-panel, ` +
            `[data-tab-group="${CSS.escape(groupName)}"] [data-tab-panel]`
        );
      }

      if (panels.length === 0) {
        const scope = btn.closest('.slide') || document;
        panels = qsa('[data-tab-panel], .tab-panel', scope).filter(
          (p) => targetNames.has(p.dataset.tabPanel) || targetNames.has(p.id)
        );
      }

      if (panels.length === 0) {
        panels = Array.from(targetNames)
          .map((id) => document.getElementById(id))
          .filter(Boolean);
      }

      const usesHiddenAttr = panels.some((p) => p.hasAttribute('hidden'));

      panels.forEach((panel) => {
        const isMatch = panel.dataset.tabPanel === targetId || panel.id === targetId;
        panel.classList.toggle('active', isMatch);
        panel.setAttribute('aria-hidden', String(!isMatch));
        if (usesHiddenAttr) {
          if (isMatch) panel.removeAttribute('hidden');
          else panel.setAttribute('hidden', '');
        }
      });

      if (groupName === 'dino-era' && typeof window.setDinoEra === 'function') {
        window.setDinoEra(btn.dataset.dinoEra || targetId);
      }
    }

    document.addEventListener('click', (e) => {
      const btn = e.target instanceof Element ? e.target.closest(TAB_BTN_SELECTOR) : null;
      if (!btn) return;
      e.preventDefault();
      activateTab(btn);
    });

    // Ensure initial active states are consistent on load
    qsa('[data-tab-group]').forEach((groupEl) => {
      const activeBtn =
        groupEl.querySelector('[data-tab-target].active, [data-tab].active') ||
        groupEl.querySelector(TAB_BTN_SELECTOR);
      if (activeBtn) activateTab(activeBtn);
    });
  }

  /* ==========================================================================
   * 3. Dino Tycoon Automated Street Map & Agent Swarm Canvas (#dino-agent-canvas)
   * ========================================================================== */

  function initDinoExperience() {
    initDinoAgentCanvas();
    initVideoDropzones();
    initLiveGameModal();
  }

  function initDinoAgentCanvas() {
    const canvas = document.getElementById('dino-agent-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const VIRTUAL_W = 960;
    const VIRTUAL_H = 540;

    const ERAS = {
      era1: {
        id: 'era1',
        badge: 'ERA 1 · SIMPLE ZOO',
        hudBadge: 'ERA 1 // WILD ACRES ZOO',
        statusText: 'Street-map agent loop active',
        title: 'Simple Zoo Prototype',
        subtitle: 'Basically a muddy field in Milton Keynes with a fence.',
        dayCap: 15,
        guestTarget: 14,
        cashBase: 42800,
        agentCount: 1,
        rating: '3.2 ★',
        checks: '12 / 12',
        hudChecks: 'PASS',
        agents: [
          { name: 'simtest.js', role: 'Fence & path smoke check', color: '#34d399', active: true },
          { name: 'soak.js (60 days)', role: 'Standby (unlocks Era 2)', color: '#64748b', active: false },
          { name: 'Playwright Chromium', role: 'DOM click verification', color: '#60a5fa', active: true },
          { name: 'Playwright WebKit', role: 'Standby', color: '#64748b', active: false },
          { name: 'Masterclass AI #1–#4', role: 'Standby', color: '#64748b', active: false }
        ],
        logs: [
          '[PASS] simtest.js: Gatehouse connected to Herbivore Pen',
          '[PASS] Chromium: Build toolbar renders at 1280x720',
          '[PASS] Keeper #1 refilled feeder (0 starvation ticks)',
          '[INFO] Guest #07 complained about lack of dinosaurs'
        ]
      },
      era2: {
        id: 'era2',
        badge: 'ERA 2 · DINO PARK',
        hudBadge: 'ERA 2 // DINO TYCOON',
        statusText: '60-day economy soak & DNA splice checks running',
        title: 'Full Dinosaur Park',
        subtitle: 'Apex predators, keeper zones, vet drones & 60-day economy soak.',
        dayCap: 35,
        guestTarget: 32,
        cashBase: 68400,
        agentCount: 3,
        rating: '4.4 ★',
        checks: '26 / 26',
        hudChecks: '26/26 PASS',
        agents: [
          { name: 'simtest.js', role: 'Economy & welfare invariants', color: '#34d399', active: true },
          { name: 'soak.js (60 days)', role: 'Running 60-day survival sim', color: '#fbbf24', active: true },
          { name: 'Playwright Chromium', role: 'Canvas hit-test suite', color: '#60a5fa', active: true },
          { name: 'Playwright WebKit', role: 'Safari layout parity', color: '#38bdf8', active: true },
          { name: 'Masterclass AI #1–#4', role: 'Warming up heuristics', color: '#64748b', active: false }
        ],
        logs: [
          '[PASS] soak.js Day 24: Cash £68.4k, 0 bankruptcies',
          '[PASS] Raptor Sector fence integrity 100%',
          '[PASS] Vet Drone dispatched to Triceratops Meadow',
          '[INFO] T. rex requested a larger tea room (ignored)'
        ]
      },
      era3: {
        id: 'era3',
        badge: 'ERA 3 · MONORAIL + SEA & SKY + SAFARI',
        hudBadge: 'ERA 3 // MONORAIL, SEA & SKY',
        statusText: 'Monorail, lagoon & aviary telemetry active',
        title: 'Monorail, Lagoon, Aviary & Safari',
        subtitle: 'Elevated transit loop, Mosasaurus lagoon, geodesic aviary & jeep safari.',
        dayCap: 60,
        guestTarget: 50,
        cashBase: 194500,
        agentCount: 4,
        rating: '4.9 ★',
        checks: '38 / 38',
        hudChecks: '38/38 PASS',
        agents: [
          { name: 'simtest.js', role: 'Multi-biome pathing check', color: '#34d399', active: true },
          { name: 'soak.js (60 days)', role: '60-day stability verified', color: '#fbbf24', active: true },
          { name: 'Playwright Chromium', role: 'Monorail & Aviary E2E', color: '#60a5fa', active: true },
          { name: 'Playwright WebKit', role: 'WebAudio & Retina parity', color: '#38bdf8', active: true },
          { name: 'Masterclass AI #1–#4', role: 'Live park optimisation', color: '#c084fc', active: true }
        ],
        logs: [
          '[PASS] Monorail Tram #1 & #2 zero-deadlock loop',
          '[PASS] Mosasaurus Lagoon depth & ripple shader OK',
          '[PASS] Aviary geodesic dome containment verified',
          '[PASS] Safari Jeep #2 cleared T. rex Ridge safely'
        ]
      },
      swarm: {
        id: 'swarm',
        badge: 'ERA 4 · MULTI-AGENT SWARM TEST (42 CHECKS)',
        hudBadge: 'SWARM // 42 CHECKS ACTIVE',
        statusText: '8 parallel testers hammering island & 32 Playwright checks',
        title: '42-Check Parallel Agent Swarm',
        subtitle: '8 concurrent automated testers hammering the island while you drink tea.',
        dayCap: 60,
        guestTarget: 62,
        cashBase: 312800,
        agentCount: 8,
        rating: '5.0 ★',
        checks: '42 / 42',
        hudChecks: '42/42 PASS',
        agents: [
          { name: 'simtest.js', role: '14 invariant assertions PASS', color: '#34d399', active: true },
          { name: 'soak.js (60 days)', role: '60d soak: +0.4MB heap delta', color: '#fbbf24', active: true },
          { name: 'Playwright Chromium', role: '12 UI/Canvas checks PASS', color: '#60a5fa', active: true },
          { name: 'Playwright WebKit', role: '8 Safari parity checks PASS', color: '#38bdf8', active: true },
          { name: 'Masterclass AI #1–#4', role: '4 parallel bots stress-testing', color: '#f472b6', active: true }
        ],
        logs: [
          '[42/42 PASS] AI #1–#4 concurrent build stress OK',
          '[PASS] soak.js Day 60: 0 NaN balances, 0 stuck guests',
          '[PASS] WebKit & Chromium pixel-diff within 0.2%',
          '[PASS] simtest.js: All 42 automated checks green'
        ]
      }
    };

    const activeDinoTab = document.querySelector(
      '[data-tab-group="dino-era"] .tab-btn.active, [data-tab-group="dino-era"] [data-tab].active'
    );
    let currentEraKey = activeDinoTab
      ? normalizeEraKey(activeDinoTab.dataset.dinoEra || activeDinoTab.dataset.tab)
      : 'era1';
    const eraCaptionEl = qsAny(['#dino-era-caption', '.dino-era-caption', '[data-dino-caption]']);
    const hudBadgeEl = document.getElementById('dino-era-badge');
    const simStatusEl = document.getElementById('dino-sim-status');
    const simToggleBtn = document.getElementById('dino-sim-toggle');
    const hudAgentsEl = document.getElementById('hud-agents');
    const hudDayEl = document.getElementById('hud-day');
    const hudCashEl = document.getElementById('hud-cash');
    const hudChecksEl = document.getElementById('hud-checks');

    // Street-map graph nodes (virtual 960x540 space, leaving right 265px for telemetry HUD)
    const PATH_NODES = [
      { x: 118, y: 428 }, // 0: South Gatehouse
      { x: 235, y: 392 }, // 1: Main Plaza
      { x: 235, y: 270 }, // 2: Central Crossroad
      { x: 235, y: 155 }, // 3: North Junction
      { x: 385, y: 270 }, // 4: East Plaza
      { x: 525, y: 270 }, // 5: Lagoon Promenade
      { x: 385, y: 155 }, // 6: Aviary Overlook
      { x: 385, y: 392 }, // 7: South Boulevard
      { x: 525, y: 392 }  // 8: Brachio Walk
    ];

    const PATH_EDGES = [
      [0, 1], [1, 2], [2, 3], [1, 7], [2, 4], [3, 6], [4, 6], [4, 5], [4, 7], [7, 8], [5, 8]
    ];

    const ADJACENCY = PATH_NODES.map(() => []);
    PATH_EDGES.forEach(([a, b]) => {
      ADJACENCY[a].push(b);
      ADJACENCY[b].push(a);
    });

    // Monorail spline control points
    const MONORAIL_POINTS = [
      { x: 165, y: 125 },
      { x: 350, y: 95 },
      { x: 560, y: 130 },
      { x: 615, y: 275 },
      { x: 550, y: 425 },
      { x: 325, y: 448 },
      { x: 135, y: 385 },
      { x: 115, y: 235 }
    ];

    // Safari jeep loop
    const SAFARI_POINTS = [
      { x: 255, y: 330 },
      { x: 375, y: 330 },
      { x: 475, y: 335 },
      { x: 475, y: 445 },
      { x: 255, y: 445 }
    ];

    // Guests & Staff state
    const GUEST_COLORS = ['#fde047', '#f472b6', '#38bdf8', '#a7f3d0', '#fb923c', '#e2e8f0'];
    const guests = Array.from({ length: 64 }, (_, i) => {
      const from = i % PATH_NODES.length;
      const neighbours = ADJACENCY[from];
      const to = neighbours[i % neighbours.length];
      return {
        from,
        to,
        t: (i * 0.17) % 1,
        speed: 0.22 + (i % 5) * 0.04,
        color: GUEST_COLORS[i % GUEST_COLORS.length]
      };
    });

    const staff = [
      { role: 'keeper', label: 'K1', x: 210, y: 255, targetIdx: 0, speed: 46, color: '#f59e0b', radius: 56 },
      { role: 'keeper', label: 'K2', x: 445, y: 290, targetIdx: 1, speed: 42, color: '#f59e0b', radius: 56 },
      { role: 'vet', label: 'VET', x: 340, y: 195, targetIdx: 2, speed: 54, color: '#22d3ee', radius: 68 },
      { role: 'keeper', label: 'K3', x: 520, y: 365, targetIdx: 3, speed: 44, color: '#f59e0b', radius: 56 }
    ];

    const STAFF_WAYPOINTS = [
      { x: 175, y: 205 },
      { x: 445, y: 205 },
      { x: 310, y: 350 },
      { x: 530, y: 365 },
      { x: 565, y: 230 },
      { x: 225, y: 370 }
    ];

    const enclosures = [
      { id: 'herbi', name: 'Herbivore Pen', era: 'era1', x: 145, y: 185, w: 120, h: 82, stroke: '#34d399', fill: 'rgba(16, 185, 129, 0.14)', dinos: 3, dinoColor: '#86efac' },
      { id: 'carni', name: 'Small Carnivores', era: 'era1', x: 145, y: 295, w: 115, h: 78, stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.14)', dinos: 2, dinoColor: '#fcd34d' },
      { id: 'trex', name: 'T. rex Paddock', era: 'era2', x: 280, y: 300, w: 135, h: 86, stroke: '#f87171', fill: 'rgba(239, 68, 68, 0.16)', dinos: 1, dinoColor: '#fca5a5', big: true },
      { id: 'raptor', name: 'Raptor Sector', era: 'era2', x: 285, y: 178, w: 115, h: 74, stroke: '#fb923c', fill: 'rgba(251, 146, 60, 0.16)', dinos: 3, dinoColor: '#fdba74' },
      { id: 'brachio', name: 'Brachiosaurus Ridge', era: 'era2', x: 425, y: 302, w: 140, h: 86, stroke: '#4ade80', fill: 'rgba(74, 222, 128, 0.13)', dinos: 2, dinoColor: '#bbf7d0', big: true }
    ];

    const swarmProbes = [
      { label: 'AI-1', cx: 210, cy: 230, rx: 65, ry: 45, phase: 0.2, color: '#f472b6' },
      { label: 'AI-2', cx: 365, cy: 195, rx: 85, ry: 55, phase: 1.7, color: '#38bdf8' },
      { label: 'AI-3', cx: 540, cy: 265, rx: 70, ry: 85, phase: 3.1, color: '#a78bfa' },
      { label: 'AI-4', cx: 390, cy: 365, rx: 110, ry: 55, phase: 4.4, color: '#34d399' }
    ];

    let simTime = 0;
    let simDay = 1;
    let lastTimestamp = 0;
    let rafId = null;
    let isRunning = false;

    function isEraAtLeast(target) {
      const order = ['era1', 'era2', 'era3', 'swarm'];
      return order.indexOf(currentEraKey) >= order.indexOf(target);
    }

    function pointAlongClosedLoop(pts, u) {
      const n = pts.length;
      const wrapped = ((u % 1) + 1) % 1;
      const scaled = wrapped * n;
      const i0 = Math.floor(scaled) % n;
      const i1 = (i0 + 1) % n;
      const frac = scaled - Math.floor(scaled);
      const p0 = pts[i0];
      const p1 = pts[i1];
      return {
        x: p0.x + (p1.x - p0.x) * frac,
        y: p0.y + (p1.y - p0.y) * frac,
        angle: Math.atan2(p1.y - p0.y, p1.x - p0.x)
      };
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = rect.width > 80 ? rect.width : 920;
      const cssH = rect.height > 80 ? rect.height : Math.round(cssW * (VIRTUAL_H / VIRTUAL_W));
      const targetW = Math.round(cssW * dpr);
      const targetH = Math.round(cssH * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    }

    function drawRoundedRect(x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    }

    function drawIsland(era) {
      // Ocean & subtle telemetry blueprint grid
      ctx.fillStyle = '#07111c';
      ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.055)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < 685; gx += 32) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, VIRTUAL_H);
        ctx.stroke();
      }
      for (let gy = 0; gy < VIRTUAL_H; gy += 32) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(685, gy);
        ctx.stroke();
      }

      // Animated subtle coastline ripple
      const pulse = Math.sin(simTime * 1.4) * 3;
      ctx.save();
      ctx.beginPath();
      if (era === 'era1') {
        ctx.ellipse(230, 290, 175 + pulse, 155 + pulse, -0.08, 0, Math.PI * 2);
      } else {
        ctx.moveTo(95, 225);
        ctx.bezierCurveTo(95, 110, 230, 68, 395, 78);
        ctx.bezierCurveTo(555, 88, 645, 150, 645, 275);
        ctx.bezierCurveTo(645, 410, 560, 478, 365, 478);
        ctx.bezierCurveTo(175, 478, 82, 425, 82, 325);
        ctx.closePath();
      }
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 10 + pulse * 0.6;
      ctx.stroke();

      // Sand shore + emerald botanical island mass
      ctx.fillStyle = '#0f2922';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(217, 185, 128, 0.45)';
      ctx.stroke();
      ctx.restore();

      // Map coordinate label
      ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText('ISLA AUTOMATÓN // SECTOR 04 · 1 TILE = 4M', 22, VIRTUAL_H - 18);
    }

    function drawStreetMapPaths() {
      const maxNode = isEraAtLeast('era2') ? PATH_NODES.length : 4;
      const visibleEdges = PATH_EDGES.filter(([a, b]) => a < maxNode && b < maxNode);

      // Outer road casing
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 13;
      visibleEdges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(PATH_NODES[a].x, PATH_NODES[a].y);
        ctx.lineTo(PATH_NODES[b].x, PATH_NODES[b].y);
        ctx.stroke();
      });

      // Inner paved walkway
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 9;
      visibleEdges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(PATH_NODES[a].x, PATH_NODES[a].y);
        ctx.lineTo(PATH_NODES[b].x, PATH_NODES[b].y);
        ctx.stroke();
      });

      // Centre dashed street-map line
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.22)';
      ctx.lineWidth = 1.2;
      visibleEdges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(PATH_NODES[a].x, PATH_NODES[a].y);
        ctx.lineTo(PATH_NODES[b].x, PATH_NODES[b].y);
        ctx.stroke();
      });
      ctx.restore();

      // Gatehouse marker
      const gate = PATH_NODES[0];
      ctx.fillStyle = '#38bdf8';
      drawRoundedRect(gate.x - 16, gate.y - 9, 32, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#07111c';
      ctx.font = '700 9px ui-monospace, SFMono-Regular, monospace';
      ctx.fillText('GATE', gate.x - 11, gate.y + 3);
    }

    function drawEnclosures() {
      enclosures.forEach((enc, idx) => {
        if (!isEraAtLeast(enc.era)) return;

        ctx.save();
        drawRoundedRect(enc.x, enc.y, enc.w, enc.h, 8);
        ctx.fillStyle = enc.fill;
        ctx.fill();
        ctx.lineWidth = enc.id === 'raptor' ? 2 : 1.5;
        if (enc.id === 'raptor') ctx.setLineDash([5, 3]);
        ctx.strokeStyle = enc.stroke;
        ctx.stroke();
        ctx.restore();

        // Label
        ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
        ctx.font = '600 10px system-ui, -apple-system, sans-serif';
        ctx.fillText(enc.name, enc.x + 8, enc.y + 15);

        // Animated dinosaurs inside paddock
        for (let d = 0; d < enc.dinos; d++) {
          const px =
            enc.x +
            22 +
            ((enc.w - 44) * (0.5 + 0.42 * Math.sin(simTime * (0.7 + d * 0.2) + idx * 1.9 + d * 2.1)));
          const py =
            enc.y +
            30 +
            ((enc.h - 44) * (0.5 + 0.4 * Math.cos(simTime * (0.55 + d * 0.25) + idx + d * 1.4)));
          ctx.beginPath();
          ctx.arc(px, py, enc.big ? 5.2 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = enc.dinoColor;
          ctx.fill();
          ctx.strokeStyle = 'rgba(7, 17, 28, 0.75)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });
    }

    function drawLagoonAndAviary() {
      if (!isEraAtLeast('era3')) return;

      // Mosasaurus Lagoon (East Bay)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(548, 212, 66, 52, -0.15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#22d3ee';
      ctx.stroke();

      // Water ripple rings
      const rippleR = 14 + ((simTime * 16) % 34);
      ctx.beginPath();
      ctx.arc(548, 212, rippleR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(103, 232, 249, ${Math.max(0, 0.5 - rippleR / 70)})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Swimming Mosasaurus silhouette
      const mAngle = simTime * 0.9;
      const mx = 548 + Math.cos(mAngle) * 30;
      const my = 212 + Math.sin(mAngle) * 20;
      ctx.translate(mx, my);
      ctx.rotate(mAngle + Math.PI / 2);
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#cffafe';
      ctx.font = '600 10px system-ui, -apple-system, sans-serif';
      ctx.fillText('Mosasaurus Lagoon', 502, 172);

      // Pteranodon Geodesic Aviary (North)
      const ax = 438;
      const ay = 132;
      const ar = 44;
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax, ay, ar, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(167, 139, 250, 0.14)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#a78bfa';
      ctx.stroke();

      // Geodesic dome spokes
      ctx.strokeStyle = 'rgba(196, 181, 253, 0.28)';
      ctx.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        const ang = (Math.PI / 3) * k;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + Math.cos(ang) * ar, ay + Math.sin(ang) * ar);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(ax, ay, ar * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      // Circling pterosaurs
      for (let p = 0; p < 3; p++) {
        const ang = simTime * 1.35 + p * 2.1;
        const px = ax + Math.cos(ang) * 24;
        const py = ay + Math.sin(ang) * 20;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang + Math.PI / 2);
        ctx.strokeStyle = '#e9d5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, 3);
        ctx.lineTo(0, -3);
        ctx.lineTo(6, 3);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      ctx.fillStyle = '#ede9fe';
      ctx.font = '600 10px system-ui, -apple-system, sans-serif';
      ctx.fillText('Aviary Dome', 408, 102);
    }

    function drawSafariTrack() {
      if (!isEraAtLeast('era3')) return;

      ctx.save();
      ctx.beginPath();
      SAFARI_POINTS.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // 2 Moving Safari Jeeps
      [0, 0.5].forEach((offset) => {
        const pos = pointAlongClosedLoop(SAFARI_POINTS, simTime * 0.055 + offset);
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(pos.angle);
        ctx.fillStyle = '#fbbf24';
        drawRoundedRect(-7, -4, 14, 8, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
        ctx.beginPath();
        ctx.moveTo(7, -2);
        ctx.lineTo(24, -8);
        ctx.lineTo(24, 8);
        ctx.lineTo(7, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    }

    function drawMonorailLoop() {
      if (!isEraAtLeast('era3')) return;

      // Track shadow + glowing cyan elevated beam
      ctx.save();
      ctx.beginPath();
      MONORAIL_POINTS.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Stations
      const stations = [
        { pt: MONORAIL_POINTS[1], label: 'Aviary Stn' },
        { pt: MONORAIL_POINTS[3], label: 'Lagoon East' },
        { pt: MONORAIL_POINTS[6], label: 'Central Stn' }
      ];
      stations.forEach(({ pt, label }) => {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        drawRoundedRect(pt.x - 10, pt.y - 6, 20, 12, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#7dd3fc';
        ctx.font = '600 9px ui-monospace, monospace';
        ctx.fillText(label, pt.x - 22, pt.y - 10);
      });

      // 2 Multi-carriage moving trams
      [0, 0.5].forEach((offset) => {
        for (let car = 0; car < 3; car++) {
          const u = simTime * 0.048 + offset - car * 0.017;
          const pos = pointAlongClosedLoop(MONORAIL_POINTS, u);
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(pos.angle);
          ctx.fillStyle = car === 0 ? '#f8fafc' : '#bae6fd';
          drawRoundedRect(-7, -3.5, 14, 7, 2.5);
          ctx.fill();
          ctx.restore();
        }
      });
      ctx.restore();
    }

    function updateAndDrawGuests(dt, era) {
      const activeCount = Math.min(guests.length, era.guestTarget);
      const maxNode = isEraAtLeast('era2') ? PATH_NODES.length : 4;

      for (let i = 0; i < activeCount; i++) {
        const g = guests[i];
        g.t += dt * g.speed;
        if (g.t >= 1) {
          g.t -= 1;
          g.from = g.to < maxNode ? g.to : 0;
          const candidates = ADJACENCY[g.from].filter((n) => n < maxNode);
          const pool = candidates.length > 0 ? candidates : [0];
          g.to = pool[Math.floor(Math.random() * pool.length)];
        }
        const a = PATH_NODES[g.from];
        const b = PATH_NODES[g.to];
        const jitterX = Math.sin(i * 3.1) * 2.2;
        const jitterY = Math.cos(i * 2.7) * 2.2;
        const gx = a.x + (b.x - a.x) * g.t + jitterX;
        const gy = a.y + (b.y - a.y) * g.t + jitterY;

        ctx.beginPath();
        ctx.arc(gx, gy, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = g.color;
        ctx.fill();
      }
    }

    function updateAndDrawStaff(dt) {
      const count = isEraAtLeast('era3') ? staff.length : isEraAtLeast('era2') ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const s = staff[i];
        const wp = STAFF_WAYPOINTS[s.targetIdx % STAFF_WAYPOINTS.length];
        const dx = wp.x - s.x;
        const dy = wp.y - s.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) {
          s.targetIdx = (s.targetIdx + 1 + i) % STAFF_WAYPOINTS.length;
        } else {
          s.x += (dx / dist) * s.speed * dt;
          s.y += (dy / dist) * s.speed * dt;
        }

        // Pulsing coverage ring
        const pulse = 0.85 + 0.15 * Math.sin(simTime * 2.5 + i);
        const r = s.radius * pulse;
        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle =
          s.role === 'vet' ? 'rgba(34, 211, 238, 0.08)' : 'rgba(245, 158, 11, 0.08)';
        ctx.fill();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle =
          s.role === 'vet' ? 'rgba(34, 211, 238, 0.42)' : 'rgba(245, 158, 11, 0.42)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        // Staff badge
        ctx.beginPath();
        ctx.arc(s.x, s.y, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = '#07111c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#07111c';
        ctx.font = '700 7px ui-monospace, monospace';
        ctx.fillText(s.label, s.x - (s.label.length > 2 ? 7 : 5), s.y + 2.5);
      }
    }

    function drawSwarmOverlay() {
      if (currentEraKey !== 'swarm') return;

      // Subtle Playwright Chromium / WebKit viewport scanline
      const scanY = ((simTime * 115) % (VIRTUAL_H - 40)) + 20;
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, scanY);
      ctx.lineTo(665, scanY);
      ctx.stroke();

      // 4 Masterclass AI cursor probes
      swarmProbes.forEach((probe, idx) => {
        const px = probe.cx + Math.cos(simTime * 1.1 + probe.phase) * probe.rx;
        const py = probe.cy + Math.sin(simTime * 1.45 + probe.phase) * probe.ry;

        ctx.strokeStyle = probe.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshair ticks
        ctx.beginPath();
        ctx.moveTo(px - 19, py);
        ctx.lineTo(px - 10, py);
        ctx.moveTo(px + 10, py);
        ctx.lineTo(px + 19, py);
        ctx.moveTo(px, py - 19);
        ctx.lineTo(px, py - 10);
        ctx.moveTo(px, py + 10);
        ctx.lineTo(px, py + 19);
        ctx.stroke();

        ctx.fillStyle = probe.color;
        ctx.font = '700 9px ui-monospace, monospace';
        ctx.fillText(`${probe.label} ✓`, px + 16, py - 8 + (idx % 2) * 2);
      });
      ctx.restore();
    }

    function drawTelemetryHud(era) {
      // Top-left live park status bar
      ctx.save();
      drawRoundedRect(16, 14, 650, 34, 8);
      ctx.fillStyle = 'rgba(10, 20, 33, 0.86)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 11px ui-monospace, SFMono-Regular, monospace';
      ctx.fillText(era.badge, 28, 35);

      const dayNum = String(((Math.floor(simDay) - 1) % era.dayCap) + 1).padStart(2, '0');
      const liveCash = (era.cashBase + Math.floor(simTime * 140) % 4500).toLocaleString('en-GB');
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 11px ui-monospace, SFMono-Regular, monospace';
      ctx.fillText(
        `DAY ${dayNum}/${era.dayCap} · GUESTS ${era.guestTarget * 4} · £${liveCash} · ${era.rating}`,
        336,
        35
      );

      // Right-hand Agent Swarm HUD Panel
      const panelX = 682;
      const panelY = 14;
      const panelW = 262;
      const panelH = VIRTUAL_H - 28;

      drawRoundedRect(panelX, panelY, panelW, panelH, 10);
      ctx.fillStyle = 'rgba(9, 17, 29, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('AUTOMATED AGENT SWARM', panelX + 14, panelY + 24);

      // Checks badge
      drawRoundedRect(panelX + 14, panelY + 34, panelW - 28, 24, 6);
      ctx.fillStyle = currentEraKey === 'swarm' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(56, 189, 248, 0.14)';
      ctx.fill();
      ctx.fillStyle = currentEraKey === 'swarm' ? '#34d399' : '#7dd3fc';
      ctx.font = '700 11px ui-monospace, monospace';
      ctx.fillText(`ASSERTIONS: ${era.checks} PASSING`, panelX + 24, panelY + 50);

      // Agent list
      let yCursor = panelY + 78;
      era.agents.forEach((agent, idx) => {
        drawRoundedRect(panelX + 14, yCursor, panelW - 28, 42, 6);
        ctx.fillStyle = agent.active ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.5)';
        ctx.fill();

        const blink = agent.active ? 0.55 + 0.45 * Math.sin(simTime * 4.5 + idx) : 0.35;
        ctx.beginPath();
        ctx.arc(panelX + 27, yCursor + 15, 4, 0, Math.PI * 2);
        ctx.fillStyle = agent.color;
        ctx.globalAlpha = blink;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = agent.active ? '#f1f5f9' : '#64748b';
        ctx.font = '700 11px ui-monospace, monospace';
        ctx.fillText(agent.name, panelX + 38, yCursor + 18);

        ctx.fillStyle = agent.active ? '#94a3b8' : '#475569';
        ctx.font = '500 10px system-ui, -apple-system, sans-serif';
        ctx.fillText(agent.role, panelX + 38, yCursor + 34);

        yCursor += 49;
      });

      // Live scrolling telemetry log
      const logBoxY = yCursor + 6;
      const logBoxH = panelY + panelH - logBoxY - 12;
      drawRoundedRect(panelX + 14, logBoxY, panelW - 28, logBoxH, 6);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '700 9px ui-monospace, monospace';
      ctx.fillText('LIVE TEST LOG STREAM', panelX + 22, logBoxY + 16);

      const activeLogIdx = Math.floor(simTime / 2.2) % era.logs.length;
      era.logs.forEach((line, idx) => {
        const ly = logBoxY + 34 + idx * 28;
        if (ly + 14 > logBoxY + logBoxH) return;
        const isCurrent = idx === activeLogIdx;
        ctx.fillStyle = isCurrent
          ? line.includes('[INFO]')
            ? '#fcd34d'
            : '#34d399'
          : '#94a3b8';
        ctx.font = `${isCurrent ? '700' : '500'} 9.5px ui-monospace, monospace`;
        const clipped = line.length > 36 ? `${line.slice(0, 35)}…` : line;
        ctx.fillText(clipped, panelX + 22, ly);
      });
      ctx.restore();
    }

    let userPaused = false;
    let lastHudText = {
      agents: '',
      day: '',
      cash: '',
      checks: '',
      badge: '',
      status: ''
    };

    function updateHudReadouts(era) {
      if (!era) return;
      const dayVal = String(((Math.floor(simDay) - 1) % era.dayCap) + 1);
      const cashVal = `£${(era.cashBase + (Math.floor(simTime * 140) % 4500)).toLocaleString('en-GB')}`;
      const agentsVal = String(era.agentCount);
      const checksVal = era.hudChecks || 'PASS';
      const badgeVal = era.hudBadge || era.badge;
      const statusVal = userPaused ? 'Simulation paused' : era.statusText || 'Street-map agent loop active';

      if (hudAgentsEl && lastHudText.agents !== agentsVal) {
        hudAgentsEl.textContent = agentsVal;
        lastHudText.agents = agentsVal;
      }
      if (hudDayEl && lastHudText.day !== dayVal) {
        hudDayEl.textContent = dayVal;
        lastHudText.day = dayVal;
      }
      if (hudCashEl && lastHudText.cash !== cashVal) {
        hudCashEl.textContent = cashVal;
        lastHudText.cash = cashVal;
      }
      if (hudChecksEl && lastHudText.checks !== checksVal) {
        hudChecksEl.textContent = checksVal;
        lastHudText.checks = checksVal;
      }
      if (hudBadgeEl && lastHudText.badge !== badgeVal) {
        hudBadgeEl.textContent = badgeVal;
        lastHudText.badge = badgeVal;
      }
      if (simStatusEl && lastHudText.status !== statusVal) {
        simStatusEl.textContent = statusVal;
        lastHudText.status = statusVal;
      }
    }

    function drawCurrentScene(dt = 0) {
      resizeCanvas();
      ctx.save();
      ctx.scale(canvas.width / VIRTUAL_W, canvas.height / VIRTUAL_H);

      const era = ERAS[currentEraKey] || ERAS.era1;
      drawIsland(currentEraKey);
      drawStreetMapPaths();
      drawSafariTrack();
      drawEnclosures();
      drawLagoonAndAviary();
      drawMonorailLoop();
      updateAndDrawGuests(dt, era);
      updateAndDrawStaff(dt);
      drawSwarmOverlay();
      drawTelemetryHud(era);

      ctx.restore();
      updateHudReadouts(era);
    }

    function renderFrame(timestamp) {
      if (!isRunning) return;
      if (!lastTimestamp) lastTimestamp = timestamp;
      const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;

      const eraSpeed = currentEraKey === 'swarm' ? 2.1 : currentEraKey === 'era3' ? 1.35 : 1;
      simTime += dt * eraSpeed;
      simDay += dt * (currentEraKey === 'swarm' ? 2.4 : 0.85);

      drawCurrentScene(dt);
      rafId = requestAnimationFrame(renderFrame);
    }

    function startLoop() {
      if (isRunning || userPaused) return;
      isRunning = true;
      lastTimestamp = 0;
      rafId = requestAnimationFrame(renderFrame);
    }

    function stopLoop() {
      isRunning = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function normalizeEraKey(raw) {
      const val = String(raw || '').toLowerCase().trim();
      if (val === '1' || val === 'era1' || val.includes('zoo')) return 'era1';
      if (val === '2' || val === 'era2' || val.includes('park')) return 'era2';
      if (val === '3' || val === 'era3' || val.includes('monorail') || val.includes('safari')) return 'era3';
      if (val === '4' || val === 'swarm' || val.includes('42') || val.includes('agent')) return 'swarm';
      return 'era1';
    }

    const eraButtons = qsa('[data-dino-era], [data-era], #dino-era-controls button, .era-controls button');

    function setEra(rawKey) {
      const key = normalizeEraKey(rawKey);
      currentEraKey = key;
      const era = ERAS[key];

      eraButtons.forEach((btn) => {
        const btnKey = normalizeEraKey(btn.dataset.dinoEra || btn.dataset.era || btn.textContent);
        const active = btnKey === key;
        btn.classList.toggle('active', active);
        if (btn.getAttribute('role') === 'tab') {
          btn.setAttribute('aria-selected', String(active));
        } else {
          btn.setAttribute('aria-pressed', String(active));
        }
      });

      if (eraCaptionEl && era) {
        eraCaptionEl.textContent = `${era.title} — ${era.subtitle}`;
      }

      updateHudReadouts(era);
      if (!isRunning) {
        drawCurrentScene(0);
      }
    }

    eraButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = btn.dataset.dinoEra || btn.dataset.era || btn.textContent;
        setEra(raw);
      });
    });

    if (simToggleBtn) {
      simToggleBtn.setAttribute('aria-pressed', 'false');
      simToggleBtn.addEventListener('click', () => {
        userPaused = !userPaused;
        simToggleBtn.textContent = userPaused ? 'Resume Sim' : 'Pause Sim';
        simToggleBtn.setAttribute('aria-pressed', String(userPaused));
        updateHudReadouts(ERAS[currentEraKey] || ERAS.era1);
        syncVisibility();
      });
    }

    // Only animate when Dino slide is active (or if there is no .slide wrapper)
    function syncVisibility() {
      const parentSlide = canvas.closest('.slide');
      const slideVisible = !parentSlide || parentSlide.classList.contains('active');
      if (slideVisible && !document.hidden && !userPaused) {
        resizeCanvas();
        startLoop();
      } else {
        stopLoop();
        if (slideVisible) {
          drawCurrentScene(0);
        }
      }
    }

    document.addEventListener('slidechange', syncVisibility);
    document.addEventListener('visibilitychange', syncVisibility);
    window.addEventListener('resize', resizeCanvas);

    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(() => resizeCanvas());
      ro.observe(canvas);
    }

    setEra(currentEraKey);
    syncVisibility();

    window.setDinoEra = setEra;
  }

  function initVideoDropzones() {
    const dropzones = qsa('.video-dropzone');
    if (dropzones.length === 0) return;

    // Prevent accidental full-page navigation when dragging files near the dropzone
    ['dragover', 'drop'].forEach((evtName) => {
      window.addEventListener(evtName, (e) => {
        if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
          e.preventDefault();
        }
      });
    });

    dropzones.forEach((zone) => {
      let currentUrl = null;

      let fileInput = zone.querySelector('input[type="file"]');
      if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'video/*,.mp4,.webm,.mov';
        fileInput.style.display = 'none';
        zone.appendChild(fileInput);
      }

      const promptEls = placeholder
        ? [placeholder]
        : Array.from(zone.children).filter(
            (el) => el.tagName !== 'INPUT' && el.tagName !== 'VIDEO' && !el.classList.contains('video-reset-btn')
          );
      let videoEl = zone.querySelector('video');
      let resetBtn = zone.querySelector('.video-reset-btn');

      function setPromptVisible(visible) {
        promptEls.forEach((el) => {
          el.style.display = visible ? '' : 'none';
        });
      }

      function loadVideoFile(file) {
        if (!file) return;
        const looksLikeVideo =
          file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
        if (!looksLikeVideo) return;

        if (currentUrl) URL.revokeObjectURL(currentUrl);
        currentUrl = URL.createObjectURL(file);

        if (!videoEl) {
          videoEl = document.createElement('video');
          videoEl.controls = true;
          videoEl.autoplay = true;
          videoEl.loop = true;
          videoEl.muted = true;
          videoEl.playsInline = true;
          videoEl.style.width = '100%';
          videoEl.style.height = '100%';
          videoEl.style.objectFit = 'contain';
          videoEl.style.borderRadius = 'inherit';
          zone.appendChild(videoEl);
        }

        if (!resetBtn) {
          resetBtn = document.createElement('button');
          resetBtn.type = 'button';
          resetBtn.className = 'btn video-reset-btn';
          resetBtn.style.marginTop = '0.35rem';
          resetBtn.style.padding = '0.25rem 0.65rem';
          resetBtn.style.fontSize = '0.75rem';
          resetBtn.textContent = 'Replace clip';
          resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearVideo();
          });
          zone.appendChild(resetBtn);
        }

        videoEl.src = currentUrl;
        videoEl.hidden = false;
        videoEl.style.display = 'block';
        resetBtn.hidden = false;
        setPromptVisible(false);
        zone.classList.add('has-video');
        videoEl.play().catch(() => {});
      }

      function clearVideo() {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
          currentUrl = null;
        }
        if (videoEl) {
          videoEl.pause();
          videoEl.removeAttribute('src');
          videoEl.load();
          videoEl.hidden = true;
          videoEl.style.display = 'none';
        }
        if (resetBtn) resetBtn.hidden = true;
        setPromptVisible(true);
        zone.classList.remove('has-video');
        fileInput.value = '';
      }

      zone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        zone.classList.add('dragover', 'drag-over');
      });

      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover', 'drag-over');
      });

      zone.addEventListener('dragleave', (e) => {
        if (!zone.contains(e.relatedTarget)) {
          zone.classList.remove('dragover', 'drag-over');
        }
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('dragover', 'drag-over');
        const file = e.dataTransfer?.files?.[0];
        loadVideoFile(file);
      });

      zone.addEventListener('click', (e) => {
        if (zone.classList.contains('has-video')) return;
        if (e.target instanceof Element && e.target.closest('video, button, a')) return;
        fileInput.click();
      });

      zone.addEventListener('keydown', (e) => {
        if (zone.classList.contains('has-video')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput.click();
        }
      });

      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        loadVideoFile(file);
      });
    });
  }

  function initLiveGameModal() {
    const DINO_URL = 'https://samdporter.github.io/Dino-Tycoon/';
    const triggers = qsa(
      '#launch-dino-btn, #launch-dino-game, [data-launch-dino], .launch-dino-btn, .launch-game-btn'
    );
    if (triggers.length === 0) return;

    let modal = qsAny(['#dino-modal', '#iframe-modal', '[data-dino-modal]']);

    function ensureModal() {
      if (modal) return modal;
      modal = document.createElement('div');
      modal.id = 'dino-modal';
      modal.className = 'modal dino-iframe-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Dino Tycoon Live Build');
      modal.innerHTML = `
        <div class="modal-backdrop" data-modal-close></div>
        <div class="modal-shell">
          <div class="modal-header">
            <span><strong>Dino Tycoon</strong> — Live Hosted Build</span>
            <div class="modal-actions">
              <a class="modal-ext-link" href="${DINO_URL}" target="_blank" rel="noopener noreferrer">Open in New Tab ↗</a>
              <button type="button" class="modal-close-btn" data-modal-close aria-label="Close modal">✕</button>
            </div>
          </div>
          <div class="modal-body">
            <iframe title="Dino Tycoon Live Game" allow="fullscreen; autoplay" loading="lazy"></iframe>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      return modal;
    }

    function openModal(url = DINO_URL) {
      const m = ensureModal();
      const iframe = m.querySelector('iframe');
      if (iframe && iframe.getAttribute('src') !== url) {
        iframe.setAttribute('src', url);
      }
      m.classList.add('open', 'active');
      m.removeAttribute('hidden');
      m.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('open', 'active');
      modal.setAttribute('aria-hidden', 'true');
      const iframe = modal.querySelector('iframe');
      if (iframe) {
        iframe.setAttribute('src', 'about:blank');
      }
    }

    triggers.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = btn.dataset.url || btn.getAttribute('href') || DINO_URL;
        openModal(url);
      });
    });

    document.addEventListener('click', (e) => {
      if (!modal) return;
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      if (target === modal || target.closest('[data-modal-close], .modal-close, .modal-close-btn')) {
        closeModal();
      }
    });

    document.addEventListener('presentation:close-modal', closeModal);
  }

  /* ==========================================================================
   * 4. Interactive AutoSeg get_bbox Upstream Bug Toggle (#toggle-bbox-bug)
   * ========================================================================== */

  function initBboxBugToggle() {
    const toggleEl = document.getElementById('toggle-bbox-bug');
    if (!toggleEl) return;

    const isCheckbox = toggleEl instanceof HTMLInputElement && toggleEl.type === 'checkbox';
    let reproduceBug = isCheckbox ? toggleEl.checked : true;

    const container =
      document.getElementById('bbox-bug-card') ||
      toggleEl.closest('.bug-reveal-card, .bbox-demo, .card, .slide') ||
      document;
    const flagStateEl = document.getElementById('bbox-flag-state');
    const calloutEl = document.getElementById('bbox-callout');
    const visualizer = qsAny(
      ['#bbox-visualizer', '#bbox-diagram', '.bbox-visualizer', '[data-bbox-visualizer]'],
      container
    );
    const statusEl = qsAny(['#bbox-status', '.bbox-status', '[data-bbox-status]'], container);
    const codeEl = qsAny(['#bbox-code', '#bbox-code-preview', '[data-bbox-code]'], container);
    const explainEl = qsAny(['#bbox-explanation', '.bbox-explanation', '[data-bbox-explain]'], container);
    const bugViews = qsa('[data-bbox-view="bug"]', container);
    const fixViews = qsa('[data-bbox-view="fixed"]', container);
    const bugCodeLines = qsa('.code-line.is-bug', container);
    const fixCodeLines = qsa('.code-line.is-fix', container);

    function renderVisualizer() {
      if (!visualizer) return;

      // 1D voxel strip representing shape=128, lesion=[104..125], patch=64
      const overshootHtml = reproduceBug
        ? `<div class="bbox-overshoot" style="position:absolute;left:100%;width:6.25%;top:0;bottom:0;background:repeating-linear-gradient(45deg,rgba(248,113,113,0.45),rgba(248,113,113,0.45) 4px,rgba(127,29,29,0.5) 4px,rgba(127,29,29,0.5) 8px);border:1.5px dashed #f87171;border-left:none;" title="Extra zero-padding past ubs=128 (+8 voxels)"></div>`
        : '';

      const cropLeftPct = reproduceBug ? 56.25 : 50; // 72/128 vs 64/128
      const cropWidthPct = reproduceBug ? 43.75 : 50; // 72..128 (plus 8 overshoot) vs 64..128
      const cropColor = reproduceBug ? '#fbbf24' : '#34d399';
      const cropBg = reproduceBug ? 'rgba(251, 191, 36, 0.16)' : 'rgba(52, 211, 153, 0.16)';

      visualizer.innerHTML = `
        <div class="bbox-track-wrap" style="position:relative;padding:24px 36px 28px 0;">
          <div class="bbox-axis" style="display:flex;justify-content:space-between;font:600 11px ui-monospace,monospace;color:#94a3b8;margin-bottom:6px;">
            <span>x = 0</span>
            <span>Foreground ROI [104..125]</span>
            <span>ubs = 128</span>
          </div>
          <div class="bbox-volume" style="position:relative;height:44px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.35);border-radius:6px;">
            <div class="bbox-roi" style="position:absolute;left:81.25%;width:16.4%;top:8px;bottom:8px;background:rgba(56,189,248,0.38);border:1px solid #38bdf8;border-radius:3px;" title="Foreground ROI"></div>
            <div class="bbox-crop" style="position:absolute;left:${cropLeftPct}%;width:${cropWidthPct}%;top:-3px;bottom:-3px;background:${cropBg};border:2px solid ${cropColor};border-radius:4px;"></div>
            ${overshootHtml}
          </div>
          <div style="margin-top:8px;font:600 11px ui-monospace,monospace;color:${cropColor};">
            ${
              reproduceBug
                ? '⚠ Crop window [72 .. 136] → misses upper clamp, adds +8 extra zero-pad voxels past 128'
                : '✓ Crop window [64 .. 128] → cleanly clamped to volume shape (0 overshoot voxels)'
            }
          </div>
        </div>
      `;
    }

    function updateBboxState() {
      if (isCheckbox) {
        toggleEl.checked = reproduceBug;
      } else {
        toggleEl.classList.toggle('active', reproduceBug);
        toggleEl.classList.toggle('is-fixed', !reproduceBug);
        toggleEl.setAttribute('aria-pressed', String(reproduceBug));
        toggleEl.textContent = reproduceBug
          ? 'reproduce_upstream_bbox_bug = True (Parity Mode)'
          : 'reproduce_upstream_bbox_bug = False (Clean Clamp)';
      }

      container.classList.toggle('bbox-bug-on', reproduceBug);
      container.classList.toggle('bbox-bug-off', !reproduceBug);
      container.classList.toggle('bug-highlighted', reproduceBug);
      container.classList.toggle('is-revealed', reproduceBug);
      container.classList.toggle('fix-highlighted', !reproduceBug);

      if (flagStateEl) {
        flagStateEl.textContent = reproduceBug ? 'True' : 'False';
        flagStateEl.classList.toggle('badge-crimson', reproduceBug);
        flagStateEl.classList.toggle('badge-emerald', !reproduceBug);
      }

      if (calloutEl) {
        calloutEl.classList.toggle('is-fix-callout', !reproduceBug);
        calloutEl.innerHTML = reproduceBug
          ? '<strong><code>reproduce_upstream_bbox_bug=True</code>:</strong> Deliberately reproducing upstream\'s unclamped edge-crop overflow so our 548 equivalence tests prove exact numerical parity down to the voxel.'
          : '<strong><code>reproduce_upstream_bbox_bug=False</code>:</strong> Cleanly clamping both <code>bbox_lbs[d]</code> and <code>bbox_ubs[d]</code> to <code>vol_shape[d]</code> — zero asymmetric edge zero-padding (pure mathematical sanity, no upstream quirk).';
      }

      bugCodeLines.forEach((line) => {
        line.setAttribute('aria-hidden', 'false');
        line.style.opacity = reproduceBug ? '1' : '0.45';
      });
      fixCodeLines.forEach((line) => {
        line.setAttribute('aria-hidden', 'false');
        line.style.opacity = reproduceBug ? '0.6' : '1';
      });

      if (statusEl) {
        statusEl.textContent = reproduceBug
          ? 'Upstream Parity Mode: Extra border zero-padding reproduced bit-for-bit'
          : 'Clean Clamped Mode: Upper bound clamped to data_shape';
      }

      if (codeEl) {
        codeEl.textContent = reproduceBug
          ? 'bbox_ubs = [i + p for i, p in zip(bbox_lbs, patch_size)]  # nnU-Net omits min(shape, ...)'
          : 'bbox_ubs = [min(s, i + p) for s, i, p in zip(shape, bbox_lbs, patch_size)]';
      }

      if (explainEl) {
        explainEl.textContent = reproduceBug
          ? 'Upstream nnU-NetDataLoader.get_bbox clamps lbs at 0 but forgets to clamp ubs at volume shape — adding subtle extra zero-padding near borders. AutoSeg reproduces it on purpose for 100% mathematical parity.'
          : 'Clamps both lbs >= 0 and ubs <= shape cleanly. Technically right, though upstream nnU-Net checkpoints were trained with the quirk.';
      }

      bugViews.forEach((el) => {
        el.hidden = !reproduceBug;
        el.classList.toggle('active', reproduceBug);
      });
      fixViews.forEach((el) => {
        el.hidden = reproduceBug;
        el.classList.toggle('active', !reproduceBug);
      });

      renderVisualizer();
    }

    const eventName = isCheckbox ? 'change' : 'click';
    toggleEl.addEventListener(eventName, () => {
      reproduceBug = isCheckbox ? toggleEl.checked : !reproduceBug;
      updateBboxState();
    });

    updateBboxState();
  }

  /* ==========================================================================
   * 5. Image Lightbox (img.zoomable -> #lightbox)
   * ========================================================================== */

  function initImageLightbox() {
    let lightbox = document.getElementById('lightbox');

    function ensureLightbox() {
      if (lightbox) return lightbox;
      lightbox = document.createElement('div');
      lightbox.id = 'lightbox';
      lightbox.className = 'lightbox';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-hidden', 'true');
      lightbox.innerHTML = `
        <button type="button" id="lightbox-close" class="lightbox-close" aria-label="Close image preview">✕</button>
        <figure class="lightbox-figure">
          <img id="lightbox-img" src="" alt="" />
          <figcaption id="lightbox-caption"></figcaption>
        </figure>
      `;
      document.body.appendChild(lightbox);
      return lightbox;
    }

    function openLightbox(img) {
      const box = ensureLightbox();
      const targetImg = qsAny(['#lightbox-img', 'img'], box);
      const captionEl = qsAny(['#lightbox-caption', '.lightbox-caption', 'figcaption'], box);

      if (targetImg) {
        targetImg.src = img.currentSrc || img.src;
        targetImg.alt = img.alt || '';
      }

      if (captionEl) {
        const figure = img.closest('figure');
        const figureCaption =
          figure?.querySelector('figcaption > span:first-child')?.textContent?.trim() ||
          figure?.querySelector('figcaption')?.textContent?.trim();
        const text = img.dataset.caption || figureCaption || img.alt || '';
        captionEl.textContent = text;
        captionEl.style.display = text ? '' : 'none';
      }

      box.classList.add('open', 'active');
      box.removeAttribute('hidden');
      box.setAttribute('aria-hidden', 'false');
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove('open', 'active');
      lightbox.setAttribute('aria-hidden', 'true');
    }

    document.addEventListener('click', (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      const zoomImg = target.closest('img.zoomable');
      if (zoomImg instanceof HTMLImageElement) {
        e.preventDefault();
        openLightbox(zoomImg);
        return;
      }

      if (lightbox && (lightbox.classList.contains('open') || lightbox.classList.contains('active'))) {
        const closeTrigger = target.closest('#lightbox-close, .lightbox-close, [data-lightbox-close]');
        if (target === lightbox || closeTrigger) {
          closeLightbox();
        }
      }
    });

    document.addEventListener('presentation:close-lightbox', closeLightbox);
  }

  /* ==========================================================================
   * 6. Interactive "Team Rapture Readiness Audit" (Final Slide)
   * ========================================================================== */

  function initRaptureAudit() {
    const auditCard = qsAny([
      '#rapture-audit-card',
      '#rapture-audit',
      '.rapture-audit',
      '[data-rapture-audit]'
    ]);
    const slideScope = auditCard?.closest('.slide') || document;
    const auditCheckboxes = qsa('.audit-checkbox', slideScope);

    // Primary wiring for Slide 9 (#rapture-audit-card, #salvation-panel, .audit-checkbox)
    if (auditCheckboxes.length > 0) {
      const scoreBadge = document.getElementById('audit-score-badge');
      const percentEl = document.getElementById('salvation-percent');
      const verdictEl = document.getElementById('salvation-verdict');
      const salvationPanel = document.getElementById('salvation-panel');
      const tickAllBtn = document.getElementById('audit-all-btn');
      const resetBtn = document.getElementById('audit-reset-btn');

      const VERDICTS = [
        {
          badgeClass: 'badge badge-crimson',
          metricClass: 'metric-value crimson',
          panelClass: 'card',
          text: 'Status: Perilously artisanal. Recommend hiding under a PACS server until harnesses are installed.'
        },
        {
          badgeClass: 'badge badge-gold',
          metricClass: 'metric-value',
          panelClass: 'card card-gold',
          text: 'Status: Mildly promising (on probation). You have at least stopped pretending to read 40,000-line C# diffs while making tea.'
        },
        {
          badgeClass: 'badge badge-gold',
          metricClass: 'metric-value cyan',
          panelClass: 'card card-cyan',
          text: 'Status: Narrowly spared. Amodei pauses the rapture briefly, though you remain on nnU-Net get_bbox parity duty until Friday.'
        },
        {
          badgeClass: 'badge badge-emerald',
          metricClass: 'metric-value emerald',
          panelClass: 'card card-emerald',
          text: 'Status: First-class ascent! Amodei nods approvingly. You are officially promoted to Principal Harness & Clinical Safety Officer.'
        }
      ];

      function updateAudit() {
        const total = auditCheckboxes.length;
        let checkedCount = 0;

        auditCheckboxes.forEach((cb) => {
          const isChecked = cb.checked;
          if (isChecked) checkedCount += 1;
          const labelCard = cb.closest('label.card');
          if (labelCard) {
            labelCard.classList.toggle('card-emerald', isChecked);
          }
        });

        const pct = Math.round((checkedCount / total) * 100);
        const outcomeIdx = Math.min(VERDICTS.length - 1, Math.round((checkedCount / total) * 3));
        const outcome = VERDICTS[outcomeIdx];

        if (scoreBadge) {
          scoreBadge.textContent = `${checkedCount} / ${total} VERIFIED`;
          scoreBadge.className = outcome.badgeClass;
        }

        if (percentEl) {
          percentEl.textContent = `${pct}% READY`;
          percentEl.className = outcome.metricClass;
        }

        if (verdictEl) {
          verdictEl.textContent = outcome.text;
        }

        if (salvationPanel) {
          salvationPanel.className = outcome.panelClass;
        }
      }

      auditCheckboxes.forEach((cb) => {
        cb.addEventListener('change', updateAudit);
      });

      if (tickAllBtn) {
        tickAllBtn.addEventListener('click', () => {
          auditCheckboxes.forEach((cb) => {
            cb.checked = true;
          });
          updateAudit();
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          auditCheckboxes.forEach((cb) => {
            cb.checked = false;
          });
          updateAudit();
        });
      }

      updateAudit();
      return;
    }

    // Fallback wiring for generic .rapture-toggle markup
    const auditRoot = auditCard;
    if (!auditRoot) return;

    const DEFAULT_CHECKS = [
      'I have read the Amodei essay and nodded gravely over lukewarm tea.',
      'My AGENTS.md is now longer than the actual codebase, and I feel nothing.',
      'When the agent refactors 400 lines while I make toast, I still pretend I reviewed the diff.'
    ];

    let toggles = qsa(
      '.rapture-toggle, [data-rapture-toggle], input[type="checkbox"], button[data-check]',
      auditRoot
    );

    if (toggles.length === 0) {
      const list = document.createElement('div');
      list.className = 'rapture-checks';
      DEFAULT_CHECKS.forEach((label, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rapture-toggle';
        btn.dataset.raptureToggle = String(idx);
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = `<span class="rapture-box">☐</span> <span>${escapeHtml(label)}</span>`;
        list.appendChild(btn);
      });
      auditRoot.prepend(list);
      toggles = qsa('.rapture-toggle', auditRoot);
    }

    let verdictEl = qsAny(
      ['#rapture-verdict', '#rapture-result', '.rapture-verdict', '[data-rapture-verdict]'],
      auditRoot.closest('.slide') || document
    );

    if (!verdictEl) {
      verdictEl = document.createElement('div');
      verdictEl.id = 'rapture-verdict';
      verdictEl.className = 'rapture-verdict';
      auditRoot.appendChild(verdictEl);
    }

    const VERDICTS = [
      {
        status: 'LEFT BEHIND',
        tone: 'status-left-behind',
        copy: '0 / 3 — Spectacularly left behind. You are still manually drawing ROIs in ITK-SNAP at 6pm on a Friday, aren’t you?'
      },
      {
        status: 'LEFT BEHIND (ON PROBATION)',
        tone: 'status-warn',
        copy: '1 / 3 — Looking decidedly exposed. At least open a terminal running htop and mutter about VRAM fragmentation when management walks past.'
      },
      {
        status: 'ALMOST SAVED',
        tone: 'status-close',
        copy: '2 / 3 — Narrowly spared, though you will be sentenced to maintaining upstream nnU-Net get_bbox off-by-one parity for eternity.'
      },
      {
        status: 'SAVED',
        tone: 'status-saved',
        copy: '3 / 3 — First-class ascent! Amodei nods approvingly. You are officially promoted to Principal Vibe-Check Officer.'
      }
    ];

    function isToggleActive(el) {
      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        return el.checked;
      }
      return el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true';
    }

    function updateVerdict() {
      const score = toggles.reduce((acc, el) => acc + (isToggleActive(el) ? 1 : 0), 0);
      const clamped = Math.max(0, Math.min(VERDICTS.length - 1, score));
      const outcome = VERDICTS[clamped];

      verdictEl.className = `rapture-verdict ${outcome.tone}`;
      verdictEl.innerHTML = `
        <strong class="rapture-badge">${outcome.status}</strong>
        <span class="rapture-copy">${escapeHtml(outcome.copy)}</span>
      `;
    }

    toggles.forEach((el) => {
      const isCheckbox = el instanceof HTMLInputElement && el.type === 'checkbox';
      el.addEventListener(isCheckbox ? 'change' : 'click', () => {
        if (!isCheckbox) {
          const next = !isToggleActive(el);
          el.classList.toggle('active', next);
          el.setAttribute('aria-pressed', String(next));
          const box = el.querySelector('.rapture-box');
          if (box) box.textContent = next ? '☑' : '☐';
        }
        updateVerdict();
      });
    });

    updateVerdict();
  }

  /* ==========================================================================
   * Bootstrap
   * ========================================================================== */

  function bootstrap() {
    initDeckNavigation();
    initTabSwitchers();
    initDinoExperience();
    initBboxBugToggle();
    initImageLightbox();
    initRaptureAudit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
