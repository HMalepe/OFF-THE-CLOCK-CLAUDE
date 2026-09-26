# MOTION_SPEC: Off The Clock site

Source of truth for every animation. If the site is ported (Next.js, Astro, Webflow), rebuild from this file, not from memory. Implementation: `js/main.js`.

**Feel:** calm, premium, confident. Long `expo.out` settles, masked reveals instead of pops, heavy scrubbing (`scrub: 1`) on anything tied to scroll. The recurring motif is **time**: clock hands sweep, dials turn, badges rotate.

## Global

| Setting | Value |
|---|---|
| Libraries | GSAP 3, ScrollTrigger, Lenis (vendored) |
| Smooth scroll | `new Lenis({ lerp: 0.1, smoothWheel: true })`, driven by `gsap.ticker`, `lagSmoothing(0)`, `lenis.on('scroll', ScrollTrigger.update)` |
| ScrollTrigger config | `ignoreMobileResize: true` |
| Default ease | `expo.out` (CSS mirror: `--ease-out: cubic-bezier(.16,1,.3,1)`) |
| Creation order | DOM order, then `ScrollTrigger.sort()`; `refresh()` after `document.fonts.ready` and `load` |
| Static mode | `html.static` when `prefers-reduced-motion: reduce` **or** GSAP/ScrollTrigger missing. No loader, pins, Lenis or scroll tweens |
| Anchors | `lenis.scrollTo(target, { duration: 1.4, offset: section ? 0 : -96 })`. `[data-topic]` links also pre-select the enquiry topic |
| Clock hands | `rotation` with `svgOrigin: '50 50'` (`HAND`) in both from and to vars |
| Desktop-only motion | `gsap.matchMedia()` with `(min-width: 761px)` for `[data-speed]`; tilt only on `(hover:hover) and (pointer:fine)` |

## Reusable primitives

| Name | What | Trigger | From → To | Duration / ease / stagger |
|---|---|---|---|---|
| `split(el)` | Wraps words in `span.w > span.wi` (mask = `.w { overflow:hidden }`). Sets `aria-label` | none | none | none |
| `splitChars(el)` | Wraps letters in `span.ch` (used for "integrity") | none | none | none |
| `wordRise(el)` | Masked word rise | `top 85%`, once | `.wi` yPercent 118 → 0 | 1.1s, expo.out, 0.07 |
| `fadeUp(el)` | Fade-up for `[data-fade]` | `top 88%`, once | y 40, opacity 0 → 0/1 | 1.0s, expo.out |
| `staggerUp(el)` | Children of `[data-stagger]` | `top 90%`, once | y 24, opacity 0 → 0/1 | 0.9s, expo.out, 0.08 |
| `reveal(scope)` | Runs the three above on every hook inside scope, in DOM order | none | none | none |
| `leave(el)` | Soft exit as a block leaves the top | `bottom 35%` → `bottom top`, scrub 1 | opacity 1, y 0 → 0, −60 | linear |
| `drift(ph, amt=6)` | Image drifts inside its frame (needs `.ph` headroom) | parent `top bottom` → `bottom top`, scrub 1 | yPercent −amt → amt | linear |
| `batchReveal(list, amt=6)` | Card clip reveal + image un-zoom + `drift(amt)` | `top 90%`, once | li `clipPath inset(100% 0 0 0)` → `inset(0)`; `.ph` scale 1.3 → 1 | 1.2s / 1.6s, expo.out, 0.12 |
| `speed(el)` | `[data-speed]` parallax float (desktop) | `top bottom` → `bottom top`, scrub 1 | y `−(1−s)·(vh+h)/2` → `+…` | linear |
| `enter(els)` | Entrance for re-rendered UI (drawer items, form messages, FAQ answer). No-op in static | on event | y 18, opacity 0 → 0/1 | 0.8s, expo.out, 0.06 |
| `tilt(el, {base, amp})` | Pointer tilt around a resting rotation | pointermove | rotationX/Y base ± amp | 0.6s, power3.out; returns to base on leave |
| CSS hovers | `.tlink` hairline wipes out right, sky line draws in left; buttons lift −2px with glow; `.zoom` scales 1.04; nav links underline in sky; FAQ + turns 45° and fills sky | hover | none | 0.3–1.2s, `--ease-out` |
| CSS loops | Eyebrow dot pulse (2.4s), hero scroll-cue line (2.2s), episode waveform bars (1.2–1.9s, staggered) | always | none | disabled in static |

