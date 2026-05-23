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

import { readFileSync } from "fs";
import { join } from "path";
import type {
  ContestantDetail,
  ContestantReference,
  ContestantWithResults,
  ContestDetail,
  ContestReference,
  ContestSummary,
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

export function getCountryName(
  code: string,
  countries?: CountryMap,
): string {
  const map = countries ?? getCountries();
  return map[code] ?? code;
}

// ---------------------------------------------------------------------------
// Years
// ---------------------------------------------------------------------------

export function getYears(): number[] {
  return readJson<number[]>(dataPath("years.json"));
}

// ---------------------------------------------------------------------------
// Contest list / references
// ---------------------------------------------------------------------------

export function getContestReferences(): ContestReference[] {
  return readJson<ContestReference[]>(dataPath("contests.json"));
}

/** Returns contest references enriched with resolved country names. */
export function getContestSummaries(): ContestSummary[] {
  const countries = getCountries();
  return getContestReferences().map((ref) => ({
    ...ref,
    countryName: getCountryName(ref.country, countries),
    intendedCountryName: ref.intendedCountry
      ? getCountryName(ref.intendedCountry, countries)
      : null,
  }));
}

// ---------------------------------------------------------------------------
// Contest index (lightweight, includes winner + contestant list)
// ---------------------------------------------------------------------------

/** Shape of the pre-built index entry (written by fetch-all.ts) */
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
  }>;
  winner: {
    country: string;
    artist: string;
    song: string;
    points: number | null;
  } | null;
}

let _index: ContestIndexEntry[] | null = null;

export function getContestIndex(): ContestIndexEntry[] {
  if (!_index) {
    _index = readJson<ContestIndexEntry[]>(dataPath("index.json"));
  }
  return _index!;
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
    for (const perf of (round.performances ?? [])) {
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
// Contestant detail (only available if --contestants flag was used)
// ---------------------------------------------------------------------------

export function getContestantDetail(
  year: number,
  id: number,
): ContestantDetail | null {
  try {
    return readJson<ContestantDetail>(
      dataPath("contestants", String(year), `${id}.json`),
    );
  } catch {
    // File doesn't exist — contestant detail wasn't fetched
    return null;
  }
}

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

export interface SearchResult {
  type: "contest" | "contestant";
  year: number;
  // For contest hits
  city?: string;
  country?: string;
  countryName?: string;
  // For contestant hits
  artist?: string;
  song?: string;
  contestantCountry?: string;
  contestantCountryName?: string;
  contestantId?: number;
}

/**
 * Searches the contest index for matching years, cities, countries,
 * artists, and song titles. Case-insensitive substring match.
 *
 * Returns results ranked: exact matches first, then partial.
 */
export function search(query: string, limit = 50): SearchResult[] {
  if (!query.trim()) return [];

  const q = query.toLowerCase();
  const countries = getCountries();
  const index = getContestIndex();
  const results: SearchResult[] = [];

  for (const entry of index) {
    const hostCountryName = getCountryName(entry.country, countries).toLowerCase();
    const intendedName = entry.intendedCountry
      ? getCountryName(entry.intendedCountry, countries).toLowerCase()
      : null;

    // Contest-level match (year, city, country, slogan)
    if (
      String(entry.year).includes(q) ||
      entry.city.toLowerCase().includes(q) ||
      hostCountryName.includes(q) ||
      (intendedName && intendedName.includes(q)) ||
      (entry.slogan && entry.slogan.toLowerCase().includes(q))
    ) {
      results.push({
        type: "contest",
        year: entry.year,
        city: entry.city,
        country: entry.country,
        countryName: getCountryName(entry.country, countries),
      });
    }

    // Contestant-level match (artist, song, country)
    for (const c of entry.contestants) {
      const contestantCountryName = getCountryName(c.country, countries).toLowerCase();
      if (
        c.artist.toLowerCase().includes(q) ||
        c.song.toLowerCase().includes(q) ||
        contestantCountryName.includes(q)
      ) {
        results.push({
          type: "contestant",
          year: entry.year,
          artist: c.artist,
          song: c.song,
          contestantCountry: c.country,
          contestantCountryName: getCountryName(c.country, countries),
          contestantId: c.id,
        });
      }
    }

    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Country history
// ---------------------------------------------------------------------------

export interface CountryAppearance {
  year: number;
  artist: string;
  song: string;
  contestantId: number;
  finalPlace: number | null;
  finalPoints: number | null;
}

/**
 * Returns all appearances of a given country across all contest editions,
 * sorted chronologically.
 */
export function getCountryHistory(countryCode: string): CountryAppearance[] {
  const index = getContestIndex();
  const appearances: CountryAppearance[] = [];

  for (const entry of index) {
    const contestant = entry.contestants.find(
      (c) => c.country === countryCode,
    );
    if (!contestant) continue;

    // To get placement we need the full contest detail
    const detail = getContest(entry.year);
    const finalRound = detail.rounds.find((r) => r.name === "final");
    const finalPerf = finalRound?.performances?.find(
      (p) => p.contestantId === contestant.id,
    );

    appearances.push({
      year: entry.year,
      artist: contestant.artist,
      song: contestant.song,
      contestantId: contestant.id,
      finalPlace: finalPerf?.place ?? null,
      finalPoints:
        finalPerf?.scores.find((s) => s.name === "total")?.points ?? null,
    });
  }

  return appearances.sort((a, b) => a.year - b.year);
}
