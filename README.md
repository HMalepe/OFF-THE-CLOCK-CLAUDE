# Off The Clock — podcast site

One-page site for **Off The Clock**, a leadership and wellbeing podcast co-founded by **Peter Mehlape**, author of *Winning in Africa: Your Next 8 Moves for Business Success in Africa*.

HTML + CSS + vanilla JS with no build step. Motion uses **GSAP 3 + ScrollTrigger + Lenis**, stored in `js/vendor/`, so it runs offline.

## Run it

```bash
npx serve .          # or: python3 -m http.server 8000
```

Open the URL it prints. Don't double-click `index.html`, because some browsers restrict `file://` pages.

## What's on the page

| # | Section | What it does |
|---|---|---|
| 00 | Loader | The logo's clock hand sweeps once, the wordmark rises, then a curtain lifts |
| 01 | Header | Logo, inline nav (desktop), Listen button, burger + drawer (≤1080px) |
| 02 | Hero | "Leadership, *off the clock.*" with the studio photo, a rotating badge, platform buttons and a clock-dial backdrop |
| 03 | The show | Manifesto + three pillars (Leadership · Wellbeing · Africa) |
| 04 | Integrity (pinned) | The word on the studio wall set as type. The show's three principles light up as you scroll |
| 04b | Marquee | Scroll-reactive ticker with spinning clock marks |
| 05 | Conversations (pinned) | Horizontal gallery of five themes. Each card's clock hand turns as it crosses the screen |
| 06 | Episodes | Featured "Introducing Peter Mehlape" card + "More conversations on the way" card |
| 06b | Clock-out check | Playable 3-question self-reflection ("Are you ever really off the clock?"), ending in a newsletter CTA |
| 07 | Host | Peter's portrait, bio and credentials |
| 08 | Book | 3D *Winning in Africa* cover, the eight moves, foreword credit |
| 09 | FAQ | Native `<details>` accordion |
| 10 | Contact | Newsletter sign-up + "Work with us" enquiry form |
| 11 | Footer | Logo, socials, links, disclaimer, giant rising wordmark |

## Structure

```
index.html            one <section> per block, numbered comments (00 loader … 11 footer)
css/styles.css        @font-face → :root tokens → base → primitives → sections in page order → .static
fonts/                self-hosted, subset woff2 (Source Serif 4, Inter, Montserrat) + licence notes
js/main.js            SITE CONFIG → basics → static-mode return → motion in DOM order
js/vendor/            gsap.min.js, ScrollTrigger.min.js, lenis.min.js
assets/               logos, photos, book cover, favicon, og.jpg
MOTION_SPEC.md        every animation (source of truth)
CLAUDE.md / .cursorrules   rules for AI coding tools
PROMPTS.md            ready-to-paste follow-up prompts
```

## Brand system

Sampled directly from the supplied logo, promo card and book cover:

| Token | Hex | Used for |
|---|---|---|
| `--navy` | `#0E2340` | Logo navy: dark sections, text on light |
| `--sky` | `#70CDDE` | The clock "O": CTAs, accents on dark |
| `--gold` | `#C08A4C` | The promo card's rule: hairlines, eyebrows |
| `--paper` | `#F1EEE9` | The promo card's background: light sections |
| `--blue` | `#2F6FAE` | Book-cover blue: accent text on light |
| `--ice` → `--ice-2` | `#E4ECF5` → `#C9D9EA` | Book-cover sky: the book section |