## Section choreography

### 00 Loader → 02 Hero intro (timeline)
Lenis is stopped during the intro and the scroll is reset to the top when there is no hash.

| t | Target | Tween |
|---|---|---|
| 0.15 | `.loader__clock` | scale 0.6, opacity 0 → 1, 1 · 0.8 expo.out |
| −0.45 | `[data-loader-hand]` | rotation 0 → 360 (svgOrigin 50 50) · 1.1 power3.inOut |
| −0.6 | `.loader__word span` | yPercent 110 → 0 · 0.8, stagger 0.08 |
| −0.55 | `.loader__rule` | scaleX 0 → 1 · 0.8 expo.inOut |
| −0.45 | `.loader__tag` | opacity 0, y 10 → 1, 0 · 0.6 |
| +0.3 hold | `.loader__inner` | opacity → 0, y −20 · 0.5 power2.in |
| −0.1 | `.loader` curtain | yPercent 0 → −100 · 1.1 expo.inOut |
| −0.7 | `[data-hero-frame]` | clipPath inset(100% 0 0 0) → inset(0) · 1.6 expo.inOut |
| same | `[data-hero-img]` | scale 1.3 → 1 · 2.2 expo.out |
| +0.2 | header | opacity 0, y −20 → 1, 0 · 1.0 |
| +0.1 | hero words | yPercent 118 → 0 · 1.2, stagger 0.08 |
| +0.3 | `[data-hero-rule]` | scaleX 0 → 1 · 1.2 expo.inOut |
| +0.1 | `[data-hero-fade]` | opacity 0, y 24 → 1, 0 · 1.0, stagger 0.1 |
| +0.3 | `[data-badge]` | scale 0, rotation −90 → 1, 0 · 1.4 expo.out |
| end | none | `html.is-loaded`, `lenis.start()` |

CSS failsafe: `.js .loader` hides itself at 5s.

### 01 Header (plain scroll listener, all modes)
- Transparent over the hero; `.is-solid` (navy 92% + blur, 88 → 72px) after 40px of scroll.
- `.is-hidden` (translateY −100%) when scrolling down past 35% of the viewport; returns on any scroll up.
- Drawer slides in from the right (0.7s). Lenis stops while open. Logo, links, title and platform links `enter()` (y 28, stagger 0.045, delay 0.15, 0.9s).

### Back to top (plain scroll listener, all modes)
Fixed circular button with an SVG progress ring (`pathLength=1`, `dashoffset = 1 − progress`). Appears after 1 viewport. Hidden while the menu is open.

### 02 Hero
| Target | Trigger | From → To |
|---|---|---|
| `.badge__text` | always | rotation 0 → 360, 26s linear, repeat −1 |
| badge spin | `.hero` scroll velocity | timeScale → clamp(1, 5, 1 + |v|/400) over 0.25s, back to 1 over 1.2s |
| `[data-hero-content]` | `.hero` top top → bottom top, scrub 1 | yPercent 0, opacity 1 → −18, 0 |
| `[data-hero-media]` | same | yPercent 0 → 10 |
| `[data-hero-dial]` | same | rotation 0 → 45 |
| `.hero__cue` | top top → 25% top, scrub | opacity 1 → 0 (`immediateRender:false`) |

### 03 The show
`reveal` (eyebrow, heading word-rise, copy fade-ups, pillars stagger, link). Heading has `[data-speed="0.85"]`.

### 04 Integrity: PINNED
Arrival (not scrubbed): trigger `top 65%`, once → letters of "integrity" yPercent 70, opacity 0 → 0, 1 (1.1s, stagger 0.05), then IPA + "noun" fade up (0.9s, stagger 0.12).

Pinned timeline: `start: top top`, `end: += 2 × innerHeight`, `pin`, `scrub: 1`, `anticipatePin: 1`, `invalidateOnRefresh`. Length ≈ 3.

