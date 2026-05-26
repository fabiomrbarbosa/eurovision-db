<script lang="ts">
	const { videoUrls, title }: { videoUrls: string[]; title: string } = $props();

	let activeIdx = $state(0);

	function videoId(url: string): string {
		return url.split("/").pop()?.split("?")[0] ?? "";
	}

	function thumbUrl(url: string): string {
		return `https://img.youtube.com/vi/${videoId(url)}/mqdefault.jpg`;
	}
</script>

<div class="video-player">
	<div class="video-embed">
		<iframe
			src={videoUrls[activeIdx] + "?vq=hd720"}
			{title}
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowfullscreen
		></iframe>
	</div>

	{#if videoUrls.length > 1}
		<div class="thumb-strip">
			{#each videoUrls as url, i}
				<button
					class="thumb-btn"
					class:active={i === activeIdx}
					onclick={() => (activeIdx = i)}
					aria-label={`Video ${i + 1}`}
					aria-pressed={i === activeIdx}
				>
					<img src={thumbUrl(url)} alt="" loading="lazy" />
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.video-player {
		width: 100%;
	}
	.video-embed {
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 4px;
		background: #000;
		overflow: hidden;
	}
	.video-embed iframe {
		width: 100%;
		height: 100%;
		border: 0;
		display: block;
	}

	.thumb-strip {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		overflow-x: auto;
		padding-bottom: 4px;
		scrollbar-width: thin;
		scrollbar-color: var(--c-border) transparent;
	}

	.thumb-btn {
		flex: 0 0 auto;
		width: 100px;
		aspect-ratio: 16 / 9;
		padding: 0;
		border: 2px solid var(--c-border);
		border-radius: 3px;
		background: #000;
		cursor: pointer;
		overflow: hidden;
		opacity: 0.55;
		transition:
			opacity 0.15s,
			border-color 0.15s;
	}
	.thumb-btn img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.thumb-btn:hover {
		opacity: 0.85;
		border-color: var(--c-muted);
	}
	.thumb-btn.active {
		opacity: 1;
		border-color: var(--c-cyan);
	}
</style>
