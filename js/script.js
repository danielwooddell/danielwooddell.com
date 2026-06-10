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

  function playInterfaceMediaSoundCue(wasMuted, isMutedNow, currentInterfaceKey) {
    const mediaSoundWasTurnedOn = Boolean(wasMuted) && !isMutedNow;

    if (mediaSoundWasTurnedOn && currentInterfaceKey === 'workflowReplay') {
      playAudio(jarvisEasterEggSound, { volume: easterEggVolume });
      return;
    }

    if (mediaSoundWasTurnedOn && currentInterfaceKey === 'caseStudyPlayer') {
      playAudio(glitchEasterEggSound, { volume: easterEggVolume });
      return;
    }

    if (typeof playInterfaceOrbSound === 'function') {
      playInterfaceOrbSound();
    }
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
      if (typeof scheduleInterfaceMP4FrameFit === 'function') {
        scheduleInterfaceMP4FrameFit();
        window.setTimeout(scheduleInterfaceMP4FrameFit, 140);
        window.setTimeout(scheduleInterfaceMP4FrameFit, 420);
      }
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
        interfaceSystemStatusText.textContent = winterfaceOnline ? 'WInterface™ v3.7 Online' : 'WInterface™ v3.7 Muted';
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
        copy: 'This pathway models AI guidance around practical use, course or content design, prompting, productivity & responsible adoption across teaching, learning, & professional workplace contexts.',
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
        linkText: 'Launch Support System',
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
        title: 'LMS Basics for Faculty in Higher Education',
        copy: 'A structured faculty training course that supports practical LMS use, common workflows, and scalable LMS guidance for instructors who need clear next steps.',
        systems: ['Faculty LMS training', 'LMS workflow support', 'Reusable course guidance'],
        primary: 'Effective LMS support gives educators confidence.',
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
        title: 'Accessibility Built-in to the Design',
        copy: 'Accessibility support becomes stronger when it is connected to LMS workflows, document improvement, readable design, captions, alternative text, & guidance.',
        systems: ['Ally-informed workflows', 'Accessible LMS practices', 'Improvement pathways'],
        primary: 'Accessibility works best as a visible workflow, not a hidden compliance task.',
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
        title: 'Teaching with Technology Educator Resource Hub',
        copy: 'A public-facing ecosystem for helping educators discover EdTech, generative AI guidance, accessibility support, and practical digital teaching resources.',
        systems: ['Tool discovery', 'Educator resource pathways', 'Public-facing support UX'],
        primary: 'A strong resource hub reduces support friction before questions=tickets.',
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
        title: '24/7 Educational Technology Assistant',
        copy: 'ETA extends the support ecosystem through conversational guidance for the LMS, EdTech tools, accessibility workflows, and Teaching with Tech resources.',
        systems: ['Custom GPT support', '24/7 guidance layer', 'Ed-tech workflow routing'],
        primary: 'Assistants are strongest when they sit inside a real support architecture.',
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
        title: 'Prompting Systems and Workflows',
        copy: 'Prompting works best when users understand context, role, output format, constraints, examples, and review habits rather than relying on one-off prompt tricks.',
        systems: ['Prompt structure', 'Educator productivity', 'AI output review'],
        primary: 'Good prompting is structured thinking made visible. Iterative process.',
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
        title: 'AI-Supported Course Design Activities',
        copy: 'Course design support becomes more useful when AI is positioned as a planning partner for outcomes, activities, materials, feedback, and educator judgment.',
        systems: ['Outcome alignment', 'Activity planning', 'Educator judgment'],
        primary: 'AI should support better design decisions, not replace expertise.',
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
        primary: 'Visual evidence makes the portfolio feel more concrete.',
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
        primary: 'AI support becomes more credible when educators can see the structure.',
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
        primary: 'This module moves from reserved concept to working project console.',
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
        primary: 'The assistant works because it is connected to a real ecosystem.',
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
        primary: 'Progress happens when innovation meets usability and purpose.',
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
        primary: 'The video should remain available along with the image-based modules.',
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
    let mediaFrame = interfaceSystem.querySelector('[data-interface-media-frame]');
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
    let interfaceMediaAutoplay = false;
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
      if (!interfaceData[activeInterfaceKey] || interfaceData[activeInterfaceKey].mediaType !== 'video' || !mediaFrame) return false;

      const routeHash = await digestRouteInput(value);
      const route = routeTokens.find(item => item.token === routeHash);
      if (!route) return false;

      const nextSource = decodeRouteTarget(route.target);
      if (!nextSource) return false;

      rebuildInterfaceMediaRoute(nextSource);

      if (commandInput) {
        commandInput.value = interfaceData[activeInterfaceKey].command;
      }

      return true;
    }


    function getSetForKey(key) {
      return interfaceData[key] ? interfaceData[key].set : activeInterfaceSet;
    }

    function renderInterfacePaths(setKey) {
      const set = interfaceSets[setKey] || interfaceSets.primary;
      interfaceSystem.classList.remove('interface-system-set-primary', 'interface-system-set-operations', 'interface-system-set-media', 'interface-system-set-youtubeEncore', 'interface-system-set-vimeoEncore', 'interface-system-set-priceEncore');
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

      link.textContent = interfaceMediaPlaying ? 'Pause Video' : 'Play Video';
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
      const navigationPulseItems = [
        { label: 'Back', readout: 'PREVIOUS CARD: READY.' },
        { label: 'Bay', readout: 'NEXT MEDIA BAY: READY.' },
        { label: 'Next', readout: 'NEXT CARD: READY.' }
      ];

      pulseChips.forEach((chip, index) => {
        const item = navigationPulseItems[index] || navigationPulseItems[0];
        chip.textContent = item.label;
        chip.setAttribute('aria-label', normalizePulseReadout(item.readout));
        chip.setAttribute('title', normalizePulseReadout(item.readout));
        chip.dataset.interfacePulseIndex = String(index);
      });

      setInterfacePulseReadout(navigationPulseItems, 0);
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


    let interfaceMediaController = null;
    let interfaceMediaControllerSource = '';
    let interfaceMediaControllerKey = '';
    let interfaceMediaControllerToken = 0;
    let youtubeIframeApiPromise = null;
    let panoptoEmbedApiPromise = null;
    const interfaceMediaPlaybackProgress = Object.create(null);
    const interfaceMediaResumeThreshold = 0.75;
    const interfaceMediaBackgroundAdvanceThreshold = 1.25;
    let interfaceMediaAdvancePending = false;
    let interfaceMediaBackgroundAdvanceBusy = false;

    function setInterfacePlaybackState(isPlaying) {
      interfaceMediaPlaying = Boolean(isPlaying);

      if (playbackStatus) {
        playbackStatus.classList.toggle('interface-playback-is-playing', interfaceMediaPlaying);
      }

      updateInterfacePlaybackControl();
      updateInterfacePlaybackStatusLabel();
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

    function getInterfacePlaybackVisibleLabel() {
      const activeData = interfaceData[activeInterfaceKey];
      const isVideo = activeData && activeData.mediaType === 'video';
      const baseLabel = isVideo ? 'Live Playback' : 'Showcase Active';
      const autoLabel = interfaceMediaAutoplay ? 'Auto-Play On' : 'Auto-Play Off';
      return isVideo ? `${baseLabel} · ${autoLabel}` : baseLabel;
    }

    function updateInterfacePlaybackStatusLabel() {
      const activeData = interfaceData[activeInterfaceKey];
      const isVideo = activeData && activeData.mediaType === 'video';
      const visibleLabel = getInterfacePlaybackVisibleLabel();

      if (mediaStatusText) mediaStatusText.textContent = visibleLabel;
      if (!playbackStatus) return;

      playbackStatus.classList.toggle('is-autoplay-linked', Boolean(isVideo));
      playbackStatus.setAttribute('aria-label', isVideo ? `${visibleLabel}. Click to toggle auto-play.` : visibleLabel);
      playbackStatus.setAttribute('title', visibleLabel);

      if (isVideo) {
        playbackStatus.setAttribute('role', 'button');
        playbackStatus.setAttribute('tabindex', '0');
        playbackStatus.setAttribute('aria-pressed', String(interfaceMediaAutoplay));
      } else {
        playbackStatus.removeAttribute('role');
        playbackStatus.removeAttribute('tabindex');
        playbackStatus.removeAttribute('aria-pressed');
      }
    }

    function setInterfaceMediaAutoplay(enabled) {
      interfaceMediaAutoplay = Boolean(enabled);
      updateInterfacePlaybackStatusLabel();
      if (interfaceMediaAutoplay) {
        window.setTimeout(checkInterfaceMediaBackgroundAdvance, 120);
      }
    }

    function toggleInterfaceMediaAutoplay() {
      setInterfaceMediaAutoplay(!interfaceMediaAutoplay);
      if (typeof playInteractionSound === 'function') {
        playInteractionSound();
      }
    }

    function playInterfaceMediaWhenReady(attempt = 0, expectedKey = activeInterfaceKey) {
      if (!interfaceMediaAutoplay) return;
      if (expectedKey !== activeInterfaceKey) return;
      if (!interfaceData[activeInterfaceKey] || interfaceData[activeInterfaceKey].mediaType !== 'video') return;

      initializeInterfaceMediaController();

      if (interfaceMediaController && typeof interfaceMediaController.play === 'function') {
        try {
          const playAction = interfaceMediaController.play();
          if (playAction && typeof playAction.catch === 'function') {
            playAction.catch(() => setInterfacePlaybackState(false));
          }
        } catch (error) {
          setInterfacePlaybackState(false);
        }
        return;
      }

      if (attempt < 20) {
        window.setTimeout(() => playInterfaceMediaWhenReady(attempt + 1, expectedKey), 250);
      }
    }

    function getInterfaceMediaSource() {
      if (!mediaFrame) return '';
      if (mediaFrame.dataset && mediaFrame.dataset.panoptoSource) {
        return String(mediaFrame.dataset.panoptoSource || '');
      }
      if (mediaFrame.dataset && mediaFrame.dataset.mp4Source) {
        return String(mediaFrame.dataset.mp4Source || '');
      }
      return String(mediaFrame.getAttribute('src') || mediaFrame.src || '');
    }

    function escapeInterfaceMediaAttribute(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function buildInterfaceMP4Srcdoc(source, captionSource = '', captionLabel = 'English', captionDefault = false) {
      let resolvedSource = source;
      try {
        resolvedSource = new URL(source, window.location.href).href;
      } catch (error) {
        resolvedSource = source;
      }

      let resolvedCaptionSource = captionSource;
      if (resolvedCaptionSource) {
        try {
          resolvedCaptionSource = new URL(resolvedCaptionSource, window.location.href).href;
        } catch (error) {
          resolvedCaptionSource = captionSource;
        }
      }

      const safeSource = escapeInterfaceMediaAttribute(resolvedSource);
      const safeCaptionSource = escapeInterfaceMediaAttribute(resolvedCaptionSource || '');
      const safeCaptionLabel = escapeInterfaceMediaAttribute(captionLabel || 'English');
      const captionTrack = safeCaptionSource
        ? `<track data-interface-mp4-caption src="${safeCaptionSource}" kind="captions" srclang="en" label="${safeCaptionLabel}"${captionDefault ? ' default' : ''}>`
        : '';
      return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>:root{accent-color:#44c8ff;}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000;}body{position:relative;}video{display:block;width:100%;height:100%;object-fit:contain;background:#000;accent-color:#44c8ff;}video::-webkit-media-controls-panel{background:linear-gradient(180deg,rgba(3,16,29,.08),rgba(3,16,29,.78));}video::-webkit-media-controls-timeline{accent-color:#44c8ff;filter:saturate(1.45) brightness(1.32);}video::-webkit-media-controls-fullscreen-button{display:none!important;}video::-webkit-media-controls-volume-slider{accent-color:#44c8ff;background:linear-gradient(90deg,#44c8ff,rgba(68,200,255,.32))!important;border-radius:999px;filter:saturate(1.5) brightness(1.35) drop-shadow(0 0 7px rgba(68,200,255,.7));}video::-webkit-media-controls-volume-slider-container{filter:saturate(1.35) brightness(1.18) drop-shadow(0 0 8px rgba(68,200,255,.48));}video::-webkit-media-controls-mute-button{filter:drop-shadow(0 0 8px rgba(68,200,255,.55));}video::-webkit-media-controls-current-time-display,video::-webkit-media-controls-time-remaining-display{color:#fff;text-shadow:0 0 10px rgba(68,200,255,.65);}.interface-mp4-seek{position:absolute;left:78px;right:132px;bottom:13px;height:12px;z-index:8;display:flex;align-items:center;pointer-events:auto;opacity:.98;}.interface-mp4-seek input{width:100%;height:8px;margin:0;appearance:none;-webkit-appearance:none;background:linear-gradient(90deg,#44c8ff var(--interface-mp4-progress,0%),rgba(68,200,255,.28) var(--interface-mp4-progress,0%),rgba(255,255,255,.18) 100%);border-radius:999px;box-shadow:0 0 0 1px rgba(68,200,255,.26),0 0 16px rgba(68,200,255,.45);cursor:pointer;outline:none;}.interface-mp4-seek input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:13px;height:13px;border-radius:50%;background:#9ee7ff;border:1px solid rgba(255,255,255,.92);box-shadow:0 0 14px rgba(68,200,255,.9);}.interface-mp4-seek input::-moz-range-thumb{width:13px;height:13px;border-radius:50%;background:#9ee7ff;border:1px solid rgba(255,255,255,.92);box-shadow:0 0 14px rgba(68,200,255,.9);}.interface-mp4-seek input::-moz-range-track{height:8px;border-radius:999px;background:transparent;}.interface-mp4-fullscreen{position:absolute;right:55px;bottom:5px;width:42px;height:34px;z-index:10;border:0;border-radius:10px;background:rgba(3,16,29,.22);color:#f8fcff;display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto;text-shadow:0 0 10px rgba(68,200,255,.58);box-shadow:none;transition:background .18s ease,color .18s ease,filter .18s ease;}.interface-mp4-fullscreen:before{content:'⛶';font-size:22px;line-height:1;font-weight:700;transform:translateY(-1px);}.interface-mp4-fullscreen:hover,.interface-mp4-fullscreen:focus-visible{background:rgba(68,200,255,.14);color:#9ee7ff;filter:drop-shadow(0 0 8px rgba(68,200,255,.72));outline:none;}html:fullscreen .interface-mp4-fullscreen:before{content:'×';font-size:30px;font-weight:500;transform:translateY(-2px);}html:-webkit-full-screen .interface-mp4-fullscreen:before{content:'×';font-size:30px;font-weight:500;transform:translateY(-2px);}@media(max-width:720px){.interface-mp4-seek{left:64px;right:96px;bottom:12px;height:10px}.interface-mp4-seek input{height:7px}.interface-mp4-fullscreen{right:45px;bottom:4px;width:36px;height:30px}.interface-mp4-fullscreen:before{font-size:20px}}</style></head><body><video data-interface-mp4-video controls playsinline preload="metadata" src="${safeSource}">${captionTrack}</video><div class="interface-mp4-seek" aria-hidden="true"><input data-interface-mp4-seek type="range" min="0" max="1000" value="0" step="1" tabindex="-1"></div><button class="interface-mp4-fullscreen" type="button" aria-label="Toggle MP4 fullscreen" title="Fullscreen"></button><script>(function(){var video=document.querySelector('[data-interface-mp4-video]');var seek=document.querySelector('[data-interface-mp4-seek]');var fs=document.querySelector('.interface-mp4-fullscreen');if(!video||!seek)return;var active=false;function pct(){var d=Number(video.duration)||0;return d>0?(video.currentTime/d)*100:0;}function paint(){var p=Math.max(0,Math.min(100,pct()));seek.value=Math.round(p*10);seek.style.setProperty('--interface-mp4-progress',p.toFixed(2)+'%');}function commit(){var d=Number(video.duration)||0;if(d>0)video.currentTime=(Number(seek.value)||0)/1000*d;paint();}function fullscreenElement(){return document.fullscreenElement||document.webkitFullscreenElement||null;}function requestFull(){var target=document.documentElement;if(target.requestFullscreen)return target.requestFullscreen();if(target.webkitRequestFullscreen)return target.webkitRequestFullscreen();return null;}function exitFull(){if(document.exitFullscreen)return document.exitFullscreen();if(document.webkitExitFullscreen)return document.webkitExitFullscreen();return null;}video.addEventListener('loadedmetadata',paint);video.addEventListener('durationchange',paint);video.addEventListener('timeupdate',function(){if(!active)paint();});video.addEventListener('progress',paint);video.addEventListener('seeking',paint);video.addEventListener('seeked',paint);seek.addEventListener('pointerdown',function(){active=true;});seek.addEventListener('input',function(){commit();});seek.addEventListener('change',function(){commit();active=false;});seek.addEventListener('pointerup',function(){commit();active=false;});seek.addEventListener('pointercancel',function(){active=false;paint();});if(fs){fs.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();try{if(fullscreenElement()){exitFull();}else{requestFull();}}catch(error){}});}paint();})();<\/script></body></html>`;
    }

    function getInterfaceMediaProgressKey(key = activeInterfaceKey) {
      const data = interfaceData[key];
      if (!data || data.mediaType !== 'video') return '';
      return key;
    }

    function rememberInterfaceMediaProgress(key, seconds) {
      const progressKey = getInterfaceMediaProgressKey(key);
      const value = Number(seconds);
      if (!progressKey || !Number.isFinite(value)) return;

      if (value > interfaceMediaResumeThreshold) {
        interfaceMediaPlaybackProgress[progressKey] = value;
      } else {
        delete interfaceMediaPlaybackProgress[progressKey];
      }
    }

    function forgetInterfaceMediaProgress(key = activeInterfaceKey) {
      const progressKey = getInterfaceMediaProgressKey(key);
      if (progressKey) delete interfaceMediaPlaybackProgress[progressKey];
    }

    function captureInterfaceMediaProgress(key = activeInterfaceKey) {
      const progressKey = getInterfaceMediaProgressKey(key);
      if (!progressKey || !interfaceMediaController || typeof interfaceMediaController.getCurrentTime !== 'function') return;

      try {
        const currentTime = interfaceMediaController.getCurrentTime();

        if (currentTime && typeof currentTime.then === 'function') {
          currentTime.then(seconds => rememberInterfaceMediaProgress(progressKey, seconds)).catch(() => {});
          return;
        }

        rememberInterfaceMediaProgress(progressKey, currentTime);
      } catch (error) {
        // Provider progress can be unavailable during iframe teardown or route changes.
      }
    }

    function applyInterfaceMediaSavedProgress(token, key = activeInterfaceKey, attempt = 0) {
      if (token !== interfaceMediaControllerToken) return;
      const progressKey = getInterfaceMediaProgressKey(key);
      if (!progressKey || !interfaceMediaController || typeof interfaceMediaController.seekTo !== 'function') return;

      const savedSeconds = Number(interfaceMediaPlaybackProgress[progressKey]);
      if (!Number.isFinite(savedSeconds) || savedSeconds <= interfaceMediaResumeThreshold) return;

      const retrySavedProgress = () => {
        if (attempt >= 8 || token !== interfaceMediaControllerToken) return;
        window.setTimeout(() => applyInterfaceMediaSavedProgress(token, key, attempt + 1), 180);
      };

      try {
        const seekAction = interfaceMediaController.seekTo(savedSeconds);
        if (seekAction && typeof seekAction.then === 'function') {
          seekAction.then(() => setInterfacePlaybackState(false)).catch(retrySavedProgress);
        } else if (seekAction && typeof seekAction.catch === 'function') {
          seekAction.catch(retrySavedProgress);
        }
      } catch (error) {
        retrySavedProgress();
      }

      setInterfacePlaybackState(false);
    }

    function getInterfaceMediaProvider(source) {
      if (!source) return '';

      let host = '';

      try {
        host = new URL(source, window.location.href).hostname.toLowerCase();
      } catch (error) {
        host = source.toLowerCase();
      }

      const lowerSource = source.toLowerCase().split('?')[0].split('#')[0];

      if (host.includes('player.vimeo.com') || host.includes('vimeo.com')) return 'vimeo';
      if (host.includes('youtube.com') || host.includes('youtube-nocookie.com') || host.includes('youtu.be')) return 'youtube';
      if (host.includes('panopto.com') || source.toLowerCase().includes('/panopto/pages/embed.aspx')) return 'panopto';
      if (lowerSource.endsWith('.mp4')) return 'mp4';

      return '';
    }

    function normalizeInterfaceMediaSource(source) {
      const provider = getInterfaceMediaProvider(source);
      if (provider !== 'youtube' && provider !== 'vimeo' && provider !== 'panopto' && provider !== 'mp4') return source;

      try {
        const url = new URL(source, window.location.href);

        if (provider === 'youtube') {
          url.searchParams.set('enablejsapi', '1');
          url.searchParams.set('playsinline', '1');
          return url.toString();
        }

        if (provider === 'vimeo') {
          url.searchParams.set('api', '1');
          url.searchParams.set('autopause', '0');
          return url.toString();
        }

        if (provider === 'panopto') {
          url.searchParams.set('autoplay', 'false');
          url.searchParams.set('offerviewer', url.searchParams.get('offerviewer') || 'true');
          url.searchParams.set('showtitle', url.searchParams.get('showtitle') || 'true');
          url.searchParams.set('showbrand', url.searchParams.get('showbrand') || 'false');
          url.searchParams.set('captions', url.searchParams.get('captions') || 'true');
          url.searchParams.set('interactivity', url.searchParams.get('interactivity') || 'all');
          return url.toString();
        }
      } catch (error) {
        return source;
      }

      return source;
    }


    function getPanoptoSourceConfig(source) {
      try {
        const url = new URL(source, window.location.href);
        const sessionId = url.searchParams.get('id') || url.searchParams.get('sessionId') || '';
        if (!url.hostname || !sessionId) return null;

        return {
          serverName: url.hostname,
          sessionId,
          videoParams: {
            autoplay: 'false',
            offerviewer: url.searchParams.get('offerviewer') || 'true',
            showtitle: url.searchParams.get('showtitle') || 'true',
            showbrand: url.searchParams.get('showbrand') || 'false',
            captions: url.searchParams.get('captions') || 'true',
            interactivity: url.searchParams.get('interactivity') || 'all'
          }
        };
      } catch (error) {
        return null;
      }
    }

    function ensurePanoptoEmbedApi() {
      if (window.EmbedApi && typeof window.EmbedApi === 'function') {
        return Promise.resolve();
      }

      if (panoptoEmbedApiPromise) return panoptoEmbedApiPromise;

      panoptoEmbedApiPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[src="https://developers.panopto.com/scripts/embedapi.min.js"]');
        const previousReadyHandler = window.onPanoptoEmbedApiReady;

        window.onPanoptoEmbedApiReady = function onPanoptoEmbedApiReady() {
          if (typeof previousReadyHandler === 'function') {
            previousReadyHandler();
          }

          resolve();
        };

        if (existingScript) return;

        const script = document.createElement('script');
        script.src = 'https://developers.panopto.com/scripts/embedapi.min.js';
        script.async = true;
        script.onerror = () => reject(new Error('Panopto Embed API failed to load.'));
        document.head.appendChild(script);
      });

      return panoptoEmbedApiPromise;
    }

    function ensureYouTubeIframeApi() {
      if (window.YT && typeof window.YT.Player === 'function') {
        return Promise.resolve();
      }

      if (youtubeIframeApiPromise) return youtubeIframeApiPromise;

      youtubeIframeApiPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        const previousReadyHandler = window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
          if (typeof previousReadyHandler === 'function') {
            previousReadyHandler();
          }

          resolve();
        };

        if (existingScript) return;

        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => reject(new Error('YouTube IFrame API failed to load.'));
        document.head.appendChild(script);
      });

      return youtubeIframeApiPromise;
    }

    let mediaFrameObserver = null;

    function clearInterfaceMediaController() {
      captureInterfaceMediaProgress(interfaceMediaControllerKey || activeInterfaceKey);
      interfaceMediaControllerToken += 1;

      const currentController = interfaceMediaController;
      interfaceMediaController = null;
      interfaceMediaControllerSource = '';
      interfaceMediaControllerKey = '';
      interfaceMediaAdvancePending = false;

      if (currentController && typeof currentController.destroy === 'function') {
        try {
          currentController.destroy();
        } catch (error) {
          // Some providers reject teardown after iframe route changes.
        }
      }
    }

    function observeInterfaceMediaFrame() {
      if (mediaFrameObserver) {
        mediaFrameObserver.disconnect();
        mediaFrameObserver = null;
      }

      if (!mediaFrame) return;

      mediaFrameObserver = new MutationObserver(mutations => {
        if (mutations.some(mutation => mutation.attributeName === 'src')) {
          setInterfacePlaybackState(false);
          initializeInterfaceMediaController();
        }
      });

      mediaFrameObserver.observe(mediaFrame, { attributes: true, attributeFilter: ['src', 'data-panopto-source'] });
    }

    let interfaceMp4FrameFitRaf = null;

    function clearInterfaceMP4FrameFit() {
      if (!videoFrameWrap) return;
      videoFrameWrap.style.removeProperty('width');
      videoFrameWrap.style.removeProperty('max-width');
      videoFrameWrap.style.removeProperty('height');
      videoFrameWrap.style.removeProperty('max-height');
      videoFrameWrap.style.removeProperty('min-height');
      videoFrameWrap.style.removeProperty('aspect-ratio');
      videoFrameWrap.style.removeProperty('overflow');
      videoFrameWrap.style.removeProperty('margin-left');
      videoFrameWrap.style.removeProperty('margin-right');
      videoFrameWrap.style.removeProperty('flex');
      videoFrameWrap.style.removeProperty('align-self');
      videoFrameWrap.style.removeProperty('contain');
      delete videoFrameWrap.dataset.interfaceMp4FitWidth;
      delete videoFrameWrap.dataset.interfaceMp4FitHeight;
    }

    function fitInterfaceMP4Frame() {
      // Local MP4 cards now use the same CSS-driven 16:9 media frame as
      // YouTube, Vimeo, and Panopto cards. Do not write calculated inline
      // dimensions here; repeated card clicks and expand/collapse transitions
      // can otherwise compound stale measurements and shrink the player.
      clearInterfaceMP4FrameFit();

      if (mediaFrame && mediaFrame.tagName === 'VIDEO') {
        mediaFrame.style.removeProperty('width');
        mediaFrame.style.removeProperty('height');
        mediaFrame.style.removeProperty('max-width');
        mediaFrame.style.removeProperty('max-height');
        mediaFrame.style.removeProperty('position');
        mediaFrame.style.removeProperty('inset');
        mediaFrame.style.removeProperty('display');
        mediaFrame.style.removeProperty('object-fit');
        mediaFrame.style.removeProperty('object-position');
        mediaFrame.style.removeProperty('background');
        mediaFrame.style.removeProperty('box-sizing');
      }
    }

    function scheduleInterfaceMP4FrameFit() {
      if (interfaceMp4FrameFitRaf) window.cancelAnimationFrame(interfaceMp4FrameFitRaf);
      interfaceMp4FrameFitRaf = window.requestAnimationFrame(() => {
        interfaceMp4FrameFitRaf = null;
        fitInterfaceMP4Frame();
      });
    }

    window.addEventListener('resize', scheduleInterfaceMP4FrameFit, { passive: true });

    // MP4 sizing is intentionally CSS-driven. The MP4 wrapper should match
    // the fixed iframe media viewport exactly and must not run measurement-based
    // width/height writes during card reloads or expand/collapse transitions.

    function rebuildInterfaceMediaFrame(nextSource) {
      if (!mediaFrame || !mediaFrame.parentNode) return '';

      const normalizedSource = normalizeInterfaceMediaSource(nextSource || getInterfaceMediaSource());
      const provider = getInterfaceMediaProvider(normalizedSource);
      const activeMediaData = interfaceData[activeInterfaceKey] || {};
      const normalizedCaptionSource = activeMediaData.captionSource
        ? normalizeInterfaceMediaSource(activeMediaData.captionSource)
        : '';
      let replacementFrame;

      if (videoFrameWrap) {
        videoFrameWrap.classList.toggle('is-interface-mp4-frame', provider === 'mp4');
        videoFrameWrap.classList.toggle('is-interface-panopto-frame', provider === 'panopto');
        videoFrameWrap.classList.toggle('is-interface-iframe-frame', provider !== 'mp4' && provider !== 'panopto');
        if (provider === 'mp4') {
          scheduleInterfaceMP4FrameFit();
          window.setTimeout(scheduleInterfaceMP4FrameFit, 80);
          window.setTimeout(scheduleInterfaceMP4FrameFit, 260);
        } else {
          clearInterfaceMP4FrameFit();
        }
      }

      if (provider === 'panopto') {
        replacementFrame = document.createElement('div');
        replacementFrame.id = `interface-panopto-player-${Date.now()}`;
        replacementFrame.dataset.panoptoSource = normalizedSource;
        replacementFrame.dataset.interfaceMediaFrame = '';
        replacementFrame.setAttribute('role', 'group');
        replacementFrame.setAttribute('aria-label', 'Panopto Embedded Video Player');
      } else if (provider === 'mp4') {
        replacementFrame = document.createElement('iframe');
        replacementFrame.dataset.interfaceMediaFrame = '';
        replacementFrame.dataset.mp4Source = normalizedSource;
        if (normalizedCaptionSource) replacementFrame.dataset.mp4CaptionSource = normalizedCaptionSource;
        replacementFrame.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
        replacementFrame.setAttribute('frameborder', '0');
        replacementFrame.setAttribute('referrerpolicy', 'same-origin');
        replacementFrame.setAttribute('allowfullscreen', '');
        replacementFrame.setAttribute('title', 'MP4 Video Player');

        if (normalizedSource) {
          replacementFrame.setAttribute(
            'srcdoc',
            buildInterfaceMP4Srcdoc(
              normalizedSource,
              normalizedCaptionSource,
              activeMediaData.captionLabel || 'English',
              Boolean(activeMediaData.captionDefault)
            )
          );
        }
      } else {
        replacementFrame = document.createElement('iframe');
        replacementFrame.dataset.interfaceMediaFrame = '';
        replacementFrame.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
        replacementFrame.setAttribute('frameborder', '0');
        replacementFrame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        replacementFrame.setAttribute('allowfullscreen', '');

        if (normalizedSource) {
          replacementFrame.setAttribute('src', normalizedSource);
        }
      }

      if (mediaFrameObserver) {
        mediaFrameObserver.disconnect();
        mediaFrameObserver = null;
      }

      const previousFrame = mediaFrame;
      previousFrame.parentNode.replaceChild(replacementFrame, previousFrame);
      mediaFrame = replacementFrame;
      observeInterfaceMediaFrame();
      scheduleInterfaceMP4FrameFit();
      window.setTimeout(scheduleInterfaceMP4FrameFit, 80);
      window.setTimeout(scheduleInterfaceMP4FrameFit, 260);

      return normalizedSource;
    }

    function rebuildInterfaceMediaRoute(nextSource) {
      const normalizedSource = rebuildInterfaceMediaFrame(nextSource);

      clearInterfaceMediaController();
      setInterfacePlaybackState(false);

      if (normalizedSource) {
        initializeInterfaceMediaController();
      }

      return Boolean(normalizedSource);
    }

    function resolveInterfaceMediaValue(value) {
      if (value && typeof value.then === 'function') {
        return value.catch(() => null);
      }
      return Promise.resolve(value);
    }

    function checkInterfaceMediaBackgroundAdvance() {
      if (!interfaceMediaAutoplay || interfaceMediaAdvancePending || interfaceMediaBackgroundAdvanceBusy) return;
      if (!interfaceMediaController || !interfaceData[activeInterfaceKey] || interfaceData[activeInterfaceKey].mediaType !== 'video') return;
      if (!interfaceMediaPlaying) return;
      if (typeof interfaceMediaController.getCurrentTime !== 'function' || typeof interfaceMediaController.getDuration !== 'function') return;

      const token = interfaceMediaControllerToken;
      interfaceMediaBackgroundAdvanceBusy = true;

      Promise.all([
        resolveInterfaceMediaValue(interfaceMediaController.getCurrentTime()),
        resolveInterfaceMediaValue(interfaceMediaController.getDuration())
      ]).then(([currentTimeValue, durationValue]) => {
        if (token !== interfaceMediaControllerToken || !interfaceMediaAutoplay || interfaceMediaAdvancePending) return;

        const currentTime = Number(currentTimeValue);
        const duration = Number(durationValue);

        if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 1) return;

        if (currentTime >= Math.max(0, duration - interfaceMediaBackgroundAdvanceThreshold)) {
          advanceInterfaceAfterMediaEnded(token);
        }
      }).catch(() => {
        // Background tabs and third-party iframes may reject timing reads.
      }).finally(() => {
        interfaceMediaBackgroundAdvanceBusy = false;
      });
    }

    function advanceInterfaceAfterMediaEnded(token) {
      if (token !== interfaceMediaControllerToken || interfaceMediaAdvancePending) return;
      if (!interfaceData[activeInterfaceKey] || interfaceData[activeInterfaceKey].mediaType !== 'video') return;

      interfaceMediaAdvancePending = true;
      forgetInterfaceMediaProgress(activeInterfaceKey);
      setInterfacePlaybackState(false);

      window.setTimeout(() => {
        if (token !== interfaceMediaControllerToken) {
          interfaceMediaAdvancePending = false;
          return;
        }
        if (!interfaceData[activeInterfaceKey] || interfaceData[activeInterfaceKey].mediaType !== 'video') {
          interfaceMediaAdvancePending = false;
          return;
        }
        navigateInterfaceCard(1);
        if (interfaceMediaAutoplay) {
          const expectedKey = activeInterfaceKey;
          window.setTimeout(() => playInterfaceMediaWhenReady(0, expectedKey), 420);
          window.setTimeout(() => playInterfaceMediaWhenReady(0, expectedKey), 1200);
          window.setTimeout(() => playInterfaceMediaWhenReady(0, expectedKey), 2400);
        }
        window.setTimeout(() => {
          interfaceMediaAdvancePending = false;
        }, 800);
      }, 250);
    }


    function initializePanoptoMediaController(source, token) {
      const panoptoConfig = getPanoptoSourceConfig(source);
      if (!panoptoConfig || !mediaFrame) {
        setInterfacePlaybackState(false);
        return;
      }

      if (!mediaFrame.id) {
        mediaFrame.id = `interface-panopto-player-${Date.now()}`;
      }

      ensurePanoptoEmbedApi().then(() => {
        if (token !== interfaceMediaControllerToken || !mediaFrame || !window.EmbedApi) return;

        try {
          const controllerKey = activeInterfaceKey;
          let panoptoReady = false;
          let panoptoIframeReady = false;
          let lastKnownTime = 0;
          let progressTimer = null;
          let player = null;

          const stopProgressTimer = () => {
            if (progressTimer) {
              window.clearInterval(progressTimer);
              progressTimer = null;
            }
          };

          const startProgressTimer = () => {
            stopProgressTimer();
            progressTimer = window.setInterval(() => {
              if (token !== interfaceMediaControllerToken || !player || typeof player.getCurrentTime !== 'function') return;
              try {
                const currentTime = Number(player.getCurrentTime());
                if (Number.isFinite(currentTime)) {
                  lastKnownTime = currentTime;
                  rememberInterfaceMediaProgress(controllerKey, currentTime);
                }
              } catch (error) {
                // Panopto may reject progress queries while loading.
              }
            }, 1000);
          };

          const getPanoptoTime = () => {
            try {
              if (player && typeof player.getCurrentTime === 'function') {
                const currentTime = Number(player.getCurrentTime());
                if (Number.isFinite(currentTime)) {
                  lastKnownTime = currentTime;
                  return currentTime;
                }
              }
            } catch (error) {
              // Use the last tracked value if Panopto is between states.
            }
            return lastKnownTime;
          };

          player = new window.EmbedApi(mediaFrame.id, {
            width: '100%',
            height: '100%',
            serverName: panoptoConfig.serverName,
            sessionId: panoptoConfig.sessionId,
            videoParams: panoptoConfig.videoParams,
            events: {
              onIframeReady: () => {
                panoptoIframeReady = true;
              },
              onReady: () => {
                if (token !== interfaceMediaControllerToken) return;
                panoptoReady = true;
                applyInterfaceMediaMuteState();
                applyInterfaceMediaSavedProgress(token, controllerKey);
              },
              onStateChange: state => {
                if (token !== interfaceMediaControllerToken) return;
                const playerState = window.PlayerState || {};
                const isPlaying = state === playerState.Playing || state === 1 || state === 'Playing';
                const isEnded = state === playerState.Ended || state === 0 || state === 'Ended';
                const isPaused = state === playerState.Paused || state === 2 || state === 'Paused';

                if (isPlaying) {
                  setInterfacePlaybackState(true);
                  startProgressTimer();
                  return;
                }

                if (isEnded) {
                  stopProgressTimer();
                  forgetInterfaceMediaProgress(controllerKey);
                  advanceInterfaceAfterMediaEnded(token);
                  return;
                }

                if (isPaused) {
                  rememberInterfaceMediaProgress(controllerKey, getPanoptoTime());
                  stopProgressTimer();
                  setInterfacePlaybackState(false);
                }
              }
            }
          });

          interfaceMediaController = {
            provider: 'panopto',
            play: () => {
              if (!player) return null;
              if (!panoptoReady && panoptoIframeReady && typeof player.loadVideo === 'function') {
                return player.loadVideo();
              }
              if (typeof player.playVideo === 'function') return player.playVideo();
              if (typeof player.loadVideo === 'function') return player.loadVideo();
              return null;
            },
            pause: () => {
              if (player && typeof player.pauseVideo === 'function') return player.pauseVideo();
              return null;
            },
            getCurrentTime: () => getPanoptoTime(),
            getDuration: () => {
              if (player && typeof player.getDuration === 'function') return player.getDuration();
              return 0;
            },
            seekTo: seconds => {
              if (player && typeof player.seekTo === 'function') return player.seekTo(Math.max(0, Number(seconds) || 0));
              return null;
            },
            setMuted: muted => {
              if (!player) return null;
              if (muted && typeof player.muteVideo === 'function') return player.muteVideo();
              if (!muted && typeof player.unmuteVideo === 'function') return player.unmuteVideo();
              if (typeof player.setVolume === 'function') return player.setVolume(muted ? 0 : 1);
              return null;
            },
            destroy: () => {
              stopProgressTimer();
              return null;
            }
          };

          interfaceMediaControllerSource = source;
          interfaceMediaControllerKey = controllerKey;
        } catch (error) {
          interfaceMediaController = null;
          interfaceMediaControllerSource = '';
          interfaceMediaControllerKey = '';
          setInterfacePlaybackState(false);
        }
      }).catch(() => {
        if (token === interfaceMediaControllerToken) {
          interfaceMediaController = null;
          interfaceMediaControllerSource = '';
          interfaceMediaControllerKey = '';
          setInterfacePlaybackState(false);
        }
      });
    }

    function getInterfaceMP4VideoElement() {
      if (!mediaFrame) return null;
      if (mediaFrame.tagName === 'VIDEO') return mediaFrame;
      if (mediaFrame.tagName !== 'IFRAME') return null;

      try {
        const doc = mediaFrame.contentDocument || (mediaFrame.contentWindow && mediaFrame.contentWindow.document);
        if (!doc) return null;
        return doc.querySelector('video[data-interface-mp4-video], video');
      } catch (error) {
        return null;
      }
    }

    function initializeMP4MediaController(source, token, attempt = 0) {
      const player = getInterfaceMP4VideoElement();
      if (!player) {
        if (attempt < 12) {
          window.setTimeout(() => initializeMP4MediaController(source, token, attempt + 1), 120);
        } else {
          setInterfacePlaybackState(false);
        }
        return;
      }

      try {
        const controllerKey = activeInterfaceKey;

        const onPlay = () => {
          if (token === interfaceMediaControllerToken) setInterfacePlaybackState(true);
        };
        const onPause = () => {
          if (token !== interfaceMediaControllerToken) return;
          rememberInterfaceMediaProgress(controllerKey, player.currentTime);
          setInterfacePlaybackState(false);
        };
        const onTimeUpdate = () => {
          if (token !== interfaceMediaControllerToken) return;
          rememberInterfaceMediaProgress(controllerKey, player.currentTime);
        };
        const onEnded = () => {
          if (token !== interfaceMediaControllerToken) return;
          forgetInterfaceMediaProgress(controllerKey);
          advanceInterfaceAfterMediaEnded(token);
        };
        const onLoadedMetadata = () => {
          if (token !== interfaceMediaControllerToken) return;
          applyInterfaceMediaMuteState();
          applyInterfaceMediaSavedProgress(token, controllerKey);
        };

        player.addEventListener('play', onPlay);
        player.addEventListener('pause', onPause);
        player.addEventListener('timeupdate', onTimeUpdate);
        player.addEventListener('ended', onEnded);
        player.addEventListener('loadedmetadata', onLoadedMetadata);

        interfaceMediaController = {
          provider: 'mp4',
          play: () => player.play(),
          pause: () => player.pause(),
          getCurrentTime: () => player.currentTime || 0,
          getDuration: () => player.duration || 0,
          seekTo: seconds => {
            player.currentTime = Math.max(0, Number(seconds) || 0);
            return Promise.resolve();
          },
          setMuted: muted => {
            player.muted = Boolean(muted);
            if (!muted && player.volume === 0) player.volume = 1;
            return null;
          },
          destroy: () => {
            player.removeEventListener('play', onPlay);
            player.removeEventListener('pause', onPause);
            player.removeEventListener('timeupdate', onTimeUpdate);
            player.removeEventListener('ended', onEnded);
            player.removeEventListener('loadedmetadata', onLoadedMetadata);
            try { player.pause(); } catch (error) {}
            return null;
          }
        };

        interfaceMediaControllerSource = source;
        interfaceMediaControllerKey = controllerKey;
        applyInterfaceMediaMuteState();
        if (player.readyState >= 1) {
          applyInterfaceMediaSavedProgress(token, controllerKey);
        }
      } catch (error) {
        interfaceMediaController = null;
        interfaceMediaControllerSource = '';
        interfaceMediaControllerKey = '';
        setInterfacePlaybackState(false);
      }
    }

    function initializeVimeoMediaController(source, token) {
      if (!window.Vimeo || typeof window.Vimeo.Player !== 'function') {
        setInterfacePlaybackState(false);
        return;
      }

      try {
        const player = new window.Vimeo.Player(mediaFrame);
        const controllerKey = activeInterfaceKey;

        interfaceMediaController = {
          provider: 'vimeo',
          play: () => player.play(),
          pause: () => player.pause(),
          getCurrentTime: () => player.getCurrentTime(),
          getDuration: () => player.getDuration(),
          seekTo: seconds => player.setCurrentTime(Math.max(0, Number(seconds) || 0)),
          setMuted: muted => player.setMuted(Boolean(muted)),
          destroy: () => {
            if (typeof player.unload === 'function') {
              return player.unload();
            }
            return null;
          }
        };
        interfaceMediaControllerSource = source;
        interfaceMediaControllerKey = controllerKey;

        player.ready().then(() => {
          if (token === interfaceMediaControllerToken) {
            applyInterfaceMediaMuteState();
            applyInterfaceMediaSavedProgress(token, controllerKey);
            window.setTimeout(() => applyInterfaceMediaSavedProgress(token, controllerKey), 300);
          }
        }).catch(() => {});
        player.on('loaded', () => applyInterfaceMediaSavedProgress(token, controllerKey));
        player.on('timeupdate', data => {
          if (token !== interfaceMediaControllerToken || !data) return;
          rememberInterfaceMediaProgress(controllerKey, data.seconds);
        });
        player.on('play', () => setInterfacePlaybackState(true));
        player.on('pause', data => {
          if (data && Number.isFinite(Number(data.seconds))) {
            rememberInterfaceMediaProgress(controllerKey, data.seconds);
          } else {
            captureInterfaceMediaProgress(controllerKey);
          }
          setInterfacePlaybackState(false);
        });
        player.on('seeked', data => {
          if (data && Number.isFinite(Number(data.seconds))) {
            rememberInterfaceMediaProgress(controllerKey, data.seconds);
          }
        });
        player.on('ended', () => {
          forgetInterfaceMediaProgress(controllerKey);
          advanceInterfaceAfterMediaEnded(token);
        });
      } catch (error) {
        interfaceMediaController = null;
        interfaceMediaControllerSource = '';
        interfaceMediaControllerKey = '';
        setInterfacePlaybackState(false);
      }
    }

    function initializeYouTubeMediaController(source, token) {
      ensureYouTubeIframeApi().then(() => {
        if (token !== interfaceMediaControllerToken || !mediaFrame) return;

        try {
          const player = new window.YT.Player(mediaFrame, {
            events: {
              onReady: () => {
                if (token === interfaceMediaControllerToken) {
                  applyInterfaceMediaMuteState();
                  applyInterfaceMediaSavedProgress(token);
                }
              },
              onStateChange: event => {
                if (!window.YT || !window.YT.PlayerState) return;

                if (event.data === window.YT.PlayerState.PLAYING) {
                  setInterfacePlaybackState(true);
                  return;
                }

                if (event.data === window.YT.PlayerState.ENDED) {
                  advanceInterfaceAfterMediaEnded(token);
                  return;
                }

                if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.CUED) {
                  setInterfacePlaybackState(false);
                }
              }
            }
          });

          interfaceMediaController = {
            provider: 'youtube',
            play: () => player.playVideo(),
            pause: () => player.pauseVideo(),
            getCurrentTime: () => (typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0),
            getDuration: () => (typeof player.getDuration === 'function' ? player.getDuration() : 0),
            seekTo: seconds => {
              if (typeof player.seekTo === 'function') player.seekTo(Math.max(0, Number(seconds) || 0), true);
            },
            setMuted: muted => {
              if (muted && typeof player.mute === 'function') {
                player.mute();
              } else if (!muted && typeof player.unMute === 'function') {
                player.unMute();
              }
            },
            destroy: () => {
              if (typeof player.destroy === 'function') {
                player.destroy();
              }
            }
          };
          interfaceMediaControllerSource = source;
          interfaceMediaControllerKey = activeInterfaceKey;
        } catch (error) {
          interfaceMediaController = null;
          interfaceMediaControllerSource = '';
          interfaceMediaControllerKey = '';
          setInterfacePlaybackState(false);
        }
      }).catch(() => {
        if (token === interfaceMediaControllerToken) {
          interfaceMediaController = null;
          interfaceMediaControllerSource = '';
          interfaceMediaControllerKey = '';
          setInterfacePlaybackState(false);
        }
      });
    }

    function initializeInterfaceMediaController() {
      if (!mediaFrame) {
        clearInterfaceMediaController();
        setInterfacePlaybackState(false);
        return;
      }

      const currentSource = getInterfaceMediaSource();
      const normalizedSource = normalizeInterfaceMediaSource(currentSource);

      if (normalizedSource && normalizedSource !== currentSource) {
        mediaFrame.src = normalizedSource;
      }

      const source = normalizedSource || currentSource;
      const provider = getInterfaceMediaProvider(source);

      if (interfaceMediaController && interfaceMediaControllerSource === source && interfaceMediaController.provider === provider) {
        applyInterfaceMediaMuteState();
        return;
      }

      clearInterfaceMediaController();
      const token = interfaceMediaControllerToken;

      if (provider === 'panopto') {
        initializePanoptoMediaController(source, token);
        return;
      }

      if (provider === 'mp4') {
        initializeMP4MediaController(source, token);
        return;
      }

      if (provider === 'vimeo') {
        initializeVimeoMediaController(source, token);
        return;
      }

      if (provider === 'youtube') {
        initializeYouTubeMediaController(source, token);
        return;
      }

      setInterfacePlaybackState(false);
    }

    function applyInterfaceMediaMuteState() {
      updateInterfaceMuteControl();

      if (interfaceMediaController && typeof interfaceMediaController.setMuted === 'function') {
        try {
          const muteAction = interfaceMediaController.setMuted(interfaceMediaMuted);

          if (muteAction && typeof muteAction.catch === 'function') {
            muteAction.catch(() => {
              // Providers may reject mute calls before the player is ready or after iframe state changes.
            });
          }
        } catch (error) {
          // YouTube may reject mute calls before the iframe API has finished binding.
        }
      }
    }

    function toggleInterfaceMediaMute() {
      interfaceMediaMuted = !interfaceMediaMuted;
      applyInterfaceMediaMuteState();
    }

    function pauseInterfaceMedia() {
      captureInterfaceMediaProgress(interfaceMediaControllerKey || activeInterfaceKey);

      if (interfaceMediaController && typeof interfaceMediaController.pause === 'function') {
        try {
          const pauseAction = interfaceMediaController.pause();

          if (pauseAction && typeof pauseAction.catch === 'function') {
            pauseAction.catch(() => {
              // Providers may reject pause calls before the player is ready or after iframe state changes.
            });
          }
        } catch (error) {
          // Provider was not ready. The UI state is still reset below.
        }
      }

      setInterfacePlaybackState(false);
    }

    function toggleInterfaceMediaPlayback() {
      if (!interfaceData[activeInterfaceKey] || interfaceData[activeInterfaceKey].mediaType !== 'video') return;

      initializeInterfaceMediaController();

      if (!interfaceMediaController) return;

      try {
        const mediaAction = interfaceMediaPlaying ? interfaceMediaController.pause() : interfaceMediaController.play();

        if (mediaAction && typeof mediaAction.catch === 'function') {
          mediaAction.catch(() => {
            // Providers may reject play/pause calls before the player is ready or when browser policies block playback.
          });
        }
      } catch (error) {
        // Ignore provider-level control errors to preserve the surrounding interface.
      }
    }

    initializeInterfaceMediaController();

    observeInterfaceMediaFrame();

    document.addEventListener('visibilitychange', () => {
      captureInterfaceMediaProgress(interfaceMediaControllerKey || activeInterfaceKey);

      if (!document.hidden) {
        initializeInterfaceMediaController();
      }

      window.setTimeout(checkInterfaceMediaBackgroundAdvance, 120);
      window.setTimeout(checkInterfaceMediaBackgroundAdvance, 1200);
    });

    window.setInterval(checkInterfaceMediaBackgroundAdvance, 2000);

    window.addEventListener('pagehide', () => {
      captureInterfaceMediaProgress(interfaceMediaControllerKey || activeInterfaceKey);
    });

    function setInterfaceMediaExpanded(expanded) {
      interfaceSystem.classList.toggle('interface-system-media-expanded', Boolean(expanded));
      updateInterfacePlaybackStatusLabel();
      scheduleInterfaceMP4FrameFit();
      window.setTimeout(scheduleInterfaceMP4FrameFit, 60);
      window.setTimeout(scheduleInterfaceMP4FrameFit, 140);
      window.setTimeout(scheduleInterfaceMP4FrameFit, 320);
      window.setTimeout(scheduleInterfaceMP4FrameFit, 640);


    if (mediaToggle) {
        mediaToggle.setAttribute('aria-pressed', String(Boolean(expanded)));
        mediaToggle.textContent = expanded ? 'Collapse WInterface ☠️' : 'Expand WInterface 🦇';
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
      updateInterfacePlaybackStatusLabel();
      scheduleInterfaceMP4FrameFit();
      window.setTimeout(scheduleInterfaceMP4FrameFit, 80);

      if (isVideo) {
        const nextSource = data.mediaSource || data.videoSource || '';
        const currentSource = getInterfaceMediaSource();
        if (nextSource && normalizeInterfaceMediaSource(nextSource) !== normalizeInterfaceMediaSource(currentSource)) {
          rebuildInterfaceMediaRoute(nextSource);
        } else {
          initializeInterfaceMediaController();
        }
        if (mediaFrame) mediaFrame.title = data.mediaTitle || data.title || 'Secret Intel Player';
      }

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

      if (key !== activeInterfaceKey) {
        captureInterfaceMediaProgress(activeInterfaceKey);
      }

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
        updateInterfaceLink({ linkText: 'Launch Projects', linkUrl: '#winterface' });
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

    const navigationPulseItems = [
      { label: 'Back', readout: 'PREVIOUS CARD: READY.' },
      { label: 'Bay', readout: 'NEXT MEDIA BAY: READY.' },
      { label: 'Next', readout: 'NEXT CARD: READY.' }
    ];

    function navigateInterfaceCard(direction) {
      const set = interfaceSets[activeInterfaceSet] || interfaceSets.primary;
      if (!set || !Array.isArray(set.keys) || !set.keys.length) return;

      const currentIndex = Math.max(0, set.keys.indexOf(activeInterfaceKey));
      const nextIndex = (currentIndex + direction + set.keys.length) % set.keys.length;
      const nextKey = set.keys[nextIndex];

      if (nextKey) {
        setInterfacePath(nextKey, { updateSet: false });
      }
    }

    function navigateInterfaceBay() {
      const setOrder = Object.keys(interfaceSets);
      const currentSetIndex = Math.max(0, setOrder.indexOf(activeInterfaceSet));
      const nextSet = setOrder[(currentSetIndex + 1) % setOrder.length];
      switchInterfaceSet(nextSet, { playSound: false });
    }

    pulseChips.forEach(chip => {
      const activatePulseChip = () => {
        const index = Number(chip.dataset.interfacePulseIndex || chip.dataset.interfacePulseChip || 0);
        setInterfacePulseReadout(navigationPulseItems, index);
      };

      chip.addEventListener('mouseenter', activatePulseChip);
      chip.addEventListener('focus', activatePulseChip);
      chip.addEventListener('click', () => {
        activatePulseChip();
        const index = Number(chip.dataset.interfacePulseIndex || chip.dataset.interfacePulseChip || 0);
        playSignalPulseSound(index);

        if (index === 0) {
          navigateInterfaceCard(-1);
        } else if (index === 1) {
          navigateInterfaceBay();
        } else if (index === 2) {
          navigateInterfaceCard(1);
        }
      });
    });

    if (mediaMute) {
      updateInterfaceMuteControl();
      mediaMute.addEventListener('click', () => {
        const wasMuted = interfaceMediaMuted;
        toggleInterfaceMediaMute();
        playInterfaceMediaSoundCue(wasMuted, interfaceMediaMuted, activeInterfaceKey);
      });
    }

    if (playbackStatus) {
      updateInterfacePlaybackStatusLabel();
      playbackStatus.addEventListener('click', () => {
        if (!interfaceData[activeInterfaceKey] || interfaceData[activeInterfaceKey].mediaType !== 'video') return;
        toggleInterfaceMediaAutoplay();
      });

      playbackStatus.addEventListener('keydown', event => {
        if (!interfaceData[activeInterfaceKey] || interfaceData[activeInterfaceKey].mediaType !== 'video') return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggleInterfaceMediaAutoplay();
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

    const themeStylesheet = document.getElementById('winterface-theme-stylesheet');
    const themeSelector = interfaceSystem.querySelector('[data-interface-theme-selector]');
    const themeToggle = interfaceSystem.querySelector('[data-interface-theme-toggle]');
    const themeMenu = interfaceSystem.querySelector('[data-interface-theme-menu]');
    const themeOptions = Array.from(interfaceSystem.querySelectorAll('[data-interface-theme-option]'));
    const themeStorageKey = 'winterface.visualSystem';
    const themeFiles = {
      default: '',
      'navy-sky-grey': 'navy-sky-grey.css',
      'green-gold': 'green-gold.css',
      'dark-purple': 'dark-purple.css'
    };

    function getThemeBaseHref() {
      if (!themeStylesheet) return 'css/';
      const href = themeStylesheet.getAttribute('href') || '';
      return href.startsWith('../') ? '../css/' : 'css/';
    }

    function setThemeMenuOpen(isOpen) {
      if (!themeSelector || !themeToggle || !themeMenu) return;
      themeSelector.classList.toggle('is-open', isOpen);
      themeToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      themeMenu.hidden = !isOpen;
    }

    function applyWinterfaceTheme(themeKey, options = {}) {
      if (!themeStylesheet || !themeFiles.hasOwnProperty(themeKey)) return;
      const baseHref = getThemeBaseHref();
      const themeCacheVersion = '3.7-bay-orb-sync-20260609';
      const nextHrefBase = themeKey === 'default' ? `${baseHref}${baseHref.startsWith('../') ? 'style-dev.css' : 'style.css'}` : `${baseHref}themes/${themeFiles[themeKey]}`;
      const nextHref = `${nextHrefBase}?v=${themeCacheVersion}`;
      if (themeStylesheet.getAttribute('href') !== nextHref) {
        themeStylesheet.setAttribute('href', nextHref);
      }
      document.documentElement.setAttribute('data-winterface-theme', themeKey);
      themeOptions.forEach(option => {
        const isActive = option.dataset.interfaceThemeOption === themeKey;
        option.classList.toggle('is-active', isActive);
        option.setAttribute('aria-checked', isActive ? 'true' : 'false');
      });
      if (!options.skipStorage) {
        try {
          window.localStorage.setItem(themeStorageKey, themeKey);
        } catch (error) {
          // localStorage may be unavailable in some embedded contexts.
        }
      }
    }

    if (themeToggle && themeMenu && themeOptions.length) {
      themeToggle.addEventListener('click', event => {
        event.preventDefault();
        setThemeMenuOpen(themeMenu.hidden);
      });

      themeOptions.forEach(option => {
        option.addEventListener('click', event => {
          event.preventDefault();
          applyWinterfaceTheme(option.dataset.interfaceThemeOption || 'default');
          setThemeMenuOpen(false);
          themeToggle.focus({ preventScroll: true });
        });
      });

      document.addEventListener('click', event => {
        if (!themeSelector || themeSelector.contains(event.target)) return;
        setThemeMenuOpen(false);
      });

      document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        setThemeMenuOpen(false);
      });

      let savedTheme = 'default';
      try {
        savedTheme = window.localStorage.getItem(themeStorageKey) || 'default';
      } catch (error) {
        savedTheme = 'default';
      }
      applyWinterfaceTheme(themeFiles.hasOwnProperty(savedTheme) ? savedTheme : 'default', { skipStorage: true });
    }

    renderInterfacePaths('primary');
    setInterfacePath('ai', { updateSet: false });
    startInterfaceAutoplay();
  }


})();