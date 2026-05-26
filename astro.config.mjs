import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import AstroPWA from "@vite-pwa/astro";
import { readdirSync } from "fs";
import { join } from "path";

// Derive the most recent N contest years from the data directory at build time
const PRECACHE_YEARS = 4;
const recentYears = readdirSync(join(process.cwd(), "src/data/contests"))
  .map((f) => parseInt(f.replace(".json", ""), 10))
  .filter((y) => !isNaN(y))
  .sort((a, b) => a - b)
  .slice(-PRECACHE_YEARS);

const recentYearGlobs = recentYears.flatMap((year) => [
  `contest/${year}/index.html`,
  `contest/${year}/song/*/index.html`,
]);

export default defineConfig({
  integrations: [
    svelte(),
    AstroPWA({
      registerType: "autoUpdate",
      manifest: false,
      workbox: {
        globPatterns: [
          // App shell
          "**/*.{js,css,woff2,ico}",
          "images/flags/*.{svg,png}",
          "images/logos/*.png",
          "*.png",
          "images/emblem.svg",
          // Key navigation pages
          "index.html",
          "contests/index.html",
          "countries/index.html",
          // Most recent contest + song pages
          ...recentYearGlobs,
        ],
        runtimeCaching: [
          {
            // All other HTML pages: try network, fall back to cache on first visit
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "pages", networkTimeoutSeconds: 5 },
          },
          {
            // Search JSON: stale-while-revalidate so search works offline
            urlPattern: /\/data\/(index|countries)\.json$/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "search-data" },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  output: "static",
  trailingSlash: "always",
});
