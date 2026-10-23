// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
// Closing the mobile nav on link click, EXCEPT for the mega-menu trigger —
// that one opens a sub-panel, so closing the whole nav would hide it instantly.
navLinks.querySelectorAll('.nav-item-link, .nav-login, .nav-cta').forEach(link => {
  if (link.classList.contains('nav-dropdown-trigger')) return;
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Services mega menu — hover on desktop (pointer: fine), tap to toggle on touch
// devices and in the collapsed mobile nav.
const servicesDropdown = document.getElementById('servicesDropdown');
const servicesTrigger = servicesDropdown.querySelector('.nav-dropdown-trigger');
const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)');

let dropdownCloseTimer = null;
// Set by a click on the trigger: the panel stays open until the user clicks
// away, so it can't evaporate while the pointer is travelling toward it.
let dropdownPinned = false;

function setDropdown(open) {
  clearTimeout(dropdownCloseTimer);
  if (!open) dropdownPinned = false;
  servicesDropdown.classList.toggle('open', open);
  servicesTrigger.setAttribute('aria-expanded', String(open));
}

// Closing is deferred so a brief slip off the panel (or crossing a sub-pixel
// seam between elements) doesn't snap it shut mid-interaction.
function scheduleDropdownClose() {
  clearTimeout(dropdownCloseTimer);
  dropdownCloseTimer = setTimeout(() => {
    if (!dropdownPinned) setDropdown(false);
  }, 260);
}

servicesDropdown.addEventListener('mouseenter', () => {
  if (!hoverCapable.matches) return;
  clearTimeout(dropdownCloseTimer);
  setDropdown(true);
});
servicesDropdown.addEventListener('mouseleave', () => {
  if (!hoverCapable.matches) return;
  scheduleDropdownClose();
});

servicesTrigger.addEventListener('click', (e) => {
  // Always handle the click here rather than following the href — clicking the
  // trigger pins the panel open (or closes it if already pinned).
  e.preventDefault();
  const isOpen = servicesDropdown.classList.contains('open');
  if (isOpen && dropdownPinned) {
    setDropdown(false);
  } else {
    setDropdown(true);
    dropdownPinned = true;
  }
});

// Choosing a category closes both the panel and the mobile nav.
servicesDropdown.querySelectorAll('.mega-item, .mega-footer a').forEach(link => {
  link.addEventListener('click', () => {
    // Picking a category jumps to Our Work (via the href) and pre-filters the
    // grid to that category, so visitors land straight on the relevant samples.
    const filter = link.dataset.svcFilter;
    if (filter) applyWorkFilter(filter);
    setDropdown(false);
    navLinks.classList.remove('open');
  });
});

document.addEventListener('click', (e) => {
  if (!servicesDropdown.contains(e.target)) setDropdown(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setDropdown(false);
});

// Smart nav: hide on scroll down, reveal on scroll up or when the mouse
// approaches the top edge of the viewport. Runs on rAF to stay flicker-free.
const navEl = document.getElementById('nav');
const NAV_REVEAL_ZONE = 60;   // px from top that forces the nav back
const NAV_HIDE_START = 96;    // px scrolled before hiding is allowed

let lastScrollY = window.scrollY;
let ticking = false;

function applyNavScrollState() {
  const currentY = window.scrollY;
  navEl.classList.toggle('nav-scrolled', currentY > 4);

  if (!navLinks.classList.contains('open')) {
    if (currentY <= NAV_HIDE_START) {
      navEl.classList.remove('nav-hidden');
    } else if (currentY > lastScrollY) {
      navEl.classList.add('nav-hidden');
    } else if (currentY < lastScrollY) {
      navEl.classList.remove('nav-hidden');
    }
  }
  lastScrollY = currentY;
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(applyNavScrollState);
    ticking = true;
  }
}, { passive: true });

document.addEventListener('mousemove', (e) => {
  if (e.clientY <= NAV_REVEAL_ZONE) navEl.classList.remove('nav-hidden');
});

// Reveal-on-scroll
const revealTargets = document.querySelectorAll(
  '.problem-card, .pain-card, .price-card, .why-card, .included-card, .stat-card, .work-card, .service-card, .terms-card, .pricing-cta, .testimonial-card, ' +
  '.section .eyebrow, .section h2, .section-lede, .print-swatch, .callout, .contact-form, .contact-person, .project-pricing'
);
revealTargets.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealTargets.forEach(el => observer.observe(el));

