<script lang="ts">
  interface Lyrics {
    type: 0 | 1 | 2;
    languages: string[];
    displayedLanguages: string[] | null;
    title: string;
    content: string;
  }

  let { lyrics }: { lyrics: Lyrics[] } = $props();

  let activeIdx = $state(0);

  const current = $derived(lyrics[activeIdx]);
  const paragraphs = $derived(current?.content.split('\n\n') ?? []);

  function tabLabel(lyric: Lyrics): string {
    const langs = lyric.displayedLanguages ?? lyric.languages;
    if (!langs.length) return lyric.title;
    return langs.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(' · ');
  }

  function typeName(type: 0 | 1 | 2): 'original' | 'translation' | 'version' {
    return type === 0 ? 'original' : type === 1 ? 'translation' : 'version';
  }
</script>

<div class="lyrics-tabs">
  {#if lyrics.length > 1}
    <div class="tab-bar" role="tablist" aria-label="Lyrics versions">
      {#each lyrics as lyric, i}
        <button
          role="tab"
          id="lyrics-tab-{i}"
          aria-selected={i === activeIdx}
          aria-controls="lyrics-panel"
          class:active={i === activeIdx}
          onclick={() => activeIdx = i}
        >
          {tabLabel(lyric)}
          <span class="type-badge type--{typeName(lyric.type)}">{typeName(lyric.type)}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if current}
    <div
      class="lyrics-panel"
      id="lyrics-panel"
      role="tabpanel"
      aria-labelledby="lyrics-tab-{activeIdx}"
    >
      {#if current.title}
        <p class="lyrics-title">{current.title}</p>
      {/if}
      {#each paragraphs as para}
        <p class="lyric-stanza">{para}</p>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* ── Tab bar ─────────────────────────────────────────────────── */
  .tab-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--c-border);
    margin-bottom: 1.25rem;
  }

  button[role="tab"] {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.7rem;
    background: none;
    border: 1px solid var(--c-border);
    border-radius: 4px;
    color: var(--c-muted);
    font-family: var(--f-body);
    font-size: 0.85rem;
    cursor: pointer;
    transition: color 0.1s, border-color 0.1s, background 0.1s;
  }
  button[role="tab"]:hover {
    color: var(--c-text);
    border-color: var(--c-muted);
  }
  button[role="tab"].active {
    color: var(--c-text);
    background: var(--c-surface);
    border-color: var(--c-gold-dim);
  }

  /* ── Type badge ──────────────────────────────────────────────── */
  .type-badge {
    font-family: var(--f-mono);
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.1em 0.35em;
    border-radius: 3px;
    border: 1px solid;
    flex-shrink: 0;
  }
  .type--original {
    color: var(--c-gold);
    border-color: var(--c-gold-dim);
    background: var(--c-surface-gold);
  }
  .type--translation {
    color: var(--c-cyan);
    border-color: color-mix(in srgb, var(--c-cyan) 30%, transparent);
    background: color-mix(in srgb, var(--c-cyan) 10%, transparent);
  }
  .type--version {
    color: var(--c-magenta);
    border-color: color-mix(in srgb, var(--c-magenta) 30%, transparent);
    background: color-mix(in srgb, var(--c-magenta) 10%, transparent);
  }

  /* ── Panel ───────────────────────────────────────────────────── */
  .lyrics-title {
    font-style: italic;
    color: var(--c-muted);
    font-size: 0.85rem;
    margin-bottom: 1.25rem;
  }
  .lyric-stanza {
    white-space: pre-line;
    line-height: 1.75;
    margin-bottom: 1.25rem;
    font-size: 0.9rem;
    color: var(--c-text);
  }
</style>
