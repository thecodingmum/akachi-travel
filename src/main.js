import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;
if (reduced) root.classList.add('reduced');

/* --------------------------------------------------------------------------
   Video helpers — sources load lazily from data-src
   -------------------------------------------------------------------------- */
function loadVideo(v) {
  if (v && !v.getAttribute('src') && v.dataset.src) {
    v.src = v.dataset.src;
    v.load();
  }
}
function playVideo(v) {
  if (reduced || !v) return;
  loadVideo(v);
  const p = v.play();
  if (p && p.catch) p.catch(() => {});
}

/* --------------------------------------------------------------------------
   Smooth scroll
   -------------------------------------------------------------------------- */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(target, offset = 0) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.6 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduced ? 'auto' : 'smooth' });
}

/* --------------------------------------------------------------------------
   Fit text — giant wordmarks span their container exactly
   -------------------------------------------------------------------------- */
function fitText() {
  $$('[data-fit]').forEach((el) => {
    const box = el.parentElement;
    // Measure the natural (max-content) width at 100px, then scale to fill the box
    el.style.fontSize = '100px';
    const cs = getComputedStyle(box);
    const target = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    el.style.width = 'max-content';
    const natural = el.getBoundingClientRect().width;
    el.style.width = '';
    if (natural > 0) el.style.fontSize = `${(100 * target) / natural}px`;
  });
  // Keep hero reel + scroll cue clear of the wordmark
  const word = $('.hero__word');
  if (word) root.style.setProperty('--hero-word-h', `${word.offsetHeight}px`);
}

/* --------------------------------------------------------------------------
   Text splitting
   -------------------------------------------------------------------------- */
function splitLines(el) {
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map((p) => `<span class="line-mask"><span>${p.trim()}</span></span>`).join('');
  return $$('.line-mask > span', el);
}

function splitWords(el) {
  const out = [];
  const walk = (node, parent) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = tok;
          frag.appendChild(s);
          out.push(s);
        });
        parent.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        if (child.classList.contains('inline-media')) { child.classList.add('w'); out.push(child); }
        else walk(child, child);
      }
    });
  };
  walk(el, el);
  return out;
}

/* --------------------------------------------------------------------------
   Preloader + hero intro
   -------------------------------------------------------------------------- */
const heroVideos = $$('.hero__video');
loadVideo(heroVideos[0]);

function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.hero__word-inner .word span', { yPercent: 105, duration: 1.4, stagger: 0.06 }, 0)
    .from('.hero__line > span', { yPercent: 110, duration: 1.3, stagger: 0.1 }, 0.25)
    .from('[data-hero-in]', { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.45)
    .from('.hero__top, .nav', { opacity: 0, y: -12, duration: 1 }, 0.5)
    .from('.scroll-cue', { opacity: 0, duration: 1 }, 0.9);
  return tl;
}

function runLoader() {
  const loader = $('.loader');
  window.scrollTo(0, 0);
  lenis?.scrollTo(0, { immediate: true, force: true });
  if (reduced || !loader) {
    loader?.remove();
    document.body.classList.remove('is-loading');
    startReel();
    return;
  }
  document.body.classList.add('is-loading');
  lenis?.stop();
  // Failsafe: if animation frames never arrive (e.g. a background tab), don't trap the page
  setTimeout(() => {
    if (!document.body.contains(loader) || gsap.ticker.time > 0.5) return;
    loader.remove();
    document.body.classList.remove('is-loading');
    lenis?.start();
    startReel();
  }, 6000);
  const counter = { v: 0 };
  const countEl = $('.loader__count');
  const tl = gsap.timeline();
  tl.to('.loader__mark .word span', { yPercent: 0, duration: 1, stagger: 0.06, ease: 'expo.out' }, 0)
    .to(counter, {
      v: 100, duration: 1.8, ease: 'power2.inOut',
      onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
    }, 0)
    .to('.loader__bar i', { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, 0)
    .to('.loader__mark .word span', { yPercent: -105, duration: 0.7, stagger: 0.04, ease: 'expo.in' }, 1.9)
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, 2.3)
    .add(() => {
      document.body.classList.remove('is-loading');
      lenis?.start();
      heroIntro();
      startReel();
    }, 2.45)
    .add(() => { loader.remove(); ScrollTrigger.refresh(); }, 3.4);
}

