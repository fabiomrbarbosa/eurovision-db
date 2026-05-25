import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import AstroPWA from "@vite-pwa/astro";

export default defineConfig({
  integrations: [
    svelte(),
    AstroPWA({
      registerType: "autoUpdate",
      manifest: false, // we have our own site.webmanifest
      workbox: {
        // Pre-cache only the app shell: JS/CSS bundles, fonts, icons, flags, logos
        globPatterns: ["**/*.{js,css,woff2,ico}", "images/flags/*.{svg,png}", "images/logos/*.png", "*.png", "images/emblem.svg"],
        // Pages are too numerous (~1900) to pre-cache — cache on first visit instead
        runtimeCaching: [
          {
            // HTML pages: try network, fall back to cache
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "pages", networkTimeoutSeconds: 5 },
          },
          {
            // Search index JSON — stale-while-revalidate so search works offline
            urlPattern: /\/data\/(index|countries)\.json$/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "search-data" },
          },
        ],
      },
      devOptions: {
        enabled: false, // keep dev server clean; test PWA via `npm run build && npm run preview`
      },
    }),
  ],
  output: "static",
  trailingSlash: "always",
});
