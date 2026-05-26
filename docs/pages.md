# Pages

All Astro pages live in `src/pages/`. Each file maps to a URL or set of URLs. The `---` frontmatter block runs at build time; the HTML below it becomes the static output.

---

## `src/layouts/Base.astro`

Not a page — a **layout** that every page wraps itself in. Think of it as `header.php` + `footer.php` merged into one file with a `<slot />` where page content goes.

It provides:
- `<head>` with meta tags, favicon links, and PWA manifest
- Sticky nav header with logo ("Eurovision DB") and links to Contests and Countries
- A `SearchModal` island in the nav (the ⌘K button)
- A `<main>` with `<slot />` — this is where each page's content appears
- A footer with credit links

Props: `title` (optional) and `description`. If `title` is omitted, the page title is just "Eurovision Database". If provided, it becomes "Title · Eurovision Database".

The service worker is registered inline with `is:inline` to prevent Astro's bundler from processing it:
```html
<script is:inline>
  if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("/sw.js", { scope: "/" });
</script>
```

---

## `src/pages/index.astro` — Homepage

URL: `/`

**What it renders:** Hero section with tagline + search bar, and a grid of the 12 most recent contest winners.

**Data:** Calls `getContestIndex()` and `getCountries()`. The import is wrapped in a `try/catch` so the page renders gracefully if `src/data/` is empty (shows an "npm run fetch:data" prompt instead of crashing the build).

**Notable pattern — the winners grid:** Cards are arranged in a CSS Grid with `auto-fill` columns. Borders are achieved by putting the top+left borders on the *container* and the right+bottom borders on each *card*. This avoids double-borders between cells without using gaps or pseudo-elements.

**The emblem background:** A fixed `<div>` behind the page content showing `public/images/emblem.svg` with `mix-blend-mode: overlay`. This is purely decorative — it blends with the background without obscuring text.

---

## `src/pages/contests.astro` — All Editions Table

URL: `/contests/`

**What it renders:** A sortable table of all contest editions — Year, Host city, Winner, Winning song, Winning score, Entries.

**Data:** `getContestIndex()` + `getCountries()` for name resolution. The country code is kept alongside the resolved name so flag images can still use the original code.

**Sorting:** Implemented entirely client-side in a `<script>` block at the bottom of the file. Rows carry `data-year`, `data-host`, `data-winner`, `data-score`, `data-entries` attributes. The script reads these to sort without re-fetching data. Clicking a sorted header reverses direction; clicking a different header resets to that column's default direction. The active column header turns gold.

**Why client-side sort instead of a Svelte component?** The table is fully static HTML — there's nothing interactive beyond the sort. Adding a Svelte component for this would bundle extra JS and require hydration. A plain `<script>` block is lighter and keeps the data co-located with the template.

**Cancelled editions:** The `badge--magenta "Cancelled"` badge appears in the Winning score column for 2020. The `badge--gold` shows the winning score for all other years.

---

## `src/pages/countries.astro` — Countries List

URL: `/countries/`

**What it renders:** A sortable table of every country that has participated, with Wins, Appearances, and Last entry year.

**Data:** Builds a `statsMap` by iterating `getContestIndex()` — counts appearances per country, and separately counts wins from `entry.winner.country`.

**Sorting:** Same pattern as the contests table — `data-` attributes on rows, client-side `<script>` block.

**Default sort:** Alphabetical by country name (unlike the contests table which defaults to year descending). Wins sort descending when clicked; appearances and last entry also descending.

---

## `src/pages/contest/[year].astro` — Contest Detail Page

URL: `/contest/1956/`, `/contest/2026/`, etc.

**What it renders:** Full details for one contest year — header with host city, arena, dates, slogan, presenters, broadcasters, logo; prev/next edition navigation; and the results via `ContestTabs`.

**Static paths:** `getStaticPaths()` calls `getYears()` to get the list of years from the filenames in `src/data/contests/`.

**Prev/next navigation:** The nav shows "← Turin 2022" rather than just "← 2022". To get the city for an adjacent year, it calls `getContestIndex()` and looks up the city by year. The city lookup uses `?.city ?? null` with a fallback to "ESC" if the city is somehow missing.

**Date formatting:** The script reads dates from all round records, deduplicates them, and formats them intelligently:
- If all rounds are in the same month: "10, 12, 14 May 2026"
- If rounds span months: "6 May, 8 May, 10 June 2026"

This is done with `Intl.DateTimeFormat` (via `toLocaleDateString`) with `timeZone: "UTC"` so it doesn't shift based on the server's locale.

**Cancelled editions (2020):** Shows a "Contest cancelled" notice with a static table of the acts that had been selected. Song links still work even for cancelled editions — the contestant detail pages are generated for all years with data files.

