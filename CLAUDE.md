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
- Coverage: Senior ESC 1956–2025, Junior ESC 2003–present
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
GET /api/junior/contests/...                          → same shape, junior prefix
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
│   └── fetch-logos.ts               ← downloads contest logos to public/images/logos/
├── public/
│   ├── favicon.svg                  ← 💙 emoji SVG favicon
│   ├── images/
│   │   └── logos/                   ← offline contest logos: {year}.png
│   └── data/                        ← symlink → ../src/data (Search runtime access)
└── src/
    ├── data/                        ← server-side JSON (read by Astro at build time)
    │   ├── countries.json
    │   ├── index.json               ← flattened search index (all contestants+winners)
    │   ├── years.json
    │   ├── contests.json
    │   └── contests/
    │       ├── 1956.json
    │       └── ... (1956–2026)
    ├── lib/
    │   ├── api/
    │   │   ├── types.ts             ← ALL TypeScript interfaces (source of truth)
    │   │   └── client.ts            ← typed fetch wrapper, retry logic, batch helpers
    │   ├── data.ts                  ← server-side read helpers (fs, not fetch)
    │   └── utils.ts                 ← countryFlag(), ordinal()
    ├── layouts/
    │   └── Base.astro               ← shell, nav, footer
    ├── styles/
    │   └── global.css               ← design tokens, reset, typography, utilities
    ├── components/
    │   ├── Search.svelte            ← client-side search island (fetches /data/index.json)
    │   ├── ScoreBreakdown.svelte    ← interactive vote detail (click country → voters)
    │   └── SemifinalsView.svelte    ← semifinal results tabs for contest page
    └── pages/
        ├── index.astro              ← homepage: hero + recent winners grid
        ├── contests.astro           ← all editions table
        ├── countries.astro          ← all countries with win/appearance stats
        ├── contest/
        │   └── [year].astro        ← full contest page: scoreboard + ScoreBreakdown
        └── country/
            └── [code].astro        ← country page: stats + full history table
```

---

## Data flow

```
fetch-all.ts → src/data/  ← Astro pages read at build/SSR time via data.ts
                          ← Search.svelte fetches /data/index.json at runtime
                             (needs public/data/ to be populated — see setup below)
```

**Important:** `src/data/` is for server-side Astro reads. The Search component
runs in the browser and fetches from `/data/...` (public folder). You need to
either symlink `public/data → src/data` or copy after fetching. The fetch script
currently writes to `src/data/` — add a copy/symlink step or adjust the script.

Recommended: add to `scripts/fetch-all.ts` or `package.json`:
```json
"postfetch:data": "cp -r src/data public/data"
```

---

## Design system

Aesthetic: **editorial / archival** — deep navy ground, gold winner accent,
cyan links, generous whitespace. Inspired by museum catalogues and score notation.

```
/* Base neutrals (all derived by fixed RGB deltas from --c-bg) */
--c-bg:                #030514   deep navy-black background
--c-surface:           #0A0E28   cards, tables
--c-border:            #1B234B   all dividers
--c-text:              #e8e8e8   body text
--c-muted:             #6070A8   secondary text, labels
--c-hover:             #11143D   row/card hover

/* Semantic surface tints */
--c-surface-gold:      #1B131B   winner row bg
--c-surface-gold-hover:#221B33   winner row hover
--c-surface-green:     #0A171D   qualified row bg
--c-surface-green-hover:#101E25  qualified row hover

/* Accent palette */
--c-gold:              #c9a84c   winner highlights, badges, active states
--c-gold-dim:          #8a6f2e   borders of gold elements
--c-green:             #6abf69   qualified badge text
--c-cyan:              #4daad5   raw cyan hue
--c-link:    var(--c-cyan)       all hyperlinks (change --c-cyan to retheme links)

--f-display:  DM Serif Display  → headings (h1–h4)
--f-body:     Inter             → body prose
--f-mono:     IBM Plex Mono     → scores, codes, year numbers, labels
```

**Token rules:**

- Never hardcode hex values in component or page styles — always use a token.
- `--c-link` is the single source of truth for hyperlink colour; it aliases `--c-cyan`.
- `--c-gold` is reserved for winner/score semantics. Navigation links use `--c-link`.
- Scores and year numbers always use `--f-mono`. Section labels use
  `font-family: var(--f-mono); text-transform: uppercase; letter-spacing: 0.1em`
  at small size — never bold headings for these.

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

# Fetch contestant detail (lyrics, BPM, jury names — large, optional)
npm run fetch:data:contestants

# Download all contest logos to public/images/logos/{year}.png (safe to re-run)
npm run fetch:logos

# Gap-fill a single year — WARNING: clobbers years.json, contests.json, index.json
# with only that year's data. Back up src/data/contests/{year}.json first,
# and prefer npm run fetch:data (full run) when possible.
npm run fetch:year -- 2026

# Recreate public/data symlink (if broken)
npm run sync:data

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
  `finalPlace`, `finalPoints`, `cancelled`
- `utils.ts` — `countryFlag()` (emoji flag from ISO code) + `ordinal()` suffix helper
- `Base.astro` — layout shell
- `global.css` — design tokens
- `index.astro` — homepage
- `contests.astro` — all editions table
- `countries.astro` — country listing with stats + emoji flags; all columns sortable
- `contest/[year].astro` — full contest page: unified round tab group via ContestTabs
- `country/[code].astro` — country history; sortable columns; "Cancelled" badge for 2020;
  Run column shows grand final draw number (null for DNQ)
- `Search.svelte` — live search island (queries /data/index.json)
- `ScoreBreakdown.svelte` — interactive voter detail panel
- `ContestTabs.svelte` — unified tab group: SF1 → SF2 → Grand Final (default); all
  columns sortable (sort resets on tab switch); jury/tele columns appear automatically
  when data contains split scores (e.g. 2022, 2026); Run column shows draw/lineup order;
  ScoreBreakdown hidden for years with no score data (e.g. 1956)
- ESC 2026 data — hand-crafted `src/data/contests/2026.json` with aggregate jury/tele
  totals; per-country vote breakdowns pending official API update; semi running order
  not yet available (shows `—`)
- `public/data` — symlink `public/data → ../src/data`; `npm run sync:data` recreates it
- `public/favicon.svg` — 💙 emoji SVG favicon
- `public/images/logos/{year}.png` — offline contest logos; `npm run fetch:logos` downloads all
- Contest logo `<img>` on `[year].astro` uses local `/images/logos/{year}.png` (not GitHub URL)
- `scripts/fetch-logos.ts` — downloads logos from EurovisionAPI GitHub dataset; skips existing files

### 🔲 Still to build
- Contestant detail page: `/contest/{year}/contestant/{id}` (lyrics, BPM, jury)
- Junior ESC pages (routes mirror senior, just swap type)
- Error/404 page
- Pagination or virtual scroll for the contests table (70 rows is fine for now)
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
- 1956: each country sent two songs. `getCountryHistory` handles this correctly (uses
  `.filter()` not `.find()`). The 1956 contest page shows all 14 performers with `—`
  for place/score (votes were never made public — only the winner is known).
- Cancelled editions (2020): `getCountryHistory` returns `cancelled: true` on the
  appearance; the country page renders a "Cancelled" badge instead of "DNQ".

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