/* --------------------------------------------------------------------------
   Hero reel — crossfading cinematic clips
   -------------------------------------------------------------------------- */
const reelCoords = ['36.46°N · 25.38°E', '3.20°N · 73.22°E', '1.28°N · 103.86°E', '40.63°N · 14.48°E'];
const REEL_DURATION = 5; // matches the 5s Higgsfield clips
let reelIndex = 0;
let reelTween = null;
const reelItems = $$('.hero__index li');

function showReel(i) {
  const prev = heroVideos[reelIndex];
  reelIndex = (i + heroVideos.length) % heroVideos.length;
  const next = heroVideos[reelIndex];
  loadVideo(heroVideos[(reelIndex + 1) % heroVideos.length]); // warm the next clip
  if (prev !== next) {
    prev.classList.remove('is-active');
    setTimeout(() => prev.pause(), 1600);
  }
  next.classList.add('is-active');
  if (!reduced) {
    try { next.currentTime = 0; } catch (e) { /* not loaded yet */ }
    playVideo(next);
  }
  reelItems.forEach((li, n) => li.classList.toggle('is-active', n === reelIndex));
  const coords = $('[data-coords]');
  if (coords) coords.textContent = reelCoords[reelIndex];
  $$('.hero__index b').forEach((b) => gsap.set(b, { scaleX: 0 }));
  reelTween?.kill();
  if (reduced) return;
  reelTween = gsap.to(reelItems[reelIndex].querySelector('b'), {
    scaleX: 1, duration: REEL_DURATION, ease: 'none', onComplete: () => showReel(reelIndex + 1),
  });
}
function startReel() {
  heroVideos.forEach((v) => { v.loop = false; v.addEventListener('ended', () => { v.currentTime = 0; v.play().catch(() => {}); }); });
  showReel(0);
}
$$('[data-reel]').forEach((btn) => btn.addEventListener('click', () => showReel(+btn.dataset.reel)));

// Pause the reel when the hero is off-screen
ScrollTrigger.create({
  trigger: '.hero', start: 'top top', end: 'bottom top',
  onLeave: () => { heroVideos[reelIndex]?.pause(); reelTween?.pause(); },
  onEnterBack: () => { playVideo(heroVideos[reelIndex]); reelTween?.resume(); },
});

/* --------------------------------------------------------------------------
   Nav: hide on scroll down, reveal on scroll up; clock; active links; menu
   -------------------------------------------------------------------------- */
const nav = $('[data-nav]');
let lastY = 0;
function onScroll(y) {
  nav.classList.toggle('is-scrolled', y > 40);
  const menuOpen = document.body.classList.contains('menu-open');
  if (!menuOpen) nav.classList.toggle('is-hidden', y > lastY && y > 400);
  lastY = y;
}
if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

const clock = $('[data-clock]');
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' });
const tick = () => { if (clock) clock.textContent = fmt.format(new Date()); };
tick();
setInterval(tick, 15000);

// Created after the Atlas pin so positions include its pin spacing
function initNavLinks() {
  $$('.nav__links a').forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: (self) => a.classList.toggle('is-active', self.isActive),
    });
  });
}

const burger = $('.nav__burger');
const menu = $('#menu');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.setAttribute('aria-hidden', String(!open));
  if (open) { lenis?.stop(); nav.classList.remove('is-hidden'); } else lenis?.start();
}
burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });

/* --------------------------------------------------------------------------
   Anchor links + form prefill intents
   -------------------------------------------------------------------------- */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (href === '#') { e.preventDefault(); return; }
  const target = $(href);
  if (!target) return;
  e.preventDefault();
  if (document.body.classList.contains('menu-open')) setMenu(false);
  const dest = a.dataset.dest || a.closest('[data-dest]')?.dataset.dest;
  if (dest) prefillDestination(dest);
  if (a.dataset.intent === 'anywhere') setTimeout(() => $('[name="destinationOther"]')?.focus({ preventScroll: true }), 1700);
  scrollToTarget(target);
});

/* --------------------------------------------------------------------------
   Marquee — drifts constantly, accelerates with scroll velocity
   -------------------------------------------------------------------------- */
