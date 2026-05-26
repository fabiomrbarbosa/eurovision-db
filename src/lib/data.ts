/**
 * src/lib/data.ts
 *
 * Data access layer for the Eurovision frontend.
 * Reads from local JSON snapshots in src/data/ rather than hitting the API
 * directly, so the app works fully offline after running the fetch script.
 *
 * In an Astro project, import these in your .astro frontmatter or
 * server-side endpoints. They are NOT safe to call from client-side JS
 * (they use Node fs/path). Use the API client directly for any runtime
 * client-side fetching.
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type {
	ContestantDetail,
	ContestantReference,
	ContestantWithResults,
	ContestDetail,
	CountryMap,
	ResolvedContest,
	RoundName,
} from "./api/types.ts";

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const DATA_DIR = join(process.cwd(), "src/data");

function readJson<T>(filePath: string): T {
	return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

function dataPath(...parts: string[]): string {
	return join(DATA_DIR, ...parts);
}

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

let _countries: CountryMap | null = null;

export function getCountries(): CountryMap {
	if (!_countries) {
		_countries = readJson<CountryMap>(dataPath("countries.json"));
	}
	return _countries;
}

export function getCountryName(code: string, countries?: CountryMap): string {
	if (code === "WLD") return "Rest of the World";
	const map = countries ?? getCountries();
	return map[code] ?? code;
}

// ---------------------------------------------------------------------------
// Years
// ---------------------------------------------------------------------------

export function getYears(): number[] {
	return readdirSync(dataPath("contests"))
		.filter((f) => f.endsWith(".json"))
		.map((f) => parseInt(f, 10))
		.filter((n) => !isNaN(n))
		.sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Contest index (derived at build time from individual contest files)
// ---------------------------------------------------------------------------

export interface ContestIndexEntry {
	year: number;
	city: string;
	country: string;
	intendedCountry: string | null;
	slogan: string | null;
	logoUrl: string;
	broadcasters: string[];
	presenters: string[];
	contestants: Array<{
		id: number;
		country: string;
		artist: string;
		song: string;
		finalPlace: number | null;
		finalPoints: number | null;
	}>;
	winner: {
		contestantId: number;
		country: string;
		artist: string;
		song: string;
		points: number | null;
	} | null;
	cancelled: boolean;
}

let _index: ContestIndexEntry[] | null = null;

export function getContestIndex(): ContestIndexEntry[] {
	if (_index) return _index;

	const contestsDir = dataPath("contests");
	const files = readdirSync(contestsDir).filter((f) => f.endsWith(".json"));

	_index = files
		.map((file) => {
			const detail = readJson<ContestDetail>(join(contestsDir, file));
			const final = detail.rounds.find((r) => r.name === "final");
			const winnerPerf =
				final?.performances?.find((p) => p.place === 1) ?? null;
			const winnerContestant = winnerPerf
				? (detail.contestants.find((c) => c.id === winnerPerf.contestantId) ??
					null)
				: null;
			return {
				year: detail.year,
				city: detail.city,
				country: detail.country,
				intendedCountry: detail.intendedCountry,
				slogan: detail.slogan,
				logoUrl: detail.logoUrl,
				broadcasters: detail.broadcasters,
				presenters: detail.presenters,
				contestants: (() => {
					const finalPerfs = new Map(
						(final?.performances ?? [])
							.filter((p) => p !== null)
							.map((p) => [p.contestantId, p]),
					);
					return detail.contestants.map((c) => {
						const perf = finalPerfs.get(c.id);
						return {
							id: c.id,
							country: c.country,
							artist: c.artist,
							song: c.song,
							finalPlace: perf?.place ?? null,
							finalPoints:
								perf?.scores.find((s) => s.name === "total")?.points ?? null,
						};
					});
				})(),
				winner: winnerContestant
					? {
							contestantId: winnerContestant.id,
							country: winnerContestant.country,
							artist: winnerContestant.artist,
							song: winnerContestant.song,
							points:
								winnerPerf!.scores.find((s) => s.name === "total")?.points ??
								null,
						}
					: null,
				cancelled: detail.rounds.every((r) => r.performances === null),
			};
		})
		.sort((a, b) => a.year - b.year);

	return _index;
}

// ---------------------------------------------------------------------------
// Contest detail
// ---------------------------------------------------------------------------

export function getContest(year: number): ContestDetail {
	return readJson<ContestDetail>(dataPath("contests", `${year}.json`));
}

/**
 * Returns a fully resolved contest: contestants keyed by ID,
 * and a results array merging contestant references with their performances.
 */
