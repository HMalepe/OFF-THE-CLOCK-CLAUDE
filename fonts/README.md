# Fonts

Self-hosted so the page doesn't wait on a third-party stylesheet (saved ~3s of render-blocking on a throttled mobile Lighthouse run).

| File | Family | Axes kept | Source |
|---|---|---|---|
| `source-serif-4-latin.woff2` | Source Serif 4 (roman) | wght 500–700, opsz 8–60 | Google Fonts, instanced + subset to Latin |
| `source-serif-4-italic-latin.woff2` | Source Serif 4 (italic) | wght 400–500, opsz 8–60 | Google Fonts, instanced + subset to Latin |
| `inter-latin.woff2` | Inter | wght 100–900 | Google Fonts, Latin subset |
| `inter-ipa.woff2` | Inter | wght 100–900 | Only ɪ ˈ ɛ ɡ, for the "/ɪnˈtɛɡrɪti/" line (was an 83KB latin-ext file) |
| `montserrat-latin.woff2` | Montserrat | wght 100–900 | Google Fonts |

All three families are licensed under the SIL Open Font License 1.1 (https://openfontlicense.org), which allows self-hosting and subsetting.

Need a weight or glyph that isn't here? Re-download from Google Fonts and re-run the subset step (fontTools `instancer` + `subset`), then update the `@font-face` ranges in `css/styles.css`.
