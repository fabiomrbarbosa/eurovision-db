/**
 * Utility helpers safe to import on both server (Astro) and client (Svelte) sides.
 * No Node.js APIs — nothing here touches the filesystem or the network.
 */

export function countryFlagUrl(code: string): string {
	return `/images/flags/${code.toLowerCase()}.svg`;
}

// Maps known broadcaster acronyms to their full names. Strings already containing
// "(" (i.e. already "Full Name (ACRONYM)") are returned unchanged.
// ARD intentionally omitted — it's a consortium label; shown alongside the regional
// broadcaster that produced the show, injected via BROADCASTER_YEAR_OVERRIDES below.
const BROADCASTER_FULL: Record<string, string> = {
	AMPTV:   "Armenian Public Television",
	BBC:     "British Broadcasting Corporation",
	BNT:     "Bulgarian National Television",
	BR:      "Bayerischer Rundfunk",
	C1R:     "Channel One Russia",
	CLT:     "Compagnie Luxembourgeoise de Télévision",
	CyBC:    "Cyprus Broadcasting Corporation",
	DR:      "Danmarks Radio",
	ERR:     "Eesti Rahvusringhääling",
	ERT:     "Ellinikí Radiofonía Tileórasi",
	GPB:     "Georgian Public Broadcasting",
	HR:      "Hessischer Rundfunk",
	HRT:     "Hrvatska Radiotelevizija",
	IBA:     "Israeli Broadcasting Authority",
	JRT:     "Jugoslovenska Radiotelevizija",
	LRT:     "Lietuvos nacionalinis radijas ir televizija",
	LTV:     "Latvijas Televīzija",
	MRT:     "Macedonian Radio-Television",
	NDR:     "Norddeutscher Rundfunk",
	NOS:     "Nederlandse Omroep Stichting",
	NPO:     "Nederlandse Publieke Omroep",
	NRK:     "Norsk rikskringkasting",
	ORF:     "Österreichischer Rundfunk",
	PBS:     "Public Broadcasting Services",
	RAI:     "Radiotelevisione Italiana",
	RTBF:    "Radio-Télévision belge de la Communauté française",
	RTCG:    "Radio-televizija Crne Gore",
	RTF:     "Radiodiffusion-Télévision Française",
	RTL:     "Radio Télé Luxembourg",
	RTP:     "Rádio e Televisão de Portugal",
	RTÉ:     "Raidió Teilifís Éireann",
	RTS:     "Radio Televizija Srbije",
	RTSH:    "Radio Televizioni Shqiptar",
	RTVA:    "Ràdio i Televisió d'Andorra",
	RTVSLO:  "Radiotelevizija Slovenija",
	RÚV:     "Ríkisútvarpið",
	SBS:     "Special Broadcasting Service",
	SMRTV:   "San Marino RTV",
	SR:      "Sveriges Radio",
	SVT:     "Sveriges Television",
	SWR:     "Südwestrundfunk",
	TF1:     "Télévision Française 1",
	TRM:     "Teleradio-Moldova",
	TVE:     "Televisión Española",
	TVP:     "Telewizja Polska",
	TVR:     "Televiziunea Română",
	"UA:PBC": "National Public Broadcasting Company of Ukraine",
	VRT:     "Vlaamse Radio- en Televisieomroeporganisatie",
	YLE:     "Yleisradio",
	ČT:      "Česká televize",
};

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
	const full = BROADCASTER_FULL[normalised];
	return full ? `${full} (${normalised})` : normalised;
}

export function resolveContestBroadcasters(year: number, broadcasters: string[]): string[] {
	return (BROADCASTER_YEAR_OVERRIDES[year] ?? broadcasters).map(expandBroadcaster);
}

export function ordinal(n: number): string {
	const s = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
	return `${n}${s}`;
}
