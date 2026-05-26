# Eurovision Database — Developer Docs

A personal static web app for browsing Eurovision Song Contest history, 1956–present. Search by country, artist, song, or year. View full contest results with jury/televote breakdowns. Browse a country's full participation history.

**Stack:** Astro 4 (static site generator) · Svelte 5 (interactive components) · TypeScript · No backend.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Fetch the data (downloads JSON snapshots from EurovisionAPI)
npm run fetch:data

# 3. Also fetch per-song detail (lyrics, BPM, credits) — takes a few minutes
npm run fetch:data -- --contestants

# 4. Start the dev server
npm run dev

# 5. Build for production
npm run build
```

The app works fully offline after step 2–3, because all data is stored as local JSON files.

---

## Viewing these docs

These docs are served with [Docsify](https://docsify.js.org/) — a tool that turns Markdown files into a browsable website, with no build step.

```bash
npm run docs
```

Then open `http://localhost:3000` in your browser.

> Docsify loads markdown files directly in the browser via JavaScript. It needs a local server (not `file://`) because browsers block cross-origin file requests. `npm run docs` uses `npx serve` for this.

---

## What's in these docs

| File | What it covers |
|---|---|
| [architecture.md](architecture.md) | How Astro + Svelte work together; static output explained |
| [data-layer.md](data-layer.md) | Types, API client, build-time data reader, fetch scripts |
| [pages.md](pages.md) | Every Astro page: what it renders and what data it uses |
| [components.md](components.md) | Every Svelte component: what it does and how it's wired |
| [design-system.md](design-system.md) | CSS design tokens, typography, flag images |
| [pwa.md](pwa.md) | Service worker, offline support, caching strategy |
