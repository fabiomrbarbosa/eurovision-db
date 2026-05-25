// ---------------------------------------------------------------------------
// Eurovision API — TypeScript types
// Derived from https://eurovisionapi.runasp.net/documentation
// Covers both Senior (1956–present) and Junior (2003–present) contests.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** ISO 3166-1 alpha-2 country code, e.g. "PT", "SE", "AU" */
export type CountryCode = string;

/** A dictionary mapping country codes to their full names */
export type CountryMap = Record<CountryCode, string>;

/** Contest type discriminator */
export type ContestType = "senior" | "junior";

// ---------------------------------------------------------------------------
// Countries
// GET /api/countries
// ---------------------------------------------------------------------------

// Response is directly a CountryMap — no wrapper object.

// ---------------------------------------------------------------------------
// Contest reference
// GET /api/senior/contests  (array of ContestReference)
// GET /api/junior/contests
// ---------------------------------------------------------------------------

export interface ContestReference {
	year: number;
	arena: string;
	city: string;
	/** Host country code */
	country: CountryCode;
	/**
	 * If not null, the country that should have hosted but couldn't.
	 * Example: "UA" for the 2023 contest held in Liverpool on Ukraine's behalf.
	 */
	intendedCountry: CountryCode | null;
	slogan: string | null;
	logoUrl: string;
	/** Endpoint URL to fetch full ContestDetail */
	url: string;
}

// ---------------------------------------------------------------------------
// Contest detail
// GET /api/senior/contests/{year}
// GET /api/junior/contests/{year}
// ---------------------------------------------------------------------------

export interface ContestDetail extends Omit<ContestReference, "url"> {
	broadcasters: string[];
	presenters: string[];
	contestants: ContestantReference[];
	rounds: Round[];
}

// ---------------------------------------------------------------------------
// Contestant reference (embedded in ContestDetail)
// ---------------------------------------------------------------------------

export interface ContestantReference {
	/** Local ID — used to link performances to contestants within a contest */
	id: number;
	country: CountryCode;
	artist: string;
	song: string;
	/** Endpoint URL to fetch full ContestantDetail */
	url: string;
}

// ---------------------------------------------------------------------------
// Round & scoring
// ---------------------------------------------------------------------------

/**
 * Round name conventions:
 * - "final"      — always present
 * - "semifinal"  — 2004–2007
 * - "semifinal1" / "semifinal2" — 2008–present
 */
export type RoundName = "final" | "semifinal" | "semifinal1" | "semifinal2";

export interface Round {
	name: RoundName;
	/** ISO date string, UTC */
	date: string;
	/** Time string "HH:MM:SS", UTC */
	time: string;
	performances: Performance[];
	/** IDs of contestants disqualified in this round */
	disqualifieds: number[] | null;
}

export interface Performance {
	contestantId: number;
	/** Position in the running order */
	running: number;
	/** Final ranking within the round; null if not yet determined or disqualified */
	place: number | null;
	/**
	 * Score breakdown. Always contains "total".
	 * Contains "jury" and "public" only for years > 2015.
	 */
	scores: Score[];
}

/**
 * Score origin:
 * - "total"  — combined points (all years)
 * - "jury"   — professional jury points (2016+)
 * - "public" — televote points (2016+)
 */
export type ScoreName = "total" | "jury" | "public";

export interface Score {
	name: ScoreName;
	/** Aggregate points received from all voting countries */
	points: number;
	/**
	 * Per-country breakdown: { "SE": 12, "PT": 8, ... }
	 * Key is CountryCode, value is points awarded by that country.
	 */
	votes: Record<CountryCode, number>;
}

// ---------------------------------------------------------------------------
// Contestant detail
// GET /api/senior/contests/{year}/contestants/{id}
// GET /api/junior/contests/{year}/contestants/{id}
// ---------------------------------------------------------------------------

export interface ContestantDetail {
	id: number;
	country: CountryCode;
	artist: string;
	song: string;
	videoUrls: string[];
	lyrics: Lyrics[];
	/** Beats per minute; may be null if not available */
	bpm: number | null;
	/** Key and scale, e.g. "Eb minor" */
	tone: string | null;
	/**
	 * Real name(s) of the artist.
	 * If a group, contains one entry per member.
	 */
	artistPeople: string[] | null;
	backings: string[] | null;
	dancers: string[] | null;
	stageDirector: string | null;
	composers: string[] | null;
	/** Conductor — senior edition only, up to and including 1998 */
	conductor: string | null;
	lyricists: string[] | null;
	writers: string[] | null;
	broadcaster: string | null;
	commentators: string[] | null;
	/** The professional jury responsible for awarding votes */
	jury: string[] | null;
	spokesperson: string | null;
}

// ---------------------------------------------------------------------------
// Lyrics
// ---------------------------------------------------------------------------

/**
 * Lyrics version type:
 * - 0 = Original
 * - 1 = Translation
 * - 2 = Version (e.g. a different language version of the same song)
 */
export type LyricsType = 0 | 1 | 2;

export interface Lyrics {
	type: LyricsType;
	/** Language(s) the lyrics are written in */
	languages: string[];
	/**
	 * Visual language or dialect used to render the lyrics.
	 * May differ from `languages` (e.g. Cypriot dialect vs. Greek).
	 */
	displayedLanguages: string[] | null;
	title: string;
	/** Paragraphs separated by double newline "\n\n" */
	content: string;
}

// ---------------------------------------------------------------------------
// Years list
// GET /api/senior/contests/years
// GET /api/junior/contests/years
// ---------------------------------------------------------------------------

// Response is directly a number[] — no wrapper object.

// ---------------------------------------------------------------------------
// Convenience / derived types for the frontend
// ---------------------------------------------------------------------------

/**
 * A contestant enriched with their round results, for display in contest pages.
 * Merges ContestantReference with performances from all rounds.
 */
export interface ContestantWithResults extends ContestantReference {
	performances: Array<{
		round: RoundName;
		running: number;
		place: number | null;
		scores: Score[];
	}>;
}

/**
 * Fully resolved contest page data — everything needed to render a year page
 * without additional API calls.
 */
export interface ResolvedContest extends ContestDetail {
	/** Contestants keyed by their local ID for O(1) lookup */
	contestantsById: Record<number, ContestantReference>;
	/** Full contestant-with-results list derived from rounds */
	results: ContestantWithResults[];
	/** True when all rounds have null performances (e.g. ESC 2020 cancelled due to COVID) */
	cancelled: boolean;
}
