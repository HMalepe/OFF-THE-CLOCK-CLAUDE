/* ==========================================================================
   Off The Clock — main.js
   Order: 0) site config (links, endpoints)
          1) basics (always run: links, header, back-to-top, menu, anchors,
             forms, FAQ)
          2) static-mode early return
          3) motion blocks in DOM order (00 → 11)
          4) ScrollTrigger.sort() + refreshes
   Timings/eases are documented in MOTION_SPEC.md (source of truth).
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     0 · SITE CONFIG — the only place to edit links and form endpoints
     Leave a value empty ('') and every matching [data-link] shows a "Soon"
     state and points visitors to the newsletter / contact form instead.
     ------------------------------------------------------------------------ */
  const LINKS = {
    spotify: '',   // e.g. 'https://open.spotify.com/show/…'
    apple: '',     // e.g. 'https://podcasts.apple.com/…'
    youtube: '',   // e.g. 'https://www.youtube.com/@…'
    instagram: '', // e.g. 'https://www.instagram.com/…'
    linkedin: '',  // e.g. 'https://www.linkedin.com/in/…'
    book: '',      // where to buy Winning in Africa
    email: '',     // e.g. 'hello@yourdomain.co.za' (enables mailto links + enquiry fallback)
  };
  const SIGNUP_ENDPOINT = '';  // newsletter provider form URL (Mailchimp, Buttondown, ConvertKit…)
  const ENQUIRY_ENDPOINT = ''; // form backend (Formspree, Netlify Forms, your own /api/enquiry…)

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  let lenis = null; // set in motion mode

  // Motion is allowed only when the user hasn't asked for reduced motion AND the libraries loaded
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const motionOK = !reduce && !!window.gsap && !!window.ScrollTrigger;
  if (!motionOK) root.classList.add('static');

  // Small entrance used by UI that re-renders (menu, messages). No-op in static mode.
  const enter = (els, opts = {}) => {
    if (!motionOK || !els || (Array.isArray(els) && !els.length)) return;
    gsap.fromTo(els, { y: opts.y ?? 18, opacity: 0 }, {
      y: 0, opacity: 1, duration: opts.duration ?? 0.8, ease: 'expo.out', stagger: opts.stagger ?? 0.06, delay: opts.delay ?? 0,
    });
  };
  const refresh = () => window.ScrollTrigger && motionOK && requestAnimationFrame(() => ScrollTrigger.refresh());

  /* ------------------------------------------------------------------------
     1 · BASICS — work in every mode
     ------------------------------------------------------------------------ */

  // External links from LINKS (or a "Soon" state that falls back to the in-page href)
  $$('[data-link]').forEach((a) => {
    const key = a.dataset.link;
    const url = LINKS[key];
    if (url) {
      a.href = key === 'email' ? `mailto:${url}` : url;
      if (key !== 'email') { a.target = '_blank'; a.rel = 'noopener'; }
    } else {
      a.classList.add('is-soon');
      a.title = 'Coming soon';
    }
  });

  // Footer year
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  // Hero clock dial: 60 ticks, every fifth one longer
  const ticks = $('.hero__ticks');
  if (ticks) {
    const NS = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const major = i % 5 === 0;
      const r1 = 198;
      const r2 = major ? 178 : 189;
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', 200 + Math.sin(a) * r1); l.setAttribute('y1', 200 - Math.cos(a) * r1);
      l.setAttribute('x2', 200 + Math.sin(a) * r2); l.setAttribute('y2', 200 - Math.cos(a) * r2);
      if (major) l.setAttribute('class', 'major');
      ticks.appendChild(l);
    }
  }

  // Header (solid after the hero starts scrolling, hides on scroll down, returns on scroll up)
  // + back-to-top button (appears after 1 viewport, ring = page progress)
  const hdr = $('[data-hdr]');
  const toTop = $('[data-totop]');
  const toTopBar = $('[data-totop-bar]');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const past = y > vh * 0.35;
    hdr.classList.toggle('is-solid', y > 40);
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    toTopBar.style.strokeDashoffset = String(1 - Math.min(1, y / max));
    toTop.classList.toggle('is-visible', y > vh);
    if (root.classList.contains('menu-open')) return;
    if (past && y > lastY + 2) hdr.classList.add('is-hidden');
    else if (y < lastY - 2 || !past) hdr.classList.remove('is-hidden');
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Off-canvas menu (items stagger in when motion is on)
  const drawer = $('#drawer');
  const burger = $('[data-menu-open]');
  const openMenu = () => {
    root.classList.add('menu-open');
    drawer.inert = false;
    burger.setAttribute('aria-expanded', 'true');
    lenis && lenis.stop();
    enter($$('.drawer__logo, .drawer__nav a, .drawer__title, .drawer__social a', drawer), { y: 28, stagger: 0.045, delay: 0.15, duration: 0.9 });
    setTimeout(() => $('.drawer__close').focus(), 50);
  };
  const closeMenu = () => {
    if (!root.classList.contains('menu-open')) return;
    root.classList.remove('menu-open');
    drawer.inert = true;
    burger.setAttribute('aria-expanded', 'false');
    lenis && lenis.start();
    burger.focus({ preventScroll: true });
  };
  burger.addEventListener('click', openMenu);
  $$('[data-menu-close]').forEach((b) => b.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

  // In-page anchors (smooth via Lenis when available). [data-topic] pre-selects the enquiry topic.
  const topicSelect = $('#q-topic');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#') { e.preventDefault(); return; }
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    if (a.dataset.topic && topicSelect) topicSelect.value = a.dataset.topic;
    const wasOpen = root.classList.contains('menu-open');
    closeMenu();
    const go = () => {
      if (lenis) lenis.scrollTo(target, { duration: 1.4, offset: target.tagName === 'SECTION' ? 0 : -96 });
      else target.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto' });
    };
    wasOpen ? setTimeout(go, 120) : go();
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  });

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Newsletter — set SIGNUP_ENDPOINT above (see PROMPTS.md #3)
  const form = $('[data-signup]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('[data-signup-msg]', form);
    const email = form.email.value.trim();
    const say = (t) => { msg.textContent = t; enter(msg, { y: 8, duration: 0.6 }); };
    if (!EMAIL_RE.test(email)) { say('Please enter a valid email address.'); form.email.focus(); return; }
    if (!SIGNUP_ENDPOINT) { say('Almost there — sign-ups open very soon.'); return; }
    try {
      const res = await fetch(SIGNUP_ENDPOINT, { method: 'POST', body: new FormData(form) });
      say(res.ok ? "You're in. Check your inbox to confirm." : 'Something went wrong — please try again.');
      if (res.ok) form.reset();
    } catch {
      say('Something went wrong — please try again.');
    }
  });

  // Enquiry form — ENQUIRY_ENDPOINT first, then a pre-filled email to LINKS.email
  const enq = $('[data-enquiry]');
  enq.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('[data-enquiry-msg]', enq);
    const say = (t) => { msg.textContent = t; enter(msg, { y: 8, duration: 0.6 }); };
    const f = enq.elements;
    if (f.company.value) return; // honeypot filled → bot
    if (!f.name.value.trim()) { say('Please add your name.'); f.name.focus(); return; }
    if (!EMAIL_RE.test(f.email.value.trim())) { say('Please enter a valid email address.'); f.email.focus(); return; }
    if (!f.message.value.trim()) { say('Please add a short message.'); f.message.focus(); return; }
    if (ENQUIRY_ENDPOINT) {
      try {
        const res = await fetch(ENQUIRY_ENDPOINT, { method: 'POST', body: new FormData(enq), headers: { Accept: 'application/json' } });
        say(res.ok ? "Thank you — we'll be in touch soon." : 'Something went wrong — please try again.');
        if (res.ok) enq.reset();
      } catch {
        say('Something went wrong — please try again.');
      }
      return;
    }
    if (LINKS.email) {
      const subject = `Off The Clock — ${f.topic.value}`;
      const body = `${f.message.value.trim()}\n\n${f.name.value.trim()}\n${f.email.value.trim()}`;
      location.href = `mailto:${LINKS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      say('Opening your email app…');
      return;
    }
    say('Thank you — enquiries open very soon. Subscribe on the left to hear when they do.');
  });

  // FAQ open/close changes page height → keep triggers accurate; answer eases in
  $$('.faq__list details').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) enter($('p', d), { y: -8, duration: 0.6 });
    refresh();
  }));

  /* ------------------------------------------------------------------------
     2 · STATIC MODE — reduced motion or libraries missing
     ------------------------------------------------------------------------ */
  if (!motionOK) {
    root.classList.add('is-loaded');
    return;
  }

  /* ------------------------------------------------------------------------
     3 · MOTION SETUP
     ------------------------------------------------------------------------ */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis; // handy for debugging / tests
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const EASE = 'expo.out';
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mm = gsap.matchMedia();
  const DESKTOP = '(min-width: 761px)';
  const HAND = { svgOrigin: '50 50' }; // clock hands rotate around the dial centre

  // Split [data-split] headings into masked words: span.w > span.wi
  const split = (el) => {
    if (el._words) return el._words;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const wi = document.createElement('span');
            wi.className = 'wi';
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    [...el.children].forEach((c) => c.setAttribute('aria-hidden', 'true'));
    el._words = $$('.wi', el);
    return el._words;
  };

  // Split a single word into letters (span.ch)
  const splitChars = (el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map((c) => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
    return $$('.ch', el);
  };

  // Primitive: masked word-rise, once
  const wordRise = (el, start = 'top 85%') =>
    gsap.fromTo(split(el), { yPercent: 118 }, {
      yPercent: 0, duration: 1.1, ease: EASE, stagger: 0.07,
      scrollTrigger: { trigger: el, start, once: true },
    });

  // Primitive: fade-up, once
  const fadeUp = (el, start = 'top 88%') =>
    el && gsap.fromTo(el, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1, ease: EASE,
      scrollTrigger: { trigger: el, start, once: true },
    });

  // Primitive: staggered children fade-up, once ([data-stagger])
  const staggerUp = (el, start = 'top 90%') =>
    gsap.fromTo([...el.children], { y: 24, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: EASE, stagger: 0.08,
      scrollTrigger: { trigger: el, start, once: true },
    });

  // Primitive: reveal every [data-split] / [data-fade] / [data-stagger] inside a scope (DOM order)
  const reveal = (scope, skip) => {
    $$('[data-split], [data-fade], [data-stagger]', scope).forEach((el) => {
      if (skip && skip(el)) return;
      if (el.hasAttribute('data-split')) wordRise(el);
      else if (el.hasAttribute('data-stagger')) staggerUp(el);
      else fadeUp(el);
    });
  };

  // Primitive: soft fade-out as a block leaves the top
  const leave = (el) =>
    gsap.fromTo(el, { opacity: 1, y: 0 }, {
      opacity: 0, y: -60, ease: 'none',
      scrollTrigger: { trigger: el, start: 'bottom 35%', end: 'bottom top', scrub: 1 },
    });

  // Primitive: image drift while visible (inner .ph needs headroom top/bottom)
  const drift = (ph, amount = 6) =>
    gsap.fromTo(ph, { yPercent: -amount }, {
      yPercent: amount, ease: 'none',
      scrollTrigger: { trigger: ph.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 },
    });

  // Primitive: [data-speed] parallax float (desktop only; <1 = slower than scroll)
  const speed = (el) =>
    mm.add(DESKTOP, () => {
      const sp = parseFloat(el.dataset.speed) || 1;
      const range = () => (1 - sp) * (window.innerHeight + el.offsetHeight) * 0.5;
      gsap.fromTo(el, { y: () => -range() }, {
        y: () => range(), ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1, invalidateOnRefresh: true },
      });
    });

  // Primitive: card batch reveal — clip from bottom + image un-zoom (+ drift on the same image)
  const batchReveal = (list, driftAmount = 6) => {
    const items = $$(':scope > li', list);
    const imgs = items.map((i) => $('.ph', i)).filter(Boolean);
    gsap.set(items, { clipPath: 'inset(100% 0% 0% 0%)' });
    if (imgs.length) gsap.set(imgs, { scale: 1.3 });
    ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: EASE, stagger: 0.12, clearProps: 'clipPath' });
        const phs = batch.map((b) => $('.ph', b)).filter(Boolean);
        if (phs.length) gsap.to(phs, { scale: 1, duration: 1.6, ease: EASE, stagger: 0.12 });
      },
    });
    imgs.forEach((ph) => drift(ph, driftAmount));
  };

  // Primitive: pointer tilt (fine pointers only). base = resting rotation, amp = max degrees
  const tilt = (el, { base = { x: 0, y: 0 }, amp = 4 } = {}) => {
    if (!finePointer) return;
    gsap.set(el, { transformPerspective: 900, rotationX: base.x, rotationY: base.y });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      ry(base.y + ((e.clientX - r.left) / r.width - 0.5) * amp * 2);
      rx(base.x - ((e.clientY - r.top) / r.height - 0.5) * amp * 2);
    });
    el.addEventListener('pointerleave', () => { rx(base.x); ry(base.y); });
  };

  /* ------------------------------------------------------------------------
     00 · LOADER → 02 · HERO INTRO
     ------------------------------------------------------------------------ */
  if (!location.hash) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }
  lenis && lenis.stop();
  const loader = $('.loader');
  const heroWords = split($('[data-split="hero"]'));
  const heroFades = $$('[data-hero-fade]');
  const heroFrame = $('[data-hero-frame]');
  const badge = $('[data-badge]');

  const intro = gsap.timeline({
    delay: 0.15,
    onComplete: () => { root.classList.add('is-loaded'); lenis && lenis.start(); },
  });
  intro
    .fromTo('.loader__clock', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: EASE })
    .fromTo('[data-loader-hand]', { rotation: 0, ...HAND }, { rotation: 360, ...HAND, duration: 1.1, ease: 'power3.inOut' }, '-=0.45')
    .fromTo('.loader__word span', { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: EASE, stagger: 0.08 }, '-=0.6')
    .fromTo('.loader__rule', { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, '-=0.55')
    .fromTo('.loader__tag', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.45')
    .to('.loader__inner', { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' }, '+=0.3')
    .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.1')
    .fromTo(heroFrame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', clearProps: 'clipPath' }, '-=0.7')
    .fromTo('[data-hero-img]', { scale: 1.3 }, { scale: 1, duration: 2.2, ease: EASE }, '<')
    .fromTo(hdr, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, ease: EASE, clearProps: 'transform' }, '<0.2')
    .fromTo(heroWords, { yPercent: 118 }, { yPercent: 0, duration: 1.2, ease: EASE, stagger: 0.08 }, '<0.1')
    .fromTo('[data-hero-rule]', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, '<0.3')
    .fromTo(heroFades, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: 0.1 }, '<0.1')
    .fromTo(badge, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 1.4, ease: 'expo.out' }, '<0.3');

  // Badge text turns slowly forever; scroll velocity nudges it
  const badgeSpin = gsap.to('.badge__text', { rotation: 360, duration: 26, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });

  /* 02 · HERO scroll-out (scrub) */
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 };
  gsap.fromTo('[data-hero-content]', { yPercent: 0, opacity: 1 }, { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: heroST });
  gsap.fromTo('[data-hero-media]', { yPercent: 0 }, { yPercent: 10, ease: 'none', scrollTrigger: heroST });
  gsap.fromTo('[data-hero-dial]', { rotation: 0 }, { rotation: 45, ease: 'none', scrollTrigger: heroST });
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: 'bottom top',
    onUpdate: (self) => {
      const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(self.getVelocity()) / 400);
      gsap.to(badgeSpin, { timeScale: boost, duration: 0.25, overwrite: true,
        onComplete: () => gsap.to(badgeSpin, { timeScale: 1, duration: 1.2, ease: 'power2.out' }) });
    },
  });
  gsap.fromTo('.hero__cue', { opacity: 1 }, {
    opacity: 0, ease: 'none', immediateRender: false,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '25% top', scrub: true },
  });

  /* ------------------------------------------------------------------------
     03 · THE SHOW
     ------------------------------------------------------------------------ */
  reveal($('.show'));
  $$('.show [data-speed]').forEach(speed);

  /* ------------------------------------------------------------------------
     04 · INTEGRITY — word reveals on arrival; pinned timeline lights the definitions
     ------------------------------------------------------------------------ */
  const integrity = $('.integrity');
  const chars = splitChars($('[data-int-title]'));
  gsap.timeline({ scrollTrigger: { trigger: integrity, start: 'top 65%', once: true } })
    .fromTo(chars, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, ease: EASE, stagger: 0.05 })
    .fromTo('[data-int-ipa]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.12 }, '-=0.7');

  const intTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: integrity, start: 'top top', end: () => '+=' + window.innerHeight * 2,
      pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
    },
  });
  intTl
    .fromTo('[data-int-bg]', { scale: 1.15 }, { scale: 1, duration: 3 }, 0)
    .fromTo('[data-def]', { opacity: 0.15, x: 24 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.8, ease: 'power2.out' }, 0.2)
    .fromTo('.defs span', { color: 'rgba(112,205,222,.3)' }, { color: 'rgba(112,205,222,1)', duration: 0.5, stagger: 0.8 }, 0.2)
    .fromTo('[data-int-note]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.3)
    .to({}, { duration: 0.3 }); // hold

  /* ------------------------------------------------------------------------
     04b · MARQUEE — continuous loop; scroll velocity boosts speed, direction flips it, adds skew
     ------------------------------------------------------------------------ */
  const mRow = $('[data-marquee]');
  if (mRow) {
    const loop = gsap.to(mRow, { xPercent: -50, duration: 36, ease: 'none', repeat: -1 });
    const skew = gsap.quickTo(mRow, 'skewX', { duration: 0.5, ease: 'power3.out' });
    const clocks = $$('.clock', mRow);
    const spin = gsap.to(clocks, { rotation: 360, duration: 8, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { loop.paused(!self.isActive); spin.paused(!self.isActive); },
      onUpdate: (self) => {
        const v = self.getVelocity();
        const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(v) / 350);
        gsap.to([loop, spin], {
          timeScale: self.direction * boost, duration: 0.25, overwrite: true,
          onComplete: () => gsap.to([loop, spin], { timeScale: self.direction, duration: 1.2, ease: 'power2.out' }),
        });
        skew(gsap.utils.clamp(-8, 8, v / -300));
        gsap.delayedCall(0.15, () => skew(0));
      },
    });
    fadeUp($('.marquee'), 'top 95%');
  }

  /* ------------------------------------------------------------------------
     05 · TOPICS — pinned horizontal track; each clock hand turns as its card crosses
     ------------------------------------------------------------------------ */
  const topics = $('.topics');
  const track = $('[data-track]');
  const vp = $('.topics__viewport');
  const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
  reveal($('.topics__head'));
  const hTween = gsap.fromTo(track, { x: 0 }, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: topics, start: 'top top', end: () => '+=' + dist() * 1.15,
      pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (self) => gsap.set('[data-track-bar]', { scaleX: 0.02 + self.progress * 0.98 }),
    },
  });
  $$('.tcard', track).forEach((card) => {
    gsap.fromTo($('[data-hand]', card), { rotation: -90, ...HAND }, {
      rotation: 270, ...HAND, ease: 'none',
      scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true },
    });
    gsap.fromTo([$('.tcard__label', card), $('.tcard__meta', card)], { x: 60, opacity: 0 }, {
      x: 0, opacity: 1, ease: 'power2.out', stagger: 0.15,
      scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left 95%', end: 'left 55%', scrub: true },
    });
  });

  /* ------------------------------------------------------------------------
     06 · EPISODES
     ------------------------------------------------------------------------ */
  const episodes = $('.episodes');
  reveal($('.sec-head', episodes));
  batchReveal($('.epgrid'), 2.5); // small drift: the promo card must stay uncropped
  $$('[data-tilt]').forEach((el) => tilt(el, { amp: 2 }));
  leave($('.sec-head', episodes));

  /* ------------------------------------------------------------------------
     07 · HOST — portrait wipes up + un-zooms, image drifts, clock turns with scroll
     ------------------------------------------------------------------------ */
  const host = $('.host');
  const hostFrame = $('.host__frame');
  const hostPh = $('.ph', hostFrame);
  gsap.set(hostPh, { scale: 1.25 });
  gsap.timeline({ scrollTrigger: { trigger: hostFrame, start: 'top 80%', once: true } })
    .fromTo(hostFrame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' })
    .to(hostPh, { scale: 1, duration: 2, ease: EASE }, '<');
  drift(hostPh);
  gsap.fromTo('.host__clock', { rotation: -120 }, {
    rotation: 120, ease: 'none', transformOrigin: '50% 50%',
    scrollTrigger: { trigger: host, start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  reveal($('.host__copy'));

  /* ------------------------------------------------------------------------
     08 · BOOK — cover turns toward you as it scrolls in; pointer tilt; the eight moves fill in
     ------------------------------------------------------------------------ */
  const book = $('.book');
  gsap.fromTo('[data-book-scroll]', { rotationY: -28, y: 60 }, {
    rotationY: 10, y: -40, ease: 'none',
    scrollTrigger: { trigger: book, start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  tilt($('[data-book]'), { base: { x: 4, y: -18 }, amp: 5 });
  reveal($('.book__copy'));
  gsap.fromTo('[data-moves] i', { scale: 0.2, opacity: 0 }, {
    scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(2)', stagger: 0.09,
    scrollTrigger: { trigger: '[data-moves]', start: 'top 88%', once: true },
  });

  /* ------------------------------------------------------------------------
     09 · FAQ
     ------------------------------------------------------------------------ */
  reveal($('.faq'));
  $$('.faq [data-speed]').forEach(speed);

  /* ------------------------------------------------------------------------
     10 · CONTACT
     ------------------------------------------------------------------------ */
  const contact = $('.contact');
  gsap.fromTo('.contact__clock', { rotation: -180, scale: 0.4, opacity: 0 }, {
    rotation: 0, scale: 1, opacity: 1, duration: 1.4, ease: EASE, transformOrigin: '50% 50%',
    scrollTrigger: { trigger: contact, start: 'top 75%', once: true },
  });
  reveal(contact);

  /* ------------------------------------------------------------------------
     11 · FOOTER — content reveals + giant wordmark rises; its clock hand sweeps
     ------------------------------------------------------------------------ */
  fadeUp($('.ftr__top'), 'top 92%');
  reveal($('.ftr'));
  gsap.fromTo('[data-footer-mark]', { yPercent: 100 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
  });
  gsap.fromTo('[data-footer-hand]', { rotation: -270, ...HAND }, {
    rotation: 0, ...HAND, ease: 'none',
    scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
  });

  /* ------------------------------------------------------------------------
     4 · FINALISE
     ------------------------------------------------------------------------ */
  ScrollTrigger.sort();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