// Our Work — filter pills
const filterRow = document.getElementById('filterRow');
const workGrid = document.getElementById('workGrid');
const workCards = [...document.querySelectorAll('.work-card')];

const workEmpty = document.getElementById('workEmpty');
const workEmptyCat = document.getElementById('workEmptyCat');

const workMore = document.getElementById('workMore');
const workMoreBtn = document.getElementById('workMoreBtn');
const workMoreLabel = document.getElementById('workMoreLabel');
const workMoreStatus = document.getElementById('workMoreStatus');
const workMoreBar = document.getElementById('workMoreBar');

let activeFilter = 'all';
let workLimit = 0;
let workExpanded = false; // true once the visitor has loaded more

// Batch size follows the grid's live column count so every batch fills whole
// rows: 2 rows on desktop/tablet, 3 rows on the 2-column phone layout.
function workBatchSize() {
  const cols = getComputedStyle(workGrid).gridTemplateColumns.split(' ').length || 1;
  return cols * (cols <= 2 ? 3 : 2);
}

function matchingCards() {
  return workCards.filter(c => activeFilter === 'all' || c.dataset.cat === activeFilter);
}

function renderWork() {
  const matches = matchingCards();
  workCards.forEach(card => {
    const idx = matches.indexOf(card);
    card.classList.toggle('hidden', idx === -1);
    card.classList.toggle('collapsed', idx >= workLimit);
  });

  const total = matches.length;
  const shown = Math.min(workLimit, total);
  const initial = workBatchSize();
  workMore.hidden = total <= initial;
  if (!workMore.hidden) {
    const allShown = shown >= total;
    workMoreStatus.innerHTML = `Showing <strong>${shown}</strong> of <strong>${total}</strong> projects`;
    workMoreBar.style.width = `${(shown / total) * 100}%`;
    workMoreLabel.textContent = allShown ? 'Show Less' : `Load More (${total - shown})`;
    workMoreBtn.classList.toggle('is-less', allShown);
  }

  // Some services don't have published samples yet — show a prompt instead of
  // an empty grid so the category still leads somewhere useful.
  if (workEmpty) {
    workEmpty.hidden = total > 0;
  }
}

// Shared so the services mega menu can drive the same filtering. Categories
// come from one taxonomy: data-filter (pills) === data-cat (cards) ===
// data-svc-filter (mega menu).
function applyWorkFilter(filter) {
  const pills = filterRow.querySelectorAll('.filter-pill');
  let target = [...pills].find(p => p.dataset.filter === filter);
  if (!target) target = [...pills].find(p => p.dataset.filter === 'all');

  pills.forEach(p => p.classList.toggle('active', p === target));
  activeFilter = target.dataset.filter;
  workLimit = workBatchSize();
  workExpanded = false;
  if (workEmptyCat) workEmptyCat.textContent = target.textContent.trim();
  renderWork();
}

filterRow.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-pill');
  if (!btn) return;
  applyWorkFilter(btn.dataset.filter);
});

workMoreBtn.addEventListener('click', () => {
  const total = matchingCards().length;
  if (workLimit >= total) {
    // Collapse back and return to the top of the grid so the visitor isn't
    // left stranded far below the section.
    workLimit = workBatchSize();
    workExpanded = false;
    renderWork();
    filterRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const firstNew = matchingCards()[workLimit];
  workLimit += workBatchSize() * 2;
  workExpanded = true;
  renderWork();
  firstNew?.focus({ preventScroll: true });
});

// Re-fit the opening rows when the column count changes (rotate / resize),
// unless the visitor has already expanded the grid.
let workResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(workResizeTimer);
  workResizeTimer = setTimeout(() => {
    if (workExpanded) return;
    const size = workBatchSize();
    if (size !== workLimit) { workLimit = size; renderWork(); }
  }, 150);
});

applyWorkFilter('all');

// Our Work — click a card to open its image/video in a full-view lightbox,
// then step through the current category with prev/next, arrow keys or swipe.
const lightbox = document.getElementById('workLightbox');
const lightboxBody = document.getElementById('lightboxBody');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxCounter = document.getElementById('lightboxCounter');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
let lightboxItems = [];
let lightboxIndex = 0;