**Data enrichment:** The raw `results` from `getResolvedContest()` are enriched with `countryName`, `inFinal`, `running`, `finalPlace`, `finalTotal`, `finalJury`, `finalTele`, `semiPlace`, and `qualifiedFromSemi`. This flattened structure is what `ContestTabs` receives as props — the Svelte component doesn't need to know about the internal data structure.

**Semi-final data:** Built from `contest.rounds` filtered to semi-final names, sorted by round order, then mapped to the shape `ContestTabs` expects. Each entry in a semi includes a `qualified` boolean derived from whether that contestant appears in the `finalist` array.

---

## `src/pages/country/[code].astro` — Country Page

URL: `/country/SE/`, `/country/PT/`, etc.

**Static paths:** Collects all country codes that appear in any contestant list across `getContestIndex()`. Uses a `Set` to deduplicate.

**What it renders:** Country header with flag, stats (wins or best place, appearances, active years), and a sortable history table.

**Active years display:** The raw year list is compressed into ranges using `computeRanges()` — so `[2000, 2001, 2002, 2004]` becomes `["2000–2002", "2004"]`. Long range lists are split across two lines using `splitForDisplay()`, which finds the approximate midpoint by character count and puts a comma at the end of the first line (inside the data, not in JSX, to avoid whitespace nodes before the comma).

**Stats: wins vs best place:** If the country has ever won, shows the win count (in gold). If not, shows their best final placement instead. The "Wins" stat is hidden when zero to avoid showing "0 Wins".

**History table — place column logic:**
- `finalPlace === 1` → 🏆 1st (gold)
- `finalPlace !== null` → ordinal (muted)
- `cancelled` → "Cancelled" badge (magenta)
- `participatedInFinal` but no place → `—` (1956 finals, where no rankings were published)
- `!participatedInFinal` → "DNQ" badge (magenta)

**Sorting:** Same client-side `data-*` pattern. Null values (empty strings in the data attributes) always sort last regardless of ascending/descending direction, handled by converting `""` to `Infinity`.

---

## `src/pages/contest/[year]/song/[id].astro` — Song Detail Page

URL: `/contest/2026/song/5/`, etc.

**URL ID:** The URL id is `contestantId + 1` (1-based). The page subtracts 1 internally to load `src/data/contestants/{year}/{id}.json`. This avoids a URL like `/song/0/` which looks wrong.

**Static paths:** Only generates pages for songs that have a corresponding detail file in `src/data/contestants/`. This means you must run `npm run fetch:data -- --contestants` first. If a file is missing, the path is simply omitted — no 404, the link from the contest table just won't go anywhere (though in practice all files are present).

**What it renders:**
- Header with artist name, song title, country/edition eyebrow links, and result pills
- Navigation bar linking to the same country's song in the previous and next year it appeared
- Main column: YouTube embed + lyrics (via `LyricsTabs`)
- Sidebar: song metadata (language, BPM, key, members), credits (writers, stage director, backings, dancers, conductor), broadcast info (broadcaster, spokesperson, commentators, national jury)
- Full-width voting breakdown section (via `VoteTabs`)

**Result pills:** One pill per round (semis + final). Each shows: round name, draw number, place, total points, jury/tele split (2016+). Clicking a pill that has vote data scrolls to the `#votes-section` and fires a `vote-round` CustomEvent on `window` to tell `VoteTabs` which tab to activate. Pills without vote data have no click handler (the `data-vote-idx` attribute is only set when the round has vote data).

**Country navigation:** `getCountryHistory(detail.country)` returns all of that country's appearances. The current entry is found by matching both `year` and `contestantId`. Prev/next are the adjacent entries in the chronologically sorted list. Cancelled editions are included in navigation (cancelled ≠ the country withdrew).

**`toArr()` helper:** The API occasionally returns a bare string instead of a `string[]` for single-value fields (e.g. `backings: "Jane Doe"` instead of `["Jane Doe"]`). The `toArr` function normalises this: `!v ? [] : Array.isArray(v) ? v : [v]`.

**Credits deduplication:** Writers, composers, and lyricists are merged with `new Set([...writers, ...composers, ...lyricists])` to avoid showing the same name multiple times.

---

## `src/pages/data/index.json.ts` and `countries.json.ts`

URL: `/data/index.json` and `/data/countries.json`

These are Astro **API endpoints** — server-side functions that return `Response` objects. They exist so the browser-side search component can fetch the data it needs at runtime without the full contest files being publicly accessible.

`index.json.ts` calls `getContestIndex()` and serialises the result. `countries.json.ts` calls `getCountries()`. Both add a `Cache-Control: public, max-age=3600` header so the browser and service worker cache them efficiently.
