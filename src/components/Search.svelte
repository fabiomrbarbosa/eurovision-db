<script lang="ts">
	// src/components/Search.svelte
	// Client-side search against the pre-fetched index JSON.
	// Fetches the index once on mount, then filters locally.

	import { onMount } from "svelte";
	import { countryFlagUrl } from "../lib/utils.ts";

	interface ContestantEntry {
		id: number;
		country: string;
		artist: string;
		song: string;
		finalPlace: number | null;
		finalPoints: number | null;
	}
	interface IndexEntry {
		year: number;
		city: string;
		country: string;
		slogan: string | null;
		winner: {
			contestantId: number;
			country: string;
			artist: string;
			song: string;
			points: number | null;
		} | null;
		contestants: ContestantEntry[];
	}

	interface SearchHit {
		type: "contest" | "song" | "country";
		flag: string;
		label: string;
		sublabel: string;
		href: string;
	}

	let query = $state("");
	let index: IndexEntry[] = $state([]);
	let countryMap: Record<string, string> = $state({});
	let hits: SearchHit[] = $state([]);
	let loading = $state(false);
	let open = $state(false);
	let activeIndex = $state(-1);
	let inputEl: HTMLInputElement;
	let listEl: HTMLUListElement = $state()!;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		loading = true;
		try {
			const [idxRes, cRes] = await Promise.all([
				fetch("/data/index.json"),
				fetch("/data/countries.json"),
			]);
			index = await idxRes.json();
			countryMap = await cRes.json();
		} catch (e) {
			console.warn("Search index not available:", e);
		} finally {
			loading = false;
		}
	});

	function countryName(code: string) {
		return countryMap[code] ?? code;
	}

	function normalize(s: string) {
		return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
	}

	$effect(() => {
		const qNorm = normalize(query.trim());
		if (debounceTimer) clearTimeout(debounceTimer);

		if (!qNorm || qNorm.length < 2) {
			hits = [];
			open = false;
			return;
		}

		debounceTimer = setTimeout(() => {
			const tokens = qNorm.split(/\s+/).filter(Boolean);

			// Every token must appear somewhere in the joined fields string.
			function matchAll(...fields: string[]): boolean {
				const combined = fields.join(" ");
				return tokens.every((t) => combined.includes(t));
			}

			const countryHits: SearchHit[] = [];
			const contestHits: SearchHit[] = [];
			const songHits: SearchHit[] = [];

			// Country pages — match all tokens against the country name.
			for (const [code, name] of Object.entries(countryMap)) {
				if (matchAll(normalize(name))) {
					countryHits.push({
						type: "country",
						flag: countryFlagUrl(code),
						label: name,
						sublabel: "",
						href: `/country/${code}/`,
					});
				}
			}
			countryHits.sort((a, b) => a.label.localeCompare(b.label));

			for (const entry of index) {
				const yearStr = String(entry.year);
				const cityNorm = normalize(entry.city);
				const hostNorm = normalize(countryName(entry.country));

				if (matchAll(yearStr, cityNorm, hostNorm)) {
					contestHits.push({
						type: "contest",
						flag: countryFlagUrl(entry.country),
						label: `${entry.year} · ${entry.city}`,
						sublabel: countryName(entry.country),
						href: `/contest/${entry.year}/`,
					});
				}

				// Single year/city token → show all songs for that edition sorted by place.
				// Multi-token → filter to songs where all tokens match the combined song text.
				const isYearCityOnly =
					tokens.length === 1 &&
					(yearStr.includes(tokens[0]) || cityNorm.includes(tokens[0]));

				if (isYearCityOnly) {
					const sorted = [...entry.contestants].sort((a, b) => {
						if (a.finalPlace !== null && b.finalPlace !== null)
							return a.finalPlace - b.finalPlace;
						if (a.finalPlace !== null) return -1;
						if (b.finalPlace !== null) return 1;
						return (b.finalPoints ?? -1) - (a.finalPoints ?? -1);
					});
					for (const c of sorted) {
						songHits.push({
							type: "song",
							flag: countryFlagUrl(c.country),
							label: `${c.artist} — ${c.song}`,
							sublabel: `${countryName(c.country)} · ${entry.year}`,
							href: `/contest/${entry.year}/song/${c.id + 1}/`,
						});
					}
				} else {
					for (const c of entry.contestants) {
						if (
							matchAll(
								normalize(c.artist),
								normalize(c.song),
								normalize(countryName(c.country)),
								yearStr,
								cityNorm,
							)
						) {
							songHits.push({
								type: "song",
								flag: countryFlagUrl(c.country),
								label: `${c.artist} — ${c.song}`,
								sublabel: `${countryName(c.country)} · ${entry.year}`,
								href: `/contest/${entry.year}/song/${c.id + 1}/`,
							});
						}
					}
				}
			}

			hits = [...countryHits, ...contestHits, ...songHits].slice(0, 40);
			activeIndex = -1;
			open = hits.length > 0;
		}, 150);
	});

	function scrollActive() {
		if (!listEl) return;
		const item = listEl.querySelector(
			`[data-idx="${activeIndex}"]`,
		) as HTMLElement | null;
		item?.scrollIntoView({ block: "nearest" });
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === "Escape") {
			query = "";
			open = false;
			activeIndex = -1;
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!open && hits.length) {
				open = true;
				return;
			}
			activeIndex = Math.min(activeIndex + 1, hits.length - 1);
			scrollActive();
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, -1);
			scrollActive();
		} else if (e.key === "Enter" && activeIndex >= 0) {
			e.preventDefault();
			select(hits[activeIndex].href);
		}
	}

	function select(href: string) {
		window.location.href = href;
	}
