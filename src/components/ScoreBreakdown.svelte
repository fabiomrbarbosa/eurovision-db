<script lang="ts">
  // src/components/ScoreBreakdown.svelte
  // Interactive: click a country to see who voted for them and how.

  interface Score {
    name: string;
    points: number;
    votes: Record<string, number>;
  }

  interface ResultRow {
    country: string;
    countryName: string;
    place: number | null;
    scores: Score[];
  }

  let {
    results,
    countries,
    hasJuryTele = false,
  }: {
    results: ResultRow[];
    countries: Record<string, string>;
    hasJuryTele: boolean;
  } = $props();

  let selected = $state<string | null>(null);

  function getScore(row: ResultRow, name: string): number | null {
    return row.scores.find(s => s.name === name)?.points ?? null;
  }

  function getVotes(row: ResultRow, name: string): Record<string, number> {
    return row.scores.find(s => s.name === name)?.votes ?? {};
  }

  // Voters who gave points to the selected country
  const voterDetails = $derived(() => {
    if (!selected) return [];
    const row = results.find(r => r.country === selected);
    if (!row) return [];

    const totalVotes = getVotes(row, 'total');
    const juryVotes = hasJuryTele ? getVotes(row, 'jury') : {};
    const teleVotes = hasJuryTele ? getVotes(row, 'public') : {};

    return Object.entries(totalVotes)
      .map(([code, pts]) => ({
        code,
        name: countries[code] ?? code,
        total: pts,
        jury: juryVotes[code] ?? null,
        tele: teleVotes[code] ?? null,
      }))
      .sort((a, b) => b.total - a.total);
  });

  const selectedRow = $derived(results.find(r => r.country === selected) ?? null);
</script>

<div class="breakdown">
  <!-- Left: country selector -->
  <div class="selector">
    {#each results as row}
      <button
        class="selector-row"
        class:active={selected === row.country}
        onclick={() => selected = selected === row.country ? null : row.country}
      >
        <span class="sel-place mono muted">
          {row.place === 1 ? '🏆' : row.place ?? '—'}
        </span>
        <span class="sel-name">{row.countryName}</span>
        <span class="sel-pts mono">
          {getScore(row, 'total') ?? '—'}
        </span>
      </button>
    {/each}
  </div>

  <!-- Right: voter detail panel -->
  <div class="panel">
    {#if selected && selectedRow}
      <div class="panel-header">
        <p class="mono gold" style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em">
          Votes received by
        </p>
        <h3>{selectedRow.countryName}</h3>
        <div class="panel-totals">
          <div class="ptotal">
            <span class="ptotal-val mono">
              {getScore(selectedRow, 'total') ?? '—'}
            </span>
            <span class="muted">total</span>
          </div>
          {#if hasJuryTele}
            <div class="ptotal">
              <span class="ptotal-val mono">
                {getScore(selectedRow, 'jury') ?? '—'}
              </span>
              <span class="muted">jury</span>
            </div>
            <div class="ptotal">
              <span class="ptotal-val mono">
                {getScore(selectedRow, 'public') ?? '—'}
              </span>
              <span class="muted">televote</span>
            </div>
          {/if}
        </div>
      </div>

      {#if voterDetails().length > 0}
        <table class="voter-table">
          <thead>
            <tr>
              <th>From</th>
              {#if hasJuryTele}
                <th class="right">Jury</th>
                <th class="right">Tele</th>
              {/if}
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            {#each voterDetails() as voter}
              <tr>
                <td>{voter.name}</td>
                {#if hasJuryTele}
                  <td class="right mono muted">{voter.jury ?? '—'}</td>
                  <td class="right mono muted">{voter.tele ?? '—'}</td>
                {/if}
                <td class="right mono">
                  <span class="pts-badge">{voter.total}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="muted" style="padding:1rem 0">No detailed vote data available.</p>
      {/if}
    {:else}
      <div class="panel-empty">
        <p class="muted">← Select a country to see who voted for them</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .breakdown {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 1px;
    background: var(--c-border);
    border: 1px solid var(--c-border);
    border-radius: var(--radius);
    overflow: hidden;
    min-height: 400px;
  }

  /* ── Selector ───────────────────────────────────────────────── */
  .selector {
    background: var(--c-surface);
    overflow-y: auto;
    max-height: 600px;
  }
  .selector-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: none;
    border: none;
    border-bottom: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
    color: var(--c-text);
    cursor: pointer;
    font-family: var(--f-body);
    font-size: 0.85rem;
    text-align: left;
    transition: background 0.1s;
  }
  .selector-row:last-child { border-bottom: none; }
  .selector-row:hover { background: #1e1e1e; }
  .selector-row.active { background: #1a1608; border-left: 2px solid var(--c-gold); }

  .sel-place { width: 1.8rem; flex-shrink: 0; font-size: 0.78rem; }
  .sel-name { flex: 1; }
  .sel-pts { font-size: 0.82rem; color: var(--c-muted); }
  .selector-row.active .sel-pts { color: var(--c-gold); }

  /* ── Panel ──────────────────────────────────────────────────── */
  .panel {
    background: var(--c-bg);
    overflow-y: auto;
  }
  .panel-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--c-border);
  }
  .panel-header h3 {
    font-size: 1.3rem;
    margin: 0.2rem 0 0.75rem;
  }
  .panel-totals {
    display: flex;
    gap: 1.5rem;
  }
  .ptotal {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .ptotal-val { font-size: 1.4rem; font-weight: 500; }

  .panel-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
    padding: 2rem;
  }

  /* ── Voter table ────────────────────────────────────────────── */
  .voter-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  .voter-table th {
    font-family: var(--f-mono);
    font-size: 0.67rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--c-muted);
    font-weight: 400;
    padding: 0.6rem 1.5rem;
    text-align: left;
    border-bottom: 1px solid var(--c-border);
  }
  .voter-table th.right { text-align: right; }
  .voter-table td {
    padding: 0.5rem 1.5rem;
    border-bottom: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);
  }
  .voter-table tr:hover td { background: var(--c-surface); }
  .voter-table .right { text-align: right; }

  .pts-badge {
    font-family: var(--f-mono);
    font-weight: 500;
    color: var(--c-gold);
  }

  /* ── Responsive ─────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .breakdown {
      grid-template-columns: 1fr;
    }
    .selector { max-height: 250px; }
  }
</style>
