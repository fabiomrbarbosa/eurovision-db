/**
 * Utility helpers safe to import on both server (Astro) and client (Svelte) sides.
 * No Node.js APIs — nothing here touches the filesystem or the network.
 */

import { BROADCASTERS } from "./broadcaster-logos.ts";

export function countryFlagUrl(code: string): string {
	return `/images/flags/${code.toLowerCase()}.svg`;
}

// Extracts the acronym from "Full Name (ACRONYM)" strings; returns the input unchanged otherwise.
function broadcasterCode(raw: string): string {
	const m = raw.match(/\(([^)]+)\)$/);
	return m ? m[1] : raw;
}

export function broadcasterLogoUrl(raw: string): string | null {
	return BROADCASTERS[broadcasterCode(raw)]?.dest ?? null;
}

// Typos / encoding errors in the upstream API data that would recur on re-fetch.
const BROADCASTER_ALIASES: Record<string, string> = {
	RTÈ: "RTÉ",  // 1981: È (grave) should be É (acute)
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