</script>

<div class="search-root">
	<div class="search-box" class:loading>
		<span class="search-icon mono">⌕</span>
		<input
			bind:this={inputEl}
			bind:value={query}
			onkeydown={handleKey}
			onfocus={() => {
				if (hits.length) open = true;
			}}
			type="search"
			role="combobox"
			aria-expanded={open}
			aria-haspopup="listbox"
			aria-controls="search-listbox"
			aria-activedescendant={activeIndex >= 0
				? `result-${activeIndex}`
				: undefined}
			placeholder="Search contests, artists, songs, countries…"
			autocomplete="off"
			spellcheck="false"
		/>
	</div>

	{#if open && hits.length > 0}
		<ul class="results" role="listbox" id="search-listbox" bind:this={listEl}>
			{#each hits as hit, i}
				<li
					id="result-{i}"
					data-idx={i}
					role="option"
					aria-selected={i === activeIndex}
					class:active={i === activeIndex}
					onclick={() => select(hit.href)}
					onkeydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							select(hit.href);
						}
					}}
					onmouseenter={() => {
						activeIndex = i;
					}}
					tabindex="-1"
				>
					<img class="hit-flag" src={hit.flag} alt="" />
					<span class="hit-label">{hit.label}</span>
					<span class="hit-sub">{hit.sublabel}</span>
					<span class="hit-badge hit-badge--{hit.type}">{hit.type}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.search-root {
		position: relative;
		width: 100%;
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--c-surface);
		border: 1px solid var(--c-border);
		border-radius: var(--radius);
		padding: 0.6rem 1rem;
		transition: border-color 0.15s;
	}
	.search-box:focus-within {
		border-color: var(--c-gold-dim);
		outline: none;
	}
	.search-icon {
		color: var(--c-muted);
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	input {
		flex: 1;
		background: none;
		border: none;
		color: var(--c-text);
		font-family: var(--f-body);
		font-size: 0.95rem;
		outline: none;
	}
	input::placeholder {
		color: var(--c-muted);
	}
	input::-webkit-search-cancel-button {
		display: none;
	}

	.results {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		background: var(--c-surface);
		border: 1px solid var(--c-border);
		border-radius: var(--radius);
		overflow: hidden;
		max-height: 380px;
		overflow-y: auto;
		z-index: 200;
		list-style: none;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.65rem 1rem;
		cursor: pointer;
		border-bottom: 1px solid
			color-mix(in srgb, var(--c-border) 50%, transparent);
		transition: background 0.1s;
	}

	.hit-flag {
		display: inline-block;
		height: 1.1em;
		width: auto;
		flex-shrink: 0;
	}
	li:last-child {
		border-bottom: none;
	}
	li:hover,
	li.active {
		background: var(--c-hover);
		outline: none;
	}

	.hit-label {
		font-size: 0.9rem;
		flex-shrink: 0;
	}
	.hit-sub {
		font-size: 0.78rem;
		color: var(--c-muted);
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.hit-badge {
		font-family: var(--f-mono);
		font-size: 0.65rem;
		padding: 0.1em 0.4em;
		border-radius: var(--radius);
		border: 1px solid;
		flex-shrink: 0;
	}
	.hit-badge--contest {
		background: var(--c-surface-gold);
		border-color: var(--c-gold-dim);
		color: var(--c-gold);
	}
	.hit-badge--country {
		background: color-mix(in srgb, var(--c-cyan) 10%, transparent);
		border-color: color-mix(in srgb, var(--c-cyan) 30%, transparent);
		color: var(--c-cyan);
	}
	.hit-badge--song {
		background: color-mix(in srgb, var(--c-magenta) 10%, transparent);
		border-color: color-mix(in srgb, var(--c-magenta) 30%, transparent);
		color: var(--c-magenta);
	}
</style>
