# Architecture

## The big picture

The app is a **static site** — `npm run build` produces a folder of plain `.html`, `.css`, and `.js` files that can be served from any host without a server process. There is no database, no runtime server, and no API calls from the browser to a backend.

Data lives in local JSON files (`src/data/`), fetched once from EurovisionAPI by running `npm run fetch:data`. The build reads those files and bakes the data directly into the HTML. After a build, the app works fully offline.

---

## Astro

Astro handles the build. It reads files in `src/pages/` and turns each one into a URL.

```text
src/pages/index.astro          →  /
src/pages/contests.astro       →  /contests/
src/pages/contest/[year].astro →  /contest/1956/, /contest/1957/, ...
```

`[year]` in the filename is a **dynamic route**. Astro calls `getStaticPaths()` inside the file to get the full list of valid values, then generates one HTML file per value at build time.

### The frontmatter block

Every `.astro` file starts with a `---` fenced block called the **frontmatter**. Code here runs once, at build time, in Node.js — not in the browser:

```astro
---
// Runs at build time in Node
import { getContestIndex } from "../lib/data.ts";
const contests = getContestIndex(); // reads local JSON files
---

<!-- HTML template — receives the data above -->
<ul>
  {contests.map(c => <li>{c.year} — {c.city}</li>)}
</ul>
```

The frontmatter feeds data into the HTML template below it. Only the resulting HTML is sent to the browser — no JS from the frontmatter, no raw data, just markup.

### Static paths

Pages with dynamic routes must export `getStaticPaths()`:

```ts
export function getStaticPaths() {
  const years = getYears(); // reads filenames from src/data/contests/
  return years.map(year => ({ params: { year: String(year) } }));
}
```

Astro calls this once and uses the returned array to know which pages to build. There is no "catch-all at runtime" — every valid URL must be declared at build time.

---

## Svelte

Svelte handles interactivity. Components in `src/components/` are **islands** — small pieces of the page that run JavaScript in the browser. Everything else in the page is static HTML with no JS attached.

A component is only activated in the browser when given a `client:` directive:

```astro
<!-- Renders to static HTML only — no JS in browser -->
<ContestTabs />

<!-- Renders to HTML AND hydrates in the browser -->
<ContestTabs client:load />
```

`client:load` means "send the component's JS bundle to the browser and activate it as soon as the page loads".

### Svelte 5 runes

This app uses Svelte 5, which uses **runes** — `$`-prefixed declarations that replace Svelte 4's reactive syntax:

| What you want | How to write it |
| --- | --- |
| Reactive state | `let count = $state(0)` |
| Derived value (single expression) | `const doubled = $derived(count * 2)` |
| Derived value (multi-statement) | `const result = $derived.by(() => { ... })` |
| Side effect when state changes | `$effect(() => { ... })` |
| Component props | `let { name, year } = $props()` |

`$derived.by(() => {...})` is the form to use when computing a derived value requires more than one line — a loop, a conditional, etc.

---

## Data flow

```text
EurovisionAPI (remote)
       ↓  npm run fetch:data  (run manually, once per new contest)
  src/data/*.json             (local snapshots — source of truth)
       ↓  Astro build reads via data.ts
  Built HTML in dist/         (static output, ready to deploy)
       ↓  Browser loads page
  Svelte islands hydrate      (interactive components activate)
       ↓  client-side fetch
  /data/index.json            (Astro endpoint, powers the search)
```

The browser never calls EurovisionAPI directly. All data is pre-fetched and embedded into the static output at build time.

---

## File layout

```text
src/
  lib/          ← shared logic: types, data access, utilities
  layouts/      ← page shell: nav, footer, <head> tags
  styles/       ← global CSS and design tokens
  components/   ← Svelte interactive components
  pages/        ← Astro pages (each file = one or more URLs)
    data/       ← Astro endpoints (JSON served to the browser)
scripts/        ← CLI tools: data fetching, flag and logo downloads
public/         ← files served as-is: images, fonts, favicon, manifest
docs/           ← these docs
```

---

## Build output

`npm run build` writes everything to `dist/`. To preview it locally: `npm run preview`. To deploy: copy `dist/` to any static host.

The service worker (`/sw.js`) is generated automatically by `@vite-pwa/astro` from the config in `astro.config.mjs`, and pre-caches the app shell and recent contest pages for offline use. See [pwa.md](pwa.md).
