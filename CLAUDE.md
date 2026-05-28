# Eurovision Database — Project Brief for Claude Code

This file is the persistent memory and briefing for AI-assisted development.
Read it at the start of every session before touching any code.

---

## What this project is

A personal static web app for browsing Eurovision Song Contest history.
Search by country, artist, song title, or year. View full contest results
including jury/televote breakdown. Browse a country's full participation history.

**Stack:** Astro 4 (static output) + Svelte 5 (interactive islands) + TypeScript.
No backend. No database. Data lives as local JSON files fetched at build time.

**Senior ESC only** — no Junior ESC routes or data folders needed.

---

## Data source

**EurovisionAPI** — `https://eurovisionapi.runasp.net`
- Maintained by the EurovisionAPI org (formerly josago97)
- Dataset repo: `https://github.com/EurovisionAPI/dataset`
- Coverage: Senior ESC 1956–2026
- **ESC 2026** (Vienna, Bulgaria won with "Bangaranga" by Dara, 516 pts)
  — hand-crafted `src/data/contests/2026.json` exists with full aggregate jury/tele
  totals and per-country vote breakdowns for all rounds (cross-checked from
  EurovisionWorld, ESCCovers, ESC Insight, Eurovoix). Data is complete.
  Replace with official API data once available: `npm run fetch:year -- 2026`.
- Data quality: independently verified against Wikipedia 2024+2025, zero diffs.
- The API is hobbyist-hosted on a free ASP.NET tier. May go down. The local
  JSON snapshots in `src/data/` are the source of truth for the running app.

### Key API routes
```
GET /api/countries                                    → Record<code, name>
GET /api/senior/contests/years                        → number[]
GET /api/senior/contests                              → ContestReference[]
GET /api/senior/contests/{year}                       → ContestDetail (incl. rounds+scores)
GET /api/senior/contests/{year}/contestants/{id}      → ContestantDetail (lyrics, BPM, etc.)
```
Score split (jury + public) only exists for years > 2015. Before that only "total".

---

## Repository layout

```
eurovision-app/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── CLAUDE.md                        ← you are here
├── scripts/
│   ├── fetch-all.ts                 ← build-time data fetch script
│   ├── fetch-logos.ts               ← downloads contest logos to public/images/logos/
│   └── fetch-flags.ts               ← downloads heart flags from eurovision.com
├── public/
│   ├── favicon.svg                  ← 🩷 emoji SVG favicon
│   ├── images/
│   │   ├── emblem.svg               ← Eurovision emblem (used as homepage watermark)
│   │   ├── logos/                   ← offline contest logos: {year}.png
│   │   └── flags/                   ← heart flags: {code}.svg (PNG fallback for gb-wls)
└── src/
    ├── data/                        ← server-side JSON (read by Astro at build time)
    │   ├── countries.json
    │   ├── contests/
    │   │   ├── 1956.json
    │   │   └── ... (1956–2026)
    │   └── contestants/             ← per-contestant detail (fetched with --contestants flag)
    │       ├── 2025/
    │       │   ├── 0.json           ← ContestantDetail (lyrics, BPM, credits, …)
    │       │   └── ...
    │       └── ... (all years)
    ├── lib/
    │   ├── api/
    │   │   ├── types.ts             ← ALL TypeScript interfaces (source of truth)
    │   │   └── client.ts            ← typed fetch wrapper, retry logic, batch helpers
    │   ├── data.ts                  ← server-side read helpers (fs, not fetch)
    │   └── utils.ts                 ← countryFlagUrl(), ordinal()
    ├── layouts/
    │   └── Base.astro               ← shell, nav, footer
    ├── styles/
    │   └── global.css               ← design tokens, reset, typography, utilities
    ├── components/
    │   ├── Search.svelte            ← client-side search island (fetches /data/index.json)
    │   ├── ScoreBreakdown.svelte    ← interactive vote detail (click country → voters)
    │   ├── ContestTabs.svelte       ← SF1/SF2/Final tab group for contest page
    │   ├── LyricsTabs.svelte        ← wrapping tab group for original + translations/versions
    │   └── VoteTabs.svelte          ← per-song voter breakdown with SF/Final tabs
    └── pages/
        ├── index.astro              ← homepage: hero + recent winners grid
        ├── contests.astro           ← all editions table
        ├── countries.astro          ← all countries with win/appearance stats
        ├── data/
        │   ├── index.json.ts        ← Astro endpoint: serves src/data/index.json
        │   └── countries.json.ts    ← Astro endpoint: serves src/data/countries.json
        ├── contest/
        │   ├── [year].astro         ← full contest page: scoreboard + ScoreBreakdown
        │   └── [year]/song/
        │       └── [id].astro       ← song detail: video, lyrics, credits, results; id is 1-based (contestantId + 1)
        └── country/
            └── [code].astro         ← country page: stats + full history table
```

