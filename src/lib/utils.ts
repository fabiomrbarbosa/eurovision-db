/**
 * Utility helpers safe to import on both server (Astro) and client (Svelte) sides.
 * No Node.js APIs — nothing here touches the filesystem or the network.
 */

import { BROADCASTERS } from "./broadcasters.ts";

export function countryFlagUrl(code: string): string {
	return `/images/flags/${code.toLowerCase()}.svg`;
}

// Typos / encoding errors in the upstream API data that would recur on re-fetch.
const BROADCASTER_ALIASES: Record<string, string> = {
	A2F:          "Antenne 2",          // 1983–1992: API code for Antenne 2 France
	FR:           "France Télévisions", // some years: API shorthand
	FT2:          "France Télévisions", // 1993–1998, 2022: France Télévisions 2 (France 2)
	FT3:          "France Télévisions", // 2014: France Télévisions 3 (France 3)
	"France 2":   "France Télévisions", // channel name used directly by API
	"France 3":   "France Télévisions", // channel name used directly by API
	RTÈ:          "RTÉ",               // 1981: È (grave) should be É (acute)
	RTB:          "RTBF",              // 2022: API returns pre-1977 name instead of current acronym
	TVE:          "RTVE",              // API uses channel name; canonical key is the corporation acronym
	"SSR SRG":    "SRG SSR",           // API consistently returns French-order acronym; canonical key is German-order
	RTM:          "SNRT",              // 1980: Radiodiffusion-Télévision Marocaine (Morocco); RTM ≠ TRM (Moldova)
	STV:          "STVR",              // Slovakia last competed in 2012 as STV; STVR is the 2025 rebrand
};

// Extracts the acronym from "Full Name (ACRONYM)" strings; returns the input unchanged otherwise.
function broadcasterCode(raw: string): string {
	const m = raw.match(/\(([^)]+)\)$/);
	return m ? m[1] : raw;
}

function resolveEntry(raw: string) {
	const code = broadcasterCode(raw);
	const normalised = BROADCASTER_ALIASES[code] ?? code;
	return BROADCASTERS[normalised];
}

export function broadcasterLogoUrl(raw: string): string | null {
	return resolveEntry(raw)?.dest ?? null;
}

export function broadcasterLogoSquare(raw: string): boolean {
	return resolveEntry(raw)?.square ?? false;
}

// Per-country broadcaster overrides for country/all-countries pages.
// Use when the underlying contestant detail files correctly name the channel
// that produced the entry, but the country-level display should show a
// consortium or successor organisation instead.
// Keyed by the country code as it appears in the contest data (uppercase).
export const COUNTRY_BROADCASTER_OVERRIDES: Record<string, string[]> = {
	CS: ["UJRT"], // Serbia & Montenegro: RTS/TVCG alternated per year, but UJRT was the consortium
};

// Per-year broadcaster overrides. The API sometimes reports only the consortium
// label (e.g. "ARD") instead of the regional broadcaster that produced the show,
// or omits the consortium label that should appear alongside the regional one.
const BROADCASTER_YEAR_OVERRIDES: Record<number, string[]> = {
	1957: ["ARD", "HR"],   // Hessischer Rundfunk, Frankfurt
	1983: ["ARD", "BR"],   // Bayerischer Rundfunk, Munich
	2011: ["ARD", "NDR"],  // Norddeutscher Rundfunk, Düsseldorf (API only lists NDR)
};

export function expandBroadcaster(name: string): string {
	if (name.includes("(")) return name;
	const normalised = BROADCASTER_ALIASES[name] ?? name;
	const full = BROADCASTERS[normalised]?.full;
	return full ? `${full} (${normalised})` : normalised;
}

export function resolveContestBroadcasters(year: number, broadcasters: string[]): string[] {
	return (BROADCASTER_YEAR_OVERRIDES[year] ?? broadcasters).map(expandBroadcaster);
}

export function ordinal(n: number): string {
	const s = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
	return `${n}${s}`;
}
