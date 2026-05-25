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

const FETCH_CONTESTANTS = args.includes("--contestants");

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
// Manual corrections for known upstream API data errors.
// Applied after every fetch so they survive re-runs.
// ---------------------------------------------------------------------------

const CONTEST_PATCHES: Record<number, Record<string, unknown>> = {
  2005: { city: "Kyiv" },   // API returns "Kiev" (outdated romanisation)
  2006: { city: "Athens" }, // API returns "Athen" (truncated)
};

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

  // 2. Individual contest details (with rounds + scores)
  log("Fetching contest details...");
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
    const patch = CONTEST_PATCHES[detail.year];
    writeJson(join(contestsDir, `${detail.year}.json`), patch ? { ...detail, ...patch } : detail);
  }

  console.log(`\n  ✓ ${filteredDetails.length} contest files written`);

  // 4. Contestant details (optional — only when --contestants flag is set)
  if (FETCH_CONTESTANTS) {
    const totalContestants = filteredDetails.reduce((n, d) => n + d.contestants.length, 0);
    log(`Fetching contestant details (${totalContestants} total)...`);
    let fetched = 0;
    for (const detail of filteredDetails) {
      const contestants = await eurovisionApi.allContestants(detail.year, "senior", 4);
      for (const c of contestants) {
        writeJson(
          join(DATA_DIR, "contestants", String(detail.year), `${c.id}.json`),
          c,
        );
        fetched++;
        process.stdout.write(`\r  ${fetched}/${totalContestants} contestants fetched   `);
      }
    }
    console.log(`\n  ✓ ${fetched} contestant files written`);
  }

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
