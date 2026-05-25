// Returns the path to an offline heart-flag image (run npm run fetch:flags first).
// SVG from Eurovision for all current + defunct countries; PNG fallback for others.
const FLAG_PNG_CODES = new Set(["gb-wls"]);

export function countryFlagUrl(code: string): string {
	const lower = code.toLowerCase();
	return `/images/flags/${lower}.${FLAG_PNG_CODES.has(lower) ? "png" : "svg"}`;
}

export function ordinal(n: number): string {
	const s = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
	return `${n}${s}`;
}
