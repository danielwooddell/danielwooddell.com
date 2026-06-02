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

  /* =========================
     SITE AUDIO SYSTEM
  ========================= */

  const startupSound = document.querySelector('#startup-sound');
  const interactionSound = document.querySelector('#interaction-sound');
  const interfaceOrbSound = document.querySelector('#interface-orb-sound');
  const interfaceMenuSound = document.querySelector('#interface-menu-sound');
  const interfaceSubmitSound = document.querySelector('#interface-submit-sound');
  const interfaceLaunchSound = document.querySelector('#interface-launch-sound');
  const jarvisEasterEggSound = typeof Audio === 'function' ? new Audio('/audio/ijarvis.mp3') : null;
  const glitchEasterEggSound = typeof Audio === 'function' ? new Audio('/audio/iglitch.mp3') : null;
  const signalPulseLeftSound = typeof Audio === 'function' ? new Audio('audio/ileft.mp3') : null;
  const signalPulseTopSound = typeof Audio === 'function' ? new Audio('audio/itop.mp3') : null;
  const signalPulseRightSound = typeof Audio === 'function' ? new Audio('audio/iright.mp3') : null;
  const soundToggle = document.querySelector('#sound-toggle');
  const soundToggleText = soundToggle ? soundToggle.querySelector('.sound-toggle-text') : null;
  const soundStatus = document.querySelector('#sound-status');
  const soundStorageKey = 'dw-site-sound-enabled';
  let startupPlayed = false;
  let startupArmed = false;
  let lastInteractionSoundAt = 0;

  const startupVolume = 0.10;
  const interactionVolume = 0.16;
  const interfaceOrbVolume = 0.18;
  const interfaceMenuVolume = 0.20;
  const interfaceSubmitVolume = 0.18;
  const interfaceLaunchVolume = 0.18;
  const easterEggVolume = 0.18;
  const signalPulseVolume = 0.15;

  function getStoredSoundPreference() {
    try {
      return window.localStorage.getItem(soundStorageKey);
    } catch (error) {
      return null;
    }
  }

  function storeSoundPreference(enabled) {
    try {
      window.localStorage.setItem(soundStorageKey, enabled ? 'true' : 'false');
    } catch (error) {
      // Local storage can be unavailable in some private browsing contexts.
    }
  }

  let soundEnabled = getStoredSoundPreference() === 'true';

  function updateSoundControl() {
    if (!soundToggle) return;

    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.setAttribute('aria-label', soundEnabled ? 'Disable site sound' : 'Enable site sound');

    if (soundStatus) {
      soundStatus.textContent = soundEnabled ? 'Site sound is on.' : 'Site sound is off.';
    }
  }

  function prepareAudioElement(audio, volume) {
    if (!audio) return;
    audio.volume = volume;
    audio.preload = 'auto';
  }

  function stopAudio(audio) {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  function playAudio(audio, options = {}) {
    if (!audio || !soundEnabled || document.body.classList.contains('winterface-offline')) return;

    const volume = typeof options.volume === 'number' ? options.volume : interactionVolume;
    audio.volume = volume;

    if (options.restart !== false) {
      audio.currentTime = 0;
    }

    const playPromise = audio.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Browser autoplay protections may block audio until user interaction.
      });
    }
  }

  function playStartupSound() {
    if (startupPlayed || !soundEnabled) return;
    startupPlayed = true;
    playAudio(startupSound, { volume: startupVolume });
  }

  function playInteractionSound() {
    if (!soundEnabled || !startupPlayed) return;

    const now = Date.now();
    if (now - lastInteractionSoundAt < 450) return;

    lastInteractionSoundAt = now;
    playAudio(interactionSound, { volume: interactionVolume });
  }

  function playInterfaceOrbSound() {
    if (!soundEnabled || !startupPlayed) return;
    playAudio(interfaceOrbSound, { volume: interfaceOrbVolume });
  }

  function playInterfaceMenuSound() {
    if (!soundEnabled || !startupPlayed) return;
    playAudio(interfaceMenuSound, { volume: interfaceMenuVolume });
  }

  function playInterfaceSubmitSound() {
    if (!soundEnabled || !startupPlayed) return;
    playAudio(interfaceSubmitSound, { volume: interfaceSubmitVolume });
  }

  function playInterfaceLaunchSound() {
    if (!soundEnabled || !startupPlayed) return;
    playAudio(interfaceLaunchSound, { volume: interfaceLaunchVolume });
  }

  function playJarvisEasterEggSound() {
    if (!soundEnabled || !startupPlayed) return;
    playAudio(jarvisEasterEggSound, { volume: easterEggVolume });
  }

  function playGlitchEasterEggSound() {
    if (!soundEnabled || !startupPlayed) return;
    playAudio(glitchEasterEggSound, { volume: easterEggVolume });
  }

  function playSignalPulseSound(index) {
    if (!soundEnabled || !startupPlayed) return;

    const signalSounds = [signalPulseLeftSound, signalPulseTopSound, signalPulseRightSound];
    const soundIndex = Math.max(0, Math.min(signalSounds.length - 1, Number(index) || 0));
    playAudio(signalSounds[soundIndex], { volume: signalPulseVolume });
  }

  function armStartupSound() {
    if (startupArmed || startupPlayed) return;

    startupArmed = true;

    const startupEvents = ['pointerdown', 'keydown', 'touchstart'];

    function handleFirstInteraction(event) {
      if (soundToggle && event.target && soundToggle.contains(event.target)) {
        return;
      }

      playStartupSound();

      startupEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleFirstInteraction, true);
      });

      startupArmed = false;
    }

    startupEvents.forEach(eventName => {
      window.addEventListener(eventName, handleFirstInteraction, { capture: true, passive: true });
    });
  }

  if (startupSound || interactionSound || interfaceOrbSound || interfaceMenuSound || interfaceSubmitSound || interfaceLaunchSound || jarvisEasterEggSound || glitchEasterEggSound || signalPulseLeftSound || signalPulseTopSound || signalPulseRightSound) {
    prepareAudioElement(startupSound, startupVolume);
    prepareAudioElement(interactionSound, interactionVolume);
    prepareAudioElement(interfaceOrbSound, interfaceOrbVolume);
    prepareAudioElement(interfaceMenuSound, interfaceMenuVolume);
    prepareAudioElement(interfaceSubmitSound, interfaceSubmitVolume);
    prepareAudioElement(interfaceLaunchSound, interfaceLaunchVolume);
    prepareAudioElement(jarvisEasterEggSound, easterEggVolume);
    prepareAudioElement(glitchEasterEggSound, easterEggVolume);
    prepareAudioElement(signalPulseLeftSound, signalPulseVolume);
    prepareAudioElement(signalPulseTopSound, signalPulseVolume);
    prepareAudioElement(signalPulseRightSound, signalPulseVolume);
    updateSoundControl();

    if (soundEnabled) {
      armStartupSound();
    }
  }

  if (soundToggle) {
    soundToggle.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      soundEnabled = !soundEnabled;
      storeSoundPreference(soundEnabled);
      updateSoundControl();

      if (!soundEnabled) {
        stopAudio(startupSound);
        stopAudio(interactionSound);
        stopAudio(interfaceOrbSound);
        stopAudio(interfaceMenuSound);
        stopAudio(interfaceSubmitSound);
        stopAudio(interfaceLaunchSound);
        stopAudio(jarvisEasterEggSound);
        stopAudio(glitchEasterEggSound);
        stopAudio(signalPulseLeftSound);
        stopAudio(signalPulseTopSound);
        stopAudio(signalPulseRightSound);
        return;
      }

      if (!startupPlayed) {
        startupPlayed = true;
        playAudio(startupSound, { volume: startupVolume });
      }
    });
  }

  const audioInteractionTargets = document.querySelectorAll(
    '.button, .text-link, .footer-top-link, [data-nav-link], [data-hero-dot], [data-focus-dot]'
  );

  audioInteractionTargets.forEach(target => {
    if (target === soundToggle) return;
    target.addEventListener('click', playInteractionSound);
  });

  /* =========================
     TELEMETRY CARD AUDIO
  ========================= */

  document.addEventListener('click', event => {
    const telemetryCard = event.target.closest('.interface-signal-chip');
    if (!telemetryCard) return;

    const telemetryCards = Array.from(telemetryCard.parentElement ? telemetryCard.parentElement.querySelectorAll('.interface-signal-chip') : []);
    const telemetryIndex = Math.max(0, telemetryCards.indexOf(telemetryCard));
    playSignalPulseSound(telemetryIndex);
  });

  /* =========================
     INTELLIGENCE INTERFACE
  ========================= */

  const interfaceSystem = document.querySelector('[data-interface-system]');

  if (interfaceSystem) {
    const interfaceSystemToggle = interfaceSystem.querySelector('[data-interface-system-toggle]');
    const interfaceSystemStatusText = interfaceSystem.querySelector('[data-interface-system-status-text]');
    const interfaceMaximizeToggle = interfaceSystem.querySelector('[data-interface-maximize-toggle]');
    const winterfaceMaximizeQuery = window.matchMedia('(min-width: 900px)');
    let winterfaceOnline = true;
    let winterfaceMaximized = false;
    let storedBodyOverflow = '';
    let storedHtmlOverflow = '';

    function updateWinterfaceMaximizeControl() {
      if (!interfaceMaximizeToggle) return;

      const canMaximize = winterfaceMaximizeQuery.matches;
      interfaceMaximizeToggle.disabled = !canMaximize;
      interfaceMaximizeToggle.setAttribute('aria-disabled', String(!canMaximize));
      interfaceMaximizeToggle.setAttribute('aria-pressed', String(winterfaceMaximized));
      interfaceMaximizeToggle.setAttribute(
        'aria-label',
        canMaximize
          ? (winterfaceMaximized ? 'Restore WInterface Console' : 'Maximize WInterface Console')
          : 'WInterface maximize mode is available on larger screens'
      );
      interfaceMaximizeToggle.title = canMaximize
        ? (winterfaceMaximized ? 'Restore WInterface Console' : 'Maximize WInterface Console')
        : 'Maximize mode is available on larger screens';
    }

    function setWinterfaceMaximized(maximized) {
      const nextState = Boolean(maximized) && winterfaceMaximizeQuery.matches;
      if (nextState === winterfaceMaximized) {
        updateWinterfaceMaximizeControl();
        return;
      }

      if (nextState) {
        storedBodyOverflow = document.body.style.overflow || '';
        storedHtmlOverflow = document.documentElement.style.overflow || '';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = storedBodyOverflow;
        document.documentElement.style.overflow = storedHtmlOverflow;
      }

      winterfaceMaximized = nextState;
      document.body.classList.toggle('winterface-maximized', winterfaceMaximized);
      document.documentElement.classList.toggle('winterface-maximized', winterfaceMaximized);
      interfaceSystem.classList.toggle('is-winterface-maximized', winterfaceMaximized);
      updateWinterfaceMaximizeControl();
    }

    if (interfaceMaximizeToggle) {
      interfaceMaximizeToggle.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        setWinterfaceMaximized(!winterfaceMaximized);

        if (typeof playInterfaceOrbSound === 'function') {
          playInterfaceOrbSound();
        }
      });

      updateWinterfaceMaximizeControl();
    }

    window.addEventListener('keydown', event => {
      if (event.key === 'Escape' && winterfaceMaximized) {
        setWinterfaceMaximized(false);
      }
    });

    if (typeof winterfaceMaximizeQuery.addEventListener === 'function') {
      winterfaceMaximizeQuery.addEventListener('change', () => {
        if (!winterfaceMaximizeQuery.matches && winterfaceMaximized) {
          setWinterfaceMaximized(false);
        } else {
          updateWinterfaceMaximizeControl();
        }
      });
    }

    function updateWinterfacePowerState() {
      document.body.classList.toggle('winterface-offline', !winterfaceOnline);

      if (interfaceSystemToggle) {
        interfaceSystemToggle.setAttribute('aria-pressed', String(winterfaceOnline));
        interfaceSystemToggle.setAttribute('aria-label', winterfaceOnline ? 'Turn Winterface system offline' : 'Turn Winterface system online');
      }

      if (interfaceSystemStatusText) {
        interfaceSystemStatusText.textContent = winterfaceOnline ? 'WInterface™ v3.5 Online' : 'WInterface™ v3.5 Muted';
      }

      if (!winterfaceOnline) {
        stopAudio(startupSound);
        stopAudio(interactionSound);
        stopAudio(interfaceOrbSound);
        stopAudio(interfaceMenuSound);
        stopAudio(interfaceSubmitSound);
        stopAudio(interfaceLaunchSound);
        stopAudio(jarvisEasterEggSound);
        stopAudio(glitchEasterEggSound);
        stopAudio(signalPulseLeftSound);
        stopAudio(signalPulseTopSound);
        stopAudio(signalPulseRightSound);
      }
    }

    if (interfaceSystemToggle) {
      interfaceSystemToggle.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        winterfaceOnline = !winterfaceOnline;
        updateWinterfacePowerState();

        if (winterfaceOnline && typeof playInterfaceOrbSound === 'function') {
          playInterfaceOrbSound();
        }
      });

      updateWinterfacePowerState();
    }

    const interfaceSets = {
      primary: {
        label: 'Active Pathways',
        subtitle: 'Primary Systems',
        modeLabel: 'Primary systems active',
        countLabel: '6 pathways connected',
        autoplay: true,
        keys: ['ai', 'learning', 'accessibility', 'support', 'workflow', 'human']
      },
      operations: {
        label: 'Operational',
        subtitle: 'Support Nodes',
        modeLabel: 'Manual exploration mode',
        countLabel: '6 support nodes connected',
        autoplay: false,
        keys: ['canvasBasics', 'allyAccess', 'teachingTech', 'etaAssistant', 'genaiPrompting', 'courseSystems']
      },
      media: {
        label: 'Showcase Bay',
        subtitle: 'Media Modules',
        modeLabel: 'Showcase bay active',
        countLabel: '6 media modules connected',
        autoplay: false,
        keys: ['mediaPreview', 'videoWalkthroughs', 'imageSystems', 'demoConsole', 'workflowReplay', 'caseStudyPlayer']
      }
    };

    const interfaceData = {
      ai: {
        set: 'primary',
        number: '01',
        nav: 'AI Systems',
        command: 'analyze_ai_systems',
        aliases: ['ai', 'artificial intelligence', 'genai', 'generative ai', 'prompt', 'prompting', 'gpt', 'chatgpt', 'copilot', 'automation'],
        kicker: 'Generative AI Strategy',
        title: 'AI Systems That Support Real Work',
        copy: 'This pathway models AI guidance around practical use, course or content design, prompting, productivity, and responsible adoption across teaching, learning, and professional workplace contexts.',
        systems: ['Prompting guidance', 'Educator workflows', 'Custom GPT support'],
        primary: 'AI adoption becomes useful when it is tied to actual work💻',
        linkText: 'Launch GenAI Hub',
        linkUrl: 'https://www.xavier.edu/teachingwithtech/genai'
      },
      learning: {
        set: 'primary',
        number: '02',
        nav: 'Experience Design',
        command: 'map_learning_design_logic',
        aliases: ['learning', 'design', 'course', 'instructional design', 'learning design', 'faculty development', 'teaching'],
        kicker: 'Digital Experience Design',
        title: 'Learning Design With Structure and Purpose',
        copy: 'This pathway connects objectives, goals, & digital resources so technology serves the learning or communication experience instead of distracting from it.',
        systems: ['Course design strategy', 'Instructional pathways', 'Reusable educator resources'],
        primary: 'Strong learning systems make the next action clear. 💎',
        linkText: 'Launch Design Lab',
        linkUrl: 'https://www.xavier.edu/id'
      },
      accessibility: {
        set: 'primary',
        number: '03',
        nav: 'Open Interface',
        command: 'sync_accessibility_layer',
        aliases: ['accessibility', 'accessible', 'ada', 'ally', 'inclusive', 'wcag', 'readability', 'universal design', 'udl'],
        kicker: 'Inclusive Digital Systems',
        title: 'Accessibility Built Into the Workflow',
        copy: 'Accessibility works best when it is embedded into everyday design, documentation, LMS support, and content improvement workflows rather than added after the fact.',
        systems: ['Readable interface patterns', 'Inclusive design workflows', 'Content improvement'],
        primary: 'Accessible systems reduce friction for everyone. 🌎',
        linkText: 'Launch Accessibility',
        linkUrl: 'https://www.xavier.edu/id/canvas/accessibility-strategies'
      },
      support: {
        set: 'primary',
        number: '04',
        nav: 'Support Ecosystems',
        command: 'activate_support_ecosystem',
        aliases: ['support', 'ecosystem', 'documentation', 'resource', 'resources', 'training', 'faculty support', 'help'],
        kicker: 'Support Architecture',
        title: 'Support Ecosystems That Scale Knowledge',
        copy: 'I build resource hubs, training materials, documentation, and AI support layers that help people find accurate guidance without waiting for one-to-one help every time.',
        systems: ['Resource hubs', 'Documentation systems', '24/7 support layers'],
        primary: 'Good support architecture multiplies capacity. 🔋',
        linkText: 'Launch Support Systems',
        linkUrl: 'https://www.xavier.edu/teachingwithtech'
      },
      workflow: {
        set: 'primary',
        number: '05',
        nav: 'Workflow Intelligence',
        command: 'reduce_workflow_friction',
        aliases: ['workflow', 'process', 'friction', 'systems', 'operations', 'efficiency', 'clarity', 'navigation'],
        kicker: 'Workflow Intelligence',
        title: 'Complex Tools Made Into Usable Pathways',
        copy: 'The goal is to identify where users get stuck, remove unnecessary complexity, and design pathways that make tools, processes, and decisions easier to act on.',
        systems: ['Process mapping', 'Tool guidance', 'Cognitive load reduction'],
        primary: 'The best interface removes unnecessary effort. 🏋️',
        linkText: 'Launch Projects',
        linkUrl: '#winterface'
      },
      human: {
        set: 'primary',
        number: '06',
        nav: 'Human-Centered Tech',
        command: 'prioritize_human_centered_technology',
        aliases: ['human', 'people', 'user', 'users', 'communication', 'judgment', 'trust', 'experience', 'ux'],
        kicker: 'Human-Centered Technology',
        title: 'Technology Decisions Grounded in People',
        copy: 'This pathway approaches emerging technology through the lens of real users, real constraints, accessible content, trust, training, and long-term maintainability.',
        systems: ['User confidence', 'Clear communication', 'Sustainable systems'],
        primary: 'Technology should make people more capable, not less. ✅',
        linkText: 'Launch WIntelligence',
        linkUrl: '#winterface'
      },
      canvasBasics: {
        set: 'operations',
        number: '01',
        nav: 'Faculty LMS Basics',
        command: 'launch_faculty_basics',
        aliases: ['canvas', 'canvas basics', 'lms basics', 'faculty canvas', 'canvas course', 'training course'],
        kicker: 'Faculty Training System',
        title: 'Basics for Faculty',
        copy: 'A structured faculty training course that supports practical LMS use, common workflows, and scalable LMS guidance for instructors who need clear next steps.',
        systems: ['Faculty LMS training', 'LMS workflow support', 'Reusable course guidance'],
        primary: 'Effective LMS support gives educators confidence before complexity appears.',
        linkText: 'Launch LMS Basics',
        linkUrl: 'https://canvas.xavier.edu/courses/23190'
      },
      allyAccess: {
        set: 'operations',
        number: '02',
        nav: 'Course Accessibility',
        command: 'open_ally_accessibility_systems',
        aliases: ['ally', 'anthology ally', 'accessibility strategies', 'canvas accessibility', 'accessible canvas', 'accessible content'],
        kicker: 'Accessibility Support Layer',
        title: 'Accessibility Built-in',
        copy: 'Accessibility support becomes stronger when it is connected to LMS workflows, document improvement, readable design, captions, alternative text, & guidance.',
        systems: ['Ally-informed workflows', 'Accessible LMS practices', 'Improvement pathways'],
        primary: 'Accessibility works best as a visible workflow, not a hidden compliance task. Systems go.',
        linkText: 'Launch Ally Intel',
        linkUrl: 'https://www.xavier.edu/teachingwithtech/a-z/tools/ally'
      },
      teachingTech: {
        set: 'operations',
        number: '03',
        nav: 'Teaching w/Tech Hub',
        command: 'open_technology_hub',
        aliases: ['teaching with technology', 'technology hub', 'edtech hub', 'tool hub', 'teaching tools'],
        kicker: 'Digital Resource Ecosystem',
        title: 'Teaching with Tech',
        copy: 'A public-facing ecosystem for helping educators discover EdTech, generative AI guidance, accessibility support, and practical digital teaching resources.',
        systems: ['Tool discovery', 'Educator resource pathways', 'Public-facing support UX'],
        primary: 'A strong resource hub reduces support friction before questions become tickets.',
        linkText: 'Launch ✖️ Tech',
        linkUrl: 'https://www.xavier.edu/teachingwithtech'
      },
      etaAssistant: {
        set: 'operations',
        number: '04',
        nav: '24/7 ETA Assistant',
        command: 'activate_edtech_assistant',
        aliases: ['eta', 'edtech assistant', 'custom gpt', 'assistant', 'ai assistant', 'support bot'],
        kicker: 'AI Support Assistant',
        title: '24/7 EdTech Assistant',
        copy: 'ETA extends the support ecosystem through conversational guidance for the LMS, EdTech tools, accessibility workflows, and Teaching with Tech resources.',
        systems: ['Custom GPT support', '24/7 guidance layer', 'Ed-tech workflow routing'],
        primary: 'Artificial assistants are strongest when they sit inside a real support architecture.',
        linkText: 'Launch ETA',
        linkUrl: 'https://chatgpt.com/g/g-69ffe6dfccf48191b6afb459d0c78cce-edtech-assistant-eta'
      },
      genaiPrompting: {
        set: 'operations',
        number: '05',
        nav: 'Prompting Systems',
        command: 'route_prompting_systems',
        aliases: ['prompting', 'prompts', 'prompt', 'prompt design', 'ai prompts', 'genai prompts'],
        kicker: 'Prompting Architecture',
        title: 'Prompting Workflow',
        copy: 'Prompting works best when users understand context, role, output format, constraints, examples, and review habits rather than relying on one-off prompt tricks.',
        systems: ['Prompt structure', 'Educator productivity', 'AI output review'],
        primary: 'Good prompting is structured thinking made visible. An iterative process for my CPU.',
        linkText: 'Launch Prompting',
        linkUrl: 'https://www.xavier.edu/teachingwithtech/genai/prompting'
      },
      courseSystems: {
        set: 'operations',
        number: '06',
        nav: 'AI Design Systems',
        command: 'map_course_design_systems',
        aliases: ['course systems', 'course design', 'ai course design', 'ai in design', 'design systems'],
        kicker: 'Course Design Infrastructure',
        title: 'AI-Supported Design',
        copy: 'Course design support becomes more useful when AI is positioned as a planning partner for outcomes, activities, materials, feedback, and educator judgment.',
        systems: ['Outcome alignment', 'Activity planning', 'Educator judgment'],
        primary: 'AI should support better design decisions, not replace educator expertise.',
        linkText: 'Launch AI Design',
        linkUrl: 'https://www.xavier.edu/teachingwithtech/ai-in-design'
      },
      mediaPreview: {
        set: 'media',
        number: '01',
        nav: 'T w/Tech Hub SS',
        command: 'open_teaching_with_technology_preview',
        aliases: ['media', 'preview', 'screenshots', 'images', 'image', 'visuals', 'teaching with technology', 'twt'],
        kicker: 'Showcase Bay',
        title: 'Teaching with Technology Preview',
        copy: 'The Showcase Bay now displays actual project visuals from the live portfolio package rather than placeholder future modules.',
        systems: ['Live screenshot preview', 'Educator support UX', 'Resource ecosystem design'],
        primary: 'Visual evidence makes the portfolio feel more concrete and easier to scan.',
        linkText: 'Launch Image 🚀',
        linkUrl: 'assets/showcase/TwT.png',
        mediaType: 'image',
        image: 'assets/showcase/TwT.png',
        imageAlt: 'Teaching with Technology website screenshot',
        mediaKicker: 'Digital Support Ecosystem',
        mediaTitle: 'Teaching with Technology',
        mediaCopy: 'An educator-facing resource ecosystem for ed-tech, AI & accessibility guidance, and practical teaching workflows.'
      },
      videoWalkthroughs: {
        set: 'media',
        number: '02',
        nav: 'GenAI Hub SS',
        command: 'open_genai_hub_preview',
        aliases: ['video', 'videos', 'walkthrough', 'demo', 'player', 'embedded video', 'genai', 'ai hub', 'generative ai hub'],
        kicker: 'Showcase Bay',
        title: 'Generative AI Hub Preview',
        copy: 'A visual module for the public-facing AI teaching support hub with prompting, tool comparisons, quick wins, and mission-aligned guidance.',
        systems: ['Generative AI support', 'Prompting guidance', 'Mission-aware design'],
        primary: 'AI support becomes more credible when educators can see the system’s structure.',
        linkText: 'Launch Image 🚀',
        linkUrl: 'assets/showcase/GenAIhub.png',
        mediaType: 'image',
        image: 'assets/showcase/GenAIhub.png',
        imageAlt: 'Generative AI Hub website screenshot',
        mediaKicker: 'Generative AI Strategy',
        mediaTitle: 'Generative AI Hub',
        mediaCopy: 'A practical AI teaching support environment for tool comparison, prompting, classroom use, & responsible adoption.'
      },
      imageSystems: {
        set: 'media',
        number: '03',
        nav: 'AI in Design SS',
        command: 'open_ai_course_design_preview',
        aliases: ['showcase', 'gallery', 'case study media', 'portfolio media', 'pip boy', 'pipboy', 'course design', 'ai4cd', 'ai in design'],
        kicker: 'Showcase Bay',
        title: 'AI for Effective Course Design Preview',
        copy: 'A graduate instructional design project framed around helping faculty use AI as a planning partner while preserving educator judgment.',
        systems: ['Course design workflow', 'AI-supported planning', 'Learning design strategy'],
        primary: 'This module moves the media bay from reserved concept to working project console.',
        linkText: 'Launch Image 🚀',
        linkUrl: 'assets/showcase/AI4CD.png',
        mediaType: 'image',
        image: 'assets/showcase/AI4CD.png',
        imageAlt: 'AI for Effective Course Design project screenshot',
        mediaKicker: 'AI in Learning Design',
        mediaTitle: 'AI for Effective Course Design',
        mediaCopy: 'A structured faculty-facing project for using AI to plan outcomes, activities, materials, and workflows.'
      },
      demoConsole: {
        set: 'media',
        number: '04',
        nav: '24/7 ETA Assistant',
        command: 'open_eta_assistant_preview',
        aliases: ['demo console', 'demo', 'interactive demo', 'system demo', 'live demo', 'eta', 'edtech assistant'],
        kicker: 'Showcase Bay',
        title: 'EdTech Assistant Preview',
        copy: 'ETA functions as a conversational support layer for Canvas, supported educational technologies, accessibility workflows, and Teaching with Technology resources.',
        systems: ['Custom GPT workflow', 'Support architecture', 'Always-available guidance'],
        primary: 'The assistant works because it is connected to a real support ecosystem.',
        linkText: 'Launch Image 🚀',
        linkUrl: 'assets/showcase/ETA.png',
        mediaType: 'image',
        image: 'assets/showcase/ETA.png',
        imageAlt: 'EdTech Assistant ETA project screenshot',
        mediaKicker: 'AI Support Assistant',
        mediaTitle: 'EdTech Assistant ETA',
        mediaCopy: 'A custom GPT support layer for ed-tech questions, LMS workflows, accessibility guidance, and educator resources.'
      },
      workflowReplay: {
        set: 'media',
        number: '05',
        nav: 'Meet the Dev',
        command: 'open_creator_preview',
        aliases: ['workflow replay', 'replay', 'creator','process video', 'workflow video', 'walkthrough replay', 'woodrow', 'woodrow wilson'],
        kicker: 'Showcase Bay',
        title: 'Creator System Preview',
        copy: 'A visual identity module for the WInterface experience, giving the Showcase Bay a fifth live media target.',
        systems: ['Character interface asset', 'Visual system cue', 'Portfolio atmosphere'],
        primary: 'Real progress happens when innovation meets usability, accessibility, and purpose.',
        linkText: 'Launch Image 🚀',
        linkUrl: 'assets/showcase/Woodrow.png',
        mediaType: 'image',
        image: 'assets/showcase/Woodrow.png',
        imageAlt: 'Creator system visual asset',
        mediaKicker: 'WInterface™🟰',
        mediaTitle: '(Daniel)Wooddell’s + Interface',
        mediaCopy: 'A visual identity asset used to reinforce the atmosphere, personality, and interface language of WInterface.'
      },
      caseStudyPlayer: {
        set: 'media',
        number: '06',
        nav: 'Secret Intel Player',
        command: 'open_intel_player',
        aliases: ['intel player', 'intel study player', 'secret intel', 'secret', 'project player', 'portfolio player', 'media player'],
        kicker: 'Live Playback Layer',
        title: 'AI Course Design Walkthrough Player',
        copy: 'The Intel Player keeps the embedded walkthrough available as a focused playback layer inside the WInterface command system.',
        systems: ['Embedded walkthrough', 'Project playback', 'Focused explanation'],
        primary: 'The video layer should remain available without replacing the faster image-based modules.',
        linkText: 'Play Intel',
        linkUrl: '#winterface',
        mediaType: 'video',
        mediaKicker: 'Live Playback',
        mediaTitle: 'AI Course Design Walkthrough',
        mediaCopy: 'A player-style experience for viewing the project walkthrough from inside the interface.'
      }
    };

    const interfaceTelemetryMap = {
      ai: [
        { label: 'Problem', value: 'Unclear AI adoption' },
        { label: 'Method', value: 'Practical guidance' },
        { label: 'Result', value: 'Useful educator workflows' }
      ],
      learning: [
        { label: 'Problem', value: 'Disconnected course pieces' },
        { label: 'Method', value: 'Learning pathway design' },
        { label: 'Result', value: 'Clearer instructor flow' }
      ],
      accessibility: [
        { label: 'Problem', value: 'Barriers in digital content' },
        { label: 'Method', value: 'Inclusive workflow design' },
        { label: 'Result', value: 'Better learner access' }
      ],
      support: [
        { label: 'Problem', value: 'Repeated questions' },
        { label: 'Method', value: 'Resource architecture' },
        { label: 'Result', value: 'Scalable guidance' }
      ],
      workflow: [
        { label: 'Problem', value: 'Complex tool pathways' },
        { label: 'Method', value: 'Workflow analysis' },
        { label: 'Result', value: 'Easier user decisions' }
      ],
      human: [
        { label: 'Problem', value: 'Technology without context' },
        { label: 'Method', value: 'Human-centered review' },
        { label: 'Result', value: 'More trusted systems' }
      ],
      canvasBasics: [
        { label: 'Problem', value: 'LMS uncertainty' },
        { label: 'Method', value: 'Structured onboarding' },
        { label: 'Result', value: 'Confident course setup' }
      ],
      allyAccess: [
        { label: 'Problem', value: 'Hidden issues' },
        { label: 'Method', value: 'Ally-informed review' },
        { label: 'Result', value: 'Improved course access' }
      ],
      teachingTech: [
        { label: 'Problem', value: 'Scattered tool guidance' },
        { label: 'Method', value: 'Public resource hub' },
        { label: 'Result', value: 'Faster tool discovery' }
      ],
      etaAssistant: [
        { label: 'Problem', value: 'Support outside office hours' },
        { label: 'Method', value: 'Custom GPT assistant' },
        { label: 'Result', value: 'On-demand guidance' }
      ],
      genaiPrompting: [
        { label: 'Problem', value: 'Inconsistent AI outputs' },
        { label: 'Method', value: 'Prompt structure' },
        { label: 'Result', value: 'More reviewable drafts' }
      ],
      courseSystems: [
        { label: 'Problem', value: 'Course planning complexity' },
        { label: 'Method', value: 'AI-supported design' },
        { label: 'Result', value: 'Aligned course decisions' }
      ]
    };

    const interfacePulseMap = {
      ai: [
        { label: 'PRMT', readout: 'PROMPT CHANNEL: ALIGNED.' },
        { label: 'FLOW', readout: 'FACULTY WORKFLOW: ROUTED.' },
        { label: 'SCAN', readout: 'AI REVIEW LOOP: ACTIVE.' }
      ],
      learning: [
        { label: 'MAP', readout: 'OUTCOME MAP: LOCKED.' },
        { label: 'SEQ', readout: 'ACTIVITY SEQUENCE: ONLINE.' },
        { label: 'LINK', readout: 'RESOURCE LAYER: CONNECTED.' }
      ],
      accessibility: [
        { label: 'ALLY', readout: 'ALLY CHECK: STANDING BY.' },
        { label: 'STRUCT', readout: 'CONTENT STRUCTURE: VERIFIED.' },
        { label: 'FIX', readout: 'IMPROVEMENT ROUTE: OPEN.' }
      ],
      support: [
        { label: 'GUIDE', readout: 'GUIDE PATHWAY: READY.' },
        { label: 'DOCS', readout: 'DOCUMENTATION STACK: LINKED.' },
        { label: '24/7', readout: 'SUPPORT LAYER: ALWAYS ON.' }
      ],
      workflow: [
        { label: 'MAP', readout: 'PROCESS MAP: ACTIVE.' },
        { label: 'ROUTE', readout: 'TOOL ROUTING: OPTIMIZED.' },
        { label: 'LOAD', readout: 'COGNITIVE LOAD: REDUCING.' }
      ],
      human: [
        { label: 'CLEAR', readout: 'CLARITY CHECK: PRIORITY.' },
        { label: 'TRUST', readout: 'TRUST SIGNAL: STABLE.' },
        { label: 'FIT', readout: 'CONTEXT FIT: VALIDATED.' }
      ],
      canvasBasics: [
        { label: 'LMS', readout: 'LMS TRAINING PATH: ACTIVE.' },
        { label: 'SETUP', readout: 'COURSE SETUP: LINKED.' },
        { label: 'REUSE', readout: 'REUSABLE GUIDANCE: READY.' }
      ],
      allyAccess: [
        { label: 'ALLY', readout: 'ALLY REVIEW: ACTIVE.' },
        { label: 'LMS', readout: 'LMS ACCESS ROUTE: CONNECTED.' },
        { label: 'FIX', readout: 'ACCESS FIX PATH: AVAILABLE.' }
      ],
      teachingTech: [
        { label: 'TOOLS', readout: 'TOOL INDEX: SCANNED.' },
        { label: 'HUB', readout: 'RESOURCE HUB: CONNECTED.' },
        { label: 'UX', readout: 'SUPPORT UX: VISIBLE.' }
      ],
      etaAssistant: [
        { label: 'ETA', readout: 'ETA ASSISTANT: ONLINE.' },
        { label: 'ROUTE', readout: 'EDTECH ROUTING: ACTIVE.' },
        { label: '24/7', readout: 'ON-DEMAND LAYER: READY.' }
      ],
      genaiPrompting: [
        { label: 'CTX', readout: 'PROMPT CONTEXT: LOADED.' },
        { label: 'FORM', readout: 'OUTPUT FORMAT: SET.' },
        { label: 'SCAN', readout: 'REVIEW HABIT: ENABLED.' }
      ],
      courseSystems: [
        { label: 'OUT', readout: 'ALIGNMENT: ACTIVE.' },
        { label: 'PLAN', readout: 'AI PLANNING ROUTE: CONNECTED.' },
        { label: 'JUDGE', readout: 'EDUCATOR JUDGMENT: PRIMARY.' }
      ],
      mediaPreview: [
        { label: 'PREV', readout: 'TWT PREVIEW: LOADED.' },
        { label: 'UX', readout: 'SUPPORT UX: VISIBLE.' },
        { label: 'GO', readout: 'IMAGE LAUNCH: READY.' }
      ],
      videoWalkthroughs: [
        { label: 'GENAI', readout: 'GENAI HUB PREVIEW: LOADED.' },
        { label: 'PRMT', readout: 'PROMPT SIGNAL: ACTIVE.' },
        { label: 'MISSION', readout: 'MISSION LAYER: CONNECTED.' }
      ],
      imageSystems: [
        { label: 'COURSE', readout: 'DESIGN VIEW: ACTIVE.' },
        { label: 'PLAN', readout: 'AI PLANNING SIGNAL: ONLINE.' },
        { label: 'DESIGN', readout: 'LEARNING DESIGN LAYER: LINKED.' }
      ],
      demoConsole: [
        { label: 'ETA', readout: 'ETA PREVIEW: LOADED.' },
        { label: 'SUPPORT', readout: 'SUPPORT ARCHITECTURE: ACTIVE.' },
        { label: '24/7', readout: 'ALWAYS-ON GUIDANCE: CONNECTED.' }
      ],
      workflowReplay: [
        { label: 'CREATOR', readout: 'CREATOR ASSET: LOADED.' },
        { label: 'ATMOS', readout: 'ATMOSPHERE SIGNAL: ACTIVE.' },
        { label: 'ID', readout: 'WINTERFACE IDENTITY: LINKED.' }
      ],
      caseStudyPlayer: [
        { label: 'AUDIO', readout: 'SECRET INTEL AUDIO: READY.' },
        { label: 'VIDEO', readout: 'WALKTHROUGH PLAYER: CONNECTED.' },
        { label: 'FOCUS', readout: 'FOCUSED EXPLANATION: AVAILABLE.' }
      ]
    };

    const pathList = interfaceSystem.querySelector('[data-interface-path-list]');
    const setButtons = Array.from(interfaceSystem.querySelectorAll('[data-interface-set-button]'));
    const railLabel = interfaceSystem.querySelector('[data-interface-rail-label]');
    const railSubtitle = interfaceSystem.querySelector('[data-interface-rail-subtitle]');
    const modeLabel = interfaceSystem.querySelector('[data-interface-mode-label]');
    const countLabel = interfaceSystem.querySelector('[data-interface-count-label]');
    const commandInput = interfaceSystem.querySelector('[data-interface-command-input]');
    const response = interfaceSystem.querySelector('[data-interface-response]');
    const kicker = interfaceSystem.querySelector('[data-interface-kicker]');
    const title = interfaceSystem.querySelector('[data-interface-title]');
    const copy = interfaceSystem.querySelector('[data-interface-copy]');
    const telemetry = interfaceSystem.querySelector('[data-interface-telemetry]');
    const systems = interfaceSystem.querySelector('[data-interface-systems]');
    const pulse = interfaceSystem.querySelector('[data-interface-pulse]');
    const pulseChips = pulse ? Array.from(pulse.querySelectorAll('[data-interface-pulse-chip]')) : [];
    const pulseReadout = interfaceSystem.querySelector('[data-interface-pulse-readout]');
    const primary = interfaceSystem.querySelector('[data-interface-primary]');
    const link = interfaceSystem.querySelector('[data-interface-link]');
    const mediaPanel = interfaceSystem.querySelector('[data-interface-media-panel]');
    const mediaToggle = interfaceSystem.querySelector('[data-interface-media-toggle]');
    const mediaFrame = interfaceSystem.querySelector('[data-interface-media-frame]');
    const videoFrameWrap = interfaceSystem.querySelector('[data-interface-video-frame-wrap]');
    const showcaseFrame = interfaceSystem.querySelector('[data-interface-showcase-frame]');
    const showcaseImage = interfaceSystem.querySelector('[data-interface-showcase-image]');
    const showcaseKicker = interfaceSystem.querySelector('[data-interface-showcase-kicker]');
    const showcaseTitle = interfaceSystem.querySelector('[data-interface-showcase-title]');
    const showcaseCopy = interfaceSystem.querySelector('[data-interface-showcase-copy]');
    const mediaStatusText = interfaceSystem.querySelector('[data-interface-media-status-text]');
    const playbackStatus = interfaceSystem.querySelector('[data-interface-playback-status]');
    const mediaMute = interfaceSystem.querySelector('[data-interface-media-mute]');
    const mediaMuteText = interfaceSystem.querySelector('[data-interface-media-mute-text]');
    let activeInterfaceSet = 'primary';
    let activeInterfaceKey = 'ai';
    let interfaceTimer = null;
    let interfacePaused = false;
    let interfaceMediaPlaying = false;
    let interfaceMediaMuted = false;
    const routeTokens = [
      {
        token: '3a9cead089fd87a9f599b65b29568c3900362c4dd5f588536f35d2ca342ec9b4',
        target: 'aHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvU0Q0eVJEWTltZWs/c2k9LUR6QlNWRU9IX3IwbmlSYQ=='
      },
      {
        token: '028cde6cdad3c76b3229c879d0ab8319d9faa4417d1c9587e79bfb57d0b539ca',
        target: 'aHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvaXBPU3JRTnJwMVU/c2k9RzhWQ0xzbm5haVV3NFhJcA=='
      }
    ];

    async function digestRouteInput(value) {
      if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) return '';

      const inputBuffer = new TextEncoder().encode(String(value || '').trim());
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', inputBuffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    }

    function decodeRouteTarget(value) {
      try {
        return window.atob(value);
      } catch (error) {
        return '';
      }
    }

    async function applyMediaRoute(value) {
      if (activeInterfaceKey !== 'caseStudyPlayer' || !mediaFrame) return false;

      const routeHash = await digestRouteInput(value);
      const route = routeTokens.find(item => item.token === routeHash);
      if (!route) return false;

      const nextSource = decodeRouteTarget(route.target);
      if (!nextSource) return false;

      mediaFrame.src = nextSource;
      setInterfacePlaybackState(false);

      if (commandInput) {
        commandInput.value = interfaceData.caseStudyPlayer.command;
      }

      return true;
    }


    function getSetForKey(key) {
      return interfaceData[key] ? interfaceData[key].set : activeInterfaceSet;
    }

    function renderInterfacePaths(setKey) {
      const set = interfaceSets[setKey] || interfaceSets.primary;
      interfaceSystem.classList.remove('interface-system-set-primary', 'interface-system-set-operations', 'interface-system-set-media');
      interfaceSystem.classList.add(`interface-system-set-${setKey}`);
      if (railLabel) railLabel.textContent = set.label;
      if (railSubtitle) railSubtitle.textContent = set.subtitle;
      if (modeLabel) modeLabel.textContent = set.modeLabel;
      if (countLabel) countLabel.textContent = set.countLabel;

      setButtons.forEach(button => {
        const isActive = button.dataset.interfaceSetButton === setKey;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });

      if (!pathList) return;

      pathList.innerHTML = set.keys.map(key => {
        const data = interfaceData[key];
        return `
          <button class="interface-path${key === activeInterfaceKey ? ' is-active' : ''}" data-interface-path="${key}" type="button" aria-pressed="${key === activeInterfaceKey ? 'true' : 'false'}">
            <span>${data.number}</span>
            <strong>${data.nav}</strong>
          </button>
        `;
      }).join('');

      Array.from(pathList.querySelectorAll('[data-interface-path]')).forEach(button => {
        button.addEventListener('click', () => {
          setInterfacePath(button.dataset.interfacePath, { playSound: true, manual: activeInterfaceSet !== 'primary' });
          startInterfaceAutoplay();
        });
      });
    }

    function switchInterfaceSet(setKey, options = {}) {
      if (!interfaceSets[setKey]) return;
      activeInterfaceSet = setKey;
      const set = interfaceSets[setKey];
      const nextKey = set.keys.includes(activeInterfaceKey) ? activeInterfaceKey : set.keys[0];

      if (pathList && !prefersReducedMotion.matches) {
        pathList.classList.add('is-switching');
      }

      window.setTimeout(() => {
        activeInterfaceKey = nextKey;
        renderInterfacePaths(setKey);
        setInterfacePath(nextKey, { playSound: options.playSound, updateSet: false });
        if (pathList) pathList.classList.remove('is-switching');
        startInterfaceAutoplay();
      }, prefersReducedMotion.matches ? 0 : 130);
    }

    function findInterfaceMatch(value) {
      const normalized = String(value || '').toLowerCase().replace(/^dw:\/\//, '').replace(/[_-]/g, ' ').trim();
      if (!normalized) return activeInterfaceKey;

      let bestKey = null;
      let bestScore = 0;

      Object.entries(interfaceData).forEach(([key, data]) => {
        const terms = [key, data.command, data.kicker, data.title, data.nav, ...data.aliases].map(term => String(term).toLowerCase().replace(/[_-]/g, ' '));
        terms.forEach(term => {
          let score = 0;
          if (normalized === term) score = 100;
          else if (normalized.includes(term)) score = 72;
          else if (term.includes(normalized)) score = 58;
          else {
            normalized.split(/\s+/).forEach(part => {
              if (part.length > 2 && term.includes(part)) score += 12;
            });
          }

          if (score > bestScore) {
            bestScore = score;
            bestKey = key;
          }
        });
      });

      return bestScore >= 12 ? bestKey : null;
    }

    function updateInterfacePlaybackControl() {
      if (!link || !interfaceData[activeInterfaceKey] || interfaceData[activeInterfaceKey].mediaType !== 'video') return;

      link.textContent = interfaceMediaPlaying ? 'Pause Intel' : 'Play Intel';
      link.setAttribute('href', '#winterface');
      link.setAttribute('role', 'button');
      link.setAttribute('aria-pressed', String(interfaceMediaPlaying));
      link.setAttribute('aria-label', interfaceMediaPlaying ? 'Pause WInterface video playback' : 'Play WInterface video playback');
      link.classList.add('interface-jump-link-media-control');
      link.removeAttribute('target');
      link.removeAttribute('rel');
    }

    function updateInterfaceLink(data) {
      if (!link) return;

      link.classList.remove('interface-jump-link-media-control');
      link.removeAttribute('role');
      link.removeAttribute('aria-pressed');
      link.removeAttribute('aria-label');

      if (interfaceData[activeInterfaceKey] && interfaceData[activeInterfaceKey].mediaType === 'video') {
        updateInterfacePlaybackControl();
        return;
      }

      link.textContent = data.linkText;
      link.setAttribute('href', data.linkUrl);
      if (data.linkUrl.startsWith('#')) {
        link.removeAttribute('target');
        link.removeAttribute('rel');
      } else {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    }

    function updateSystemsList(data) {
      if (!systems) return;
      systems.innerHTML = data.systems.map(system => `<li>${system}</li>`).join('');
      if (!prefersReducedMotion.matches) {
        systems.querySelectorAll('li').forEach((item, index) => {
          window.setTimeout(() => item.classList.add('is-refreshing'), index * 70);
          window.setTimeout(() => item.classList.remove('is-refreshing'), 760 + (index * 70));
        });
      }
    }

    function normalizePulseReadout(value) {
      return String(value || '').trim().replace(/[.\s]+$/, '');
    }

    function setInterfacePulseReadout(items, index) {
      if (!pulseReadout || !Array.isArray(items) || !items.length) return;
      const item = items[index] || items[0];
      pulseReadout.textContent = normalizePulseReadout(item.readout || item.label || '');
      pulseChips.forEach((chip, chipIndex) => {
        chip.classList.toggle('is-active', chipIndex === index);
        chip.setAttribute('aria-pressed', String(chipIndex === index));
      });
    }

    function updateInterfacePulse(key) {
      if (!pulse || !pulseChips.length) return;

      const data = interfaceData[key];
      const fallback = data && Array.isArray(data.systems)
        ? data.systems.map(system => ({ label: system, readout: `${system} signal active.` }))
        : [];
      const items = interfacePulseMap[key] || fallback;

      if (!Array.isArray(items) || !items.length) {
        pulse.hidden = true;
        return;
      }

      pulse.hidden = false;
      pulseChips.forEach((chip, index) => {
        const item = items[index] || items[0];
        chip.textContent = item.label || `Signal ${index + 1}`;
        chip.setAttribute('aria-label', normalizePulseReadout(item.readout || item.label || `Signal ${index + 1}`));
        chip.setAttribute('title', normalizePulseReadout(item.readout || item.label || `Signal ${index + 1}`));
        chip.dataset.interfacePulseIndex = String(index);
      });

      setInterfacePulseReadout(items, 0);
    }



    function escapeInterfaceHTML(value) {
      return String(value || '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character]));
    }

    function updateInterfaceTelemetry(key) {
      if (!telemetry) return;

      const items = interfaceTelemetryMap[key];

      if (!Array.isArray(items) || !items.length) {
        telemetry.hidden = true;
        telemetry.innerHTML = '';
        return;
      }

      telemetry.hidden = false;
      telemetry.innerHTML = items.map(item => `
        <div class="interface-signal-chip">
          <span>${escapeInterfaceHTML(item.label)}</span>
          <strong>${escapeInterfaceHTML(item.value)}</strong>
        </div>
      `).join('');
    }


    let interfaceVimeoPlayer = null;

    function setInterfacePlaybackState(isPlaying) {
      interfaceMediaPlaying = Boolean(isPlaying);

      if (playbackStatus) {
        playbackStatus.classList.toggle('interface-playback-is-playing', interfaceMediaPlaying);
        playbackStatus.setAttribute('aria-label', interfaceMediaPlaying ? 'Live playback status: video playing' : 'Live playback status: video paused or idle');
      }

      updateInterfacePlaybackControl();
    }


    function updateInterfaceMuteControl() {
      if (!mediaMute) return;

      const labelText = interfaceMediaMuted ? 'Unmute Showcase Bay Audio' : 'Mute Showcase Bay Audio';
      mediaMute.classList.toggle('is-muted', interfaceMediaMuted);
      mediaMute.setAttribute('aria-pressed', String(interfaceMediaMuted));
      mediaMute.setAttribute('aria-label', labelText);
      mediaMute.setAttribute('title', labelText);

      if (mediaMuteText) {
        mediaMuteText.textContent = labelText;
      }
    }

    function applyInterfaceMediaMuteState() {
      updateInterfaceMuteControl();

      if (interfaceVimeoPlayer && typeof interfaceVimeoPlayer.setMuted === 'function') {
        const muteAction = interfaceVimeoPlayer.setMuted(interfaceMediaMuted);

        if (muteAction && typeof muteAction.catch === 'function') {
          muteAction.catch(() => {
            // Vimeo may reject mute calls before the player is ready or after iframe state changes.
          });
        }
      }
    }

    function toggleInterfaceMediaMute() {
      interfaceMediaMuted = !interfaceMediaMuted;
      applyInterfaceMediaMuteState();
    }

    function playInterfaceMediaMuteFeedback(wasMuted) {
      const mediaSoundWasTurnedOn = wasMuted === true && interfaceMediaMuted === false;

      if (mediaSoundWasTurnedOn && activeInterfaceKey === 'workflowReplay') {
        playJarvisEasterEggSound();
        return;
      }

      if (mediaSoundWasTurnedOn && activeInterfaceKey === 'caseStudyPlayer') {
        playGlitchEasterEggSound();
        return;
      }

      if (typeof playInterfaceOrbSound === 'function') {
        playInterfaceOrbSound();
      }
    }

    function pauseInterfaceMedia() {
      if (interfaceVimeoPlayer && typeof interfaceVimeoPlayer.pause === 'function') {
        interfaceVimeoPlayer.pause().catch(() => {
          // Vimeo may reject pause calls before the player is ready or after iframe state changes.
        });
      }

      setInterfacePlaybackState(false);
    }

    function toggleInterfaceMediaPlayback() {
      if (!interfaceVimeoPlayer || activeInterfaceKey !== 'caseStudyPlayer') return;

      const mediaAction = interfaceMediaPlaying ? interfaceVimeoPlayer.pause() : interfaceVimeoPlayer.play();

      if (mediaAction && typeof mediaAction.catch === 'function') {
        mediaAction.catch(() => {
          // Vimeo may reject play/pause calls before the player is ready or when browser policies block playback.
        });
      }
    }

    if (mediaFrame && window.Vimeo && typeof window.Vimeo.Player === 'function') {
      try {
        interfaceVimeoPlayer = new window.Vimeo.Player(mediaFrame);
        interfaceVimeoPlayer.ready().then(applyInterfaceMediaMuteState).catch(() => {});
        interfaceVimeoPlayer.on('play', () => setInterfacePlaybackState(true));
        interfaceVimeoPlayer.on('pause', () => setInterfacePlaybackState(false));
        interfaceVimeoPlayer.on('ended', () => setInterfacePlaybackState(false));
      } catch (error) {
        interfaceVimeoPlayer = null;
        setInterfacePlaybackState(false);
      }
    } else {
      setInterfacePlaybackState(false);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseInterfaceMedia();
      }
    });

    function setInterfaceMediaExpanded(expanded) {
      interfaceSystem.classList.toggle('interface-system-media-expanded', Boolean(expanded));


    if (mediaToggle) {
        mediaToggle.setAttribute('aria-pressed', String(Boolean(expanded)));
        mediaToggle.textContent = expanded ? 'Collapse WInterface☠️' : 'Expand WInterface🦇';
      }
    }

    function updateInterfaceMediaPanel(data) {
      if (!data || !mediaPanel) return;
      const isVideo = data.mediaType === 'video';
      if (showcaseFrame) {
        showcaseFrame.hidden = isVideo;
        showcaseFrame.dataset.showcaseKey = activeInterfaceKey;
      }
      if (videoFrameWrap) videoFrameWrap.hidden = !isVideo;
      if (mediaStatusText) mediaStatusText.textContent = isVideo ? 'Live Playback' : 'Showcase Active';

      if (!isVideo && showcaseImage) {
        if (showcaseFrame && !prefersReducedMotion.matches) showcaseFrame.classList.add('is-switching');
        window.setTimeout(() => {
          showcaseImage.src = data.image || 'assets/showcase/TwT.png';
          showcaseImage.alt = data.imageAlt || 'Selected portfolio showcase preview';
          if (showcaseKicker) showcaseKicker.textContent = data.mediaKicker || data.kicker || 'Showcase Bay';
          if (showcaseTitle) showcaseTitle.textContent = data.mediaTitle || data.title || 'Portfolio Preview';
          if (showcaseCopy) showcaseCopy.textContent = data.mediaCopy || data.copy || '';
          if (showcaseFrame) showcaseFrame.classList.remove('is-switching');
        }, prefersReducedMotion.matches ? 0 : 120);
        pauseInterfaceMedia();
      }
    }

    function setInterfaceMediaMode(enabled) {
      interfaceSystem.classList.toggle('interface-system-is-media', Boolean(enabled));

      if (mediaPanel) {
        mediaPanel.hidden = !enabled;
      }

      if (!enabled) {
        setInterfaceMediaExpanded(false);
        pauseInterfaceMedia();
      }
    }

    function setInterfacePath(key, options = {}) {
      const data = interfaceData[key];
      if (!data) return;

      const targetSet = getSetForKey(key);
      if (options.updateSet !== false && targetSet !== activeInterfaceSet) {
        activeInterfaceSet = targetSet;
        renderInterfacePaths(targetSet);
      }

      activeInterfaceKey = key;
      setInterfaceMediaMode(data.mediaType === 'image' || data.mediaType === 'video');
      updateInterfaceMediaPanel(data);
      Array.from(interfaceSystem.querySelectorAll('[data-interface-path]')).forEach(button => {
        const isActive = button.dataset.interfacePath === key;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });

      if (response && !prefersReducedMotion.matches) {
        response.classList.add('is-switching');
      }

      window.setTimeout(() => {
        if (commandInput && options.updateCommand !== false) commandInput.value = data.command;
        if (kicker) kicker.textContent = data.kicker;
        if (title) title.textContent = data.title;
        if (copy) copy.textContent = data.copy;
        updateInterfaceTelemetry(key);
        if (primary) primary.textContent = data.primary;
        updateSystemsList(data);
        updateInterfacePulse(key);
        updateInterfaceLink(data);
        if (response) response.classList.remove('is-switching');
      }, prefersReducedMotion.matches ? 0 : 140);

      if (options.playSound && typeof playInterfaceMenuSound === 'function') {
        playInterfaceMenuSound();
      }
    }

    function showInterfaceFallback(value) {
      if (response && !prefersReducedMotion.matches) {
        response.classList.add('is-switching');
      }
      window.setTimeout(() => {
        if (kicker) kicker.textContent = 'Command Routing';
        if (title) title.textContent = 'No Exact Pathway Found';
        if (copy) copy.textContent = `The interface did not find a direct pathway for "${value}". Try AI, Canvas, Ally, accessibility, workflow, support, learning design, ETA, video, or media.`;
        updateInterfaceTelemetry(null);
        if (primary) primary.textContent = 'A good system should fail clearly, then help the user recover.';
        updateSystemsList({ systems: ['Try: AI systems', 'Try: Accessibility', 'Try: Media preview'] });
        updateInterfacePulse(null);
        updateInterfaceLink({ linkText: 'Launch Projects', linkUrl: '#projects' });
        if (response) response.classList.remove('is-switching');
      }, prefersReducedMotion.matches ? 0 : 140);
    }

    function startInterfaceAutoplay() {
      window.clearInterval(interfaceTimer);
      const set = interfaceSets[activeInterfaceSet] || interfaceSets.primary;
      if (!set.autoplay || prefersReducedMotion.matches || interfacePaused || set.keys.length < 2 || (commandInput && document.activeElement === commandInput)) return;
      interfaceTimer = window.setInterval(() => {
        const currentIndex = set.keys.indexOf(activeInterfaceKey);
        const nextKey = set.keys[(currentIndex + 1) % set.keys.length];
        setInterfacePath(nextKey, { updateSet: false });
      }, 9000);
    }

    setButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (typeof playInterfaceOrbSound === 'function') {
          playInterfaceOrbSound();
        }
        switchInterfaceSet(button.dataset.interfaceSetButton, { playSound: false });
      });
    });

    pulseChips.forEach(chip => {
      const activatePulseChip = () => {
        const items = interfacePulseMap[activeInterfaceKey] || [];
        const index = Number(chip.dataset.interfacePulseIndex || chip.dataset.interfacePulseChip || 0);
        setInterfacePulseReadout(items, index);
      };

      chip.addEventListener('mouseenter', activatePulseChip);
      chip.addEventListener('focus', activatePulseChip);
      chip.addEventListener('click', () => {
        activatePulseChip();
        const index = Number(chip.dataset.interfacePulseIndex || chip.dataset.interfacePulseChip || 0);
        playSignalPulseSound(index);
      });
    });

    if (mediaMute) {
      updateInterfaceMuteControl();
      mediaMute.addEventListener('click', () => {
        const wasMuted = interfaceMediaMuted;
        toggleInterfaceMediaMute();
        playInterfaceMediaMuteFeedback(wasMuted);
      });
    }

    if (mediaToggle) {
      mediaToggle.addEventListener('click', () => {
        const isExpanded = interfaceSystem.classList.contains('interface-system-media-expanded');
        setInterfaceMediaExpanded(!isExpanded);
        if (typeof playInteractionSound === 'function') {
          playInteractionSound();
        }
      });
    }

    if (commandInput) {
      commandInput.addEventListener('focus', () => {
        interfacePaused = true;
        window.clearInterval(interfaceTimer);
        commandInput.select();
      });
      commandInput.addEventListener('input', () => {
        if (activeInterfaceSet === 'media') return;

        const match = findInterfaceMatch(commandInput.value);
        if (match && match !== activeInterfaceKey) {
          setInterfacePath(match, { updateCommand: false });
        }
      });
      commandInput.addEventListener('keydown', async event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const value = commandInput.value.trim();
        if (typeof playInterfaceSubmitSound === 'function') {
          playInterfaceSubmitSound();
        }

        if (await applyMediaRoute(value)) return;

        const match = findInterfaceMatch(value);
        if (match) setInterfacePath(match, { playSound: false });
        else if (value) showInterfaceFallback(value);
      });
      commandInput.addEventListener('blur', () => {
        if (activeInterfaceSet === 'media') {
          interfacePaused = false;
          startInterfaceAutoplay();
          return;
        }

        const value = commandInput.value.trim();
        const match = findInterfaceMatch(value);
        if (match) setInterfacePath(match);
        else if (!value) setInterfacePath(activeInterfaceKey);
        interfacePaused = false;
        startInterfaceAutoplay();
      });
    }

    if (link) {
      link.addEventListener('click', event => {
        if (typeof playInterfaceLaunchSound === 'function') {
          playInterfaceLaunchSound();
        }

        if (interfaceData[activeInterfaceKey] && interfaceData[activeInterfaceKey].mediaType === 'video') {
          event.preventDefault();
          toggleInterfaceMediaPlayback();
          return;
        }

        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        const target = document.getElementById(decodeURIComponent(href.slice(1)));
        if (!target) return;
        event.preventDefault();
        scrollToTarget(target, target.id);
        if (history.pushState) history.pushState(null, '', href);
      });
    }

    interfaceSystem.addEventListener('mouseenter', () => {
      interfacePaused = true;
      window.clearInterval(interfaceTimer);
    });
    interfaceSystem.addEventListener('mouseleave', () => {
      interfacePaused = false;
      startInterfaceAutoplay();
    });
    interfaceSystem.addEventListener('focusin', () => {
      interfacePaused = true;
      window.clearInterval(interfaceTimer);
    });
    interfaceSystem.addEventListener('focusout', event => {
      if (event.relatedTarget && interfaceSystem.contains(event.relatedTarget)) return;
      interfacePaused = false;
      startInterfaceAutoplay();
    });

    renderInterfacePaths('primary');
    setInterfacePath('ai', { updateSet: false });
    startInterfaceAutoplay();
  }


})();