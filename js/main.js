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
  const ENQUIRY_ENDPOINT = ''; // form backend (Formspree, your own /api/enquiry…)
  // Hosting on Netlify? Set this to 'netlify' and both forms work with no endpoint at all:
  // submissions appear under Site → Forms in the Netlify dashboard (the forms already carry data-netlify).
  const FORMS_PROVIDER = '';

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
      a.setAttribute('aria-label', `${a.getAttribute('aria-label') || a.textContent.trim()} (coming soon)`);
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
  let ticking = false;
  const update = () => {
    ticking = false;
    // reads first, then writes: toggling classes before reading scrollHeight forces a layout
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const past = y > vh * 0.35;
    hdr.classList.toggle('is-solid', y > 40);
    toTopBar.style.strokeDashoffset = String(1 - Math.min(1, y / max));
    toTop.classList.toggle('is-visible', y > vh);
    if (root.classList.contains('menu-open')) return;
    if (past && y > lastY + 2) hdr.classList.add('is-hidden');
    else if (y < lastY - 2 || !past) hdr.classList.remove('is-hidden');
    lastY = y;
  };
  // rAF-throttled: one layout read per frame, however fast scroll events fire
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // Current section → aria-current on the header nav (desktop)
  const spyLinks = $$('[data-spy] a');
  if ('IntersectionObserver' in window && spyLinks.length) {
    const byId = new Map(spyLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const a = byId.get(en.target.id);
        // sections without a nav link (hero, integrity, marquee, topics, faq) keep the last
        // link lit if they sit after it; the hero clears everything
        if (!a && en.target.id !== 'top') return;
        spyLinks.forEach((l) => l.removeAttribute('aria-current'));
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach((sec) => spy.observe(sec));
  }

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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); return; }
    // keep Tab inside the open drawer
    if (e.key !== 'Tab' || !root.classList.contains('menu-open')) return;
    const f = $$('a[href], button:not([disabled])', drawer);
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

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
    // move keyboard focus with the scroll so the next Tab continues from the target
    const land = () => {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    const go = () => {
      if (lenis) lenis.scrollTo(target, { duration: 1.4, offset: target.tagName === 'SECTION' ? 0 : -96, onComplete: land });
      else { target.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto' }); land(); }
    };
    wasOpen ? setTimeout(go, 120) : go();
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  });

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Send a form to its endpoint, or to Netlify Forms. Resolves true/false, or null when nothing is configured.
  const send = async (formEl, endpoint) => {
    let req = null;
    if (endpoint) req = [endpoint, { method: 'POST', body: new FormData(formEl), headers: { Accept: 'application/json' } }];
    else if (FORMS_PROVIDER === 'netlify') {
      req = ['/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(formEl)).toString() }];
    }
    if (!req) return null;
    const btn = $('[type="submit"]', formEl);
    if (btn.disabled) return false;
    btn.disabled = true;
    try {
      const res = await fetch(...req);
      return res.ok;
    } catch {
      return false;
    } finally {
      btn.disabled = false;
    }
  };

  // Newsletter — set SIGNUP_ENDPOINT or FORMS_PROVIDER above (see PROMPTS.md #2)
  const form = $('[data-signup]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('[data-signup-msg]', form);
    const email = form.email.value.trim();
    const say = (t) => { msg.textContent = t; enter(msg, { y: 8, duration: 0.6 }); };
    if (!EMAIL_RE.test(email)) { say('Please enter a valid email address.'); form.email.focus(); return; }
    const ok = await send(form, SIGNUP_ENDPOINT);
    if (ok === null) { say('Almost there — sign-ups open very soon.'); return; }
    say(ok ? "You're in. Thanks for subscribing." : 'Something went wrong — please try again.');
    if (ok) form.reset();
  });

  // Enquiry form — ENQUIRY_ENDPOINT / FORMS_PROVIDER first, then a pre-filled email to LINKS.email
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
    const ok = await send(enq, ENQUIRY_ENDPOINT);
    if (ok !== null) {
      say(ok ? "Thank you — we'll be in touch soon." : 'Something went wrong — please try again.');
      if (ok) enq.reset();
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

  // Clock-out check — 3-question self-reflection (edit CHECK below). Nothing is stored or sent.
  // `good` is the answer that means you're protecting time off the clock.
  const CHECK = [
    {
      q: 'You checked work messages within an hour of waking up today.',
      good: false,
      why: "A quick look isn't a crime. But when it's automatic, the day starts on someone else's agenda.",
    },
    {
      q: "You've taken a full day off in the last month without checking in.",
      good: true,
      why: 'Perspective rarely shows up between meetings. It needs a day with nothing on it.',
    },
    {
      q: "The people at home would say you're fully present at dinner.",
      good: true,
      why: 'Presence is the part of leadership the people closest to you feel first.',
    },
  ];
  const RESULTS = [
    ['The clock is still running.', "You're in good company — that's exactly why this show exists. Start with one small boundary this week."],
    ['The clock is still running.', "You're in good company — that's exactly why this show exists. Start with one small boundary this week."],
    ['Almost off the clock.', "You've built some good habits. The conversations on the show are about protecting the rest."],
    ['You know how to clock out.', "Rare, and worth protecting. We'd love to hear how you do it — tell us in the enquiry form."],
  ];
  const panel = $('[data-check]');
  let qi = 0;
  let score = 0;
  const clockSvg = '<svg class="clock" aria-hidden="true"><use href="#clock"/></svg>';
  const renderQ = (animate = true) => {
    const item = CHECK[qi];
    panel.innerHTML = `
      <p class="q__count">Question ${qi + 1} of ${CHECK.length}<span class="q__bar"><i style="transform:scaleX(${(qi + 1) / CHECK.length})"></i></span></p>
      <p class="q__text">${item.q}</p>
      <div class="q__opts" role="group" aria-label="Your answer">
        <button class="q__opt" type="button" data-ans="true">That's me</button>
        <button class="q__opt" type="button" data-ans="false">Not me</button>
      </div>`;
    if (animate) { enter([...panel.children]); $('.q__opt', panel).focus({ preventScroll: true }); }
  };
  const renderEnd = () => {
    const [title, text] = RESULTS[score];
    panel.innerHTML = `
      <p class="q__count">Your result</p>
      <div class="q__score">${clockSvg}<strong>${title}</strong></div>
      <p class="q__result">${text}</p>
      <div class="q__opts">
        <a class="btn btn--sky" href="#newsletter">Get new episodes</a>
        <button class="q__opt" type="button" data-restart>Take it again</button>
      </div>`;
    enter([...panel.children]);
    refresh();
  };
  panel.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-ans]');
    if (opt) {
      const item = CHECK[qi];
      if (String(item.good) === opt.dataset.ans) score++;
      $$('[data-ans]', panel).forEach((b) => { b.disabled = true; });
      opt.classList.add('is-picked');
      panel.insertAdjacentHTML('beforeend', `
        <p class="q__why">${item.why}</p>
        <button class="btn btn--light q__next" type="button" data-next>${qi < CHECK.length - 1 ? 'Next question' : 'See my result'}</button>`);
      enter($$('.q__why, [data-next]', panel), { stagger: 0.1 });
      $('[data-next]', panel).focus({ preventScroll: true });
      refresh();
      return;
    }
    if (e.target.closest('[data-next]')) { qi++; qi < CHECK.length ? renderQ() : renderEnd(); return; }
    if (e.target.closest('[data-restart]')) { qi = 0; score = 0; renderQ(); refresh(); }
  });
  renderQ(false);

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
    $('[data-hint]').textContent = 'Swipe or scroll sideways';
    return;
  }
  // In motion mode the topics track is driven by the page scroll, so its viewport isn't a scroll region
  const trackVp = $('[data-track-vp]');
  if (trackVp) { trackVp.removeAttribute('tabindex'); trackVp.removeAttribute('role'); trackVp.removeAttribute('aria-label'); }

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
  // Section setup runs as a queue of small tasks (~30ms each) after the hero is built, so the
  // first paint and the intro aren't held up by one long main-thread task. Order = DOM order.
  const steps = [];
  const step = (fn) => steps.push(fn);
  const runSteps = () => {
    requestAnimationFrame(() => setTimeout(function next() {
      const t0 = performance.now();
      while (steps.length && performance.now() - t0 < 30) steps.shift()();
      if (steps.length) setTimeout(next, 0);
    }, 0));
  };
  // Pinned sections need room: below this height (landscape phones) they fall back to normal flow
  const TALL = '(min-height: 521px)';
  const SHORT = '(max-height: 520px)';
  const hint = $('[data-hint]');
  mm.add(SHORT, () => {
    root.classList.add('no-pin');
    const was = hint.textContent;
    hint.textContent = 'Swipe or scroll sideways';
    trackVp.setAttribute('tabindex', '0'); trackVp.setAttribute('role', 'region'); trackVp.setAttribute('aria-label', 'Conversation topics (scroll sideways)');
    return () => {
      root.classList.remove('no-pin');
      hint.textContent = was;
      trackVp.removeAttribute('tabindex'); trackVp.removeAttribute('role'); trackVp.removeAttribute('aria-label');
    };
  });

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
  const heroFades = $$('[data-hero-fade]'); // .hero__sub has no data-hero-fade on purpose: it's the mobile LCP element, so it stays painted
  const heroFrame = $('[data-hero-frame]');
  const badge = $('[data-badge]');

  // Full loader once per session; repeat visits go straight to the hero reveal
  let seen = false;
  try { seen = sessionStorage.getItem('otc-intro') === '1'; sessionStorage.setItem('otc-intro', '1'); } catch { /* storage blocked */ }
  const unlock = () => { lenis && lenis.start(); };
  const intro = gsap.timeline({
    delay: seen ? 0 : 0.15,
    onComplete: () => root.classList.add('is-loaded'),
  });
  if (seen) {
    loader.style.display = 'none';
    intro.addLabel('reveal', 0);
  } else {
    intro
      .fromTo('.loader__clock', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: EASE })
      .fromTo('[data-loader-hand]', { rotation: 0, ...HAND }, { rotation: 360, ...HAND, duration: 0.75, ease: 'power3.inOut' }, '-=0.3')
      .fromTo('.loader__word span', { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: EASE, stagger: 0.05 }, '-=0.5')
      .fromTo('.loader__rule', { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'expo.inOut' }, '-=0.45')
      .fromTo('.loader__tag', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.35')
      .to('.loader__inner', { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' }, '+=0.1')
      .to(loader, { yPercent: -100, duration: 0.9, ease: 'expo.inOut', onComplete: () => { loader.style.display = 'none'; } }, '-=0.05')
      .addLabel('reveal', '-=0.6');
  }
  // Side-by-side layouts wipe the photo in. On stacked layouts (≤900px) it sits below the fold, where a
  // wipe is barely seen but holds back Largest Contentful Paint, so it only un-zooms there.
  if (matchMedia('(min-width: 901px)').matches) {
    intro.fromTo(heroFrame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' }, 'reveal');
  }
  intro
    .call(unlock, null, 'reveal+=0.3') // scrolling is allowed as soon as the hero is showing, not when every tween ends
    .fromTo('[data-hero-img]', { scale: 1.3 }, { scale: 1, duration: 2.1, ease: EASE }, 'reveal')
    .fromTo(hdr, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, ease: EASE, clearProps: 'transform' }, 'reveal+=0.2')
    .fromTo(heroWords, { yPercent: 118 }, { yPercent: 0, duration: 1.2, ease: EASE, stagger: 0.08 }, 'reveal+=0.3')
    .fromTo('[data-hero-rule]', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, 'reveal+=0.6')
    .fromTo(heroFades, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: 0.1 }, 'reveal+=0.7')
    .fromTo(badge, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 1.4, ease: 'expo.out' }, 'reveal+=1');

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
  step(() => {
    reveal($('.show'));
    $$('.show [data-speed]').forEach(speed);
  });

  /* ------------------------------------------------------------------------
     04 · INTEGRITY — word reveals on arrival; pinned timeline lights the definitions
     ------------------------------------------------------------------------ */
  step(() => {
    const integrity = $('.integrity');
    const chars = splitChars($('[data-int-title]'));
    gsap.timeline({ scrollTrigger: { trigger: integrity, start: 'top 65%', once: true } })
      .fromTo(chars, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, ease: EASE, stagger: 0.05 })
      .fromTo('[data-int-ipa]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.12 }, '-=0.7');

    mm.add(TALL, () => {
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: integrity, start: 'top top', end: () => '+=' + window.innerHeight * 2,
          pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        },
      })
        .fromTo('[data-int-bg]', { scale: 1.15 }, { scale: 1, duration: 3 }, 0)
        .fromTo('[data-def]', { opacity: 0.15, x: 24 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.8, ease: 'power2.out' }, 0.2)
        .fromTo('[data-int-note]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 2.3)
        .to({}, { duration: 0.3 }); // hold
    });
  });

  /* ------------------------------------------------------------------------
     04b · MARQUEE — continuous loop; scroll velocity boosts speed, direction flips it, adds skew
     ------------------------------------------------------------------------ */
  step(() => {
    const mRow = $('[data-marquee]');
    if (mRow) {
      const loop = gsap.to(mRow, { xPercent: -50, duration: 36, ease: 'none', repeat: -1 });
      const skew = gsap.quickTo(mRow, 'skewX', { duration: 0.5, ease: 'power3.out' });
      const settle = gsap.delayedCall(0.15, () => skew(0)).pause();
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
          settle.restart(true);
        },
      });
      fadeUp($('.marquee'), 'top 95%');
    }
  });

  /* ------------------------------------------------------------------------
     05 · TOPICS — pinned horizontal track; each clock hand turns as its card crosses
     ------------------------------------------------------------------------ */
  step(() => {
    const topics = $('.topics');
    const track = $('[data-track]');
    const vp = $('.topics__viewport');
    const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
    reveal($('.topics__head'));
    mm.add(TALL, () => {
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
    });
  });

  /* ------------------------------------------------------------------------
     06 · EPISODES
     ------------------------------------------------------------------------ */
  step(() => {
    const episodes = $('.episodes');
    reveal($('.sec-head', episodes));
    batchReveal($('.epgrid'), 2.5); // small drift: the promo card must stay uncropped
    $$('[data-tilt]').forEach((el) => tilt(el, { amp: 2 }));
    leave($('.sec-head', episodes));
    fadeUp($('.checkin'));
    $$('.checkin [data-speed]').forEach(speed);
  });

  /* ------------------------------------------------------------------------
     07 · HOST — portrait wipes up + un-zooms, image drifts, clock turns with scroll
     ------------------------------------------------------------------------ */
  step(() => {
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
  });

  /* ------------------------------------------------------------------------
     08 · BOOK — cover turns toward you as it scrolls in; pointer tilt; the eight moves fill in
     ------------------------------------------------------------------------ */
  step(() => {
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
  });

  /* ------------------------------------------------------------------------
     09 · FAQ
     ------------------------------------------------------------------------ */
  step(() => {
    reveal($('.faq'));
    $$('.faq [data-speed]').forEach(speed);
  });

  /* ------------------------------------------------------------------------
     10 · CONTACT
     ------------------------------------------------------------------------ */
  step(() => {
    const contact = $('.contact');
    gsap.fromTo('.contact__clock', { rotation: -180, scale: 0.4, opacity: 0 }, {
      rotation: 0, scale: 1, opacity: 1, duration: 1.4, ease: EASE, transformOrigin: '50% 50%',
      scrollTrigger: { trigger: contact, start: 'top 75%', once: true },
    });
    reveal(contact);
  });

  /* ------------------------------------------------------------------------
     11 · FOOTER — content reveals + giant wordmark rises; its clock hand sweeps
     ------------------------------------------------------------------------ */
  step(() => {
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
  });

  /* ------------------------------------------------------------------------
     4 · FINALISE
     ------------------------------------------------------------------------ */
  // Deep links (/#book): pins and late-loading fonts both move the target after the browser's own
  // jump, so land on it again after each of those, until the visitor scrolls on their own.
  let userMoved = false;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, () => { userMoved = true; }, { once: true, passive: true }));
  const landHash = () => {
    const target = location.hash && document.querySelector(location.hash);
    if (!target || userMoved || !lenis) return;
    lenis.resize(); // Lenis caches the page height; pins just made it taller, so re-measure before clamping
    lenis.scrollTo(target, { immediate: true, force: true, offset: target.tagName === 'SECTION' ? 0 : -96 });
  };
  const settleLayout = () => { ScrollTrigger.refresh(); landHash(); };
  step(() => {
    ScrollTrigger.sort();
    settleLayout();
  });
  runSteps();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => !steps.length && settleLayout());
  window.addEventListener('load', () => !steps.length && settleLayout());
})();