---

## Data flow

```
fetch-all.ts → src/data/  ← Astro pages read at build/SSR time via data.ts
                          ← Search.svelte fetches /data/index.json and
                             /data/countries.json at runtime, served by
                             Astro endpoints in src/pages/data/
```

The browser-side search is served by two Astro API route endpoints
(`src/pages/data/*.json.ts`) — **no symlink needed**. Only `index.json` and
`countries.json` are exposed publicly; individual contest JSONs remain server-side only.

---

## Design system

Aesthetic: **editorial / archival** — deep navy ground, gold winner accent,
cyan links, magenta CTAs, heart flags, generous whitespace. Inspired by the
official Eurovision website and museum catalogues.

```
/* Base neutrals */
--c-bg:                #05041a   deep navy-black background
--c-surface:           #0c0b28   cards, tables
--c-border:            #1e1e50   all dividers
--c-text:              #e8e8e8   body text
--c-muted:             #8a90c8   secondary text, labels
--c-hover:             #14143a   row/card hover

/* Semantic surface tints */
--c-surface-gold:      #1a1025   winner row bg
--c-surface-gold-hover:#241530   winner row hover
--c-surface-green:     #0a1020   qualified row bg
--c-surface-green-hover:#10142a  qualified row hover

/* Accent palette */
--c-gold:              #f0b429   winner highlights, badges, active states
--c-gold-dim:          #9a7018   borders of gold elements
--c-green:             #6abf69   qualified badge text
--c-cyan:              #00d4ff   raw cyan hue
--c-magenta:           #fd2494   nav logo, CTA links
--c-link:    var(--c-cyan)       all hyperlinks (change --c-cyan to retheme links)

--f-display:  alias for --f-mono (Geist Mono) → headings; no separate display font
--f-body:     Geist Sans        → body prose; variable woff2, self-hosted
--f-mono:     Geist Mono        → scores, codes, year numbers, labels, headings; variable woff2, self-hosted
```

**Token rules:**

- Never hardcode hex values in component or page styles — always use a token.
- `--c-link` is the single source of truth for hyperlink colour; it aliases `--c-cyan`.
- `--c-gold` is reserved for winner/score semantics. Navigation links use `--c-link`.
- `--c-magenta` is for the nav logo and primary CTAs only.
- Scores and year numbers always use `--f-mono`. Section labels use
  `font-family: var(--f-mono); text-transform: uppercase; letter-spacing: 0.1em`
  at small size — never bold headings for these.

**Flags:**

- All flags are `<img class="flag" src={countryFlagUrl(code)} alt="" />` — never emoji spans.
- `countryFlagUrl(code)` returns `/images/flags/{code}.svg` (or `.png` for `gb-wls`).
- Heart flag SVGs were downloaded from `https://www.eurovision.com/static/images/flags/flag_{code}.svg`
  using `npm run fetch:flags`. Defunct countries (Yugoslavia `yu`, Serbia & Montenegro `cs`) have SVGs.
  Wales (`gb-wls`) falls back to a flagcdn.com PNG as Eurovision.com doesn't carry it.
- The global `.flag` rule sets `display: inline-block; height: 1.2em; vertical-align: -0.15em; margin-right: 0.3em`
  so flags sit inline with text without the parent `<a>` underline bleeding under them.
- **Flags must always sit outside `<a>` tags in table cells** — flag inside the link causes
  an underline under the blank space between the image and the text. Pattern: `<img class="flag" ...><a class="country-link">Name</a>`.

