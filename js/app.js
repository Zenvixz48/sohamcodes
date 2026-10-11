(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  // Branded intro loader: hide after the page has had a moment to paint.
  const pageLoader = $('#pageLoader');
  if (pageLoader) {
    const dismissLoader = () => window.setTimeout(() => pageLoader.classList.add('is-done'), 720);
    if (document.readyState === 'complete') dismissLoader();
    else window.addEventListener('load', dismissLoader, { once: true });
    // Never leave the overlay stuck if an external asset is slow.
    window.setTimeout(() => pageLoader.classList.add('is-done'), 2200);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // Current year (also set in the footer as a no-JS fallback).
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Mobile navigation.
  const toggle = $('.menu-toggle');
  const menu = $('#siteMenu');
  const closeMenu = () => {
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open navigation');
    menu?.classList.remove('is-open');
  };
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu?.classList.toggle('is-open', open);
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => {
    if (menu?.classList.contains('is-open') && !menu.contains(event.target) && !toggle?.contains(event.target)) closeMenu();
  });

  // Reveal motion is reserved for supporting content; the homepage story is driven by scroll progress below.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  // Thin page progress indicator.
  const progressBar = $('.page-progress');
  let scheduled = false;
  const updatePageProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (progressBar) progressBar.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;
  };

  // Scroll story: switch chapter, palette and artwork from the section's actual scroll position.
  const storySection = $('.story-section');
  const storySticky = $('.story-sticky');
  const scenes = $$('.story-scene');
  const storyFill = $('.story-progress-fill');
  const storyCount = $('.story-step-count');
  const nextButton = $('.story-next');
  let currentStoryStep = 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const setStoryStep = (step, progress = null) => {
    if (!storySticky || !scenes.length) return;
    const safeStep = clamp(step, 0, scenes.length - 1);
    currentStoryStep = safeStep;
    storySticky.dataset.step = String(safeStep);
    scenes.forEach((scene, index) => {
      const active = index === safeStep;
      scene.classList.toggle('is-active', active);
      scene.setAttribute('aria-hidden', String(!active));
    });
    if (storyCount) storyCount.textContent = `${String(safeStep + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}`;
    if (storyFill) storyFill.style.width = `${Math.max(0, Math.min(1, progress ?? (safeStep / (scenes.length - 1)))) * 100}%`;
  };

  const updateStory = () => {
    if (!storySection || !storySticky || !scenes.length) return;
    const rect = storySection.getBoundingClientRect();
    const scrollRange = Math.max(1, rect.height - window.innerHeight);
    const progress = clamp(-rect.top / scrollRange, 0, 1);
    const step = Math.min(scenes.length - 1, Math.floor(progress * scenes.length));
    setStoryStep(step, progress);
  };

  if (storySection && storySticky && scenes.length) {
    setStoryStep(0, 0);
    window.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        updatePageProgress();
        updateStory();
        scheduled = false;
      });
    }, { passive: true });
    window.addEventListener('resize', updateStory, { passive: true });
    updateStory();
    nextButton?.addEventListener('click', () => {
      const scrollRange = Math.max(1, storySection.offsetHeight - window.innerHeight);
      const sectionTop = window.scrollY + storySection.getBoundingClientRect().top;
      const targetProgress = currentStoryStep >= scenes.length - 1 ? 1 : (currentStoryStep + 1.08) / scenes.length;
      window.scrollTo({ top: sectionTop + scrollRange * targetProgress, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  } else {
    window.addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => { updatePageProgress(); scheduled = false; });
    }, { passive: true });
  }
  updatePageProgress();

  // Pointer glow is decorative only and never blocks interactions.
  const glow = $('.cursor-glow');
  if (glow && finePointer && !reduceMotion) {
    window.addEventListener('pointermove', event => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
      glow.style.opacity = '1';
    }, { passive: true });
    document.addEventListener('pointerleave', () => { glow.style.opacity = '0'; });
  }

  // Magnetic buttons use the independent CSS translate property so hover depth still works.
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(button => {
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * .055;
        const y = (event.clientY - rect.top - rect.height / 2) * .08;
        button.style.translate = `${x}px ${y}px`;
      });
      button.addEventListener('pointerleave', () => { button.style.translate = ''; });
    });

    // Gentle perspective on work previews; no movement on touchscreens.
    $$('[data-tilt] .project-visual').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 3.5).toFixed(2)}deg) rotateY(${(x * 4.5).toFixed(2)}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    // Tilt the animated hero artwork subtly towards the pointer.
    const heroArt = $('.hero-art');
    heroArt?.addEventListener('pointermove', event => {
      const rect = heroArt.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      heroArt.style.transform = `perspective(900px) rotateY(${(x * 4).toFixed(2)}deg) rotateX(${(-y * 3).toFixed(2)}deg)`;
    });
    heroArt?.addEventListener('pointerleave', () => { heroArt.style.transform = ''; });
  }
})();