Type: **Source Serif 4** for headlines (echoes the promo card's serif), **Inter** for body, **Montserrat 900** only for logo-style caps (loader, marquee, footer wordmark).

The **clock mark** (the "O" in the logo) is an SVG `<symbol id="clock">` at the top of `index.html`. Use it anywhere with `<svg class="clock"><use href="#clock"/></svg>` and recolour it with `--clock-ring` / `--clock-face`.

## Where to put real links (one place)

Open `js/main.js`. At the top there's a `LINKS` object:

```js
const LINKS = {
  spotify: '', apple: '', youtube: '', instagram: '', linkedin: '',
  book: '',   // where to buy Winning in Africa
  email: '',  // enables mailto links + the enquiry form fallback
};
```

Any empty value shows a small **"Soon"** badge, and the button sends visitors to the newsletter (or contact form) instead of a dead link. Paste a URL and every matching button on the page goes live.

Below it are `SIGNUP_ENDPOINT` (newsletter provider) and `ENQUIRY_ENDPOINT` (form backend such as Formspree).

**Easiest option — Netlify:** deploy on Netlify and set `FORMS_PROVIDER = 'netlify'`. Both forms already carry `data-netlify`, so submissions land in *Site → Forms* in your Netlify dashboard with no other setup (spam honeypot included).

With no endpoint or provider, the enquiry form opens a pre-filled email to `LINKS.email`. With neither set, it shows "enquiries open very soon".

## Adding an episode

Duplicate the `<li class="ep ep--feature">` block in section 06. Swap the image, title and copy. If you want per-episode links, replace `data-link="spotify"` with a direct `href`.

## Assets

| File | Source |
|---|---|
| `logo-white.png`, `logo-navy.png` | Cut from the supplied logo JPGs (black background removed), 480px wide, palette PNG (~7KB each). Full-size cut-outs are in `assets/brand/` |
| `studio.jpg` | Right half of the "Introducing Peter Mehlape" promo card |
| `peter.jpg` | Portrait crop of the same photo |
| `promo-introducing-peter.jpg` | The promo card, unchanged |
| `book-winning-in-africa.jpg` | The supplied cover |
| `*.webp` | WebP copies of every photo, served first through `<picture>` (JPG fallback) |
| `og.jpg` | 1200×630 social share image built from the above |
| `privacy.html` | POPIA-structured privacy notice template describing what the site actually collects; blanks highlighted |
| `404.html` | Branded not-found page (Netlify, Vercel and most static hosts serve it automatically) |
| `robots.txt` | Allows crawling; add the sitemap line once the domain exists |
| `favicon.svg`, `apple-touch-icon.png`, `icon-512.png` | The clock mark (also used by `site.webmanifest`) |

The source photo is 1280×960, so the studio and portrait crops are ~780px and ~400px wide. They're displayed at about that size so they stay sharp. **If you get the original high-res photo, re-export `studio.jpg` (≥1600px wide) and `peter.jpg` (≥900px wide) at the same framing.**

## Pre-launch checklist

- [ ] Fill in `LINKS` in `js/main.js` (Spotify, Apple Podcasts, YouTube, Instagram, LinkedIn, book store, email).
- [ ] Set `SIGNUP_ENDPOINT` + `ENQUIRY_ENDPOINT` (see PROMPTS.md #2).
- [ ] Name the co-host / guest in the studio photo alt text if they'd like to be credited.
- [ ] Confirm the host bio and the book description with Peter.
- [ ] Replace the "More conversations on the way" card with real episodes once they're live.
- [ ] Make `og:image` an absolute URL (`https://yourdomain/assets/og.jpg`) — most social scrapers ignore relative paths. Add `url` to the JSON-LD too.
- [ ] Complete `privacy.html`: fill in every highlighted [bracketed] item (responsible party, Information Officer, providers, retention), have it reviewed, then delete the yellow "Before launch" box.
- [ ] Set `og:url` and `<link rel="canonical">` to the live domain.
- [ ] Higher-resolution studio photo if available (see Assets).
- [ ] Test on a real phone (iOS Safari + Android Chrome).

## Accessibility and fallbacks

- Works with JavaScript disabled: `<html class="static">` ships in the markup and is only lifted by JS.
- Skip link, focus moves to the section you jump to, Tab is trapped in the open menu, and the header nav marks the current section (`aria-current`).
- The loader plays once per browser session; repeat visits go straight to the hero.
- Landscape phones (≤520px tall) skip the two pinned scroll sequences and get the normal flow layout, so nothing is clipped.
- `prefers-reduced-motion: reduce` → `html.static`: no loader, no pins, no smooth scroll. All content is visible and the conversations gallery becomes a native swipe row.
- If GSAP fails to load, the same static mode kicks in. Content is never hidden by CSS; start states are only set by JS.
- The loader has a CSS safety timeout and hides itself after 5s even if JS stalls.
- Split headings keep an `aria-label` with the full text; the word spans are `aria-hidden`.
- The drawer is `inert` when closed, Escape closes it and focus returns to the burger.
- "Soon" links carry `title="Coming soon"` and still go somewhere useful.
- The enquiry form has a honeypot field for basic bot protection.

## Deploy

`vercel.json` (Vercel) and `_headers` (Netlify / Cloudflare Pages) set long cache lifetimes for fonts, vendor JS and assets, plus basic security headers.

**Vercel:** `npx vercel` in this folder (framework: *Other*, no build command, output dir `.`), or import the GitHub repo.
**Netlify:** drag the folder onto app.netlify.com/drop, or `npx netlify deploy --prod --dir .`.
**GitHub Pages:** Settings → Pages → deploy from branch, root folder.
Then point your domain's DNS at the host (HTTPS is automatic on all three).

## Credits

Built on a premium motion template (layout rhythm, pinned sequences, velocity marquee), fully rebranded to the Off The Clock identity. Photos, logo and book cover are Off The Clock's own assets.
