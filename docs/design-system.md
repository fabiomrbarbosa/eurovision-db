# Design System

The design aesthetic is **editorial / archival** — deep navy background, gold winner accents, cyan links, magenta CTAs. Inspired by the official Eurovision website and museum catalogues.

All styles live in `src/styles/global.css` (global tokens + resets + shared component styles) and per-file `<style>` blocks in each Astro page and Svelte component.

---

## Colour tokens

Defined as CSS custom properties on `:root` in `global.css`. **Never use hex values directly in component styles** — always reference a token so the whole theme can be restyled by changing one file.

### Background / surface

| Token | Value | Used for |
|---|---|---|
| `--c-bg` | `#05041a` | Page background |
| `--c-surface` | `#0c0b28` | Cards, tables, modals |
| `--c-border` | `#1e1e50` | All dividers and borders |
| `--c-hover` | `#14143a` | Row and card hover state |
| `--c-surface-gold` | `#1a1025` | Winner row background |
| `--c-surface-gold-hover` | `#241530` | Winner row hover |
| `--c-surface-green` | `#0a1020` | Qualified-to-final row background |
| `--c-surface-green-hover` | `#10142a` | Qualified row hover |

### Text

| Token | Value | Used for |
|---|---|---|
| `--c-text` | `#e8e8e8` | Body text |
| `--c-muted` | `#8a90c8` | Secondary text, labels, metadata |

### Accents

| Token | Value | Used for |
|---|---|---|
| `--c-gold` | `#f0b429` | Winner highlights, score badges, active tab indicator |
| `--c-gold-dim` | `#9a7018` | Borders of gold elements |
| `--c-green` | `#6abf69` | Qualified badge text |
| `--c-cyan` | `#00d4ff` | Links (via `--c-link`) |
| `--c-magenta` | `#fd2494` | Nav logo, CTA links, cancelled badges |
| `--c-link` | `var(--c-cyan)` | **All hyperlinks** — change this to retheme every link at once |

**Colour rules:**
- `--c-gold` is semantically tied to winning/scoring. Navigation links use `--c-link` (cyan), not gold.
- `--c-magenta` is for the nav logo and primary CTAs only. Do not use it for regular links.
- `--c-link` is the single source of truth for hyperlink colour. Hover states that need to turn cyan reference `--c-link`, not `--c-cyan` directly.

---

## Typography

Two variable fonts, both self-hosted in `public/fonts/` via `@font-face` declarations in `global.css`. No Google Fonts, no CDN — works fully offline.

| Token | Font | Used for |
|---|---|---|
| `--f-body` | Geist Sans | Body text, UI labels, everything by default |
| `--f-mono` | Geist Mono | Scores, year numbers, country codes, section labels, headings |
| `--f-display` | alias for `--f-mono` | Kept as an alias in case a display font is added later |

**Section label pattern** — used everywhere for "CONTEST HISTORY", "VOTES RECEIVED BY", column headers:
```css
font-family: var(--f-mono);
font-size: 0.72rem;
text-transform: uppercase;
letter-spacing: 0.08–0.1em;
color: var(--c-muted);
font-weight: 400;
```
Never use bold for these labels — weight comes from the uppercase + letter-spacing combo.

**Heading scale (global):**
```css
h1: clamp(2.5rem, 5vw, 4rem)    font-weight: 700
h2: clamp(1.4rem, 3vw, 2rem)    font-weight: 600
```
The song detail page overrides `h1` with a 3rem cap and uses `h2` styles at `font-weight: 400` for the song subtitle (so it reads lighter than the artist name without introducing new scale numbers).

---

## Spacing and layout

```css
--radius: 6px      border-radius for cards, tables, badges
.container          max-width 1100px, centered, horizontal padding 1.5rem→2rem
.table-scroll       overflow-x: auto — wraps wide tables on mobile
```

The `.container` class is the standard content wrapper. Most pages have a single `.container` div inside `<main>`.

---

## Badges

Reusable inline labels with coloured variants:

```css
.badge             base: small mono text, padded, border-radius
.badge--gold       gold tint background, gold text, gold-dim border  (winner scores)
.badge--magenta    magenta tint background, magenta text             (cancelled, DNQ)
```

---

## Flags

All flags are `<img>` elements, never emoji spans. This matters for accessibility (the image has `alt=""` — it's decorative) and for visual consistency (emoji rendering varies by OS).

```html
<img class="flag" src={countryFlagUrl(code)} alt="" />
```

The global `.flag` rule:
```css
display: inline-block;
height: 1.2em;
vertical-align: -0.15em;
margin-right: 0.3em;
```

This sits the flag inline with text without the parent `<a>` underline bleeding under it. **Flags must always sit outside `<a>` tags in table cells.** The pattern is:
```html
<img class="flag" ... /><a class="country-link">Name</a>
```
Not:
```html
<a><img class="flag" ... />Name</a>
```
The second form causes an underline under the blank space to the right of the flag image.

Heart flag SVGs are from `https://www.eurovision.com/static/images/flags/flag_{code}.svg`. Downloaded with `npm run fetch:flags`. Wales (`gb-wls`) uses a PNG fallback.

---

## Ambient background

Two large blurred colour circles create a subtle gradient feel behind the content:

- `body::before` — cyan circle, top-right corner
- `body::after` — magenta circle, bottom-left corner

Both are implemented as solid `color-mix(in srgb, ...)` circles with `filter: blur(200px+)` rather than `radial-gradient(..., transparent)`. The `transparent` keyword in CSS colour functions is actually `rgba(0,0,0,0)` — gradients toward it fade toward black, not toward nothing, causing visible dark banding at the edges.

A noise texture overlay (`html::after`) using an SVG `feTurbulence` filter as a base64 data URI, with `mix-blend-mode: soft-light`, dithers any residual banding artifacts. This is purely visual — it doesn't affect interactivity.

---

## Link underlines

Content links (inside `td a`, `p a`, and `footer`) have always-visible underlines using `color-mix`:

```css
text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
```

At rest, the underline is a dimmed version of the link colour. On hover, `text-decoration-color: currentColor` makes it full-opacity. This is subtler than a hard underline but more accessible than no underline at all.

Navigation links (`nav a`, section headings) have no underline — they rely on hover colour change instead.

---

## Table styles (shared via `global.css`)

The most-used table styles are defined globally:

```css
.results-table      base table styles (border-collapse, cell padding, hover)
.song-cell a        muted colour, underline visible, turns cyan on hover
.country-link       flag + country name inline
```

These are **not** re-declared in Svelte components or Astro pages. If you add a new results table, add it inside a `.results-table` element and the styles apply automatically.