function cardImageSrc(card) {
  return card.querySelector('.work-thumb img')?.src;
}

function showLightboxItem(index) {
  const count = lightboxItems.length;
  lightboxIndex = (index + count) % count;
  const card = lightboxItems[lightboxIndex];
  const img = card.querySelector('.work-thumb img');
  const video = card.querySelector('.work-thumb video');
  const title = card.querySelector('h3')?.textContent || '';
  const cat = card.querySelector('p')?.textContent || '';

  lightboxBody.innerHTML = '';
  if (video) {
    const v = document.createElement('video');
    v.src = video.currentSrc || video.src;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    lightboxBody.appendChild(v);
  } else if (img) {
    const i = document.createElement('img');
    i.src = img.src;
    i.alt = img.alt;
    lightboxBody.appendChild(i);
  }

  lightboxCaption.innerHTML = `<strong>${title}</strong><span>${cat}</span>`;
  lightboxCounter.textContent = `${lightboxIndex + 1} / ${count}`;

  // Warm the neighbouring images so prev/next feels instant
  [lightboxIndex - 1, lightboxIndex + 1].forEach(i => {
    const src = cardImageSrc(lightboxItems[(i + count) % count]);
    if (src) new Image().src = src;
  });
}

function openLightbox(card) {
  // Navigate everything in the active category, including cards still behind
  // Load More, so visitors can browse the full set without closing.
  lightboxItems = matchingCards();
  const single = lightboxItems.length < 2;
  lightboxPrev.hidden = single;
  lightboxNext.hidden = single;
  lightboxCounter.hidden = single;
  showLightboxItem(lightboxItems.indexOf(card));
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxBody.innerHTML = '';
  document.body.style.overflow = '';
  const card = lightboxItems[lightboxIndex];
  if (!card) return;
  // If the visitor browsed past the loaded rows, reveal up to that card so
  // focus (and the page position) lands on something visible.
  if (card.classList.contains('collapsed')) {
    const batch = workBatchSize();
    workLimit = Math.ceil((lightboxIndex + 1) / batch) * batch;
    workExpanded = true;
    renderWork();
  }
  card.focus({ preventScroll: true });
  card.scrollIntoView({ block: 'nearest' });
}

workCards.forEach(card => {
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.addEventListener('click', () => openLightbox(card));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(card); }
  });
});
lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => showLightboxItem(lightboxIndex - 1));
lightboxNext.addEventListener('click', () => showLightboxItem(lightboxIndex + 1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (lightboxItems.length > 1 && e.key === 'ArrowLeft') showLightboxItem(lightboxIndex - 1);
  else if (lightboxItems.length > 1 && e.key === 'ArrowRight') showLightboxItem(lightboxIndex + 1);
});

// Swipe left/right on touch screens
let touchX = null, touchY = null;
lightbox.addEventListener('touchstart', (e) => {
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
}, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  if (touchX === null || lightboxItems.length < 2) return;
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  touchX = touchY = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
    showLightboxItem(lightboxIndex + (dx < 0 ? 1 : -1));
  }
}, { passive: true });

// Footnote-star tooltip — portaled to <body> and positioned from the
// trigger's live bounding box so it always clears card `overflow: hidden`
// and flips/clamps itself to stay fully inside the viewport.
const starTooltip = document.getElementById('starTooltip');
const footnoteStars = document.querySelectorAll('.footnote-star');
const TOOLTIP_MARGIN = 10;
const TOOLTIP_GAP = 10;

function showStarTooltip(star) {
  const text = star.dataset.tooltip;
  if (!text) return;
  starTooltip.textContent = text;
  starTooltip.classList.remove('flip');
  starTooltip.style.left = '0px';
  starTooltip.style.top = '0px';

  const starRect = star.getBoundingClientRect();
  const ttRect = starTooltip.getBoundingClientRect();

  let top = starRect.top - ttRect.height - TOOLTIP_GAP;
  let flipped = false;
  if (top < TOOLTIP_MARGIN) {
    top = starRect.bottom + TOOLTIP_GAP;
    flipped = true;
  }

  let left = starRect.left + starRect.width / 2 - ttRect.width / 2;
  left = Math.max(TOOLTIP_MARGIN, Math.min(left, window.innerWidth - ttRect.width - TOOLTIP_MARGIN));

  const arrowX = starRect.left + starRect.width / 2 - left;
  starTooltip.style.setProperty('--arrow-x', `${arrowX}px`);
  starTooltip.style.left = `${left}px`;
  starTooltip.style.top = `${top}px`;
  starTooltip.classList.toggle('flip', flipped);
  starTooltip.classList.add('show');
}

