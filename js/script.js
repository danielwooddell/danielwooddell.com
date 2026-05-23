/* =========================
   ENHANCED SITE INTERACTIONS
========================= */

(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopParallaxQuery = window.matchMedia('(min-width: 1181px) and (hover: hover) and (pointer: fine)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const parallaxLayers = document.querySelectorAll('.parallax-layer');
  const lowerParallaxWrap = document.querySelector('[data-lower-parallax-wrap]');
  const lowerParallaxLayers = document.querySelectorAll('[data-lower-parallax]');
  const header = document.querySelector('[data-header]');
  const year = document.querySelector('#year');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  /* =========================
     HERO PANEL + CURRENT FOCUS CAROUSELS
  ========================= */

  function initSlideSystem(config) {
    const root = document.querySelector(config.rootSelector);
    if (!root) return;

    const slides = Array.from(root.querySelectorAll(config.slideSelector));
    const dots = Array.from(root.querySelectorAll(config.dotSelector));
    const label = config.labelSelector ? root.querySelector(config.labelSelector) : null;
    const viewport = config.viewportSelector ? root.querySelector(config.viewportSelector) : null;
    let activeIndex = 0;
    let timer = null;
    let paused = false;

    function equalizeViewportHeight() {
      if (!viewport || !slides.length) return;

      const viewportWidth = viewport.clientWidth;
      if (!viewportWidth) return;

      const measureBox = document.createElement('div');
      measureBox.setAttribute('aria-hidden', 'true');
      measureBox.style.position = 'absolute';
      measureBox.style.visibility = 'hidden';
      measureBox.style.pointerEvents = 'none';
      measureBox.style.left = '-9999px';
      measureBox.style.top = '0';
      measureBox.style.width = `${viewportWidth}px`;
      measureBox.style.height = 'auto';
      measureBox.style.overflow = 'visible';

      viewport.appendChild(measureBox);

      let maxHeight = 0;

      slides.forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('is-active');
        clone.removeAttribute('aria-hidden');
        clone.style.position = 'relative';
        clone.style.inset = 'auto';
        clone.style.width = `${viewportWidth}px`;
        clone.style.opacity = '1';
        clone.style.visibility = 'hidden';
        clone.style.transform = 'none';
        clone.style.pointerEvents = 'none';
        clone.style.transition = 'none';

        measureBox.appendChild(clone);
        maxHeight = Math.max(maxHeight, clone.scrollHeight, clone.getBoundingClientRect().height);
        measureBox.removeChild(clone);
      });

      measureBox.remove();

      if (maxHeight > 0) {
        viewport.style.minHeight = `${Math.ceil(maxHeight)}px`;
      }
    }

    let resizeFrame = null;

    function requestHeightSync() {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        equalizeViewportHeight();
        resizeFrame = null;
      });
    }

    function setSlide(index) {
      if (!slides.length) return;

      activeIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', String(!isActive));
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle('is-active', isActive);
        if (isActive) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });

      if (label) {
        label.textContent = slides[activeIndex].dataset[config.labelDataset || 'focusLabel'] || config.defaultLabel || '';
      }
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startTimer() {
      stopTimer();
      if (prefersReducedMotion.matches || paused || slides.length < 2 || config.autoplay === false) return;

      timer = window.setInterval(() => {
        setSlide(activeIndex + 1);
      }, config.interval || 7600);
    }

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        setSlide(index);
        startTimer();
      });
    });

    root.addEventListener('mouseenter', () => {
      paused = true;
      stopTimer();
    });

    root.addEventListener('mouseleave', () => {
      paused = false;
      startTimer();
    });

    root.addEventListener('focusin', () => {
      paused = true;
      stopTimer();
    });

    root.addEventListener('focusout', () => {
      paused = false;
      startTimer();
    });

    setSlide(0);
    requestHeightSync();
    startTimer();

    window.addEventListener('resize', requestHeightSync, { passive: true });
    window.addEventListener('load', requestHeightSync);

    if (document.fonts && typeof document.fonts.ready === 'object') {
      document.fonts.ready.then(requestHeightSync).catch(() => {});
    }

    if (typeof prefersReducedMotion.addEventListener === 'function') {
      prefersReducedMotion.addEventListener('change', () => {
        if (prefersReducedMotion.matches) {
          stopTimer();
          setSlide(0);
        } else {
          startTimer();
        }
      });
    }
  }

  initSlideSystem({
    rootSelector: '[data-hero-panel]',
    slideSelector: '[data-hero-slide]',
    dotSelector: '[data-hero-dot]',
    viewportSelector: '.panel-viewport',
    labelDataset: 'heroLabel',
    interval: 8400
  });

  initSlideSystem({
    rootSelector: '[data-focus-carousel]',
    slideSelector: '[data-focus-slide]',
    dotSelector: '[data-focus-dot]',
    viewportSelector: '.focus-carousel-viewport',
    labelSelector: '[data-focus-label]',
    labelDataset: 'focusLabel',
    defaultLabel: 'Current Focus',
    interval: 7600
  });

  /* =========================
     RECOMMENDATION MARQUEE
  ========================= */

  const marqueeTracks = document.querySelectorAll('[data-marquee-track]');

  function prepareRecommendationMarquees() {
    if (prefersReducedMotion.matches) return;

    marqueeTracks.forEach(track => {
      if (track.dataset.marqueeReady === 'true') return;

      const group = track.querySelector('[data-marquee-group]');
      if (!group) return;

      const clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('data-marquee-group');
      clone.querySelectorAll('a, button').forEach(element => {
        element.setAttribute('tabindex', '-1');
      });

      track.appendChild(clone);
      track.dataset.marqueeReady = 'true';
    });
  }

  prepareRecommendationMarquees();

  /* =========================
     PARALLAX BACKGROUND
  ========================= */

  let parallaxTicking = false;

  function parallaxEnabled() {
    return !prefersReducedMotion.matches && desktopParallaxQuery.matches;
  }

  function resetParallax() {
    [...parallaxLayers, ...lowerParallaxLayers].forEach(layer => {
      layer.style.transform = '';
    });
  }

  function updateParallax() {
    if (!parallaxEnabled()) {
      resetParallax();
      parallaxTicking = false;
      return;
    }

    const scrollY = window.scrollY;

    parallaxLayers.forEach(layer => {
      const speed = Number(layer.dataset.speed) || 0;
      const movement = scrollY * speed;
      layer.style.transform = `translateY(${movement}px)`;
    });

    if (lowerParallaxWrap && lowerParallaxLayers.length) {
      const wrapRect = lowerParallaxWrap.getBoundingClientRect();
      const wrapIsVisible = wrapRect.top < window.innerHeight && wrapRect.bottom > 0;

      if (wrapIsVisible) {
        const lowerScroll = scrollY - lowerParallaxWrap.offsetTop;

        lowerParallaxLayers.forEach(layer => {
          const speed = Number(layer.dataset.speed) || 0;
          const movement = lowerScroll * speed;
          layer.style.transform = `translateY(${movement}px)`;
        });
      }
    }

    parallaxTicking = false;
  }

  function requestParallaxUpdate() {
    if (!parallaxTicking) {
      window.requestAnimationFrame(updateParallax);
      parallaxTicking = true;
    }
  }

  window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
  window.addEventListener('resize', requestParallaxUpdate);

  if (typeof desktopParallaxQuery.addEventListener === 'function') {
    desktopParallaxQuery.addEventListener('change', () => {
      resetParallax();
      requestParallaxUpdate();
    });
  }

  /* =========================
     HEADER SCROLL STATE
  ========================= */

  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  /* =========================
     SCROLL REVEAL ANIMATION
  ========================= */

  const revealElements = document.querySelectorAll('.reveal');

  function activateAllReveals() {
    revealElements.forEach(element => element.classList.add('active'));
  }

  if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    revealElements.forEach(element => {
      revealObserver.observe(element);
    });
  } else {
    activateAllReveals();
  }

  /* =========================
     ANCHOR SCROLLING + ACTIVE NAVIGATION STATES
  ========================= */

  const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));
  const navSections = navLinks
    .map(link => {
      const selector = link.getAttribute('href');
      if (!selector || !selector.startsWith('#')) return null;
      const section = document.querySelector(selector);
      return section ? { id: section.id, link, section } : null;
    })
    .filter(Boolean);

  const navById = new Map(navSections.map(item => [item.id, item]));
  let navTicking = false;
  let activeNavLock = null;

  function getHeaderOffset() {
    return header ? Math.ceil(header.getBoundingClientRect().height) : 0;
  }

  function getTargetScrollTop(target) {
    if (!target) return 0;
    if (target.id === 'top') return 0;

    const headerOffset = getHeaderOffset();
    const extraOffset = window.matchMedia('(max-width: 640px)').matches ? 18 : 24;
    const absoluteTop = window.scrollY + target.getBoundingClientRect().top;
    return Math.max(0, absoluteTop - headerOffset - extraOffset);
  }

  function setActiveNav(id) {
    navLinks.forEach(link => {
      const isActive = Boolean(id && link.getAttribute('href') === `#${id}`);
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function lockActiveNav(id, duration = 1600) {
    if (!navById.has(id)) return;
    activeNavLock = {
      id,
      expiresAt: Date.now() + duration
    };
    setActiveNav(id);
  }

  function releaseExpiredNavLock() {
    if (activeNavLock && Date.now() > activeNavLock.expiresAt) {
      activeNavLock = null;
    }
  }

  function scrollToTarget(target, targetId) {
    const top = getTargetScrollTop(target);
    const behavior = prefersReducedMotion.matches ? 'auto' : 'smooth';

    if (targetId && navById.has(targetId)) {
      lockActiveNav(targetId);
    }

    window.scrollTo({ top, behavior });

    if (targetId) {
      window.setTimeout(() => {
        releaseExpiredNavLock();
        if (navById.has(targetId)) {
          setActiveNav(targetId);
        } else {
          requestActiveNavUpdate();
        }
      }, prefersReducedMotion.matches ? 80 : 1700);
    }
  }

  function updateActiveNav() {
    if (!navSections.length) {
      navTicking = false;
      return;
    }

    releaseExpiredNavLock();

    if (activeNavLock && navById.has(activeNavLock.id)) {
      setActiveNav(activeNavLock.id);
      navTicking = false;
      return;
    }

    const orderedSections = [...navSections].sort((a, b) => {
      const aTop = window.scrollY + a.section.getBoundingClientRect().top;
      const bTop = window.scrollY + b.section.getBoundingClientRect().top;
      return aTop - bTop;
    });

    const markerY = window.scrollY + getHeaderOffset() + 46;
    let active = null;

    orderedSections.forEach(item => {
      const sectionTop = window.scrollY + item.section.getBoundingClientRect().top - 8;
      if (markerY >= sectionTop) {
        active = item;
      }
    });

    setActiveNav(active ? active.id : null);
    navTicking = false;
  }

  function requestActiveNavUpdate() {
    if (!navTicking) {
      window.requestAnimationFrame(updateActiveNav);
      navTicking = true;
    }
  }

  const internalAnchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));

  internalAnchorLinks.forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const targetId = decodeURIComponent(href.slice(1));
      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      scrollToTarget(target, targetId);

      if (history.pushState) {
        history.pushState(null, '', `#${targetId}`);
      }
    });
  });

  if (navLinks.length && navSections.length) {
    updateActiveNav();
    window.addEventListener('scroll', requestActiveNavUpdate, { passive: true });
    window.addEventListener('resize', requestActiveNavUpdate);
    window.addEventListener('load', () => {
      if (window.location.hash) {
        const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        if (target) {
          window.setTimeout(() => scrollToTarget(target, target.id), 80);
        }
      } else {
        requestActiveNavUpdate();
      }
    });
  }

  /* =========================
     SUBTLE POINTER GLOW FOR CARDS
  ========================= */

  const pointerCards = document.querySelectorAll('.interactive-card');

  function handlePointerMove(event) {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    card.style.setProperty('--pointer-x', `${x}%`);
    card.style.setProperty('--pointer-y', `${y}%`);
  }

  if (!prefersReducedMotion.matches && finePointerQuery.matches) {
    pointerCards.forEach(card => {
      card.addEventListener('pointermove', handlePointerMove);
    });
  }

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', () => {
      if (prefersReducedMotion.matches) {
        activateAllReveals();
        resetParallax();
      }
    });
  }
})();
