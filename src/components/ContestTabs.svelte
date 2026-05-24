<script lang="ts">
  import { untrack } from 'svelte';
  import ScoreBreakdown from './ScoreBreakdown.svelte';
  import { countryFlagUrl } from '../lib/utils.ts';

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
    running: number | null;
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

  // ── Tab state ────────────────────────────────────────────────
  const tabs = $derived([...semiRounds.map(r => r.label), 'Grand Final']);
  let activeIdx = $state(untrack(() => semiRounds.length)); // default to Grand Final
  const isGrandFinal = $derived(activeIdx === semiRounds.length);

  // ── Sort state ───────────────────────────────────────────────
  type SortKey = 'place' | 'running' | 'country' | 'artist' | 'song' | 'total' | 'jury' | 'tele';
  const defaultDir: Record<SortKey, 'asc' | 'desc'> = {
    place: 'asc', running: 'asc', country: 'asc', artist: 'asc', song: 'asc',
    total: 'desc', jury: 'desc', tele: 'desc',
  };

  let sortKey = $state<SortKey>('place');
  let sortDir = $state<'asc' | 'desc'>('asc');

  function switchTab(i: number) {
    activeIdx = i;
    sortKey = 'place';
    sortDir = 'asc';
  }

  function sortBy(key: SortKey) {
    if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortKey = key; sortDir = defaultDir[key]; }
  }

  // Nulls always sort last regardless of direction
  function cmp(a: string | number | null, b: string | number | null, dir: 'asc' | 'desc'): number {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    const raw = typeof a === 'string' && typeof b === 'string'
      ? a.localeCompare(b as string)
      : (a as number) - (b as number);
    return dir === 'asc' ? raw : -raw;
  }

  // ── Sorted data ──────────────────────────────────────────────
  const finalSorted = $derived.by(() =>
    [...finalists].sort((a, b) => {
      switch (sortKey) {
        case 'running': return cmp(a.running, b.running, sortDir);
        case 'country': return cmp(a.countryName, b.countryName, sortDir);
        case 'artist':  return cmp(a.artist, b.artist, sortDir);
        case 'song':    return cmp(a.song, b.song, sortDir);
        case 'total':   return cmp(a.finalTotal, b.finalTotal, sortDir);
        case 'jury':    return cmp(a.finalJury, b.finalJury, sortDir);
        case 'tele':    return cmp(a.finalTele, b.finalTele, sortDir);
        default:        return cmp(a.finalPlace, b.finalPlace, sortDir);
      }
    })
  );

  const semiSorted = $derived.by(() => {
    if (isGrandFinal) return [] as SemiEntry[];
    return [...semiRounds[activeIdx].entries].sort((a, b) => {
      switch (sortKey) {
        case 'country': return cmp(a.countryName, b.countryName, sortDir);
        case 'artist':  return cmp(a.artist, b.artist, sortDir);
        case 'song':    return cmp(a.song, b.song, sortDir);
        case 'running': return cmp(a.running, b.running, sortDir);
        case 'total':   return cmp(a.total, b.total, sortDir);
        case 'jury':    return cmp(a.scores.find(s => s.name === 'jury')?.points ?? null, b.scores.find(s => s.name === 'jury')?.points ?? null, sortDir);
        case 'tele':    return cmp(a.scores.find(s => s.name === 'public')?.points ?? null, b.scores.find(s => s.name === 'public')?.points ?? null, sortDir);
        default:
          if (a.place === null && b.place === null) return cmp(a.running, b.running, 'asc');
          return cmp(a.place, b.place, sortDir);
      }
    });
  });

  const finalBreakdownResults = $derived(
    finalSorted.map(r => ({
      country: r.country,
      countryName: r.countryName,
      place: r.finalPlace,
      scores: r.scores as { name: string; points: number; votes: Record<string, number> }[],
    }))
  );

  const semiBreakdownResults = $derived(
    semiSorted.map(e => ({
      country: e.country,
      countryName: e.countryName,
      place: e.place,
      scores: e.scores as { name: string; points: number; votes: Record<string, number> }[],
    }))
  );

  const activeSemiDate = $derived(!isGrandFinal ? semiRounds[activeIdx]?.date : null);

  const semiHasJuryTele = $derived(
    !isGrandFinal &&
    semiRounds[activeIdx].entries.some(e =>
      e.scores.some(s => s.name === 'jury' && s.points !== null)
    )
  );

  const finalHasScores = $derived(finalists.some(r => r.scores.length > 0));
  const semiHasScores = $derived(
    !isGrandFinal && semiRounds[activeIdx].entries.some(e => e.scores.length > 0)
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
        onclick={() => switchTab(i)}
      >
        {label}
      </button>
    {/each}
  </div>

  {#if isGrandFinal}
    <!-- Grand Final tab -->
    {#if finalists.length > 0}
      <div class="table-scroll">
      <table class="results-table">
        <thead>
          <tr>
            <th class="col-place th-sort" class:sorted={sortKey === 'place'} class:sorted-desc={sortKey === 'place' && sortDir === 'desc'} onclick={() => sortBy('place')}>#</th>
            <th class="col-run th-sort" class:sorted={sortKey === 'running'} class:sorted-desc={sortKey === 'running' && sortDir === 'desc'} onclick={() => sortBy('running')}>Run</th>
            <th class="th-sort" class:sorted={sortKey === 'country'} class:sorted-desc={sortKey === 'country' && sortDir === 'desc'} onclick={() => sortBy('country')}>Country</th>
            <th class="th-sort" class:sorted={sortKey === 'artist'} class:sorted-desc={sortKey === 'artist' && sortDir === 'desc'} onclick={() => sortBy('artist')}>Artist</th>
            <th class="th-sort" class:sorted={sortKey === 'song'} class:sorted-desc={sortKey === 'song' && sortDir === 'desc'} onclick={() => sortBy('song')}>Song</th>
            {#if hasJuryTele}
              <th class="right th-sort" class:sorted={sortKey === 'jury'} class:sorted-desc={sortKey === 'jury' && sortDir === 'desc'} onclick={() => sortBy('jury')}>Jury</th>
              <th class="right th-sort" class:sorted={sortKey === 'tele'} class:sorted-desc={sortKey === 'tele' && sortDir === 'desc'} onclick={() => sortBy('tele')}>Tele</th>
            {/if}
            <th class="right th-sort" class:sorted={sortKey === 'total'} class:sorted-desc={sortKey === 'total' && sortDir === 'desc'} onclick={() => sortBy('total')}>Total</th>
          </tr>
        </thead>
        <tbody>
          {#each finalSorted as r}
            <tr class:row--winner={r.finalPlace === 1}>
              <td class="place-cell mono">
                {#if r.finalPlace === 1}
                  <span class="gold">🏆</span>
                {:else}
                  <span>{r.finalPlace ?? '—'}</span>
                {/if}
              </td>
              <td class="run-cell mono muted">{r.running ?? '—'}</td>
              <td>
                <a href={`/country/${r.country}`} class="country-link">
                  <img class="flag" src={countryFlagUrl(r.country)} alt="" />{r.countryName}
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
      </div>

      {#if finalHasScores}
        <div class="breakdown-wrapper">
          <p class="breakdown-hint muted">Select a country to see who voted for them.</p>
          {#key activeIdx}
            <ScoreBreakdown results={finalBreakdownResults} {countries} {hasJuryTele} />
          {/key}
        </div>
      {/if}
    {/if}

  {:else}
    <!-- Semi-final tab -->
    {#if activeSemiDate}
      <p class="semi-date mono muted">{activeSemiDate}</p>
    {/if}

    <div class="table-scroll">
    <table class="results-table">
      <thead>
        <tr>
          <th class="col-place th-sort" class:sorted={sortKey === 'place'} class:sorted-desc={sortKey === 'place' && sortDir === 'desc'} onclick={() => sortBy('place')}>#</th>
          <th class="col-run th-sort" class:sorted={sortKey === 'running'} class:sorted-desc={sortKey === 'running' && sortDir === 'desc'} onclick={() => sortBy('running')}>Run</th>
          <th class="th-sort" class:sorted={sortKey === 'country'} class:sorted-desc={sortKey === 'country' && sortDir === 'desc'} onclick={() => sortBy('country')}>Country</th>
          <th class="th-sort" class:sorted={sortKey === 'artist'} class:sorted-desc={sortKey === 'artist' && sortDir === 'desc'} onclick={() => sortBy('artist')}>Artist</th>
          <th class="th-sort" class:sorted={sortKey === 'song'} class:sorted-desc={sortKey === 'song' && sortDir === 'desc'} onclick={() => sortBy('song')}>Song</th>
          {#if semiHasJuryTele}
            <th class="right th-sort" class:sorted={sortKey === 'jury'} class:sorted-desc={sortKey === 'jury' && sortDir === 'desc'} onclick={() => sortBy('jury')}>Jury</th>
            <th class="right th-sort" class:sorted={sortKey === 'tele'} class:sorted-desc={sortKey === 'tele' && sortDir === 'desc'} onclick={() => sortBy('tele')}>Tele</th>
          {/if}
          <th class="right th-sort" class:sorted={sortKey === 'total'} class:sorted-desc={sortKey === 'total' && sortDir === 'desc'} onclick={() => sortBy('total')}>Total</th>
          <th class="col-q">Q</th>
        </tr>
      </thead>
      <tbody>
        {#each semiSorted as entry}
          <tr class:row-q={entry.qualified}>
            <td class="place-cell mono muted">{entry.place ?? '—'}</td>
            <td class="run-cell mono muted">{entry.running ?? '—'}</td>
            <td>
              <a href={`/country/${entry.country}`} class="country-link">
                <img class="flag" src={countryFlagUrl(entry.country)} alt="" />{entry.countryName}
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
    </div>

    {#if semiHasScores}
      <div class="breakdown-wrapper">
        <p class="breakdown-hint muted">Select a country to see who voted for them.</p>
        {#key activeIdx}
          <ScoreBreakdown results={semiBreakdownResults} {countries} hasJuryTele={semiHasJuryTele} />
        {/key}
      </div>
    {/if}
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
    white-space: nowrap;
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
  .col-run { width: 2.5rem; }
  .col-q { width: 2.5rem; text-align: center; }
  .place-cell { width: 2.5rem; }
  .run-cell { width: 2.5rem; }
  .song-cell em { color: var(--c-muted); }

  /* Grand Final winner row */
  .row--winner td { background: var(--c-surface-gold); }
  .row--winner:hover td { background: var(--c-surface-gold-hover); }

  /* Semi qualified row */
  .row-q td { background: var(--c-surface-green); }
  .row-q:hover td { background: var(--c-surface-green-hover); }

  /* ── Sortable headers ───────────────────────────────────────── */
  .th-sort { cursor: pointer; user-select: none; }
  .th-sort:hover { color: var(--c-text); }
  .th-sort.sorted { color: var(--c-gold); }
  .th-sort.sorted::after { content: ' ↑'; }
  .th-sort.sorted.sorted-desc::after { content: ' ↓'; }

  /* ── Score badges ───────────────────────────────────────────── */
  .q-badge {
    font-family: var(--f-mono);
    font-size: 0.68rem;
    font-weight: 500;
    color: var(--c-green);
    letter-spacing: 0.05em;
  }
  .pts-gold { color: var(--c-gold); font-weight: 500; }
  .pts--gold { color: var(--c-gold); font-weight: 500; }

  /* ── Links ──────────────────────────────────────────────────── */
  .country-link { font-weight: 500; color: var(--c-text); }
  .country-link:hover { color: var(--c-link); text-decoration: none; }
  .flag { font-family: sans-serif; margin-right: 0.3em; }

  /* ── Breakdown ──────────────────────────────────────────────── */
  .breakdown-wrapper { margin-top: 0.5rem; }
  .breakdown-hint {
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
</style>
