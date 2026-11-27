---
name: soft-panels-theme
description: Restyle a dark website into a light, premium look with a white page, cool-grey rounded panels behind content blocks, and rounded navy blocks for contrast, by re-pointing colour tokens per section. Use when Holiday says "do the colour change and grey rounded background thing", "make it light with rounded blocks", "flip dark to light", or asks to match the Off The Clock look on another page or site.
---

# Soft panels theme (white page, grey rounded panels, navy blocks)

This is the look first built for the Off The Clock site (live since 27 Nov 2026, commit d55f623 in the off-the-clock-cursor repo). The reference was a "Circus House" layout: white page, big rounded grey cards behind content, dark rounded cards for emphasis.

`assets/soft-panels.css` holds the exact CSS from the finished site. Copy it, then adapt the selectors to the target page.

## The look

- **Page:** pure white.
- **Panels:** each content block (a shelf, a copy block) sits on a large rounded panel in a cool grey with a faint blue undertone (`--c-fog: #EDEFF3`). Radius is `clamp(22px, 2.6vw, 40px)`. The panel clips its content (`overflow: hidden`) so tiles follow the rounded corners. Images inside get a softer 14px radius.
- **Contrast blocks:** one or two sections become rounded navy blocks on the white page (the book and author blocks), with white and mist text and the bright cyan accent.
- **Anchors:** the hero (video or photo) and the footer stay dark.

## The technique: re-point tokens, do not rewrite rules

The site's CSS already uses colour tokens (`--ink`, `--white`, `--mist`, `--muted`, `--line-dark`, `--accent`). To flip a section from dark to light:

1. Add fixed copies of the palette to `:root` (`--c-navy`, `--c-paper`, `--c-mist`, `--c-white`, `--c-slate`, `--c-slate-d`, `--c-muted`, `--c-fog`, `--c-teal`). They must be fixed copies, because a section that redefines `--ink` can no longer refer to the original `--ink`.
2. On each section to flip, redefine the tokens:
   - `--ink` becomes the light surface (paper, mist or white)
   - `--ink-2` becomes white
   - `--white` becomes navy (text)
   - `--mist` becomes slate-d (secondary text)
   - `--muted` becomes slate
   - `--line-dark` becomes a faint dark line
   - `--accent` becomes `--c-teal`
3. For a dark block on a light page, do the reverse on the block itself, and set its own `background`, `color` and radius.
4. Never add raw hex values outside `:root`. Add a token first.

## Rules learned the hard way

- **Cyan text fails contrast on light.** Use `--c-teal` (`#087F8C`) for text, links and rules on light backgrounds. Keep the bright cyan on navy.
- **Sections on photos stay dark.** If a section has a photo background with a dark overlay (story, mission), flipping its text to dark makes it unreadable. Leave those dark.
- **Pop-up sheets** that hold flipped sections need their sections to carry their own background, since the dialog is dark.
- **Version-tag the CSS and JS** (`styles.css?v=...`) when shipping, so browsers do not keep a cached dark version. Change the tag on every release.
- **Hidden sections:** on the one-screen homepage some sections only show in pop-ups. Check them there too.
- Panels are rounded boxes, so shelf arrows and scroll padding must use the same inner padding as the title (`clamp(18px, 2.4vw, 40px)`).

## Checklist before saying done

1. Screenshots of every section at 390 wide and 1440 wide. Look for dark text on dark, or light text on light.
2. No sideways scroll (`scrollWidth - innerWidth === 0`).
3. axe-core: zero serious or critical violations.
4. Rows or carousels still swipe, and the hero still plays.
5. Document the theme in `MOTION_SPEC.md` (or the project's design notes).
6. Build on a preview branch first. Merge to main only when Holiday says "merge".
