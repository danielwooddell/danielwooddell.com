/* =========================
   PARALLAX BACKGROUND
========================= */

const parallaxLayers = document.querySelectorAll('.parallax-layer');
let ticking = false;

function updateParallax() {
  const scrollY = window.scrollY;

  parallaxLayers.forEach(layer => {
    const speed = Number(layer.dataset.speed) || 0;
    const movement = scrollY * speed;

    layer.style.transform = `translateY(${movement}px)`;
  });

  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(updateParallax);
    ticking = true;
  }
});

/* =========================
   SCROLL REVEAL ANIMATION
========================= */

const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, {
  threshold: 0.15
});

revealElements.forEach(element => {
  revealObserver.observe(element);
});