export function getResolvedContest(year: number): ResolvedContest {
	const detail = getContest(year);

	// Build O(1) lookup map
	const contestantsById: Record<number, ContestantReference> = {};
	for (const c of detail.contestants) {
		contestantsById[c.id] = c;
	}

	// Merge all round performances per contestant
	const performancesByContestant: Record<
		number,
		ContestantWithResults["performances"]
	> = {};

	for (const round of detail.rounds) {
		for (const perf of round.performances ?? []) {
			if (!performancesByContestant[perf.contestantId]) {
				performancesByContestant[perf.contestantId] = [];
			}
			performancesByContestant[perf.contestantId].push({
				round: round.name as RoundName,
				running: perf.running,
				place: perf.place,
				scores: perf.scores,
			});
		}
	}

	const results: ContestantWithResults[] = detail.contestants.map((c) => ({
		...c,
		performances: performancesByContestant[c.id] ?? [],
	}));

	// Sort by final placement (nulls/disqualified last)
	results.sort((a, b) => {
		const aFinal = a.performances.find((p) => p.round === "final");
		const bFinal = b.performances.find((p) => p.round === "final");
		const aPlace = aFinal?.place ?? Infinity;
		const bPlace = bFinal?.place ?? Infinity;
		return aPlace - bPlace;
	});

	const cancelled = detail.rounds.every((r) => r.performances === null);
	return { ...detail, contestantsById, results, cancelled };
}

// ---------------------------------------------------------------------------
// Contestant detail (requires fetch:contestants to populate src/data/contestants/)
// ---------------------------------------------------------------------------

export function getContestantDetail(
	year: number,
	id: number,
): ContestantDetail {
	return readJson<ContestantDetail>(
		dataPath("contestants", String(year), `${id}.json`),
	);
}

// ---------------------------------------------------------------------------
// Country history
// ---------------------------------------------------------------------------

export interface CountryAppearance {
	year: number;
	artist: string;
	song: string;
	contestantId: number;
	finalRunning: number | null;
	finalPlace: number | null;
	finalPoints: number | null;
	participatedInFinal: boolean;
	cancelled: boolean;
}

/**
 * Returns all appearances of a given country across all contest editions,
 * sorted chronologically.
 */
export function getCountryHistory(countryCode: string): CountryAppearance[] {
	const index = getContestIndex();
	const appearances: CountryAppearance[] = [];

	for (const entry of index) {
		const contestants = entry.contestants.filter(
			(c) => c.country === countryCode,
		);
		if (contestants.length === 0) continue;

		// To get placement we need the full contest detail
		const detail = getContest(entry.year);
		const cancelled = detail.rounds.every((r) => r.performances === null);
		const finalRound = detail.rounds.find((r) => r.name === "final");

		for (const contestant of contestants) {
			const finalPerf = finalRound?.performances?.find(
				(p) => p.contestantId === contestant.id,
			);

			appearances.push({
				year: entry.year,
				artist: contestant.artist,
				song: contestant.song,
				contestantId: contestant.id,
				finalRunning: finalPerf?.running ?? null,
				finalPlace: finalPerf?.place ?? null,
				finalPoints:
					finalPerf?.scores.find((s) => s.name === "total")?.points ?? null,
				participatedInFinal: !!finalPerf,
				cancelled,
			});
		}
	}

	// Sort chronologically; within the same year preserve contestant ID order
	return appearances.sort(
		(a, b) => a.year - b.year || a.contestantId - b.contestantId,
	);
}
