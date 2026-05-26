# Data Layer

| File | Purpose | Runs in |
| --- | --- | --- |
| `src/lib/api/types.ts` | TypeScript type definitions | Compile-time only |
| `src/lib/api/client.ts` | HTTP client for EurovisionAPI | Fetch scripts only |
| `src/lib/data.ts` | Reads local JSON files from disk | Astro build time only |
| `src/lib/utils.ts` | Flag URLs, ordinal numbers | Both build and browser |

---

## `src/lib/api/types.ts`

Defines the shape of every piece of data in the app. TypeScript uses these at compile time to catch mismatches — they produce no runtime code.

**Key types:**

### `ContestDetail`

The full record for one contest year. Contains `year`, `city`, `country` (host country code), `arena`, a `contestants` array of `ContestantReference` (lightweight: id, country, artist, song), and a `rounds` array.

### `Round`

One round — a semi-final or the grand final. `name` is one of `"final"` | `"semifinal"` | `"semifinal1"` | `"semifinal2"`. `performances` is an array of `Performance` objects, or `null` for cancelled editions (2020).

### `Performance`

One country's result in one round. `contestantId` links to `ContestantReference.id`. `running` is the draw/running order position. `place` is the finishing rank, or `null` when no ranking was recorded (1956, cancelled editions). `scores` is an array of `Score`.

### `Score`

`name` is `"total"` (present for all years), `"jury"` or `"public"` (2016+ only). `votes` is a map of `{ countryCode: pointsGiven }` — the raw per-country breakdown used in ScoreBreakdown and VoteTabs.

### `ContestantDetail`

The full record for one song, fetched separately (requires `--contestants` flag). Contains lyrics, BPM, musical key, credits (writers, stage director, backing vocalists, dancers), broadcaster, spokesperson, jury members, and commentators.

### Derived types

These don't come from the API — they're assembled in `data.ts`:

- **`ContestantWithResults`** — a `ContestantReference` enriched with all round performances
- **`ResolvedContest`** — a `ContestDetail` plus a `contestantsById` lookup map and a sorted `results` array
- **`ContestIndexEntry`** — lightweight year summary: winner, contestant list, no scores. Used for the search index, the contests table, and the homepage grid.

---

## `src/lib/api/client.ts`

An HTTP client for `https://eurovisionapi.runasp.net`. **Used only by the fetch scripts** — never imported by pages or Svelte components, which read from local files via `data.ts` instead.

Features:

- Automatic retry with exponential backoff (up to 3 retries, starting at 500ms, doubling each attempt)
- Per-request 10-second timeout via `AbortController`
- No retry on 4xx errors — those are permanent failures (wrong URL, missing resource)
- Batched fetching with a concurrency cap to avoid overloading the free-tier API host

The exported object is `eurovisionApi` with methods: `.countries()`, `.years()`, `.contests()`, `.contest(year)`, `.contestant(year, id)`, `.allContests(concurrency)`, `.allContestants(year, concurrency)`.

The concurrency cap (default 4 for contests, 6 for contestants) matters because the API is hosted on a free ASP.NET instance. Firing 70 parallel requests would likely trigger rate limiting or crash it.

---

## `src/lib/data.ts`

The build-time data access layer. Reads from `src/data/` using Node's `fs` module.

**This file cannot be imported from Svelte components or any browser-side code.** It only works in Astro frontmatter and server-side endpoints, where Node.js APIs are available.

### `getCountries(): CountryMap`

Returns `{ "SE": "Sweden", "PT": "Portugal", ... }`. Cached in a module-level variable after the first call, so multiple pages reading it during a build don't re-read the file each time.

### `getCountryName(code, countries?): string`

Looks up a country code in the map. Handles `"WLD"` (Rest of the World — used as a voter code in some editions) as a special case. Falls back to the raw code string if not found.

### `getYears(): number[]`

Reads the filenames in `src/data/contests/` and returns them as sorted integers. Dynamic-route pages use this in `getStaticPaths()` to know which pages to generate.

### `getContestIndex(): ContestIndexEntry[]`

Returns a lightweight summary of every contest year, built by reading all individual contest files once. Cached after the first call. Used by the homepage winners grid, the contests table, the countries table, and the search index endpoint.

The `cancelled` flag is derived by checking whether every round has `performances === null`.

### `getContest(year): ContestDetail`

Reads `src/data/contests/{year}.json` directly. Not cached — called once per page during a build.

### `getResolvedContest(year): ResolvedContest`

Calls `getContest()` then builds three things on top of it:

1. A `contestantsById` map (`{ 0: {...}, 1: {...}, ... }`) for O(1) lookups when joining performances to contestants during rendering
2. A per-contestant performances array, merged across all rounds
3. A `results` array sorted by final placement, nulls last

Also adds a `cancelled` boolean.

### `getContestantDetail(year, id): ContestantDetail`

Reads `src/data/contestants/{year}/{id}.json`. Requires the `--contestants` fetch to have been run first.

### `getCountryHistory(countryCode): CountryAppearance[]`

Returns every appearance of one country across all years, sorted chronologically. For each entry it reads that year's full contest file to extract final placement, running order, and points. This reads one JSON file per year the country participated — acceptable because each country page is built once and never re-rendered.

The `CountryAppearance` type tracks `participatedInFinal` separately from `finalPlace`. The distinction matters for 1956, where contestants appeared in the final but no rankings were ever published — those show `—` rather than "DNQ" on the country page.

---

## `src/lib/utils.ts`

Two helpers safe to use anywhere — build time or browser.

### `countryFlagUrl(code): string`

Returns the path to a heart flag image. Almost all flags are SVG (`/images/flags/{code}.svg`). Wales (`gb-wls`) falls back to a PNG because Eurovision.com doesn't carry it. The fallback set is a `Set` for O(1) membership testing.

### `ordinal(n): string`

Returns the full ordinal string: `ordinal(1)` → `"1st"`, `ordinal(4)` → `"4th"`. Returns the number and suffix together so call sites can write `{ordinal(n)}` as a single expression. Writing `{n}{ordinal(n)}` separately would produce a JSX text node (a space) between the number and its suffix.

---

## `scripts/fetch-all.ts`

Run with `npm run fetch:data`. Downloads data from the API and writes it to `src/data/`.

**Order of operations:**

1. `countries.json` — the country code→name map
2. `contests/{year}.json` for each year — full contest detail including rounds and scores (fetched 4 at a time)
3. `contestants/{year}/{id}.json` — per-song detail for every contestant (~1830 files, fetched 6 at a time); only when `--contestants` flag is passed

**`CONTEST_PATCHES`** — a hardcoded corrections table applied after every fetch. The API has known data errors (e.g. `"Athen"` instead of `"Athens"` for 2006). Patches are applied as `{ ...detail, ...patch }` so they survive re-runs automatically.

**`--year N` flag** — fetches only one year's contest file. Use this to fill a gap without re-fetching everything. Note it only writes that year's contest file — not the full index.

### Why local JSON files?

The API is hobbyist-hosted on a free tier that occasionally goes down. If the build read from the API live, a server outage would break the build. Local snapshots decouple the build from API availability: fetch once, build any number of times independently.

---

## `src/pages/data/index.json.ts` and `countries.json.ts`

Astro **API endpoints** — files that export a `GET` function and return a `Response`. They serve the two JSON files that the browser-side search needs at runtime:

```text
/data/index.json      ContestIndexEntry[]  (search index)
/data/countries.json  CountryMap
```

Individual contest files are not exposed this way — they're too large and only needed at build time. Only the index and country map are sent to the browser.
