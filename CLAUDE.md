# Eurovision Archive — Project Brief for Claude Code

This file is the persistent memory and briefing for AI-assisted development.
Read it at the start of every session before touching any code.

---

## What this project is

A personal static web app for browsing Eurovision Song Contest history.
Search by country, artist, song title, or year. View full contest results
including jury/televote breakdown. Browse a country's full participation history.

**Stack:** Astro 4 (static output) + Svelte 5 (interactive islands) + TypeScript.
No backend. No database. Data lives as local JSON files fetched at build time.

---

## Data source

**EurovisionAPI** — `https://eurovisionapi.runasp.net`
- Maintained by the EurovisionAPI org (formerly josago97)
- Dataset repo: `https://github.com/EurovisionAPI/dataset`
- Coverage: Senior ESC 1956–2025, Junior ESC 2003–present
- **Missing: ESC 2026** (Vienna, Bulgaria won with "Bangaranga" by Dara, 516 pts)
  — the dataset maintainer is expected to update soon after the May 2026 final.
  Gap-fill with: `npm run fetch:year 2026` once it lands.
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
│   └── fetch-all.ts                 ← build-time data fetch script
├── public/
│   └── data/                        ← symlink or copy of src/data/ for client JS
│       ├── countries.json
│       └── senior/
│           ├── index.json           ← flattened search index (all contestants+winners)
│           ├── years.json
│           ├── contests.json
│           └── contests/
│               ├── 1956.json
│               └── ...
└── src/
    ├── data/                        ← server-side JSON (read by Astro at build time)
    │   ├── countries.json
    │   ├── senior/
    │   │   ├── index.json
    │   │   ├── years.json
    │   │   ├── contests.json
    │   │   └── contests/{year}.json
    │   └── junior/
    │       └── (same structure)
    ├── lib/
    │   ├── api/
    │   │   ├── types.ts             ← ALL TypeScript interfaces (source of truth)
    │   │   └── client.ts            ← typed fetch wrapper, retry logic, batch helpers
    │   └── data.ts                  ← server-side read helpers (fs, not fetch)
    ├── layouts/
    │   └── Base.astro               ← shell, nav, footer
    ├── styles/
    │   └── global.css               ← design tokens, reset, typography, utilities
    ├── components/
    │   ├── Search.svelte            ← client-side search island (fetches index.json)
    │   └── ScoreBreakdown.svelte    ← interactive vote detail (click country → voters)
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
                          ← Search.svelte fetches /data/senior/index.json at runtime
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

Aesthetic: **editorial / archival** — dark ground, restrained gold accent,
generous whitespace. Inspired by museum catalogues and score notation.

```
--c-bg:       #0d0d0d      dark background
--c-surface:  #161616      cards, tables
--c-border:   #2a2a2a      all dividers
--c-text:     #e8e8e8      body text
--c-muted:    #666666      secondary text, labels
--c-gold:     #c9a84c      accent — winners, active state, year links
--c-gold-dim: #8a6f2e      borders of gold-accented elements

--f-display:  Playfair Display   → headings (h1–h4)
--f-body:     Inter              → body prose
--f-mono:     IBM Plex Mono      → scores, codes, year numbers, labels
```

Rule: scores and year numbers always use `--f-mono`. Section labels use
`font-family: var(--f-mono); text-transform: uppercase; letter-spacing: 0.1em`
at small size — never use bold headings for these.

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

# Fetch junior data
npm run fetch:data:junior

# Fetch contestant detail (lyrics, BPM, jury names — large, optional)
npm run fetch:data:contestants

# Gap-fill a single year
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
- `data.ts` — server-side read helpers (getResolvedContest, search, getCountryHistory)
- `Base.astro` — layout shell
- `global.css` — design tokens
- `index.astro` — homepage
- `contests.astro` — all editions table
- `countries.astro` — country listing with stats
- `contest/[year].astro` — full scoreboard page
- `country/[code].astro` — country history page
- `Search.svelte` — live search island (queries /data/senior/index.json)
- `ScoreBreakdown.svelte` — interactive voter detail panel

### 🔲 Still to build
- `public/data` setup (symlink or copy step after fetch)
- Contestant detail page: `/contest/{year}/contestant/{id}` (lyrics, BPM, jury)
- Junior ESC pages (routes mirror senior, just swap type)
- `ordinal()` helper currently duplicated in country page — move to `src/lib/utils.ts`
- Error/404 page
- Pagination or virtual scroll for the contests table (70 rows is fine for now)
- `--year 2026` gap-fill once the API dataset updates
- Consider: voting bias charts (which countries always vote for each other)
- Consider: timeline view showing a country's placements across all years

### 🐛 Known issues / gotchas
- `ordinal()` in `country/[code].astro` is in a `<script>` tag but called in
  the template — it should be moved to the frontmatter or a utils file since
  Astro component scripts don't expose functions to the template that way.
  Fix: define `function ordinal(n: number)` in the `---` frontmatter.
- The Search component fetches `/data/senior/index.json` — this path only
  works if `public/data/` is set up. Add the copy step to package.json.
- `data.ts` uses `import.meta.url` + Node `fs` — only works in Astro
  server context (SSR or build time), not in client bundles.
- Svelte 5 uses runes (`$state`, `$derived`, `$effect`, `$props`) — do NOT
  use Svelte 4 reactive syntax (`$:`, `export let`).

---

## Fábio's context

- Freelance web developer based in Lippstadt, Germany
- Primary stack: WordPress, Astro, Svelte 5, Shopify, self-hosted via Coolify
- Preferred local dev: Local by Flywheel for WP; standard npm/node for this project
- This is a personal app, no public deployment required initially
- Preferred style: clean, typed TypeScript; no unnecessary abstractions
- The app should work fully offline after running the fetch script

---

*Last updated: May 2026. Written for handoff to Claude Code.*
