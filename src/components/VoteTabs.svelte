<script lang="ts">
	// src/components/VoteTabs.svelte
	import { countryFlagUrl } from "../lib/utils.ts";

	interface Voter {
		code: string;
		name: string;
		total: number;
		jury: number | null;
		tele: number | null;
	}

	interface VoteRound {
		label: string;
		voters: Voter[];
	}

	let {
		rounds,
		hasJuryTele = false,
	}: {
		rounds: VoteRound[];
		hasJuryTele: boolean;
	} = $props();

	let active = $state(rounds.length - 1); // default to last (Grand Final)

	$effect(() => {
		const handler = (e: Event) => {
			active = (e as CustomEvent<number>).detail;
		};
		window.addEventListener("vote-round", handler);
		return () => window.removeEventListener("vote-round", handler);
	});
</script>

{#if rounds.length > 1}
	<div class="tab-bar" role="tablist">
		{#each rounds as round, i}
			<button
				role="tab"
				aria-selected={active === i}
				class="tab-btn"
				class:active={active === i}
				onclick={() => (active = i)}
			>
				{round.label}
			</button>
		{/each}
	</div>
{/if}

<div class="table-scroll">
	<table class="votes-table">
		<thead>
			<tr>
				<th>Country</th>
				{#if hasJuryTele}
					<th class="right">Jury</th>
					<th class="right">Televote</th>
				{/if}
				<th class="right">Total</th>
			</tr>
		</thead>
		<tbody>
			{#each rounds[active].voters as v}
				<tr>
					<td
						><img class="flag" src={countryFlagUrl(v.code)} alt="" />
						{v.name}</td
					>
					{#if hasJuryTele}
						<td class="right mono muted">{v.jury ?? "—"}</td>
						<td class="right mono muted">{v.tele ?? "—"}</td>
					{/if}
					<td class="right mono pts">{v.total}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	/* ── Tab bar ────────────────────────────────────────────────── */
	.tab-bar {
		display: flex;
		gap: 0;
		border-bottom: 1px solid var(--c-border);
		margin-bottom: 0;
	}
	.tab-btn {
		font-family: var(--f-mono);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--c-muted);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		padding: 0.6rem 1rem;
		cursor: pointer;
		transition:
			color 0.12s,
			border-color 0.12s;
		margin-bottom: -1px;
	}
	.tab-btn:hover {
		color: var(--c-text);
	}
	.tab-btn.active {
		color: var(--c-gold);
		border-bottom-color: var(--c-gold);
	}

	/* ── Voter table ────────────────────────────────────────────── */
	.votes-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}
	.votes-table th {
		font-family: var(--f-mono);
		font-size: 0.67rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--c-muted);
		font-weight: 400;
		padding: 0.5rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--c-border);
	}
	.votes-table th.right {
		text-align: right;
	}
	.votes-table td {
		padding: 0.45rem 0.75rem;
		border-bottom: 1px solid
			color-mix(in srgb, var(--c-border) 40%, transparent);
	}
	.votes-table tr:hover td {
		background: var(--c-hover);
	}
	.votes-table .right {
		text-align: right;
	}
	.votes-table .pts {
		color: var(--c-gold);
		font-weight: 500;
	}
</style>
