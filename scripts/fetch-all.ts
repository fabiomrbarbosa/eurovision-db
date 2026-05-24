#!/usr/bin/env node
/**
 * fetch-all.ts
 *
 * Build-time data fetching script. Run this to populate src/data/ with
 * local JSON snapshots of the Eurovision API so the app works fully offline.
 *
 * Usage:
 *   npx tsx scripts/fetch-all.ts
 *   npx tsx scripts/fetch-all.ts --year 2025
 *   npx tsx scripts/fetch-all.ts --contestants   (also fetch per-contestant detail)
 *
 * Output structure:
 *   src/data/
 *     countries.json
 *     years.json
 *     contests.json          ← all ContestReference[]
 *     contests/
 *       1956.json            ← ContestDetail (includes rounds + scores)
 *       1957.json
 *       ...
 *     contestants/
 *       2025/
 *         0.json             ← ContestantDetail (optional, --contestants flag)
 *         1.json
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { eurovisionApi } from "../src/lib/api/client.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../src/data");

const args = process.argv.slice(2);
const YEAR_FILTER = args.includes("--year")
  ? parseInt(args[args.indexOf("--year") + 1], 10)
  : null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeJson(filePath: string, data: unknown) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  const kb = (JSON.stringify(data).length / 1024).toFixed(1);
  console.log(`  ✓ ${filePath.replace(DATA_DIR, "src/data")} (${kb} kB)`);
}

function log(msg: string) {
  console.log(`\n${msg}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n🎵 Eurovision data fetch`);
  if (YEAR_FILTER) console.log(`   Filtering to year: ${YEAR_FILTER}`);

  ensureDir(DATA_DIR);

  // 1. Countries
  log("Fetching countries...");
  const countries = await eurovisionApi.countries();
  writeJson(join(DATA_DIR, "countries.json"), countries);

  // 2. Years
  log("Fetching years...");
  const years = await eurovisionApi.years("senior");
  const filteredYears = YEAR_FILTER ? years.filter((y) => y === YEAR_FILTER) : years;
  writeJson(join(DATA_DIR, "years.json"), filteredYears);

  // 3. Individual contest details (with rounds + scores)
  log(`Fetching contest details (${filteredYears.length} years)...`);
  const contestsDir = join(DATA_DIR, "contests");
  ensureDir(contestsDir);

  const allDetails = await eurovisionApi.allContests(
    "senior",
    4,
    (done, total, year) => {
      if (!YEAR_FILTER || year === YEAR_FILTER) {
        process.stdout.write(
          `\r  ${done}/${total} contests fetched (latest: ${year})   `,
        );
      }
    },
  );

  const filteredDetails = YEAR_FILTER
    ? allDetails.filter((c) => c.year === YEAR_FILTER)
    : allDetails;

  for (const detail of filteredDetails) {
    writeJson(join(contestsDir, `${detail.year}.json`), detail);
  }

  console.log(`\n  ✓ ${filteredDetails.length} contest files written`);

  // 4. Summary: write a merged index for fast search/listing
  log("Writing contest index...");
  const index = filteredDetails.map((detail) => ({
    year: detail.year,
    city: detail.city,
    country: detail.country,
    intendedCountry: detail.intendedCountry,
    slogan: detail.slogan,
    logoUrl: detail.logoUrl,
    broadcasters: detail.broadcasters,
    presenters: detail.presenters,
    // Flatten contestants for search: [{ country, artist, song }]
    contestants: detail.contestants.map((c) => ({
      id: c.id,
      country: c.country,
      artist: c.artist,
      song: c.song,
    })),
    // Winner = contestant with place:1 in the final
    winner: (() => {
      const final = detail.rounds.find((r) => r.name === "final");
      const winnerPerf = final?.performances?.find((p) => p.place === 1);
      if (!winnerPerf) return null;
      const winner = detail.contestants.find(
        (c) => c.id === winnerPerf.contestantId,
      );
      return winner
        ? {
            country: winner.country,
            artist: winner.artist,
            song: winner.song,
            points: winnerPerf.scores.find((s) => s.name === "total")?.points ?? null,
          }
        : null;
    })(),
  }));

  writeJson(join(DATA_DIR, "index.json"), index);

  console.log(`\n✅ Done! Data written to src/data/`);
  console.log(
    `   ${filteredDetails.length} contests · ${
      filteredDetails.reduce((acc, d) => acc + d.contestants.length, 0)
    } contestant references`,
  );
}

main().catch((err) => {
  console.error("\n❌ Fetch failed:", err);
  process.exit(1);
});
