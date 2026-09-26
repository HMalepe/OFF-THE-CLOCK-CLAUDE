# Follow-up prompts (paste into Claude Code or Cursor)

Each prompt assumes the AI has read `CLAUDE.md` and `MOTION_SPEC.md`. Start the session with: *"Read CLAUDE.md and MOTION_SPEC.md first."*

---

## 1 · Real episodes
```
Season One is live. Here are the episodes: [title, guest, date, short description, Spotify/Apple/YouTube URLs, cover image filename].
Replace the "Season One is being recorded" card in section 06 with real episode cards (newest first, feature the latest).
Give each card its own platform links (direct hrefs instead of data-link). Keep batchReveal + tilt, and keep the promo card uncropped.
Add PodcastEpisode JSON-LD for each one. Then run the 390 / 1280 / 1440 checks from CLAUDE.md.
```

## 2 · Newsletter + enquiry form wiring
```
Wire the newsletter to [Mailchimp / Buttondown / ConvertKit / Beehiiv] and the enquiry form to [Formspree / Netlify Forms / a Vercel function that emails me].
Keep API keys out of main.js (serverless function if needed). Set SIGNUP_ENDPOINT and ENQUIRY_ENDPOINT.
Handle success, already-subscribed and error states in the existing message elements. Keep the honeypot.
Add a one-line POPIA consent note under both forms linking to /privacy, and create privacy.html in the same design.
```

## 3 · Real photos
```
I've added higher-resolution photos to /assets: [filenames + what each shows].
Replace studio.jpg / peter.jpg at the same framing (≥1600px / ≥900px wide), export WebP + JPG, and use <picture> with width/height attributes.
Add a photo slideshow behind the integrity section if I've supplied 3+ landscape studio shots (crossfade 2s, hold 6s, Ken Burns 1.08 → 1),
and update MOTION_SPEC.md. Verify static mode still shows everything.
```

## 4 · Next.js port (App Router + useGSAP)
```
Port this site to Next.js App Router + TypeScript, keeping it visually and behaviourally identical.
- MOTION_SPEC.md is the source of truth: every tween, trigger, start/end, scrub and step table must match.
- Use @gsap/react useGSAP (scoped refs, automatic cleanup) in one client component per section.
- A <LenisProvider> drives gsap.ticker and calls ScrollTrigger.update on scroll.
- Keep DOM-order trigger creation; a final effect calls ScrollTrigger.sort() + refresh() after fonts load.
- Tokens become CSS variables in globals.css (same names). Use next/font for Source Serif 4, Inter, Montserrat.
- Keep the static mode via a useReducedMotion hook.
- Make LINKS a typed config in /lib/site.ts.
Deliver it runnable with `npm run dev` and list anything that couldn't match 1:1.
```

## 5 · Episode pages
```
Add /episodes/<slug>.html pages generated from Markdown in /episodes/*.md (front matter: title, guest, date, cover, spotify, apple, youtube, summary).
Tiny Node build script (no framework): same header/footer, masked title, embedded Spotify player, show notes, "More episodes" row.
Generate /episodes/index.html, rss.xml and sitemap.xml. Add `npm run build` and document it in README + CLAUDE.md.
```

## 6 · SEO + social
```
Add canonical URL [https://yourdomain], og:url, JSON-LD PodcastSeries (name, description, author Peter Mehlape, webFeed if available)
and Book schema for Winning in Africa, robots.txt and sitemap.xml. Check the heading order stays h1 → h2 → h3.
```

## 7 · Tune the motion feel
```
Make the motion feel [calmer and more luxurious / snappier and more energetic].
Only change the values in the "Tuning knobs" table of MOTION_SPEC.md.
Show a before/after table, update MOTION_SPEC.md, and re-verify both pinned sections at 390 and 1280.
```

## 8 · Performance pass
```
Target Lighthouse mobile ≥ 90: preload the hero image, self-host the three fonts (woff2, font-display: swap),
defer vendor scripts, convert images to WebP/AVIF with srcset, and add will-change only during active tweens.
Report before/after numbers.
```