---

## Key types (from src/lib/api/types.ts)

```typescript
ContestReference      // year, city, country, slogan, logoUrl, url
ContestDetail         // extends Reference + broadcasters, presenters, contestants[], rounds[]
Round                 // name (final|semifinal|semifinal1|semifinal2), date, performances[]
Performance           // contestantId, running, place, scores[]
Score                 // name (total|jury|public), points, votes: Record<CountryCode, number>
ContestantReference   // id, country, artist, song, url
ContestantDetail      // full detail: lyrics, bpm, tone, writers, jury, spokesperson, etc.
```

Derived/frontend types:
- `ContestantWithResults` — ContestantReference + performances array
- `ResolvedContest` — ContestDetail + contestantsById map + sorted results[]
- `ContestIndexEntry` — lightweight: year, city, winner, contestants[] (no scores)

---

## Commands

```bash
# Install
npm install

# Fetch all senior data (run once, or after each contest)
npm run fetch:data

# Download heart flags from eurovision.com → public/images/flags/ (safe to re-run)
npm run fetch:flags

# Download all contest logos to public/images/logos/{year}.png (safe to re-run)
npm run fetch:logos

# Also fetch per-contestant detail (lyrics, BPM, credits) for all years
# WARNING: ~1800 files, takes several minutes
npm run fetch:data -- --contestants

# Gap-fill a single year — WARNING: clobbers years.json and index.json
# with only that year's data. Prefer npm run fetch:data (full run) when possible.
npm run fetch:year -- 2026

# Dev server
npm run dev

# Build
npm run build
```

---

## What's built vs what's next

### ✅ Done
- `types.ts` — full typed schema
- `client.ts` — live API client with retry/concurrency
- `fetch-all.ts` — build-time data dump script, writes index.json
- `data.ts` — server-side read helpers; `CountryAppearance` includes `finalRunning`,
  `finalPlace`, `finalPoints`, `participatedInFinal`, `cancelled`;
  `getCountryName()` maps `WLD` → "Rest of the World";
  `ContestIndexEntry` includes `cancelled: boolean` (derived from all rounds having null performances)
- `utils.ts` — `countryFlagUrl()` (heart flag image URL from ISO code) + `ordinal(n)` returns
  the full string ("1st", "2nd", "3rd", "4th"…) — **not** just the suffix; all call sites use
  `ordinal(n)` alone, never `{n}{ordinal(n)}`, to avoid JSX whitespace bugs;
  `broadcasterLogoUrl(raw)` resolves a raw broadcaster string to its public logo path via
  `src/lib/broadcasters.ts`; `broadcasterLogoSquare(raw)` returns the square hint;
  `expandBroadcaster(raw)` returns the full display name;
  `resolveContestBroadcasterCodes(year, broadcasters)` returns raw broadcaster codes after
  applying year overrides (without name expansion) — use for logo lookups on the contest page
- `src/lib/broadcasters.ts` — single source of truth for broadcaster metadata; `BroadcasterEntry`
  has `full?` (display name), `logo?` (public asset path in `public/images/broadcasters/`),
  `logoSquare?: true` (aspect-ratio hint), and `logoRef?` (borrow logo from another entry —
  used for historical names that predate a rebrand, e.g. NTU → UA:PBC, TVCG → RTCG, CLT → RTL);
  historical aliases should set `full` to their own name and `logoRef` to the successor key —
  the successor's logo is displayed but the original name is shown in the UI;
  `BROADCASTER_ALIASES` in `utils.ts` handles API encoding quirks and full-name forms that
  don't match BROADCASTERS keys (e.g. `İTV → İctimai`, `SRG SSR idée suisse → SRG SSR`,
  `IPBC` is a BROADCASTERS entry with `logoRef: "KAN"` — rebranded to KAN in 2017)
- `Base.astro` — layout shell; nav logo "Eurovision DB" in `--c-magenta`; `title` prop is optional
  (omitting it renders just "Eurovision Database" with no separator); favicon links point to PNG
  variants and `site.webmanifest` for PWA support; SW registered inline with `is:inline` script
  (Astro's bundler can't process a `src="/registerSW.js"` reference — must be inlined)
