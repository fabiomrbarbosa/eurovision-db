/**
 * Single source of truth for all broadcaster metadata:
 *   full  — expanded name shown in the UI (absent = display code as-is)
 *   src   — EBU download URL (absent = no logo to fetch)
 *   dest  — public path served by Astro (absent = no logo available)
 *
 * Consumed by:
 *   scripts/fetch-broadcaster-logos.ts → downloads src → dest
 *   src/lib/utils.ts → expandBroadcaster(), broadcasterLogoUrl()
 *
 * Keys match the raw broadcaster string from ContestantDetail.broadcaster
 * before any expansion. ARD is intentionally omitted from `full` (consortium
 * label; regional member is injected via BROADCASTER_YEAR_OVERRIDES in utils.ts).
 */

export interface BroadcasterEntry {
	full?: string;
	src?: string;
	dest?: string;
	square?: true;
}

const ACT =
	"https://www.ebu.ch/files/live/sites/ebu/files/Logos/Members/Active%20Members/";

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
	BNT: {
		full: "Bulgarian National Television",
		dest: "/images/broadcasters/bnt.svg",
	},
	BR: {
		full: "Bayerischer Rundfunk",
		dest: "/images/broadcasters/br.svg",
		square: true,
	},
	BRT: {
		full: "Belgische Radio en Televisie",
		dest: "/images/broadcasters/brt.png",
	},
	BRTN: {
		full: "Belgische Radio en Televisieomroep Nederlandstalig",
		dest: "/images/broadcasters/brt.png",
	},
	C1R: { full: "Channel One Russia" },
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
	IBA: { full: "Israeli Broadcasting Authority" },
	İctimai: {
		src: ACT + "Azerbaijan_ITV.png",
		dest: "/images/broadcasters/itv.png",
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
	MKRTV: {
		src: ACT + "FYR%20of%20Macedonia%20-%20MKRTV.jpg",
		dest: "/images/broadcasters/mkrtv.jpg",
	},
	MRT: {
		full: "Macedonian Radio-Television",
		dest: "/images/broadcasters/mrt.png",
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
	ORTF: { full: "Office de Radiodiffusion Télévision Française" },
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
		src: ACT + "Montenegro%20-%20RTCG.png",
		dest: "/images/broadcasters/rtcg.png",
	},
	RTF: { full: "Radiodiffusion-Télévision Française" },
	RTL: { full: "Radio Télé Luxembourg", dest: "/images/broadcasters/rtl.svg" },
	RTP: {
		full: "Rádio e Televisão de Portugal",
		dest: "/images/broadcasters/rtp.svg",
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
		src: ACT + "Andorre_RTVA.png",
		dest: "/images/broadcasters/rtva.png",
	},
	RTVSLO: {
		full: "Radiotelevizija Slovenija",
		dest: "/images/broadcasters/rtvslo.svg",
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
	"SRG SSR": {
		full: "Swiss Broadcasting Corporation",
		dest: "/images/broadcasters/srg-ssr.svg",
	},
	SR: {
		full: "Sveriges Radio",
		src: ACT + "Sweden_SR.jpg",
		dest: "/images/broadcasters/sr.jpg",
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
