#!/usr/bin/env node
/**
 * fetch-logos.ts
 *
 * Downloads all contest logos from the EurovisionAPI GitHub dataset and saves
 * them to public/images/logos/senior/{year}.png for offline use.
 *
 * Skips files that already exist. Safe to re-run incrementally.
 *
 * Usage:
 *   npm run fetch:logos
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTESTS_JSON = join(__dirname, "../src/data/contests.json");
const OUT_DIR = join(__dirname, "../public/images/logos");
const CONCURRENCY = 6;

type ContestRef = { year: number; logoUrl: string | null };

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!existsSync(CONTESTS_JSON)) {
    console.error("src/data/contests.json not found — run npm run fetch:data first.");
    process.exit(1);
  }

  const contests: ContestRef[] = JSON.parse(
    (await import("fs")).readFileSync(CONTESTS_JSON, "utf-8"),
  );

  const withLogos = contests.filter((c) => c.logoUrl);
  console.log(`\n💙 Fetching ${withLogos.length} contest logos…\n`);

  mkdirSync(OUT_DIR, { recursive: true });

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < withLogos.length; i += CONCURRENCY) {
    const batch = withLogos.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async ({ year, logoUrl }) => {
        const dest = join(OUT_DIR, `${year}.png`);
        if (existsSync(dest)) {
          skipped++;
          return;
        }
        try {
          const buf = await fetchBuffer(logoUrl!);
          writeFileSync(dest, buf);
          done++;
          console.log(`  ✓ ${year}.png`);
        } catch (err) {
          failed++;
          console.warn(`  ✗ ${year}: ${(err as Error).message}`);
        }
      }),
    );
  }

  console.log(`\n✅ Done — ${done} downloaded, ${skipped} skipped, ${failed} failed`);
  console.log(`   Logos saved to public/images/logos/`);
}

main().catch((err) => {
  console.error("\n❌", err);
  process.exit(1);
});