const mTrack = $('[data-marquee]');
if (mTrack) {
  mTrack.innerHTML += mTrack.innerHTML; // seamless loop
  if (!reduced) {
    let x = 0;
    let dir = -1;
    gsap.ticker.add(() => {
      const v = lenis ? lenis.velocity : 0;
      if (v > 0.5) dir = -1; else if (v < -0.5) dir = 1;
      x += dir * (0.6 + Math.min(Math.abs(v) * 0.25, 10));
      const half = mTrack.scrollWidth / 2;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      mTrack.style.transform = `translate3d(${x}px,0,0)`;
    });
  }
}

/* --------------------------------------------------------------------------
   Scroll-driven reveals
   -------------------------------------------------------------------------- */
function initReveals() {
  if (reduced) {
    $$('[data-count]').forEach((el) => { el.textContent = Number(el.dataset.count).toLocaleString('en-US', { minimumFractionDigits: +(el.dataset.decimals || 0) }); });
    return;
  }

  // Hero scroll-away
  gsap.to('.hero__word-inner', { yPercent: 35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content, .hero__reel', { y: -80, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '20% top', end: '75% top', scrub: true } });
  gsap.to('.hero__media', { scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Section label lines
  $$('.section-label .line').forEach((l) => gsap.from(l, { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: l, start: 'top 90%' } }));

  // Line-split display headings
  $$('[data-split]').forEach((el) => {
    const lines = splitLines(el);
    gsap.from(lines, { yPercent: 110, duration: 1.3, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  // Manifesto words brighten as you read
  const mText = $('[data-words]');
  if (mText) {
    const words = splitWords(mText);
    gsap.to(words, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: mText, start: 'top 78%', end: 'bottom 50%', scrub: 0.6 } });
  }

  // Polaroid parallax
  $$('[data-parallax]').forEach((el) => {
    const f = parseFloat(el.dataset.parallax) * (window.innerWidth <= 900 ? 0.2 : 1);
    gsap.fromTo(el, { y: () => -f * 260 }, { y: () => f * 260, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
  gsap.from('.polaroid', { opacity: 0, scale: 0.85, duration: 1.2, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.manifesto', start: 'top 60%' } });

  // Counters
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const dec = +(el.dataset.decimals || 0);
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: () => { el.textContent = o.v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); },
    });
  });
  gsap.from('.stat', { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.stats', start: 'top 85%' } });

  // Services rows
  gsap.from('.service', { y: 50, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.services__list', start: 'top 80%' } });
  gsap.from('.services__intro', { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.services__intro', start: 'top 88%' } });

  // Process
  gsap.fromTo('.process__line', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: '.process__wrap', start: 'top 80%', end: 'bottom 60%', scrub: true } });
  gsap.from('.step', { y: 60, opacity: 0, duration: 1.2, stagger: 0.14, ease: 'expo.out', scrollTrigger: { trigger: '.process__steps', start: 'top 80%' } });

  // Stories
  gsap.from('.postcard', { y: 80, opacity: 0, duration: 1.3, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.stories__rail', start: 'top 85%' } });
  gsap.from('.trust li', { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.trust', start: 'top 90%' } });

  // Plan
  gsap.from('.plan-form > *', { y: 30, opacity: 0, duration: 1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.plan-form', start: 'top 80%' } });
  gsap.from('.plan__promises li', { x: -20, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.plan__promises', start: 'top 90%' } });

  // Finale
  gsap.fromTo('.finale__video', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  gsap.from('.finale__sub, .finale__ctas, .finale__contact', { y: 30, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.finale__title', start: 'top 70%' } });

  // Footer wordmark rises
  gsap.from('.footer__word > div', { yPercent: 60, ease: 'none', scrollTrigger: { trigger: '.footer__word', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* --------------------------------------------------------------------------
   Atlas — pinned horizontal travel on desktop, swipe on mobile
   -------------------------------------------------------------------------- */
function initAtlas() {
  const track = $('[data-atlas-track]');
  const pin = $('.atlas__pin');
  const progress = $('[data-atlas-progress]');
  if (!track) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    if (reduced) { track.style.overflowX = 'auto'; return; }
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 0.8,
        invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => gsap.set(progress, { scaleX: self.progress }),
      },
    });
    // Cards drift slightly against the track for depth
    $$('.dest__media img', track).forEach((img) => {
      gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.dest'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    return () => gsap.set(track, { clearProps: 'transform' });
  });

  // Hover previews (desktop) / in-view previews (touch)
  const cards = $$('.dest:not(.dest--cta)', track);
  const start = (card) => { const v = $('video', card); if (!v || reduced) return; playVideo(v); card.classList.add('is-playing'); };
  const stop = (card) => { const v = $('video', card); if (!v) return; v.pause(); card.classList.remove('is-playing'); };
  if (finePointer) {
    cards.forEach((c) => {
      c.addEventListener('mouseenter', () => start(c));
      c.addEventListener('mouseleave', () => stop(c));
      c.addEventListener('focusin', () => start(c));
      c.addEventListener('focusout', () => stop(c));
    });
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => (en.isIntersecting ? start(en.target) : stop(en.target))), { root: window.innerWidth <= 900 ? track : null, threshold: 0.75 });
    cards.forEach((c) => io.observe(c));
  }
}

/* --------------------------------------------------------------------------
   Services — floating preview follows the cursor
   -------------------------------------------------------------------------- */
function initServices() {
  const float = $('.services__float');
  const img = $('img', float);
  const list = $('.services__list');
  if (!finePointer || !float) return;
  const xTo = gsap.quickTo(float, 'x', { duration: 0.6, ease: 'power3' });
  const yTo = gsap.quickTo(float, 'y', { duration: 0.6, ease: 'power3' });
  list.addEventListener('mousemove', (e) => { xTo(e.clientX + 30); yTo(e.clientY - 180); });
  $$('.service', list).forEach((row) => {
    row.addEventListener('mouseenter', () => { img.src = row.dataset.img; float.classList.add('is-on'); });
  });
  list.addEventListener('mouseleave', () => float.classList.remove('is-on'));
}

/* --------------------------------------------------------------------------
   Journeys — stacked cinematic panels
   -------------------------------------------------------------------------- */
function initJourneys() {
  const panels = $$('.journey');
  panels.forEach((panel, i) => {
    const inner = $('.journey__inner', panel);
    const video = $('.journey__video', panel);
    ScrollTrigger.create({
      trigger: panel, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => (self.isActive ? playVideo(video) : video.pause()),
    });
    if (reduced) return;
    const next = panels[i + 1];
    if (next) {
      gsap.fromTo(inner, { scale: 1, filter: 'brightness(1)' }, { scale: 0.9, filter: 'brightness(0.35)', ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } });
    }
    gsap.from($('.journey__name', panel), { yPercent: 30, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: panel, start: 'top 55%' } });
    gsap.from($('.journey__card', panel), { y: 50, opacity: 0, duration: 1.2, delay: 0.1, ease: 'expo.out', scrollTrigger: { trigger: panel, start: 'top 55%' } });
  });
}

/* --------------------------------------------------------------------------
   Autoplay ambient videos only while visible
   -------------------------------------------------------------------------- */
function initAmbientVideos() {
  const vids = $$('.inline-media video, .plan__visual video, .finale__video');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => entries.forEach((en) => (en.isIntersecting ? playVideo(en.target) : en.target.pause())), { rootMargin: '200px 0px' });
  vids.forEach((v) => io.observe(v));
}

/* --------------------------------------------------------------------------
   Drag-to-scroll testimonials
   -------------------------------------------------------------------------- */
function initDrag() {
  $$('[data-drag]').forEach((rail) => {
    let down = false; let startX = 0; let startScroll = 0; let moved = false;
    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startScroll = rail.scrollLeft;
      rail.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      rail.scrollLeft = startScroll - dx;
    });
    window.addEventListener('pointerup', () => { down = false; rail.classList.remove('is-dragging'); });
    rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    rail.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') rail.scrollBy({ left: 320, behavior: 'smooth' });
      if (e.key === 'ArrowLeft') rail.scrollBy({ left: -320, behavior: 'smooth' });
    });
  });
}

/* --------------------------------------------------------------------------
   Cursor + magnetic buttons
   -------------------------------------------------------------------------- */
function initCursor() {
  if (!finePointer || reduced) return;
  root.classList.add('has-cursor');
  const cursor = $('.cursor');
  const ring = $('.cursor__ring');
  const dot = $('.cursor__dot');
  const label = $('.cursor__label');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.1 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
  window.addEventListener('pointermove', (e) => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const interactive = e.target.closest('a, button, label, input, select');
    if (labelled && !(interactive && labelled.contains(interactive) && interactive !== labelled && interactive.matches('.btn'))) {
      label.textContent = labelled.dataset.cursor;
      cursor.classList.add('is-label');
      cursor.classList.remove('is-link');
    } else {
      cursor.classList.remove('is-label');
      cursor.classList.toggle('is-link', !!interactive);
    }
  });
  document.addEventListener('pointerleave', () => gsap.to([ring, dot], { opacity: 0, duration: 0.3 }));
  document.addEventListener('pointerenter', () => gsap.to([ring, dot], { opacity: 1, duration: 0.3 }));
}

function initMagnetic() {
  if (!finePointer || reduced) return;
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* --------------------------------------------------------------------------
   Itinerary form
   -------------------------------------------------------------------------- */
const form = $('[data-form]');
const success = $('.plan-success');

function prefillDestination(name) {
  const box = form?.querySelector(`input[name="destination"][value="${name}"]`);
  if (box) {
    box.checked = true;
    clearError('destination');
  }
}

function setError(field, msg) {
  const wrap = form.querySelector(`[data-field="${field}"]`);
  if (!wrap) return;
  wrap.classList.add('has-error');
  $('.field__error', wrap).textContent = msg;
}
function clearError(field) {
  const wrap = form.querySelector(`[data-field="${field}"]`);
  if (!wrap) return;
  wrap.classList.remove('has-error');
  $('.field__error', wrap).textContent = '';
}

function initForm() {
  if (!form) return;
  const counts = { adults: 2, children: 0 };
  const limits = { adults: [1, 16], children: [0, 10] };
  const agesWrap = $('[data-field="childAges"]', form);
  const agesList = $('[data-child-ages]', form);
  const ageOptions = '<option value="">Age</option><option value="0">Under 1</option>' +
    Array.from({ length: 17 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');

  // One age picker per child; ages already chosen are kept when the count changes
  function syncChildAges() {
    const n = counts.children;
    while (agesList.children.length < n) {
      const i = agesList.children.length + 1;
      const item = document.createElement('label');
      item.className = 'child-age';
      item.innerHTML = `<span class="mono">Child ${i}</span><select class="input" name="childAge" aria-label="Age of child ${i}">${ageOptions}</select>`;
      agesList.appendChild(item);
      if (!reduced) gsap.from(item, { y: 10, opacity: 0, duration: 0.45, ease: 'expo.out' });
    }
    while (agesList.children.length > n) agesList.lastElementChild.remove();
    agesWrap.hidden = n === 0;
    if (!agesList.querySelector('.is-missing')) clearError('childAges');
    clearTimeout(syncChildAges.t);
    syncChildAges.t = setTimeout(() => ScrollTrigger.refresh(), 250); // form height changed
  }

  $$('[data-step]', form).forEach((btn) => btn.addEventListener('click', () => {
    const k = btn.dataset.target;
    counts[k] = Math.min(limits[k][1], Math.max(limits[k][0], counts[k] + +btn.dataset.step));
    $(`[data-out="${k}"]`, form).textContent = counts[k];
    if (k === 'children') syncChildAges();
  }));

  form.addEventListener('input', (e) => {
    const n = e.target.name;
    if (n === 'destination' || n === 'destinationOther') clearError('destination');
    if (['name', 'email', 'phone'].includes(n)) clearError(n);
    if (n === 'childAge') {
      e.target.closest('.child-age')?.classList.toggle('is-missing', !e.target.value);
      if (!agesList.querySelector('.is-missing')) clearError('childAges');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const dests = data.getAll('destination');
    const other = (data.get('destinationOther') || '').trim();
    const name = (data.get('name') || '').trim();
    const email = (data.get('email') || '').trim();
    const phone = (data.get('phone') || '').trim();
    const errors = [];

    if (!dests.length && !other) errors.push(['destination', 'Pick at least one destination, or tell us where.']);
    if (name.length < 2) errors.push(['name', 'Please tell us your name.']);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push(['email', 'Please enter a valid email address.']);
    if (phone && phone.replace(/\D/g, '').length < 7) errors.push(['phone', 'That number looks a little short.']);
    const ageSelects = $$('select[name="childAge"]', form);
    ageSelects.forEach((sel) => sel.closest('.child-age').classList.toggle('is-missing', !sel.value));
    if (ageSelects.some((sel) => !sel.value)) {
      errors.push(['childAges', ageSelects.length > 1 ? "Please add each child's age so we can find the right rooms and fares." : "Please add your child's age so we can find the right rooms and fares."]);
    }

    ['destination', 'childAges', 'name', 'email', 'phone'].forEach(clearError);
    if (errors.length) {
      // Report top-down, so the first error is the one highest on the form
      const pos = (f) => form.querySelector(`[data-field="${f}"]`);
      errors.sort((a, b) => (pos(a[0]).compareDocumentPosition(pos(b[0])) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      errors.forEach(([f, m]) => setError(f, m));
      const first = form.querySelector(`[data-field="${errors[0][0]}"]`);
      const focusEl = first.querySelector('.is-missing select') || first.querySelector('input');
      scrollToTarget(first, -120);
      setTimeout(() => focusEl?.focus({ preventScroll: true }), reduced ? 0 : 700);
      if (!reduced) gsap.fromTo(first, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.firstChild.textContent = 'Sending your brief… ';

    // No backend yet — this is where the brief would be POSTed to the CRM.
    setTimeout(() => {
      const ref = `AK-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      $('[data-ref]', success).textContent = ref;
      $('[data-success-name]', success).textContent = name.split(' ')[0];
      const all = [...dests, other].filter(Boolean);
      $('[data-success-dest]', success).textContent = all.length ? ` for ${all.join(', ').replace(/, ([^,]*)$/, ' & $1')}` : '';
      // Success overlays the form (no layout shift, so no ScrollTrigger refresh needed)
      form.classList.add('is-sent');
      form.setAttribute('aria-hidden', 'true');
      success.hidden = false;
      success.focus({ preventScroll: true });
      scrollToTarget('.plan__form-wrap', -40);
      if (!reduced) gsap.from(success.children, { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out' });
    }, 900);
  });

  $('[data-reset]', success)?.addEventListener('click', () => {
    form.reset();
    counts.adults = 2; counts.children = 0;
    $('[data-out="adults"]', form).textContent = '2';
    $('[data-out="children"]', form).textContent = '0';
    syncChildAges();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = false;
    btn.firstChild.textContent = 'Send my travel brief ';
    success.hidden = true;
    form.classList.remove('is-sent');
    form.removeAttribute('aria-hidden');
    form.querySelector('input')?.focus({ preventScroll: true });
    scrollToTarget('.plan__form-wrap', -40);
  });

  // Newsletter
  const news = $('[data-news]');
  news?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('input', news);
    const msg = $('.news-msg');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) { msg.textContent = 'Please enter a valid email.'; return; }
    msg.textContent = "You're on the list ✺ First dispatch lands next month.";
    input.value = '';
  });
}

/* --------------------------------------------------------------------------
   Mobile sticky CTA — visible between hero and the form
   -------------------------------------------------------------------------- */
function initStickyCta() {
  const bar = $('.sticky-cta');
  if (!bar) return;
  let pastHero = false; let nearForm = false;
  const update = () => {
    const show = pastHero && !nearForm;
    bar.classList.toggle('is-visible', show);
    bar.setAttribute('aria-hidden', String(!show));
    $('a', bar).tabIndex = show ? 0 : -1;
  };
  ScrollTrigger.create({ trigger: '.hero', start: 'bottom 60%', onEnter: () => { pastHero = true; update(); }, onLeaveBack: () => { pastHero = false; update(); } });
  ScrollTrigger.create({ trigger: '#plan', start: 'top bottom', endTrigger: 'footer', end: 'bottom bottom', onToggle: (self) => { nearForm = self.isActive; update(); } });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
fitText();
initAtlas(); // pin first: triggers below it must account for its pin spacing
initReveals();
initNavLinks();
initServices();
initJourneys();
initAmbientVideos();
initDrag();
initCursor();
initMagnetic();
initForm();
initStickyCta();
runLoader();

document.fonts?.ready.then(() => { fitText(); ScrollTrigger.refresh(); });
window.addEventListener('load', () => ScrollTrigger.refresh());
let rT;
window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { fitText(); ScrollTrigger.refresh(); }, 150); });
