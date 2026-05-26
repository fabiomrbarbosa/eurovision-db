/**
 * Utility helpers safe to import on both server (Astro) and client (Svelte) sides.
 * No Node.js APIs — nothing here touches the filesystem or the network.
 */

// SVG from Eurovision.com for all countries; PNG fallback for codes it doesn't carry.
const FLAG_PNG_CODES = new Set(["gb-wls"]);

export function countryFlagUrl(code: string): string {
	const lower = code.toLowerCase();
	return `/images/flags/${lower}.${FLAG_PNG_CODES.has(lower) ? "png" : "svg"}`;
}

export function ordinal(n: number): string {
	const s = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
	return `${n}${s}`;
}
