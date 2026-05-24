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
  — hand-crafted `src/data/contests/2026.json` exists with aggregate jury/tele
  totals (cross-checked from EurovisionWorld, ESCCovers, ESC Insight, Eurovoix).
  Per-country vote breakdowns are **not yet available** (stored as empty objects).
  Replace with official data once the API dataset updates: `npm run fetch:year -- 2026`.
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
    │   ├── index.json               ← flattened search index (all contestants+winners)
    │   ├── years.json
    │   └── contests/
    │       ├── 1956.json
    │       └── ... (1956–2026)
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
    │   └── ContestTabs.svelte       ← SF1/SF2/Final tab group for contest page
    └── pages/
        ├── index.astro              ← homepage: hero + recent winners grid
        ├── contests.astro           ← all editions table
        ├── countries.astro          ← all countries with win/appearance stats
        ├── data/
        │   ├── index.json.ts        ← Astro endpoint: serves src/data/index.json
        │   └── countries.json.ts    ← Astro endpoint: serves src/data/countries.json
        ├── contest/
        │   └── [year].astro        ← full contest page: scoreboard + ScoreBreakdown
        └── country/
            └── [code].astro        ← country page: stats + full history table
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
--c-magenta:           #de3268   nav logo, CTA links
--c-link:    var(--c-cyan)       all hyperlinks (change --c-cyan to retheme links)

--f-display:  DM Serif Display  → headings (h1–h4)
--f-body:     Inter             → body prose
--f-mono:     IBM Plex Mono     → scores, codes, year numbers, labels
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
- The global `.flag` rule sets `display: inline-block; height: 1.2em; vertical-align: -0.15em`
  so flags sit inline with text without the parent `<a>` underline bleeding under them.

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
  `finalPlace`, `finalPoints`, `cancelled`; `getCountryName()` maps `WLD` → "Rest of the World"
- `utils.ts` — `countryFlagUrl()` (heart flag image URL from ISO code) + `ordinal()` suffix helper
- `Base.astro` — layout shell; nav logo in `--c-magenta`
- `global.css` — design tokens; Eurovision-inspired palette; `.flag` global rule for inline images;
  content links (td a, p a, footer) have always-visible underlines via `color-mix`
- `index.astro` — homepage: hero + recent winners grid; `public/images/emblem.svg` as
  fixed `cover` background watermark at low opacity
- `contests.astro` — all editions table
- `countries.astro` — country listing with win/appearance stats; all columns sortable
- `contest/[year].astro` — full contest page: unified round tab group via ContestTabs
- `country/[code].astro` — country history; sortable columns; "Cancelled" badge for 2020;
  Run column shows grand final draw number (null for DNQ); "Active years" stat shows
  actual consecutive participation ranges (not a simple A–B span), deduped to handle
  1956 two-songs-per-country correctly; balanced two-line display for fragmented histories
- `Search.svelte` — live search island (queries /data/index.json and /data/countries.json)
- `ScoreBreakdown.svelte` — interactive voter detail panel; `WLD` voter shown as
  "Rest of the World" with no flag
- `ContestTabs.svelte` — unified tab group: SF1 → SF2 → Grand Final (default); all
  columns sortable (sort resets on tab switch); jury/tele columns appear automatically
  when data contains split scores (e.g. 2022, 2026); Run column shows draw/lineup order;
  ScoreBreakdown hidden for years with no score data (e.g. 1956)
- ESC 2026 data — hand-crafted `src/data/contests/2026.json` with aggregate jury/tele
  totals; per-country vote breakdowns pending official API update; semi running order
  not yet available (shows `—`)
- `src/pages/data/index.json.ts` and `countries.json.ts` — Astro endpoints serving the
  two JSON files the browser needs; replaces the old `public/data` symlink
- `public/favicon.svg` — 🩷 emoji SVG favicon
- `public/images/logos/{year}.png` — offline contest logos; `npm run fetch:logos` downloads all
- `public/images/flags/{code}.svg` — Eurovision heart flags; `npm run fetch:flags` downloads all
- `scripts/fetch-flags.ts` — downloads heart flags from eurovision.com with browser headers;
  falls back to flagcdn.com PNG for unsupported codes (gb-wls)
- Contest logo `<img>` on `[year].astro` uses local `/images/logos/{year}.png`

### 🔲 Still to build
- Contestant detail page: `/contest/{year}/contestant/{id}` (lyrics, BPM, jury)
- Error/404 page
- Pagination or virtual scroll for the contests table (70+ rows is fine for now)
- Per-country vote breakdowns for 2026 — run `npm run fetch:year -- 2026` once API updates
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
- `WLD` is a special voter code meaning "Rest of the World" (used in some scoring systems).
  `getCountryName('WLD')` returns "Rest of the World"; `ScoreBreakdown` suppresses the
  flag image for that row.

---

## Fábio's context

- Freelance web developer based in Lippstadt, Germany
- Primary stack: WordPress, Astro, Svelte 5, Shopify, self-hosted via Coolify
- Preferred local dev: Local by Flywheel for WP; standard npm/node for this project
- This is a personal app, no public deployment required initially
- Preferred style: clean, typed TypeScript; no unnecessary abstractions
- The app should work fully offline after running the fetch script

---

*Last updated: 2026-05-24.*
