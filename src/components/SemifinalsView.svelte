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

  let {
    rounds,
    countries,
  }: {
    rounds: SemiRound[];
    countries: Record<string, string>;
  } = $props();

  let activeIdx = $state(0);

  const sorted = $derived(
    [...rounds[activeIdx].entries].sort((a, b) => {
      if (a.place === null && b.place === null) return (a.running ?? 0) - (b.running ?? 0);
      if (a.place === null) return 1;
      if (b.place === null) return -1;
      return a.place - b.place;
    })
  );

  const breakdownResults = $derived(
    sorted.map(e => ({
      country: e.country,
      countryName: e.countryName,
      place: e.place,
      scores: e.scores as { name: string; points: number; votes: Record<string, number> }[],
    }))
  );
</script>

<div class="semi-view">
  <div class="tab-bar" role="tablist">
    {#each rounds as round, i}
      <button
        role="tab"
        aria-selected={activeIdx === i}
        class="tab-btn"
        class:active={activeIdx === i}
        onclick={() => { activeIdx = i; }}
      >
        {round.label}
      </button>
    {/each}
  </div>

  <div class="tab-content">
    {#if rounds[activeIdx].date}
      <p class="semi-date mono muted">{rounds[activeIdx].date}</p>
    {/if}

    <table class="semi-table">
      <thead>
        <tr>
          <th class="col-place">#</th>
          <th>Country</th>
          <th>Artist</th>
          <th>Song</th>
          <th class="right">Total</th>
          <th class="col-q">Q</th>
        </tr>
      </thead>
      <tbody>
        {#each sorted as entry}
          <tr class:row-q={entry.qualified}>
            <td class="place-cell mono muted">{entry.place ?? '—'}</td>
            <td>
              <a href={`/country/${entry.country}`} class="country-link">
                <span class="flag">{countryFlag(entry.country)}</span>{entry.countryName}
              </a>
            </td>
            <td>{entry.artist}</td>
            <td class="song-cell"><em>{entry.song}</em></td>
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
        <ScoreBreakdown results={breakdownResults} {countries} hasJuryTele={false} />
      {/key}
    </div>
  </div>
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
  .semi-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    margin-bottom: 2.5rem;
  }
  .semi-table th {
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
  .semi-table th.right { text-align: right; }
  .semi-table td {
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);
    vertical-align: middle;
  }
  .semi-table tr:hover td { background: var(--c-surface); }
  .semi-table .right { text-align: right; }

  .row-q td { background: #0f130e; }
  .row-q:hover td { background: #141a12; }

  .place-cell { width: 2.5rem; }
  .song-cell em { color: var(--c-muted); }
  .col-place { width: 2.5rem; }
  .col-q { width: 2.5rem; text-align: center; }

  /* ── Badges ─────────────────────────────────────────────────── */
  .q-badge {
    font-family: var(--f-mono);
    font-size: 0.68rem;
    font-weight: 500;
    color: #6abf69;
    letter-spacing: 0.05em;
  }
  .pts-gold { color: var(--c-gold); font-weight: 500; }

  /* ── Country link ───────────────────────────────────────────── */
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
