<script lang="ts">
  import ScoreBreakdown from './ScoreBreakdown.svelte';
  import { countryFlag } from '../lib/utils.ts';

  interface Score {
    name: string;
    points: number | null;
    votes: Record<string, number>;
  }

  interface SemiEntry {
    running: number | null;
    place: number | null;
    country: string;
    countryName: string;
    artist: string;
    song: string;
    total: number | null;
    qualified: boolean;
    scores: Score[];
  }

  interface SemiRound {
    label: string;
    date: string | null;
    entries: SemiEntry[];
  }

  interface FinalEntry {
    country: string;
    countryName: string;
    artist: string;
    song: string;
    finalPlace: number | null;
    finalTotal: number | null;
    finalJury: number | null;
    finalTele: number | null;
    scores: Score[];
  }

  let {
    semiRounds,
    finalists,
    countries,
    hasJuryTele,
  }: {
    semiRounds: SemiRound[];
    finalists: FinalEntry[];
    countries: Record<string, string>;
    hasJuryTele: boolean;
  } = $props();

  // Grand Final is always the last tab; semiRounds may be empty
  const tabs = [...semiRounds.map(r => r.label), 'Grand Final'];
  let activeIdx = $state(semiRounds.length); // default to Grand Final

  const isGrandFinal = $derived(activeIdx === semiRounds.length);

  const semiSorted = $derived(
    isGrandFinal
      ? ([] as SemiEntry[])
      : [...semiRounds[activeIdx].entries].sort((a, b) => {
          if (a.place === null && b.place === null) return (a.running ?? 0) - (b.running ?? 0);
          if (a.place === null) return 1;
          if (b.place === null) return -1;
          return a.place - b.place;
        })
  );

  const semiBreakdownResults = $derived(
    semiSorted.map(e => ({
      country: e.country,
      countryName: e.countryName,
      place: e.place,
      scores: e.scores as { name: string; points: number; votes: Record<string, number> }[],
    }))
  );

  const finalBreakdownResults = $derived(
    finalists.map(r => ({
      country: r.country,
      countryName: r.countryName,
      place: r.finalPlace,
      scores: r.scores as { name: string; points: number; votes: Record<string, number> }[],
    }))
  );

  const activeSemiDate = $derived(
    !isGrandFinal ? semiRounds[activeIdx]?.date : null
  );

  // Detect jury/tele split from the actual scores in the active semi round
  const semiHasJuryTele = $derived(
    !isGrandFinal &&
    semiRounds[activeIdx].entries.some(e =>
      e.scores.some(s => s.name === 'jury' && s.points !== null)
    )
  );
</script>