- `global.css` — design tokens; Eurovision-inspired palette; `.flag` global rule for inline images;
  content links (td a, p a, footer) have always-visible underlines via `color-mix`;
  fonts self-hosted via `@font-face` from `/public/fonts/` (Geist Sans, Geist Mono — no Pixel font);
  `--f-display` is an alias for `--f-mono`; `html { overflow-x: hidden }` + `.table-scroll` utility
  (`overflow-x: auto`) prevent tables from stretching the viewport on mobile;
  ambient background spheres: `body::before` (cyan, top-right) and `body::after` (magenta, bottom-left)
  are solid `color-mix` circles with `filter: blur(200px+)` at `z-index: -3` — solid colour + blur
  avoids the `transparent` keyword (= `rgba(0,0,0,0)`) that caused gradient banding toward black;
  `html::after` is an SVG fractal-noise data-URI tile (`mix-blend-mode: soft-light; z-index: -2`)
  that dithers any residual banding; `base.footer` has `background: var(--c-bg)` so it sits
  over the ambient layer; `.badge--magenta` for cancelled-contest badges (dark tint bg, magenta text)
- `index.astro` — homepage: hero + recent winners grid; winner cards separated by real CSS borders
  (top+left on container, right+bottom on each card — no gap/background hack); `public/images/emblem.svg`
  as fixed watermark with `mix-blend-mode: overlay`; emblem fill is `#3065F5` (Eurovision blue);
  each card uses `flex-direction: column; justify-content: space-between` with `card-top` (flag + city + year)
  and `card-bottom` (winner song + score badge, or `badge--magenta` "Cancelled" for 2020)
- `contests.astro` — all editions table; columns: Year, Host, Winner, Winning song, Winning score,
  Entries; sortable by Year (default desc), Host country, Winner country, Winning score, Entries;
  table wrapped in `.table-scroll` for mobile; host city+country text is a link to the contest
  (flag stays outside the link); city and country rendered as `{city,}<span>{country}</span>`
  (comma inside first expression, space inside second) — no JSX whitespace nodes around the comma;
  winning song is muted and linked; Cancelled editions show a `badge badge--magenta` in the
  Winning Score column instead of a dash; the `.map()` spreads the full `ContestIndexEntry`
  (`...e`) and only adds derived fields on top — so `cancelled` and any future index fields flow
  through automatically without needing to be listed explicitly
- `countries.astro` — country listing with win/appearance stats; all columns sortable;
  default sort: alphabetical by country name; flag sits outside the country name `<a>` link
  so the underline doesn't bleed under the blank space between flag and text
- `contest/[year].astro` — full contest page: unified round tab group via ContestTabs;
  contest logo capped at `max-height: 175px; max-width: 240px` with `height: auto; width: auto`;
  cancelled editions show a selected-acts table (full `.results-table` styling from `global.css`)
  with song links to individual song pages (which do generate for cancelled years) and flags
  outside the `<a>` tag; table wrapped in `.table-scroll`;
  header meta: row 1 = broadcaster logo(s) + venue; row 2 = dates + hosted by + slogan;
  broadcaster items pre-computed in frontmatter (`broadcasterItems`) to avoid block-body arrow
  functions inside Astro JSX (language server trips on `const` declarations inside `.map()`);
  wide logos `1.25rem`, square logos `1.75rem`
- `country/[code].astro` — country history; sortable columns; Run column removed (not useful
  per-country); DNQ and Cancelled both use `<span class="badge badge--magenta">`; "Active years"
  stat shows actual consecutive participation ranges (not a simple A–B span), deduped to handle
  1956 two-songs-per-country correctly; two-line display kicks in when visible year-number
  count > 5; `splitForDisplay` includes the trailing comma **inside** the returned `yearsLine1`
  string — never in JSX — to prevent whitespace before the comma; single-line histories render
  at full stat size; Wins stat hidden when 0 (shows Best place ordinal instead, hidden if no
  final place known); Final column shows `—` (not "DNQ") for contestants who appeared in the
  final round but have no recorded place (1956); table wrapped in `.table-scroll` for mobile;
  song links are muted (`--c-muted`) with underline, turning cyan on hover (uses global `td a` rule,
  no local `text-decoration: none` override);
  broadcaster logo(s) rendered as last stat in the stats-row; `.stat` uses
  `justify-content: space-between` so labels align across mixed-height stat blocks; wide logos
  `1.35rem`, square logos `1.6rem` with `padding-top: 0.65rem` to align top edge with number cap height
