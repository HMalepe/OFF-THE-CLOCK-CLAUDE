# Project rules: Off The Clock site

Static podcast site. **No build step, no framework.** Keep it that way unless the task is an explicit port (see PROMPTS.md #4).

## Stack
- `index.html`: one `<section>` per block, with numbered comments `00 LOADER … 11 FOOTER`. Keep the numbering when adding sections.
- `css/styles.css`: `:root` tokens first, then base, primitives, sections in page order and `.static` rules last.
- `js/main.js`: SITE CONFIG (`LINKS`, endpoints), then basics (links, header, menu, anchors, forms, FAQ), then the static-mode early return, then motion blocks in DOM order, then `ScrollTrigger.sort()` + refresh.
- `js/vendor/`: GSAP 3, ScrollTrigger, Lenis. Vendored for offline use. Never switch to CDN links.
- `MOTION_SPEC.md` is the source of truth for motion. Update it in the same change as any animation edit.

## Brand rules
- **Colours only via tokens** (`var(--navy)`, `--sky`, `--gold`, `--paper`, `--blue`, …). No new hex values outside `:root`. Existing `rgba()` values are navy/sky/paper at alpha for overlays, glows and shadows.
- Fonts: `--f-display` (Source Serif 4: headings, italic accents), `--f-body` (Inter), `--f-brand` (Montserrat 900: logo-style caps only — loader, marquee, footer wordmark, card numbers).
- Fonts are **self-hosted** in `fonts/` (subset woff2, see `fonts/README.md`). Never add a Google Fonts `<link>` back: it was the biggest render-blocker. A new weight or glyph means re-subsetting.
- Don't use `-webkit-text-stroke` on Montserrat: the variable font's overlapping contours show through. Use solid fills.
- The clock mark is `<symbol id="clock">`. Reuse it with `<use href="#clock">`; recolour via `--clock-ring` / `--clock-face`. When a hand must animate, inline the full SVG and mark the path (`data-hand`, `data-loader-hand`, `data-footer-hand`).
- Logos are real PNGs (`assets/logo-white.png`, `assets/logo-navy.png`). Don't redraw the logo in type for the header or footer.
- Purely decorative text (card numbers, marquee words, footer wordmark) is CSS generated content (`data-n` / `data-w` / `data-t` + `::before`), not DOM text. Keep new decorative type the same way.

## Motion rules
1. **Create ScrollTriggers in DOM order.** Pinned sections add spacing that shifts every later trigger. Section setup (03–11) goes inside `step(() => { … })` so it runs in the queued, chunked order.
2. **Never hide content with CSS start states.** Set start states with `gsap.set` or `fromTo` so content stays visible when JS or GSAP fails.
3. **Use `fromTo`, not `from`.**
4. Pinned sequences need `scrub: 1`, `invalidateOnRefresh: true` and function-based values, and must be created inside `mm.add(TALL, …)` so short viewports get the flow layout.
5. Reuse the primitives (`wordRise`, `fadeUp`, `staggerUp`, `reveal`, `leave`, `drift`, `speed`, `batchReveal`, `tilt`) before writing new tweens. Use `[data-split]` for masked headings, `[data-fade]` for fade-ups, `[data-stagger]` for child cascades.
6. Default ease is `expo.out`. Scroll-linked tweens use `ease: 'none'`.
7. Clock hands rotate with `svgOrigin: '50 50'` passed in **both** the from and to vars (`...HAND`), or they orbit the wrong point.
8. Call `ScrollTrigger.refresh()` after anything that changes layout height.
9. Image transforms: GSAP owns `.ph` (un-zoom, drift); CSS hover owns the `.zoom` wrapper. Never put a CSS transform on `.ph`.
10. UI that re-renders (menu, messages) animates with `enter()`, which does nothing in static mode.
11. Desktop-only motion goes through the shared `mm = gsap.matchMedia()` (`DESKTOP` query).

## Static mode
`<html class="static">` ships in the markup so the page is complete with JavaScript off. The head script removes it unless `prefers-reduced-motion: reduce` is set; `main.js` adds it back if GSAP is missing. Never remove the class from the markup. No loader, no pins, no Lenis, everything visible, the conversations track is a native swipe row. Every new feature must work and be readable in static mode.

## Testing (before calling anything done)
- Widths: **390×844**, **1280×800** and **1440×900**, plus one landscape phone (**844×390**) where the pins must switch off (`html.no-pin`).
- `document.documentElement.scrollWidth - innerWidth === 0` (no horizontal scroll).
- No console errors (blocked Google Fonts in sandboxes are fine).
- Both pinned sections (integrity, conversations) show all content by their end, with nothing clipped.
- Run once with reduced motion emulated and once with JavaScript disabled; confirm all content shows and the conversations row scrolls.
- Keyboard: first Tab shows the skip link; the drawer traps Tab and Escape returns focus to the burger.
- axe-core: zero violations in static mode (decorative text is CSS content). In motion mode only elements caught mid-fade may flag.
- Deep links: `/#book` and `/#contact` must land with the section top at 0.
- Lighthouse (mobile) ≥ 90 performance, 100 accessibility / best practices / SEO.

## Content rules
- No fabricated episodes, guests, testimonials, stats, download numbers or awards. Only use facts supplied by the owner.
- Known facts: Peter Mehlape is Co-Founder of Off The Clock (a Leadership & Wellbeing Podcast) and author of *Winning in Africa: Your Next 8 Moves for Business Success in Africa*, foreword by Vodacom Group CEO Shameel Joosub.
- Don't name the other person in the studio photo unless the owner supplies the name.
- Keep the footer disclaimer (general information, not professional/financial/medical advice).
- Don't claim a season, release schedule or production status the owner hasn't confirmed.
- The clock-out check is self-reflection only: no health claims, no scores stored or sent.
