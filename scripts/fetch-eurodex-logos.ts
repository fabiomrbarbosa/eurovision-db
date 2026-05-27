#!/usr/bin/env node
/**
 * fetch-eurodex-logos.ts
 *
 * For each edition, fetches the Eurovision.com city-year page
 * (e.g. /eurovision-song-contest/rotterdam-2021/) and downloads the
 * .hero-logo <img> to public/images/logos/{year}.png.
 *
 * Existing files are skipped unless --force is passed.
 * Years where the page 404s or has no logo are reported for manual follow-up.
 *
 * Usage:
 *   npm run fetch:eurodex-logos
 *   npm run fetch:eurodex-logos -- --force
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTESTS_DIR = join(__dirname, "../src/data/contests");
const OUT_DIR = join(__dirname, "../public/images/logos");
const CONCURRENCY = 4;
const FORCE = process.argv.includes("--force");

const ESC_BASE = "https://www.eurovision.com/eurovision-song-contest";
const ESC_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.eurovision.com/",
};

function cityToSlug(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function extractHeroLogoSrc(html: string): string | null {
  // The logo is <img class="hero-logo …" src="…"> — class is on the img itself
  const tag = html.match(/<img\b[^>]*\bhero-logo\b[^>]*>/);
  if (tag) {
    const src = tag[0].match(/\bsrc="([^"]+)"/);
    if (src) return src[1];
  }
  // Fallback: first GCS rendition URL on the page
  const m = html.match(
    /(https:\/\/storage\.googleapis\.com\/eurovision-com\.appspot\.com\/renditions\/[^"'\s]+\.(?:png|jpg|webp))/,
  );
  return m ? m[1] : null;
}

interface ContestMeta {
  year: number;
  city: string | null;
}

async function main() {
  const files = readdirSync(CONTESTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const contests: ContestMeta[] = files.map((f) => {
    const d = JSON.parse(readFileSync(join(CONTESTS_DIR, f), "utf-8"));
    return { year: d.year as number, city: (d.city as string | null) ?? null };
  });

  console.log(`\n💙 Fetching Eurodex logos for ${contests.length} editions…\n`);
  mkdirSync(OUT_DIR, { recursive: true });

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < contests.length; i += CONCURRENCY) {
    const batch = contests.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async ({ year, city }) => {
        const dest = join(OUT_DIR, `${year}.png`);
        if (!FORCE && existsSync(dest)) {
          skipped++;
          return;
        }

        if (!city) {
          console.warn(`  ✗ ${year}: no city in data`);
          failed++;
          return;
        }

        const slug = cityToSlug(city);
        const pageUrl = `${ESC_BASE}/${slug}-${year}/`;

        try {
          const pageRes = await fetch(pageUrl, { headers: ESC_HEADERS });
          if (!pageRes.ok) {
            console.warn(`  ✗ ${year} (${city}): HTTP ${pageRes.status} — ${pageUrl}`);
            failed++;
            return;
          }

          const html = await pageRes.text();
          const logoUrl = extractHeroLogoSrc(html);

          if (!logoUrl) {
            console.warn(`  ✗ ${year} (${city}): no hero logo found`);
            failed++;
            return;
          }

          const imgRes = await fetch(logoUrl, { headers: ESC_HEADERS });
          if (!imgRes.ok) {
            console.warn(`  ✗ ${year}: image fetch HTTP ${imgRes.status}`);
            failed++;
            return;
          }

          const ext = logoUrl.split(".").pop()?.split("?")[0] ?? "png";
          const finalDest = ext === "png" ? dest : dest.replace(".png", `.${ext}`);
          writeFileSync(finalDest, Buffer.from(await imgRes.arrayBuffer()));
          done++;
          console.log(`  ✓ ${year}.${ext}  (${city})`);
        } catch (err) {
          failed++;
          console.warn(`  ✗ ${year}: ${(err as Error).message}`);
        }
      }),
    );
  }

  console.log(
    `\n✅ Done — ${done} downloaded, ${skipped} skipped, ${failed} failed`,
  );
  if (failed > 0) {
    console.log(
      "   Failed years may need slug overrides added to SLUG_OVERRIDES in the script.",
    );
  }
}

main().catch((err) => {
  console.error("\n❌", err);
  process.exit(1);
});