- `Search.svelte` — live search island (queries /data/index.json and /data/countries.json);
  `listEl` declared with `$state()` for reactive binding; a11y `onkeydown` handler on result `<li>`
- `ScoreBreakdown.svelte` — interactive voter detail panel; `WLD` voter shown as
  "Rest of the World" with its heart flag (`/images/flags/wld.svg`); "Votes received by"
  label uses `--c-cyan`
- `ContestTabs.svelte` — unified tab group: SF1 → SF2 → Grand Final (default); all
  columns sortable (sort resets on tab switch); jury/tele columns appear automatically
  when data contains split scores (e.g. 2022, 2026); Draw column shows running order;
  ScoreBreakdown hidden for years with no score data (e.g. 1956); place numbers render
  in full text colour (only the trophy 🏆 uses `--c-gold` for 1st place);
  both SF and Final tables wrapped in `.table-scroll` for mobile; song cells have no
  `<em>` — `.song-cell a` is muted with underline (via global `td a` rule), turning cyan on hover;
  core table styles (`.results-table`, `.song-cell a`, `.country-link`) live in `global.css` —
  do not re-declare them locally in Svelte components or Astro pages
- ESC 2026 data — hand-crafted `src/data/contests/2026.json` with aggregate jury/tele
  totals; per-country vote breakdowns pending official API update; semi running order
  not yet available (shows `—`)
- `src/pages/data/index.json.ts` and `countries.json.ts` — Astro endpoints serving the
  two JSON files the browser needs; replaces the old `public/data` symlink
- PWA support — `@vite-pwa/astro` wired into `astro.config.mjs`; `registerType: "autoUpdate"`;
  Workbox pre-caches the app shell (JS/CSS bundles, woff2 fonts, heart flags, contest logos,
  favicon PNGs) plus key navigation pages (`/`, `/contests/`, `/countries/`) and the most recent
  4 contest years (contest page + all song pages) — years are derived dynamically at build time
  from `src/data/contests/` so the set rotates automatically each year (`PRECACHE_YEARS = 4`);
  all other HTML pages cache on first visit via a `NetworkFirst` runtime rule
  (`networkTimeoutSeconds: 5`); search JSON (`/data/index.json`, `/data/countries.json`) cached
  with `StaleWhileRevalidate` so search works offline; `devOptions.enabled: false` keeps the dev
  server clean — test PWA with `npm run build && npm run preview`; `manifest: false` because we
  supply our own `site.webmanifest`
- `public/site.webmanifest` — PWA manifest: name "Eurovision Database", standalone display,
  `theme_color: #000c54`, `background_color: #05041a`; icons: 192×192 and 512×512 PNG (maskable)
- `public/favicon.ico`, `public/favicon-96x96.png`, `public/favicon-192x192.png`,
  `public/favicon-512x512.png`, `public/apple-touch-icon.png` — multi-format favicon set;
  replaces the old `public/favicon.svg` emoji SVG
- `public/images/logos/{year}.png` — offline contest logos; `npm run fetch:logos` downloads all
- `public/images/flags/{code}.svg` — Eurovision heart flags; `npm run fetch:flags` downloads all
- `scripts/fetch-flags.ts` — downloads heart flags from eurovision.com with browser headers;
  falls back to flagcdn.com PNG for unsupported codes (gb-wls)
- Contest logo `<img>` on `[year].astro` uses local `/images/logos/{year}.png`; logos compressed
- `contest/[year].astro` — Venue meta row: host country and intended host country are linked to
  their `/country/{code}/` pages; `.meta-content a` white + dim underline at rest, `--c-link` on
  hover/focus; prev/next edition nav shows "City Year" (e.g. "← Turin 2022") using
  `getContestIndex()` to look up city at build time; falls back to "ESC Year" if city missing;
  `finalist.map()` reshape removed — `finalist` passed directly to `ContestTabs` after renaming
  `finalRunning` → `running` in the `results.map()`; `qualifiedToFinalIds` derived from `finalist`
  instead of re-filtering `results`; `cancelled` alias removed, `contest.cancelled` used directly