| Timeline pos | Target | From → To |
|---|---|---|
| 0 → 3 | `[data-int-bg]` | scale 1.15 → 1 |
| 0.2 / 1.0 / 1.8 (+0.5) | `[data-def]` 1–3 | opacity 0.15, x 24 → 1, 0 (power2.out) |
| same | `.defs span` numbers | sky 30% → sky 100% |
| 2.3 → 2.7 | `[data-int-note]` | opacity 0, y 16 → 1, 0 |
| 2.7 → 3.0 | none | hold |

### 04b Marquee
- Two identical sets; `xPercent −50`, 36s linear loop. The clock marks spin (8s/turn).
- On scroll: both loops' timeScale → `direction × clamp(1, 6, 1 + |v|/350)`, easing back to `±1` over 1.2s. Skew `clamp(−8°, 8°, −v/300)` settling to 0. Paused off screen.
- Section `fadeUp` at `top 95%`. Static: one wrapped set, no motion.

### 05 Conversations: PINNED horizontal
Trigger `.topics`, `start: top top`, `end: += dist() × 1.15`, `dist = track.scrollWidth − viewport.clientWidth`, `pin`, `scrub: 1`, `invalidateOnRefresh`.

| Target | Trigger | From → To |
|---|---|---|
| `[data-track]` | pin progress | x 0 → −dist() |
| `[data-track-bar]` | onUpdate | scaleX 0.02 → 1 |
| each card `[data-hand]` | `containerAnimation`, card `left right` → `right left`, scrub | rotation −90 → 270 (svgOrigin 50 50) |
| each card label + meta | `containerAnimation`, `left 95%` → `left 55%`, scrub | x 60, opacity 0 → 0, 1, stagger 0.15 |

Static: native `overflow-x: auto` swipe row with scroll-snap.

### 06 Episodes
Heading `reveal`, then `leave()`. `.epgrid` → `batchReveal(list, 2.5)` (small drift so the promo card stays uncropped). Feature card `tilt` (amp 2°). Waveform bars loop in CSS.

### 07 Host
- `.host__frame` wipes up (clipPath inset(100% 0 0 0) → 0, 1.4s expo.inOut) at `top 80%`, once, while its `.ph` un-zooms 1.25 → 1 (2s).
- `drift(.ph)` ±6%.
- `.host__clock` rotation −120 → 120 across the section (scrub 1).
- Copy `reveal` (heading, rule, paragraphs, credentials stagger, link).

### 08 Book
- `[data-book-scroll]` rotationY −28 → 10, y 60 → −40 across the section (scrub 1).
- `[data-book]` `tilt` with base rotationX 4 / rotationY −18, amp 5°.
- Copy `reveal`. `[data-moves] i` scale 0.2, opacity 0 → 1, 1 · 0.9 back.out(2), stagger 0.09, at `top 88%`, once.

### 09 FAQ
`reveal`; each `<details>` fades up. `.sec-head` `[data-speed="0.85"]`. Opening a question `enter()`s the answer (y −8, 0.6s) + `ScrollTrigger.refresh()`.

### 10 Contact
`.contact__clock` rotation −180, scale 0.4, opacity 0 → 0, 1, 1 (1.4s, expo.out) at `top 75%`, once. Then `reveal`. Form messages `enter()` (y 8, 0.6s).

### 11 Footer
- `.ftr__top` `fadeUp` at `top 92%`; socials and links `staggerUp`; base `fadeUp`.
- `[data-footer-mark]` yPercent 100 → 0 and `[data-footer-hand]` rotation −270 → 0, both over `.ftr` `top bottom` → `bottom bottom`, scrub 1.

## Tuning knobs

| Knob | Where | Effect |
|---|---|---|
| Lenis `lerp` (0.1) | setup | Lower = floatier, higher = snappier |
| `scrub: 1` | pins, parallax | 0.5 = tighter, 2 = heavier |
| Integrity length `2 × innerHeight` | 04 | Longer = slower definitions |
| Topics end `dist() × 1.15` | 05 | Bigger multiplier = slower travel |
| `wordRise` 1.1s / 0.07 | primitives | Faster headings = 0.8s / 0.04 |
| Badge 26s/turn | 02 | Lower = faster spin |
| Marquee 36s, boost cap 6 | 04b | Base speed / max velocity boost |
| Tilt amp | 06, 08 | Degrees of pointer tilt |
