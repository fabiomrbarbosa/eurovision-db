/**
 * Single source of truth for all broadcaster metadata:
 *   full  — expanded name shown in the UI (absent = display code as-is)
 *   logo  — public path served by Astro (absent = no logo available)
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
	logo?: string;
	logoSquare?: true;
	logoRef?: string; // borrow logo from another entry (historical → successor)
}

export const BROADCASTERS: Record<string, BroadcasterEntry> = {
	ARD: {
		logo: "/images/broadcasters/ard.svg",
		logoSquare: true,
	},
	AMPTV: {
		full: "Armenian Public Television",
		logo: "/images/broadcasters/amptv.svg",
		logoSquare: true,
	},
	AVROTROS: {
		logo: "/images/broadcasters/avrotros.svg",
		logoSquare: true,
	},
	TROS: {
		full: "Televisie Radio Omroep Stichting",
		logo: "/images/broadcasters/tros.svg",
		logoSquare: true,
	},
	BBC: {
		full: "British Broadcasting Corporation",
		logo: "/images/broadcasters/bbc.svg",
	},
	BHRT: {
		full: "Radiotelevizija Bosne i Hercegovine",
		logo: "/images/broadcasters/bhrt.svg",
	},
	BNT: {
		full: "Bulgarian National Television",
		logo: "/images/broadcasters/bnt.svg",
	},
	BTRC: {
		full: "Bielaruskaje telebachannie i radyjo",
		logo: "/images/broadcasters/btrc.svg",
	},
	BR: {
		full: "Bayerischer Rundfunk",
		logo: "/images/broadcasters/br.svg",
		logoSquare: true,
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
		logo: "/images/broadcasters/c1r.svg",
		logoSquare: true,
	},
	CLT: { full: "Compagnie Luxembourgeoise de Télévision", logoRef: "RTL" },
	CyBC: {
		full: "Cyprus Broadcasting Corporation",
		logo: "/images/broadcasters/cybc.svg",
	},
	DR: {
		full: "Danmarks Radio",
		logo: "/images/broadcasters/dr.svg",
	},
	ERR: {
		full: "Eesti Rahvusringhääling",
		logo: "/images/broadcasters/err.svg",
	},
	ERT: {
		full: "Ellinikí Radiofonía Tileórasi",
		logo: "/images/broadcasters/ert.svg",
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
		logo: "/images/broadcasters/francetv.svg",
	},
	GPB: {
		full: "Georgian Public Broadcasting",
		logo: "/images/broadcasters/gpb.svg",
	},
	HR: {
		full: "Hessischer Rundfunk",
		logo: "/images/broadcasters/hr.svg",
		logoSquare: true,
	},
	HRT: {
		full: "Hrvatska Radiotelevizija",
		logo: "/images/broadcasters/hrt.svg",
	},
	IBA: {
		full: "Israeli Broadcasting Authority",
		logo: "/images/broadcasters/iba.svg",
		logoSquare: true,
	},
	İctimai: {
		logo: "/images/broadcasters/itv.svg",
		logoSquare: true,
	},
	JRT: {
		full: "Jugoslovenska Radiotelevizija",
		logo: "/images/broadcasters/jrt.svg",
		logoSquare: true,
	},
	IPBC: {
		full: "Israeli Public Broadcasting Corporation",
		logoRef: "KAN", // IPBC rebranded to KAN in 2017
	},
	KAN: {
		logo: "/images/broadcasters/kan.svg",
		logoSquare: true,
	},
	LRT: {
		full: "Lietuvos nacionalinis radijas ir televizija",
		logo: "/images/broadcasters/lrt.svg",
	},
	LTV: {
		full: "Latvijas Televīzija",
		logo: "/images/broadcasters/ltv.svg",
	},
	MTV: {
		full: "Magyar Televízió",
		logo: "/images/broadcasters/mtv.svg",
		logoSquare: true,
	},
	MKRTV: {
		full: "Macedonian Radio-Television",
		logo: "/images/broadcasters/mrt.svg",
	},
	NDR: {
		full: "Norddeutscher Rundfunk",
		logo: "/images/broadcasters/ndr.svg",
		logoSquare: true,
	},
	NOS: {
		full: "Nederlandse Omroep Stichting",
		logo: "/images/broadcasters/nos.svg",
	},
	NPO: {
		full: "Nederlandse Publieke Omroep",
		logo: "/images/broadcasters/npo.svg",
	},
	NRK: {
		full: "Norsk rikskringkasting",
		logo: "/images/broadcasters/nrk.svg",
	},
	ORTF: {
		full: "Office de Radiodiffusion Télévision Française",
		logoRef: "France Télévisions",
	},
	ORF: {
		full: "Österreichischer Rundfunk",
		logo: "/images/broadcasters/orf.svg",
	},
	PBS: {
		full: "Public Broadcasting Services",
		logo: "/images/broadcasters/pbs.svg",
	},
	RAI: {
		full: "Radiotelevisione Italiana",
		logo: "/images/broadcasters/rai.svg",
		logoSquare: true,
	},
	RTBF: {
		full: "Radio-Télévision belge de la Communauté française",
		logo: "/images/broadcasters/rtbf.svg",
	},
	RTCG: {
		full: "Radio-televizija Crne Gore",
		logo: "/images/broadcasters/rtcg.svg",
	},
	TVCG: {
		full: "Televizija Crne Gore",
		logoRef: "RTCG", // historical name used during Serbia & Montenegro era (e.g. 2005); successor is RTCG
	},
	RTB: {
		full: "Radio Télévision Belge",
		logoRef: "RTBF",
	},
	RTF: {
		full: "Radiodiffusion-Télévision Française",
		logoRef: "France Télévisions",
	},
	RTL: { full: "Radio Télé Luxembourg", logo: "/images/broadcasters/rtl.svg" },
	RTR: {
		full: "All-Russia State Television and Radio Broadcasting Company",
		logo: "/images/broadcasters/rtr.svg",
	},
	RTP: {
		full: "Rádio e Televisão de Portugal",
		logo: "/images/broadcasters/rtp.svg",
	},
	RÉ: {
		full: "Radio Éireann",
		logoRef: "RTÉ", // pre-1962 name; RTÉ is the direct TV-era successor
	},
	RTÉ: {
		full: "Raidió Teilifís Éireann",
		logo: "/images/broadcasters/rte.svg",
	},
	RTS: {
		full: "Radio Televizija Srbije",
		logo: "/images/broadcasters/rts.svg",
	},
	RTSH: {
		full: "Radio Televizioni Shqiptar",
		logo: "/images/broadcasters/rtsh.svg",
	},
	RTVA: {
		full: "Ràdio i Televisió d'Andorra",
		logo: "/images/broadcasters/rtva.svg",
	},
	RTVSLO: {
		full: "Radiotelevizija Slovenija",
		logo: "/images/broadcasters/rtvslo.svg",
		logoSquare: true,
	},
	RÚV: {
		full: "Ríkisútvarpið",
		logo: "/images/broadcasters/ruv.svg",
	},
	SBS: {
		full: "Special Broadcasting Service",
		logo: "/images/broadcasters/sbs.svg",
		logoSquare: true,
	},
	SMRTV: {
		full: "San Marino RTV",
		logo: "/images/broadcasters/smrtv.svg",
		logoSquare: true,
	},
	SNRT: {
		full: "Société Nationale de Radiodiffusion et de Télévision",
		logo: "/images/broadcasters/snrt.svg",
		logoSquare: true,
	},
	"SRG SSR": {
		full: "Swiss Broadcasting Corporation",
		logo: "/images/broadcasters/srg-ssr.svg",
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
		logo: "/images/broadcasters/stv.png",
	},
	SVT: {
		full: "Sveriges Television",
		logo: "/images/broadcasters/svt.svg",
	},
	SWR: {
		full: "Südwestrundfunk",
		logo: "/images/broadcasters/swr.svg",
	},
	TF1: { full: "Télévision Française 1" },
	TMC: {
		full: "Télé Monte-Carlo",
		logo: "/images/broadcasters/tmc.svg",
	},
	TRM: {
		full: "Teleradio-Moldova",
		logo: "/images/broadcasters/trm.png",
	},
	RTVE: {
		full: "Radiotelevisión Española",
		logo: "/images/broadcasters/rtve.svg",
	},
	TVP: {
		full: "Telewizja Polska",
		logo: "/images/broadcasters/tvp.svg",
	},
	TRT: {
		full: "Türkiye Radyo ve Televizyon Kurumu",
		logo: "/images/broadcasters/trt.svg",
	},
	TVR: {
		full: "Televiziunea Română",
		logo: "/images/broadcasters/tvr.svg",
	},
	NTU: {
		full: "National Television Company of Ukraine",
		logoRef: "UA:PBC", // television predecessor of NSTU; role transferred when public broadcaster formed in 2017
	},
	"UA:PBC": {
		full: "National Public Broadcasting Company of Ukraine",
		logo: "/images/broadcasters/ua-pbc.svg",
	},
	UJRT: {
		full: "Udruženje javnih radija i televizija",
		logo: "/images/broadcasters/ujrt.svg",
	},
	VRT: {
		full: "Vlaamse Radio- en Televisieomroeporganisatie",
		logo: "/images/broadcasters/vrt.svg",
	},
	YLE: {
		full: "Yleisradio",
		logo: "/images/broadcasters/yle.svg",
		logoSquare: true,
	},
	ČT: {
		full: "Česká televize",
		logo: "/images/broadcasters/ct.svg",
	},
};
