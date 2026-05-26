/**
 * HTTP client for https://eurovisionapi.runasp.net.
 * Used only by the fetch scripts (scripts/fetch-all.ts) — never imported at build time by
 * Astro pages, which read from local JSON files via src/lib/data.ts instead.
 */

import type {
	ContestantDetail,
	ContestDetail,
	ContestReference,
	ContestType,
	CountryMap,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = "https://eurovisionapi.runasp.net/api";

/** How long to wait for a single request before giving up (ms) */
const DEFAULT_TIMEOUT_MS = 10_000;

/** How many times to retry a failed request before throwing */
const DEFAULT_RETRIES = 3;

/** Base delay between retries in ms (doubles on each attempt) */
const RETRY_BASE_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

class EurovisionApiError extends Error {
	constructor(
		public readonly url: string,
		public readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "EurovisionApiError";
	}
}

async function apiFetch<T>(
	path: string,
	retries = DEFAULT_RETRIES,
): Promise<T> {
	const url = `${BASE_URL}${path}`;
	let lastError: unknown;

	for (let attempt = 0; attempt <= retries; attempt++) {
		if (attempt > 0) {
			const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
			await new Promise((r) => setTimeout(r, delay));
		}

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				DEFAULT_TIMEOUT_MS,
			);

			const response = await fetch(url, { signal: controller.signal });
			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new EurovisionApiError(
					url,
					response.status,
					`HTTP ${response.status} fetching ${url}`,
				);
			}

			return (await response.json()) as T;
		} catch (err) {
			lastError = err;
			// Don't retry on 4xx — those are permanent failures
			if (err instanceof EurovisionApiError && err.status < 500) {
				throw err;
			}
		}
	}

	throw lastError;
}

// ---------------------------------------------------------------------------
// Public client
// ---------------------------------------------------------------------------

export const eurovisionApi = {
	// -------------------------------------------------------------------------
	// Countries
	// -------------------------------------------------------------------------

	/** Returns all country codes mapped to their full names. */
	countries(): Promise<CountryMap> {
		return apiFetch<CountryMap>("/countries");
	},

	// -------------------------------------------------------------------------
	// Senior & Junior shared helpers
	// -------------------------------------------------------------------------

	/**
	 * Returns all years in which an edition has been held.
	 * Equivalent to GET /api/{type}/contests/years
	 */
	years(type: ContestType = "senior"): Promise<number[]> {
		return apiFetch<number[]>(`/${type}/contests/years`);
	},

	/**
	 * Returns lightweight references for all contest editions.
	 * Equivalent to GET /api/{type}/contests
	 */
	contests(type: ContestType = "senior"): Promise<ContestReference[]> {
		return apiFetch<ContestReference[]>(`/${type}/contests`);
	},

	/**
	 * Returns full contest detail including rounds and scores.
	 * Equivalent to GET /api/{type}/contests/{year}
	 */
	contest(year: number, type: ContestType = "senior"): Promise<ContestDetail> {
		return apiFetch<ContestDetail>(`/${type}/contests/${year}`);
	},

	/**
	 * Returns full contestant detail including lyrics, BPM, jury, etc.
	 * Equivalent to GET /api/{type}/contests/{year}/contestants/{id}
	 */
	contestant(
		year: number,
		id: number,
		type: ContestType = "senior",
	): Promise<ContestantDetail> {
		return apiFetch<ContestantDetail>(
			`/${type}/contests/${year}/contestants/${id}`,
		);
	},

	// -------------------------------------------------------------------------
	// Convenience: fetch all contest details in parallel (with concurrency cap)
	// -------------------------------------------------------------------------

	/**
	 * Fetches all contest details for a given type.
	 * Caps concurrent requests to avoid hammering the API.
	 *
	 * @param type       "senior" | "junior"
	 * @param concurrency Max simultaneous requests (default: 4)
	 * @param onProgress Optional callback called after each completed fetch
	 */
	async allContests(
		type: ContestType = "senior",
		concurrency = 4,
		onProgress?: (fetched: number, total: number, year: number) => void,
	): Promise<ContestDetail[]> {
		const years = await eurovisionApi.years(type);
		const results: ContestDetail[] = [];
		let fetched = 0;

		// Process in batches of `concurrency`
		for (let i = 0; i < years.length; i += concurrency) {
			const batch = years.slice(i, i + concurrency);
			const batchResults = await Promise.all(
				batch.map((year) =>
					eurovisionApi.contest(year, type).then((detail) => {
						fetched++;
						onProgress?.(fetched, years.length, year);
						return detail;
					}),
				),
			);
			results.push(...batchResults);
		}

		// Return sorted chronologically
		return results.sort((a, b) => a.year - b.year);
	},

	/**
	 * Fetches all contestant details for a given contest year.
	 * Caps concurrent requests to avoid hammering the API.
	 *
	 * @param year        Contest year
	 * @param type        "senior" | "junior"
	 * @param concurrency Max simultaneous requests (default: 6)
	 */
	async allContestants(
		year: number,
		type: ContestType = "senior",
		concurrency = 6,
	): Promise<ContestantDetail[]> {
		const contest = await eurovisionApi.contest(year, type);
		const results: ContestantDetail[] = [];

		for (let i = 0; i < contest.contestants.length; i += concurrency) {
			const batch = contest.contestants.slice(i, i + concurrency);
			const batchResults = await Promise.all(
				batch.map((c) => eurovisionApi.contestant(year, c.id, type)),
			);
			results.push(...batchResults);
		}

		return results;
	},
};
