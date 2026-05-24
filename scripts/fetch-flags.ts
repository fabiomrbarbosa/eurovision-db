#!/usr/bin/env node
/**
 * fetch-flags.ts
 *
 * Downloads heart-flag SVGs from the Eurovision website for every country
 * in src/data/countries.json and saves them to public/images/flags/{code}.svg.
 *
 * For any country the Eurovision site doesn't cover (e.g. gb-wls), falls
 * back to a flagcdn.com PNG saved as {code}.png.
 *
 * Skips files that already exist. Safe to re-run incrementally.
 *
 * Usage:
 *   npm run fetch:flags
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COUNTRIES_JSON = join(__dirname, "../src/data/countries.json");
const OUT_DIR = join(__dirname, "../public/images/flags");
const CONCURRENCY = 6;

const ESC_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://www.eurovision.com/",
};

async function tryFetch(
  url: string,
  headers: Record<string, string> = {},
): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function main() {
  if (!existsSync(COUNTRIES_JSON)) {
    console.error(
      "src/data/countries.json not found — run npm run fetch:data first.",
    );
    process.exit(1);
  }

  const countries: Record<string, string> = JSON.parse(
    readFileSync(COUNTRIES_JSON, "utf-8"),
  );

  const codes = Object.keys(countries);
  console.log(`\n💙 Fetching flags for ${codes.length} countries…\n`);

  mkdirSync(OUT_DIR, { recursive: true });

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < codes.length; i += CONCURRENCY) {
    const batch = codes.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (code) => {
        const lower = code.toLowerCase();
        const svgDest = join(OUT_DIR, `${lower}.svg`);
        const pngDest = join(OUT_DIR, `${lower}.png`);

        if (existsSync(svgDest) || existsSync(pngDest)) {
          skipped++;
          return;
        }

        // Try Eurovision heart flag SVG first
        const svgBuf = await tryFetch(
          `https://www.eurovision.com/static/images/flags/flag_${lower}.svg`,
          ESC_HEADERS,
        );
        if (svgBuf) {
          writeFileSync(svgDest, svgBuf);
          done++;
          console.log(`  ✓ ${lower}.svg`);
          return;
        }

        // Fallback: flagcdn PNG (covers regional codes like gb-wls)
        const pngBuf = await tryFetch(
          `https://flagcdn.com/48x36/${lower}.png`,
        );
        if (pngBuf) {
          writeFileSync(pngDest, pngBuf);
          done++;
          console.log(`  ✓ ${lower}.png  (flagcdn fallback)`);
          return;
        }

        failed++;
        console.warn(`  ✗ ${code} (${countries[code]}): no flag found`);
      }),
    );
  }

  console.log(
    `\n✅ Done — ${done} downloaded, ${skipped} skipped, ${failed} failed`,
  );
  console.log(`   Flags saved to public/images/flags/`);
}

main().catch((err) => {
  console.error("\n❌", err);
  process.exit(1);
});
