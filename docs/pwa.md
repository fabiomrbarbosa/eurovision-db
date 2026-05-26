# PWA and Offline Support

The app is a **Progressive Web App (PWA)** — it can be installed on a phone or desktop, and works without internet after the first visit.

---

## What makes it a PWA

Three things are required:

1. **A web manifest** (`public/site.webmanifest`) — tells the browser the app's name, icons, and display mode. The app uses `"display": "standalone"` so it opens without browser chrome when installed.

2. **A service worker** (`/sw.js`) — a background script that intercepts network requests and serves cached responses. Generated automatically at build time by `@vite-pwa/astro` (configured in `astro.config.mjs`).

3. **HTTPS** (or localhost) — required for service workers to register. Handled by the hosting environment.

The service worker is registered inline in `Base.astro`:
```html
<script is:inline>
  if ("serviceWorker" in navigator)
    navigator.serviceWorker.register("/sw.js", { scope: "/" });
</script>
```
`is:inline` prevents Astro from bundling this script — service worker registration must happen in an inline script or a plain `src=` reference, not a bundled module.

---

## Caching strategy

Configured in `astro.config.mjs` via the `workbox` option. There are two types of caching:

### Pre-cache (at install time)

These files are downloaded and cached when the service worker first installs:

| Pattern | What it includes |
|---|---|
| `**/*.{js,css,woff2,ico}` | All bundled JS/CSS, fonts, favicon |
| `images/flags/*.{svg,png}` | All ~50 heart flag images |
| `images/logos/*.png` | All contest logo images |
| `*.png` | Favicon PNGs |
| `images/emblem.svg` | Background emblem |
| `index.html` | Homepage |
| `contests/index.html` | All editions page |
| `countries/index.html` | Countries page |
| Recent 4 contest + song pages | See below |

### Recent contest pages

`astro.config.mjs` reads `src/data/contests/` at build time to find the most recent 4 years:

```js
const PRECACHE_YEARS = 4;
const recentYears = readdirSync(join(process.cwd(), "src/data/contests"))
  .map(f => parseInt(f.replace(".json", ""), 10))
  .filter(y => !isNaN(y))
  .sort((a, b) => a - b)
  .slice(-PRECACHE_YEARS);
```

This generates glob patterns like:
```
contest/2023/index.html
contest/2023/song/*/index.html
contest/2024/index.html
...
```

**Why 4 years?** The most recent contests are what users are most likely to want offline. Pre-caching every year (70+ editions × ~40 songs each = 2800+ pages) would be too much. The set rotates automatically — when 2027 data is added, 2023 falls out of the pre-cache.

### Runtime caching

For resources not in the pre-cache, two rules apply:

| Pattern | Strategy | What it covers |
|---|---|---|
| `navigate` requests | NetworkFirst (5s timeout) | All other HTML pages |
| `/data/(index\|countries).json` | StaleWhileRevalidate | Search JSON files |

**NetworkFirst** means: try the network, fall back to cache if offline or network takes > 5 seconds. This way older contest pages load correctly after being visited once, even offline.

**StaleWhileRevalidate** means: serve the cached version immediately, then update the cache in the background. This keeps search working offline while ensuring the index stays fresh after new data is fetched.

---

## Update behaviour

`registerType: "autoUpdate"` — when a new version of the service worker is detected, it activates automatically without asking the user. On the next page load the user sees the updated app.

---

## Testing offline

The dev server (`npm run dev`) does **not** run the service worker (`devOptions.enabled: false` in `astro.config.mjs`). To test offline behaviour:

```bash
npm run build
npm run preview
```

Then open DevTools → Application → Service Workers, and check "Offline". The pre-cached pages should load without a network connection.

---

## `public/site.webmanifest`

The PWA manifest. Key fields:

```json
{
  "name": "Eurovision Database",
  "short_name": "Eurovision DB",
  "display": "standalone",
  "theme_color": "#000c54",
  "background_color": "#05041a"
}
```

`background_color` matches `--c-bg` so the splash screen while loading matches the app background. Icons: 192×192 and 512×512 PNG (maskable).

The `manifest: false` option in `astro.config.mjs` prevents `@vite-pwa/astro` from generating its own manifest — we supply our own.