function hideStarTooltip() {
  starTooltip.classList.remove('show');
}

footnoteStars.forEach(star => {
  star.addEventListener('mouseenter', () => showStarTooltip(star));
  star.addEventListener('mouseleave', hideStarTooltip);
  star.addEventListener('focus', () => showStarTooltip(star));
  star.addEventListener('blur', hideStarTooltip);
  star.addEventListener('touchstart', () => showStarTooltip(star), { passive: true });
});
window.addEventListener('scroll', hideStarTooltip, { passive: true });

// Quick intro video — custom play button, then hand over to native controls.
const introWrap = document.querySelector('.intro-video-wrap');
const introVideo = document.getElementById('introVideo');
const introPlay = document.getElementById('introPlay');

if (introWrap && introVideo && introPlay) {
  introPlay.addEventListener('click', () => {
    introVideo.controls = true;
    introVideo.play();
  });
  introVideo.addEventListener('play', () => introWrap.classList.add('playing'));
  introVideo.addEventListener('pause', () => {
    // Only bring the big play button back once the clip has finished, so a
    // mid-clip pause keeps the native controls in charge.
    if (introVideo.ended) introWrap.classList.remove('playing');
  });
  introVideo.addEventListener('ended', () => {
    introWrap.classList.remove('playing');
    introVideo.controls = false;
    introVideo.currentTime = 0;
  });
}

// Industries marquee — duplicate each track's cards so the -50% translate
// loops seamlessly. Done here rather than in markup to keep the HTML readable;
// without JS the cards still render, just without the infinite loop.
document.querySelectorAll('[data-marquee]').forEach(track => {
  track.setAttribute('aria-hidden', 'false');
  [...track.children].forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
});

// Hero showcase columns are pure CSS (animation + hover-pause) — no JS needed.

// Contact form — posts to FormSubmit, which forwards each submission to the
// destination address in the form's action URL. No API key or mailbox password
// is involved, so there is nothing secret in this file.
const CONTACT_EMAIL = 'info@graphiccrow.com';
const form = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
const formSubmit = document.getElementById('formSubmit');

// If the API call fails for any reason (form not yet activated, service down,
// visitor offline, corporate firewall), fall back to a pre-filled mail draft
// so the enquiry still reaches us instead of hitting a dead end.
function buildMailtoFallback() {
  const get = n => (form.querySelector(`[name="${n}"]`)?.value || '').trim();
  const body = [
    `Name: ${get('name')}`,
    `Email: ${get('email')}`,
    `Phone: ${get('phone') || '-'}`,
    '',
    'Project details:',
    get('message')
  ].join('\n');

  return `mailto:${CONTACT_EMAIL}` +
    `?subject=${encodeURIComponent('New enquiry from graphiccrow.com')}` +
    `&body=${encodeURIComponent(body)}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const originalLabel = formSubmit.textContent;
  formSubmit.disabled = true;
  formSubmit.textContent = 'Sending…';
  formNote.className = 'form-note';
  formNote.textContent = '';

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    });
    const data = await res.json();

    // FormSubmit returns success as the STRING "true", not a boolean — a plain
    // truthy check would also pass for the string "false".
    const ok = data.success === true || data.success === 'true';

    if (res.ok && ok) {
      formNote.textContent = "Thanks! We've got your details and will get back to you in 2-3 working days.";
      form.reset();
    } else {
      throw new Error(data.message || 'Submission failed');
    }
  } catch (err) {
    // Visitors get a friendly line plus a one-click way through; the real
    // reason goes to the console so setup problems (form not activated,
    // opened as a file:// page, network blocked) stay diagnosable.
    console.error('[contact form] submission failed:', err.message);
    formNote.className = 'form-note error';
    formNote.innerHTML =
      'Couldn’t send automatically. ' +
      `<a class="form-fallback-link" href="${buildMailtoFallback()}">Click here to email us instead</a> ` +
      '— your details are already filled in.';
  } finally {
    formSubmit.disabled = false;
    formSubmit.textContent = originalLabel;
  }
});