<div class="contest-tabs">
  <div class="tab-bar" role="tablist">
    {#each tabs as label, i}
      <button
        role="tab"
        aria-selected={activeIdx === i}
        class="tab-btn"
        class:active={activeIdx === i}
        onclick={() => { activeIdx = i; }}
      >
        {label}
      </button>
    {/each}
  </div>

  {#if isGrandFinal}
    <!-- Grand Final tab -->
    {#if finalists.length > 0}
      <table class="results-table">
        <thead>
          <tr>
            <th class="col-place">#</th>
            <th>Country</th>
            <th>Artist</th>
            <th>Song</th>
            {#if hasJuryTele}
              <th class="right">Jury</th>
              <th class="right">Tele</th>
            {/if}
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          {#each finalists as r}
            <tr class:row--winner={r.finalPlace === 1}>
              <td class="place-cell mono">
                {#if r.finalPlace === 1}
                  <span class="gold">🏆</span>
                {:else}
                  <span class="muted">{r.finalPlace ?? '—'}</span>
                {/if}
              </td>
              <td>
                <a href={`/country/${r.country}`} class="country-link">
                  <span class="flag">{countryFlag(r.country)}</span>{r.countryName}
                </a>
              </td>
              <td>{r.artist}</td>
              <td class="song-cell"><em>{r.song}</em></td>
              {#if hasJuryTele}
                <td class="right mono muted">{r.finalJury ?? '—'}</td>
                <td class="right mono muted">{r.finalTele ?? '—'}</td>
              {/if}
              <td class="right mono">
                <span class:pts--gold={r.finalPlace === 1}>{r.finalTotal ?? '—'}</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      <div class="breakdown-wrapper">
        <p class="breakdown-hint muted">Select a country to see who voted for them.</p>
        {#key activeIdx}
          <ScoreBreakdown results={finalBreakdownResults} {countries} {hasJuryTele} />
        {/key}
      </div>
    {/if}

  {:else}
    <!-- Semi-final tab -->
    {#if activeSemiDate}
      <p class="semi-date mono muted">{activeSemiDate}</p>
    {/if}

    <table class="results-table">
      <thead>
        <tr>
          <th class="col-place">#</th>
          <th>Country</th>
          <th>Artist</th>
          <th>Song</th>
          {#if semiHasJuryTele}
            <th class="right">Jury</th>
            <th class="right">Tele</th>
          {/if}
          <th class="right">Total</th>
          <th class="col-q">Q</th>
        </tr>
      </thead>
      <tbody>
        {#each semiSorted as entry}
          <tr class:row-q={entry.qualified}>
            <td class="place-cell mono muted">{entry.place ?? '—'}</td>
            <td>
              <a href={`/country/${entry.country}`} class="country-link">
                <span class="flag">{countryFlag(entry.country)}</span>{entry.countryName}
              </a>
            </td>
            <td>{entry.artist}</td>
            <td class="song-cell"><em>{entry.song}</em></td>
            {#if semiHasJuryTele}
              <td class="right mono muted">{entry.scores.find(s => s.name === 'jury')?.points ?? '—'}</td>
              <td class="right mono muted">{entry.scores.find(s => s.name === 'public')?.points ?? '—'}</td>
            {/if}
            <td class="right mono">
              <span class:pts-gold={entry.qualified}>{entry.total ?? '—'}</span>
            </td>
            <td class="col-q">
              {#if entry.qualified}
                <span class="q-badge">Q</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <div class="breakdown-wrapper">
      <p class="breakdown-hint muted">Select a country to see who voted for them.</p>
      {#key activeIdx}
        <ScoreBreakdown results={semiBreakdownResults} {countries} hasJuryTele={semiHasJuryTele} />
      {/key}
    </div>
  {/if}
</div>

<style>
  /* ── Tabs ───────────────────────────────────────────────────── */
  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--c-border);
    margin-bottom: 1.5rem;
  }
  .tab-btn {
    font-family: var(--f-mono);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--c-muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 0.6rem 1.25rem;
    cursor: pointer;
    transition: color 0.12s, border-color 0.12s;
    margin-bottom: -1px;
  }
  .tab-btn:hover { color: var(--c-text); }
  .tab-btn.active {
    color: var(--c-gold);
    border-bottom-color: var(--c-gold);
  }

  /* ── Date ───────────────────────────────────────────────────── */
  .semi-date {
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    margin-bottom: 1rem;
  }

  /* ── Table ──────────────────────────────────────────────────── */
  .results-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    margin-bottom: 2.5rem;
  }
  .results-table th {
    font-family: var(--f-mono);
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--c-muted);
    font-weight: 400;
    padding: 0.6rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--c-border);
  }
  .results-table th.right { text-align: right; }
  .results-table td {
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);
    vertical-align: middle;
  }
  .results-table tr:hover td { background: var(--c-surface); }
  .results-table .right { text-align: right; }

  .col-place { width: 2.5rem; }
  .col-q { width: 2.5rem; text-align: center; }
  .place-cell { width: 2.5rem; }
  .song-cell em { color: var(--c-muted); }

  /* Grand Final winner row */
  .row--winner td { background: #1a1608; }
  .row--winner:hover td { background: #201c0a; }

  /* Semi qualified row */
  .row-q td { background: #0f130e; }
  .row-q:hover td { background: #141a12; }

  /* ── Score badges ───────────────────────────────────────────── */
  .q-badge {
    font-family: var(--f-mono);
    font-size: 0.68rem;
    font-weight: 500;
    color: #6abf69;
    letter-spacing: 0.05em;
  }
  .pts-gold { color: var(--c-gold); font-weight: 500; }
  .pts--gold { color: var(--c-gold); font-weight: 500; }

  /* ── Links ──────────────────────────────────────────────────── */
  .country-link { font-weight: 500; color: var(--c-text); }
  .country-link:hover { color: var(--c-gold); text-decoration: none; }
  .flag { font-family: sans-serif; margin-right: 0.3em; }

  /* ── Breakdown ──────────────────────────────────────────────── */
  .breakdown-wrapper { margin-top: 0.5rem; }
  .breakdown-hint {
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
</style>