- `contest/[year]/song/[id].astro` — song detail page: hero with performance
  result pills (round label, "Draw #N" running order, place, pts, jury/tele split), YouTube embed, `LyricsTabs` island, sidebar
  with song metadata (BPM, key, members), credits (writers, stage director, backings,
  dancers, conductor), and broadcast info (broadcaster, spokesperson, commentators, jury);
  only generates static paths for songs that have a local detail file; URL id is 1-based
  (`contestantId + 1` in links; page subtracts 1 internally to load the JSON file);
  song nav below the header links to the same country's song in the previous/next year
  it appeared, including cancelled editions (cancelled ≠ country withdrew);
  typography: artist h1 uses `clamp(2rem, 5vw, 3rem)` (global min+slope, 3rem cap); song title
  uses exact global h2 values `clamp(1.4rem, 3vw, 2rem)` at `font-weight: 400` — subtitle reads
  lighter than heading (600) without introducing new scale numbers;
  page title format: `Artist - Song (Country Year)`; result pills: 1st-place ordinal rendered in `--c-gold` only for Grand Final (not semis); clicking a pill with vote data scrolls
  to `#votes-section` (90px offset for fixed header) and switches `VoteTabs` to the matching round
  via a `vote-round` CustomEvent on `window`; pills without vote data are inert;
  eyebrow links (country + edition) have dim underline at rest, full on hover;
  section headings use `--c-text` (white), not `--c-muted`;
  voting breakdown section after `.contestant-body`: `VoteTabs` island with per-round voter
  tables; defaults to Grand Final tab; tab bar always shown (even single-round songs) so the
  round name is always visible; only rounds with `votes` data are included (pre-split years show Total only)
- `LyricsTabs.svelte` — wrapping tab bar (flex-wrap) for original + translations + versions;
  tab label uses language name(s) (capitalised), type badge colour-coded gold/cyan/magenta;
  single-lyric songs skip the tab bar entirely; `\n\n` stanzas rendered as `<p>` with
  `white-space: pre-line` to preserve line breaks within stanzas
- `src/data/contestants/` — 1830 ContestantDetail JSON files covering all years (1956–2026),
  fetched with `npm run fetch:data -- --contestants`
- Data fix: `2026/21.json` (AT/Cosmó) and `2026/23.json` (LT/Lion Ceccah) were swapped due
  to an upstream API bug; contestant detail files corrected and `contestantId` references in
  `2026.json` rounds swapped accordingly (Austria final-only as host; Lithuania semi+final)
- Build fix: contestant page guards all nullable array fields (`dancers`, `backings`,
  `commentators`, `jury` etc.) with `toArr()` helper — API occasionally returns a bare string
  for single-value entries instead of a `string[]`
- `VideoPlayer.svelte` — video embed island used on `[id].astro`; accepts `videoUrls: string[]` and `title`; renders the active video as a 16:9 `aspect-ratio` iframe; shows a horizontally-scrollable thumbnail strip below when there are 2+ videos (YouTube `mqdefault.jpg` thumbnails, active highlighted with `--c-cyan` border); the parent grid column must have `min-width: 0` to prevent iframe overflow
- `VoteTabs.svelte` — per-song voter breakdown island used on `[id].astro`; accepts `rounds`
  (label + voters array) and `hasJuryTele`; tab bar always shown so the round name is visible
  even for single-round songs; listens to `vote-round` CustomEvent (dispatched by result pill
  clicks) to switch the active tab; voter rows sorted by total descending; jury/tele columns
  only shown when `hasJuryTele`
- `countries.astro` — countries table wrapped in `.table-scroll` for mobile horizontal scroll (same
  fix as contests and country-history tables); `padding-bottom` removed from local `.container` block
