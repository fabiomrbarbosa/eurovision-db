/**
 * Single source of truth for all broadcaster metadata:
 *   full  — expanded name shown in the UI (absent = display code as-is)
 *   dest  — public path served by Astro (absent = no logo available)
 *
 * Consumed by:
 *   src/lib/utils.ts → expandBroadcaster(), broadcasterLogoUrl()
 *
 * Keys match the raw broadcaster string from ContestantDetail.broadcaster
 * before any expansion. ARD is intentionally omitted from `full` (consortium
 * label; regional member is injected via BROADCASTER_YEAR_OVERRIDES in utils.ts).
 */

export interface BroadcasterEntry {
	full?: string;
	dest?: string;
	square?: true;
	logoRef?: string; // borrow logo from another entry (historical → successor)
}

export const BROADCASTERS: Record<string, BroadcasterEntry> = {
	ARD: {
		dest: "/images/broadcasters/ard.svg",
	},
	AMPTV: {
		full: "Armenian Public Television",
		dest: "/images/broadcasters/amptv.svg",
		square: true,
	},
	AVROTROS: {
		dest: "/images/broadcasters/avrotros.svg",
		square: true,
	},
	BBC: {
		full: "British Broadcasting Corporation",
		dest: "/images/broadcasters/bbc.svg",
	},
	BHRT: {
		full: "Radiotelevizija Bosne i Hercegovine",
		dest: "/images/broadcasters/bhrt.svg",
	},
	BNT: {
		full: "Bulgarian National Television",
		dest: "/images/broadcasters/bnt.svg",
	},
	BTRC: {
		full: "Bielaruskaje telebachannie i radyjo",
		dest: "/images/broadcasters/btrc.svg",
	},
	BR: {
		full: "Bayerischer Rundfunk",
		dest: "/images/broadcasters/br.svg",
		square: true,
	},
	BRT: {
		full: "Belgische Radio en Televisie",
		logoRef: "VRT", // predecessor to VRT; show the living successor logo
	},
	BRTN: {
		full: "Belgische Radio en Televisieomroep Nederlandstalig",
		logoRef: "VRT", // predecessor to VRT; show the living successor logo
	},
	C1R: {
		full: "Channel One Russia",
		dest: "/images/broadcasters/c1r.svg",
		square: true,
	},
	CLT: { full: "Compagnie Luxembourgeoise de Télévision" },
	CyBC: {
		full: "Cyprus Broadcasting Corporation",
		dest: "/images/broadcasters/cybc.svg",
	},
	DR: {
		full: "Danmarks Radio",
		dest: "/images/broadcasters/dr.svg",
	},
	ERR: {
		full: "Eesti Rahvusringhääling",
		dest: "/images/broadcasters/err.svg",
	},
	ERT: {
		full: "Ellinikí Radiofonía Tileórasi",
		dest: "/images/broadcasters/ert.svg",
	},
	"Antenne 2": {
		logoRef: "France Télévisions",
	},
	"France 2": {
		logoRef: "France Télévisions",
	},
	"France 3": {
		logoRef: "France Télévisions",
	},
	"France Télévisions": {
		dest: "/images/broadcasters/francetv.svg",
	},
	GPB: {
		full: "Georgian Public Broadcasting",
		dest: "/images/broadcasters/gpb.svg",
	},
	HR: {
		full: "Hessischer Rundfunk",
		dest: "/images/broadcasters/hr.svg",
		square: true,
	},
	HRT: {
		full: "Hrvatska Radiotelevizija",
		dest: "/images/broadcasters/hrt.svg",
	},
	IBA: {
		full: "Israeli Broadcasting Authority",
		logoRef: "KAN",
	},
	İctimai: {
		dest: "/images/broadcasters/itv.svg",
		square: true,
	},
	JRT: {
		full: "Jugoslovenska Radiotelevizija",
		dest: "/images/broadcasters/jrt.svg",
		square: true,
	},
	KAN: {
		dest: "/images/broadcasters/kan.svg",
	},
	LRT: {
		full: "Lietuvos nacionalinis radijas ir televizija",
		dest: "/images/broadcasters/lrt.svg",
	},
	LTV: {
		full: "Latvijas Televīzija",
		dest: "/images/broadcasters/ltv.svg",
	},
	MTV: {
		full: "Magyar Televízió",
		dest: "/images/broadcasters/mtv.svg",
		square: true,
	},
	MKRTV: {
		full: "Macedonian Radio-Television",
		dest: "/images/broadcasters/mrt.svg",
	},
	NDR: {
		full: "Norddeutscher Rundfunk",
		dest: "/images/broadcasters/ndr.svg",
		square: true,
	},
	NOS: {
		full: "Nederlandse Omroep Stichting",
		dest: "/images/broadcasters/nos.svg",
	},
	NPO: {
		full: "Nederlandse Publieke Omroep",
		dest: "/images/broadcasters/npo.svg",
	},
	NRK: {
		full: "Norsk rikskringkasting",
		dest: "/images/broadcasters/nrk.svg",
	},
	ORTF: {
		full: "Office de Radiodiffusion Télévision Française",
		logoRef: "France Télévisions",
	},
	ORF: {
		full: "Österreichischer Rundfunk",
		dest: "/images/broadcasters/orf.svg",
	},
	PBS: {
		full: "Public Broadcasting Services",
		dest: "/images/broadcasters/pbs.svg",
	},
	RAI: {
		full: "Radiotelevisione Italiana",
		dest: "/images/broadcasters/rai.svg",
		square: true,
	},
	RTBF: {
		full: "Radio-Télévision belge de la Communauté française",
		dest: "/images/broadcasters/rtbf.svg",
	},
	RTCG: {
		full: "Radio-televizija Crne Gore",
		dest: "/images/broadcasters/rtcg.svg",
	},
	RTB: {
		full: "Radio Télévision Belge",
		logoRef: "RTBF",
	},
	RTF: {
		full: "Radiodiffusion-Télévision Française",
		logoRef: "France Télévisions",
	},
	RTL: { full: "Radio Télé Luxembourg", dest: "/images/broadcasters/rtl.svg" },
	RTR: {
		full: "All-Russia State Television and Radio Broadcasting Company",
		dest: "/images/broadcasters/rtr.svg",
	},
	RTP: {
		full: "Rádio e Televisão de Portugal",
		dest: "/images/broadcasters/rtp.svg",
	},
	RÉ: {
		full: "Radio Éireann",
		logoRef: "RTÉ", // pre-1962 name; RTÉ is the direct TV-era successor
	},
	RTÉ: {
		full: "Raidió Teilifís Éireann",
		dest: "/images/broadcasters/rte.svg",
	},
	RTS: {
		full: "Radio Televizija Srbije",
		dest: "/images/broadcasters/rts.svg",
	},
	RTSH: {
		full: "Radio Televizioni Shqiptar",
		dest: "/images/broadcasters/rtsh.svg",
	},
	RTVA: {
		full: "Ràdio i Televisió d'Andorra",
		dest: "/images/broadcasters/rtva.svg",
	},
	RTVSLO: {
		full: "Radiotelevizija Slovenija",
		dest: "/images/broadcasters/rtvslo.svg",
		square: true,
	},
	RÚV: {
		full: "Ríkisútvarpið",
		dest: "/images/broadcasters/ruv.svg",
	},
	SBS: {
		full: "Special Broadcasting Service",
		dest: "/images/broadcasters/sbs.svg",
	},
	SMRTV: {
		full: "San Marino RTV",
		dest: "/images/broadcasters/smrtv.svg",
		square: true,
	},
	SNRT: {
		full: "Société Nationale de Radiodiffusion et de Télévision",
		dest: "/images/broadcasters/snrt.svg",
		square: true,
	},
	"SRG SSR": {
		full: "Swiss Broadcasting Corporation",
		dest: "/images/broadcasters/srg-ssr.svg",
	},
	SR: {
		full: "Sveriges Radio",
		logoRef: "SVT", // old SR was the unified TV+radio org; SVT is the TV successor
	},
	STV: {
		full: "Slovenská televízia",
		logoRef: "STVR", // 2012 and earlier name; STVR is the 2025 rebrand
	},
	STVR: {
		full: "Slovenská televízia a rozhlas",
		dest: "/images/broadcasters/stv.png",
	},
	SVT: {
		full: "Sveriges Television",
		dest: "/images/broadcasters/svt.svg",
	},
	SWR: {
		full: "Südwestrundfunk",
		dest: "/images/broadcasters/swr.svg",
	},
	TF1: { full: "Télévision Française 1" },
	TMC: {
		full: "Télé Monte-Carlo",
		dest: "/images/broadcasters/tmc.svg",
	},
	TRM: {
		full: "Teleradio-Moldova",
		dest: "/images/broadcasters/trm.png",
	},
	RTVE: {
		full: "Radiotelevisión Española",
		dest: "/images/broadcasters/rtve.svg",
	},
	TVP: {
		full: "Telewizja Polska",
		dest: "/images/broadcasters/tvp.svg",
	},
	TRT: {
		full: "Türkiye Radyo ve Televizyon Kurumu",
		dest: "/images/broadcasters/trt.svg",
	},
	TVR: {
		full: "Televiziunea Română",
		dest: "/images/broadcasters/tvr.svg",
	},
	"UA:PBC": {
		full: "National Public Broadcasting Company of Ukraine",
		dest: "/images/broadcasters/ua-pbc.svg",
	},
	UJRT: {
		full: "Udruženje javnih radija i televizija",
		dest: "/images/broadcasters/ujrt.svg",
	},
	VRT: {
		full: "Vlaamse Radio- en Televisieomroeporganisatie",
		dest: "/images/broadcasters/vrt.svg",
	},
	YLE: {
		full: "Yleisradio",
		dest: "/images/broadcasters/yle.svg",
		square: true,
	},
	ČT: {
		full: "Česká televize",
		dest: "/images/broadcasters/ct.svg",
	},
};
