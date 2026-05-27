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
}

const ACT =
	"https://www.ebu.ch/files/live/sites/ebu/files/Logos/Members/Active%20Members/";

export const BROADCASTERS: Record<string, BroadcasterEntry> = {
	ARD: {
		dest: "/images/broadcasters/ard.svg",
	},
	AMPTV: {
		full: "Armenian Public Television",
		src: ACT + "Armenia_AMPTV.png",
		dest: "/images/broadcasters/amptv.png",
	},
	AVROTROS: {
		dest: "/images/broadcasters/avrotros.svg",
	},
	BBC: {
		full: "British Broadcasting Corporation",
		dest: "/images/broadcasters/bbc.svg",
	},
	BNT: {
		full: "Bulgarian National Television",
		dest: "/images/broadcasters/bnt.svg",
	},
	BR: { full: "Bayerischer Rundfunk", dest: "/images/broadcasters/br.svg" },
	BRT: {
		full: "Belgische Radio en Televisie",
		dest: "/images/broadcasters/brt.svg",
	},
	BRTN: {
		full: "Belgische Radio en Televisieomroep Nederlandstalig",
		dest: "/images/broadcasters/brt.svg",
	},
	C1R: { full: "Channel One Russia" },
	CLT: { full: "Compagnie Luxembourgeoise de Télévision" },
	CyBC: {
		full: "Cyprus Broadcasting Corporation",
		src: ACT + "Cyprus%20-%20CY_CBC.png",
		dest: "/images/broadcasters/cybc.png",
	},
	DR: {
		full: "Danmarks Radio",
		src: ACT + "Denmark%20-%20DR.png",
		dest: "/images/broadcasters/dr.png",
	},
	ERR: {
		full: "Eesti Rahvusringhääling",
		src: ACT + "Estonia_ERR.png",
		dest: "/images/broadcasters/err.png",
	},
	ERT: {
		full: "Ellinikí Radiofonía Tileórasi",
		src: ACT + "Greece%20-%20ERT.png",
		dest: "/images/broadcasters/ert.png",
	},
	GPB: {
		full: "Georgian Public Broadcasting",
		src: ACT + "Georgia-GPB.png",
		dest: "/images/broadcasters/gpb.png",
	},
	HR: { full: "Hessischer Rundfunk", dest: "/images/broadcasters/hr.svg" },
	HRT: {
		full: "Hrvatska Radiotelevizija",
		src: ACT + "Croatia_HRT.png",
		dest: "/images/broadcasters/hrt.png",
	},
	IBA: { full: "Israeli Broadcasting Authority" },
	İctimai: {
		src: ACT + "Azerbaijan_ITV.png",
		dest: "/images/broadcasters/itv.png",
	},
	JRT: { full: "Jugoslovenska Radiotelevizija" },
	KAN: {
		dest: "/images/broadcasters/kan.svg",
	},
	LRT: {
		full: "Lietuvos nacionalinis radijas ir televizija",
		dest: "/images/broadcasters/lrt.svg",
	},
	LTV: {
		full: "Latvijas Televīzija",
		src: ACT + "Latvia%20-%20LSM.png",
		dest: "/images/broadcasters/ltv.png",
	},
	MKRTV: {
		src: ACT + "FYR%20of%20Macedonia%20-%20MKRTV.jpg",
		dest: "/images/broadcasters/mkrtv.jpg",
	},
	MRT: { full: "Macedonian Radio-Television" },
	NDR: { full: "Norddeutscher Rundfunk", dest: "/images/broadcasters/ndr.svg" },
	NOS: {
		full: "Nederlandse Omroep Stichting",
		dest: "/images/broadcasters/nos.svg",
	},
	NPO: {
		full: "Nederlandse Publieke Omroep",
		src: ACT + "Netherlands%20-%20NPO.png",
		dest: "/images/broadcasters/npo.png",
	},
	NRK: {
		full: "Norsk rikskringkasting",
		src: ACT + "Norway_NRK.jpg",
		dest: "/images/broadcasters/nrk.jpg",
	},
	ORF: {
		full: "Österreichischer Rundfunk",
		src: ACT + "Autriche_ORF.png",
		dest: "/images/broadcasters/orf.png",
	},
	PBS: {
		full: "Public Broadcasting Services",
		src: ACT + "Malta%20-%20PBS.png",
		dest: "/images/broadcasters/pbs.png",
	},
	RAI: {
		full: "Radiotelevisione Italiana",
		dest: "/images/broadcasters/rai.svg",
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
	RTL: { full: "Radio Télé Luxembourg", dest: "/images/broadcasters/rtl.png" },
	RTP: {
		full: "Rádio e Televisão de Portugal",
		dest: "/images/broadcasters/rtp.svg",
	},
	RTÉ: {
		full: "Raidió Teilifís Éireann",
		src: ACT + "Ireland%20-%20RTE.jpg",
		dest: "/images/broadcasters/rte.jpg",
	},
	RTS: {
		full: "Radio Televizija Srbije",
		src: ACT + "Serbie_rts.png",
		dest: "/images/broadcasters/rts.png",
	},
	RTSH: {
		full: "Radio Televizioni Shqiptar",
		src: ACT + "Albanie-RTSH.png",
		dest: "/images/broadcasters/rtsh.png",
	},
	RTVA: {
		full: "Ràdio i Televisió d'Andorra",
		src: ACT + "Andorre_RTVA.png",
		dest: "/images/broadcasters/rtva.png",
	},
	RTVSLO: {
		full: "Radiotelevizija Slovenija",
		src: ACT + "Slovenie_RTVSLO.jpg",
		dest: "/images/broadcasters/rtvslo.jpg",
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
		src: ACT + "SanMarino-RTV.jpg",
		dest: "/images/broadcasters/smrtv.jpg",
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
		src: ACT + "Sweden_SVT.png",
		dest: "/images/broadcasters/svt.png",
	},
	SWR: { full: "Südwestrundfunk", dest: "/images/broadcasters/swr.svg" },
	TF1: { full: "Télévision Française 1" },
	TRM: { full: "Teleradio-Moldova" },
	TVE: {
		full: "Televisión Española",
		src: ACT + "Spain_RTVE.png",
		dest: "/images/broadcasters/tve.png",
	},
	TVP: {
		full: "Telewizja Polska",
		src: ACT + "Pologne_TVP.jpg",
		dest: "/images/broadcasters/tvp.jpg",
	},
	TVR: {
		full: "Televiziunea Română",
		src: ACT + "Roumanie_TVR.jpg",
		dest: "/images/broadcasters/tvr.jpg",
	},
	"UA:PBC": {
		full: "National Public Broadcasting Company of Ukraine",
		src: ACT + "Ukraine_Suspilne.png",
		dest: "/images/broadcasters/ua-pbc.png",
	},
	VRT: {
		full: "Vlaamse Radio- en Televisieomroeporganisatie",
		dest: "/images/broadcasters/vrt.svg",
	},
	YLE: {
		full: "Yleisradio",
		src: ACT + "Finland-YLE.png",
		dest: "/images/broadcasters/yle.png",
	},
	ČT: {
		full: "Česká televize",
		src: ACT + "Czech_Republic_CT.png",
		dest: "/images/broadcasters/ct.png",
	},
};