- `global.css` — `main { padding-bottom: 4rem }` is the single source of bottom spacing before the
  footer; removed redundant per-page declarations from `index.astro` (.recent), `contests.astro`
  (.container), `countries.astro` (.container), `country/[code].astro` (.container), and
  `song/[id].astro` (.votes-section)
- `SearchModal.svelte` — modal backdrop uses plain navy overlay (`color-mix` 85%); no
  `backdrop-filter: blur()` (removed — amplified pre-existing gradient dithering in the
  background spheres by re-sampling the composited pixel buffer); ⌘K / Ctrl+K global
  shortcut opens the modal (always-on `$effect`, `e.preventDefault()` to suppress browser
  defaults); `⌘K` kbd hint shown in trigger button, hidden on mobile; `modal-panel` has
  `tabindex="-1"` and an Escape `onkeydown` handler to satisfy Svelte a11y rules
- `LyricsTabs.svelte` — lyric content is stripped of HTML tags (`/<[^>]*>/g`) before
  splitting into stanzas; the upstream API embeds Font Awesome `<span>`/`<i>` markup
  in some translations (e.g. Czech lyrics for Israel 2023) that would otherwise render
  as literal text

### 🔲 Still to build

- Error/404 page
- Pagination or virtual scroll for the contests table (70+ rows is fine for now)
- **Semifinal + final score columns on country page** — `country/[code].astro` history
  table shows only the final result. Add SF place/points columns for years with semis.
  Extend `getCountryHistory()` to return `semifinalPlace` and `semifinalPoints`.
- Consider: voting bias charts (which countries always vote for each other)
- Consider: timeline view showing a country's placements across all years

### 🐛 Known issues / gotchas
- Svelte 5 uses runes (`$state`, `$derived`, `$effect`, `$props`) — do NOT
  use Svelte 4 reactive syntax (`$:`, `export let`).
- `data.ts` uses Node `fs` — only works in Astro server context (build/SSR),
  never import it from client-side code or Svelte components.
- 1956: each country sent two songs. `getCountryHistory` returns two entries for that year.
  `computeRanges` in `country/[code].astro` deduplicates years with `new Set` before
  computing ranges, so 1956 countries don't get a spurious "1956, 1956–..." display.
  The 1956 contest page shows all 14 performers with `—` for place/score (votes were
  never made public — only the winner is known).
- Cancelled editions (2020): `getCountryHistory` returns `cancelled: true` on the
  appearance; the country page renders a "Cancelled" badge instead of "DNQ".
- 1956 DNQ: `CountryAppearance.participatedInFinal` is `true` when a `finalPerf` entry
  exists in the data (even if `place` is null). The country page shows `—` for
  "participated but no place recorded" and "DNQ" only when `participatedInFinal` is false.
- `WLD` is a special voter code meaning "Rest of the World" (used in some scoring systems).
  `getCountryName('WLD')` returns "Rest of the World"; `public/images/flags/wld.svg` exists
  and is shown like any other voter flag in `ScoreBreakdown`.
- **JSX whitespace rule**: two separate JSX expressions on adjacent lines produce a text node
  (space) between them. Prevent this by: (a) using template literals or single expressions
  (`ordinal(n)` returns the full "1st" string, never `{n}{ordinal(n)}`); (b) moving punctuation
  into the data layer (`splitForDisplay` includes the trailing comma in `yearsLine1`).
- **Prettier** is installed (`prettier`, `prettier-plugin-astro`, `prettier-plugin-svelte`).
  Config in `.prettierrc` — uses tabs. Format-on-save works in VS Code. HTML comments inside
  JSX expressions (`{condition ? (<!-- comment --> <el>`) are invalid — use regular comments
  outside the JSX block or remove them.

---

## Fábio's context

- Freelance web developer based in Lippstadt, Germany
- Primary stack: WordPress, Astro, Svelte 5, Shopify, self-hosted via Coolify
- Preferred local dev: Local by Flywheel for WP; standard npm/node for this project
- This is a personal app, no public deployment required initially
- Preferred style: clean, typed TypeScript; no unnecessary abstractions
- The app should work fully offline after running the fetch script

---

*Last updated: 2026-05-26 (session 13).*
