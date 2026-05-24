<script lang="ts">
  // src/components/Search.svelte
  // Client-side search against the pre-fetched index JSON.
  // Fetches the index once on mount, then filters locally.

  import { onMount } from 'svelte';
  import { countryFlagUrl } from '../lib/utils.ts';

  interface ContestantEntry {
    id: number;
    country: string;
    artist: string;
    song: string;
  }
  interface IndexEntry {
    year: number;
    city: string;
    country: string;
    slogan: string | null;
    winner: { country: string; artist: string; song: string; points: number | null } | null;
    contestants: ContestantEntry[];
  }

  interface SearchHit {
    type: 'contest' | 'contestant';
    year: number;
    flag: string;
    label: string;
    sublabel: string;
    href: string;
  }

  let query = $state('');
  let index: IndexEntry[] = $state([]);
  let countryMap: Record<string, string> = $state({});
  let hits: SearchHit[] = $state([]);
  let loading = $state(false);
  let open = $state(false);
  let inputEl: HTMLInputElement;

  onMount(async () => {
    loading = true;
    try {
      const [idxRes, cRes] = await Promise.all([
        fetch('/data/index.json'),
        fetch('/data/countries.json'),
      ]);
      index = await idxRes.json();
      countryMap = await cRes.json();
    } catch (e) {
      console.warn('Search index not available:', e);
    } finally {
      loading = false;
    }
  });

  function countryName(code: string) {
    return countryMap[code] ?? code;
  }

  $effect(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      hits = [];
      open = false;
      return;
    }

    const results: SearchHit[] = [];

    for (const entry of index) {
      if (results.length >= 40) break;

      const hostName = countryName(entry.country).toLowerCase();

      // Contest match
      if (
        String(entry.year).includes(q) ||
        entry.city.toLowerCase().includes(q) ||
        hostName.includes(q) ||
        (entry.slogan?.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'contest',
          year: entry.year,
          flag: countryFlagUrl(entry.country),
          label: `${entry.year} · ${entry.city}`,
          sublabel: countryName(entry.country),
          href: `/contest/${entry.year}`,
        });
        continue; // one hit per year at the contest level
      }

      // Contestant match
      for (const c of entry.contestants) {
        if (results.length >= 40) break;
        const cName = countryName(c.country).toLowerCase();
        if (
          c.artist.toLowerCase().includes(q) ||
          c.song.toLowerCase().includes(q) ||
          cName.includes(q)
        ) {
          results.push({
            type: 'contestant',
            year: entry.year,
            flag: countryFlagUrl(c.country),
            label: `${c.artist} — ${c.song}`,
            sublabel: `${countryName(c.country)} · ${entry.year}`,
            href: `/contest/${entry.year}`,
          });
        }
      }
    }

    hits = results;
    open = results.length > 0;
  });

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      query = '';
      open = false;
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
      onfocus={() => { if (hits.length) open = true; }}
      type="search"
      placeholder="Search contests, artists, songs, countries…"
      autocomplete="off"
      spellcheck="false"
    />
  </div>

  {#if open && hits.length > 0}
    <ul class="results" role="listbox">
      {#each hits as hit}
        <li
          role="option"
          aria-selected="false"
          onclick={() => select(hit.href)}
          onkeydown={(e) => e.key === 'Enter' && select(hit.href)}
          tabindex="0"
        >
          <img class="hit-flag" src={hit.flag} alt="" />
          <span class="hit-label">{hit.label}</span>
          <span class="hit-sub">{hit.sublabel}</span>
          {#if hit.type === 'contest'}
            <span class="hit-badge">contest</span>
          {/if}
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
  input::placeholder { color: var(--c-muted); }
  input::-webkit-search-cancel-button { display: none; }

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
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 1rem;
    cursor: pointer;
    border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);
    transition: background 0.1s;
  }

  .hit-flag {
    display: inline-block;
    height: 1.1em;
    width: auto;
    flex-shrink: 0;
  }
  li:last-child { border-bottom: none; }
  li:hover, li:focus { background: var(--c-hover); outline: none; }

  .hit-label { font-size: 0.9rem; flex-shrink: 0; }
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
    background: var(--c-surface-gold);
    border: 1px solid var(--c-gold-dim);
    color: var(--c-gold);
    border-radius: var(--radius);
    flex-shrink: 0;
  }
</style>
