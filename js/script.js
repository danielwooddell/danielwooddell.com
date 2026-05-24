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
  const soundToggle = document.querySelector('#sound-toggle');
  const soundToggleText = soundToggle ? soundToggle.querySelector('.sound-toggle-text') : null;
  const soundStatus = document.querySelector('#sound-status');
  const soundStorageKey = 'dw-site-sound-enabled';
  let startupPlayed = false;
  let startupArmed = false;
  let lastInteractionSoundAt = 0;

  const startupVolume = 0.10;
  const interactionVolume = 0.16;

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
    if (!audio || !soundEnabled) return;

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

  if (startupSound || interactionSound) {
    prepareAudioElement(startupSound, startupVolume);
    prepareAudioElement(interactionSound, interactionVolume);
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
        return;
      }

      if (!startupPlayed) {
        armStartupSound();
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
     INTELLIGENCE INTERFACE
  ========================= */

  const interfaceSystem = document.querySelector('[data-interface-system]');

  if (interfaceSystem) {
    const interfaceData = {
      ai: {
        command: 'analyze_ai_systems',
        aliases: ['ai', 'artificial intelligence', 'genai', 'generative ai', 'prompt', 'prompting', 'gpt', 'chatgpt', 'copilot', 'automation'],
        kicker: 'Generative AI Strategy',
        title: 'AI Systems That Support Real Work',
        copy: 'I design AI guidance around practical teaching, course design, prompting, productivity, and responsible adoption rather than treating AI as only a policy conversation.',
        systems: ['Prompting guidance', 'Faculty workflows', 'Custom GPT support'],
        primary: 'AI adoption becomes useful when it is tied to actual work.',
        linkText: 'Launch GenAI Hub',
        linkUrl: 'https://www.xavier.edu/teachingwithtech/genai'
      },
      learning: {
        command: 'map_learning_design_logic',
        aliases: ['learning', 'design', 'course', 'instructional design', 'learning design', 'faculty development', 'teaching'],
        kicker: 'Learning Experience Design',
        title: 'Learning Design With Structure and Purpose',
        copy: 'My work connects learning objectives, instructional pathways, digital materials, and support resources so technology serves the learning experience instead of distracting from it.',
        systems: ['Course design strategy', 'Instructional pathways', 'Reusable faculty resources'],
        primary: 'Strong learning systems make the next action clear.',
        linkText: 'Launch Design Lab',
        linkUrl: 'https://www.xavier.edu/teachingwithtech/ai-in-design'
      },
      accessibility: {
        command: 'sync_accessibility_layer',
        aliases: ['accessibility', 'accessible', 'ada', 'ally', 'inclusive', 'wcag', 'readability', 'universal design', 'udl'],
        kicker: 'Inclusive Digital Systems',
        title: 'Accessibility Built Into the Workflow',
        copy: 'Accessibility works best when it is embedded into everyday design, documentation, LMS support, and content improvement workflows rather than added after the fact.',
        systems: ['Readable interface patterns', 'Inclusive design workflows', 'Content improvement systems'],
        primary: 'Accessible systems reduce friction for everyone.',
        linkText: 'Launch Access',
        linkUrl: '#capabilities'
      },
      support: {
        command: 'activate_support_ecosystem',
        aliases: ['support', 'ecosystem', 'documentation', 'resource', 'resources', 'training', 'faculty support', 'help'],
        kicker: 'Support Architecture',
        title: 'Support Ecosystems That Scale Knowledge',
        copy: 'I build resource hubs, training materials, documentation, and AI support layers that help people find accurate guidance without waiting for one-to-one help every time.',
        systems: ['Resource hubs', 'Documentation systems', 'Always-available support layers'],
        primary: 'Good support architecture multiplies institutional capacity.',
        linkText: 'Launch Support Systems',
        linkUrl: 'https://www.xavier.edu/teachingwithtech'
      },
      workflow: {
        command: 'reduce_workflow_friction',
        aliases: ['workflow', 'process', 'friction', 'systems', 'operations', 'efficiency', 'clarity', 'navigation'],
        kicker: 'Workflow Intelligence',
        title: 'Complex Tools Translated Into Usable Pathways',
        copy: 'The goal is to identify where people get stuck, remove unnecessary complexity, and design pathways that make tools, processes, and decisions easier to act on.',
        systems: ['Process mapping', 'Tool guidance', 'Cognitive load reduction'],
        primary: 'The best interface removes unnecessary effort.',
        linkText: 'Launch Workflows',
        linkUrl: '#projects'
      },
      human: {
        command: 'prioritize_human_centered_technology',
        aliases: ['human', 'people', 'user', 'users', 'communication', 'judgment', 'trust', 'experience', 'ux'],
        kicker: 'Human-Centered Technology',
        title: 'Technology Decisions Grounded in People',
        copy: 'I approach emerging technology through the lens of real users, real constraints, accessibility, trust, training, and long-term maintainability.',
        systems: ['User confidence', 'Clear communication', 'Sustainable systems'],
        primary: 'Technology should make people more capable, not more confused.',
        linkText: 'Launch Intelligence',
        linkUrl: '#recommendations'
      }
    };

    const pathButtons = Array.from(interfaceSystem.querySelectorAll('[data-interface-path]'));
    const commandInput = interfaceSystem.querySelector('[data-interface-command-input]');
    const response = interfaceSystem.querySelector('[data-interface-response]');
    const kicker = interfaceSystem.querySelector('[data-interface-kicker]');
    const title = interfaceSystem.querySelector('[data-interface-title]');
    const copy = interfaceSystem.querySelector('[data-interface-copy]');
    const systems = interfaceSystem.querySelector('[data-interface-systems]');
    const primary = interfaceSystem.querySelector('[data-interface-primary]');
    const link = interfaceSystem.querySelector('[data-interface-link]');
    let activeInterfaceKey = 'ai';
    let interfaceTimer = null;
    let interfacePaused = false;

    function findInterfaceMatch(value) {
      const normalized = String(value || '').toLowerCase().replace(/^dw:\/\//, '').replace(/[_-]/g, ' ').trim();
      if (!normalized) return activeInterfaceKey;

      let bestKey = null;
      let bestScore = 0;

      Object.entries(interfaceData).forEach(([key, data]) => {
        const terms = [key, data.command, data.kicker, data.title, ...data.aliases].map(term => String(term).toLowerCase().replace(/[_-]/g, ' '));
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

    function updateInterfaceLink(data) {
      if (!link) return;
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

    function setInterfacePath(key, options = {}) {
      const data = interfaceData[key];
      if (!data) return;
      activeInterfaceKey = key;
      pathButtons.forEach(button => {
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
        if (primary) primary.textContent = data.primary;
        updateSystemsList(data);
        updateInterfaceLink(data);
        if (response) response.classList.remove('is-switching');
      }, prefersReducedMotion.matches ? 0 : 140);
      if (options.playSound && typeof playInteractionSound === 'function') {
        playInteractionSound();
      }
    }

    function showInterfaceFallback(value) {
      if (response && !prefersReducedMotion.matches) {
        response.classList.add('is-switching');
      }
      window.setTimeout(() => {
        if (kicker) kicker.textContent = 'Command Routing';
        if (title) title.textContent = 'No Exact Pathway Found';
        if (copy) copy.textContent = `The interface did not find a direct pathway for "${value}". Try AI, accessibility, workflow, support, learning design, LMS, or human-centered technology.`;
        if (primary) primary.textContent = 'A good system should fail clearly, then help the user recover.';
        updateSystemsList({ systems: ['Try: AI systems', 'Try: accessibility', 'Try: workflow intelligence'] });
        updateInterfaceLink({ linkText: 'Launch Workflows', linkUrl: '#projects' });
        if (response) response.classList.remove('is-switching');
      }, prefersReducedMotion.matches ? 0 : 140);
    }

    function startInterfaceAutoplay() {
      window.clearInterval(interfaceTimer);
      if (prefersReducedMotion.matches || interfacePaused || pathButtons.length < 2 || (commandInput && document.activeElement === commandInput)) return;
      interfaceTimer = window.setInterval(() => {
        const keys = Object.keys(interfaceData);
        const currentIndex = keys.indexOf(activeInterfaceKey);
        const nextKey = keys[(currentIndex + 1) % keys.length];
        setInterfacePath(nextKey);
      }, 9000);
    }

    pathButtons.forEach(button => {
      button.setAttribute('aria-pressed', button.classList.contains('is-active') ? 'true' : 'false');
      button.addEventListener('click', () => {
        setInterfacePath(button.dataset.interfacePath, { playSound: true });
        startInterfaceAutoplay();
      });
    });

    if (commandInput) {
      commandInput.addEventListener('focus', () => {
        interfacePaused = true;
        window.clearInterval(interfaceTimer);
        commandInput.select();
      });
      commandInput.addEventListener('input', () => {
        const match = findInterfaceMatch(commandInput.value);
        if (match && match !== activeInterfaceKey) {
          setInterfacePath(match, { updateCommand: false });
        }
      });
      commandInput.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const value = commandInput.value.trim();
        const match = findInterfaceMatch(value);
        if (match) setInterfacePath(match, { playSound: true });
        else if (value) showInterfaceFallback(value);
      });
      commandInput.addEventListener('blur', () => {
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

    setInterfacePath('ai');
    startInterfaceAutoplay();
  }


})();