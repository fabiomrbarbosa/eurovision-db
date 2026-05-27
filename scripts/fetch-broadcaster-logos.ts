#!/usr/bin/env node
/**
 * fetch-broadcaster-logos.ts
 *
 * Downloads EBU member broadcaster logos and saves them to
 * public/images/broadcasters/ for offline use.
 *
 * Source: EBU active-members and associate-members pages at ebu.ch.
 * Entries marked with "?" in broadcaster-logos.ts have inferred filenames —
 * the script warns on 404 so they can be corrected in the mapping.
 *
 * Skips files that already exist. Safe to re-run incrementally.
 *
 * Usage:
 *   npm run fetch:broadcaster-logos
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { BROADCASTERS } from "../src/lib/broadcaster-logos.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "../public");
const CONCURRENCY = 4;

async function fetchBuffer(url: string): Promise<Buffer> {
	const res = await fetch(url, {
		headers: {
			"User-Agent": "Mozilla/5.0 (compatible; Eurovision-DB fetcher)",
			Referer: "https://www.ebu.ch/about/members",
		},
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return Buffer.from(await res.arrayBuffer());
}

async function main() {
	const entries = Object.entries(BROADCASTERS).filter(([, e]) => e.src && e.dest) as [string, { src: string; dest: string }][];
	console.log(`\n📡 Fetching ${entries.length} broadcaster logos…\n`);

	let done = 0;
	let skipped = 0;
	let failed = 0;

	for (let i = 0; i < entries.length; i += CONCURRENCY) {
		const batch = entries.slice(i, i + CONCURRENCY);

		await Promise.all(
			batch.map(async ([code, { src, dest }]) => {
				const outPath = join(PUBLIC_DIR, dest);
				mkdirSync(dirname(outPath), { recursive: true });

				if (existsSync(outPath)) {
					skipped++;
					return;
				}

				try {
					const buf = await fetchBuffer(src);
					writeFileSync(outPath, buf);
					done++;
					console.log(`  ✓ ${code.padEnd(12)} ${dest}`);
				} catch (err) {
					failed++;
					console.warn(`  ✗ ${code.padEnd(12)} ${(err as Error).message} — ${src}`);
				}
			}),
		);
	}

	console.log(
		`\n✅ Done — ${done} downloaded, ${skipped} skipped, ${failed} failed`,
	);
	if (failed > 0) {
		console.log(
			"   Fix the flagged filenames in src/lib/broadcaster-logos.ts and re-run.",
		);
	}
	console.log("   Logos saved to public/images/broadcasters/");
}

main().catch((err) => {
	console.error("\n❌", err);
	process.exit(1);
});
