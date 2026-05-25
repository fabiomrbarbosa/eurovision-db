<script lang="ts">
	import { tick } from "svelte";
	import Search from "./Search.svelte";

	let open = $state(false);

	$effect(() => {
		const onShortcut = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				open = true;
			}
		};
		window.addEventListener("keydown", onShortcut);
		return () => window.removeEventListener("keydown", onShortcut);
	});

	$effect(() => {
		if (!open) return;
		// Lock body scroll and focus the input once the panel is in the DOM
		document.body.style.overflow = "hidden";
		tick().then(() => {
			document
				.querySelector<HTMLInputElement>('.modal-panel input[type="search"]')
				?.focus();
		});
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") open = false;
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = "";
			window.removeEventListener("keydown", onKey);
		};
	});
</script>

<button
	class="search-trigger"
	onclick={() => (open = true)}
	aria-label="Open search"
>
	<span class="trigger-icon mono">⌕</span>
	<span class="trigger-label">Search</span>
	<kbd class="trigger-kbd">⌘K</kbd>
</button>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={() => (open = false)}
		onkeydown={(e) => {
			if (e.key === "Escape") open = false;
		}}
	>
		<div
			class="modal-panel"
			role="dialog"
			aria-modal="true"
			aria-label="Search"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === "Escape") open = false;
			}}
		>
			<Search />
		</div>
	</div>
{/if}

<style>
	/* ── Trigger ─────────────────────────────────────────────────── */
	.search-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.75rem;
		background: none;
		border: 1px solid var(--c-border);
		border-radius: var(--radius);
		color: var(--c-muted);
		font-family: var(--f-body);
		font-size: 0.875rem;
		cursor: pointer;
		transition:
			color 0.12s,
			border-color 0.12s;
		white-space: nowrap;
	}
	.search-trigger:hover {
		color: var(--c-text);
		border-color: var(--c-muted);
	}
	.trigger-icon {
		font-size: 1.1rem;
		line-height: 1;
	}
	.trigger-kbd {
		font-family: var(--f-mono);
		font-size: 0.7rem;
		color: var(--c-border);
		border: 1px solid var(--c-border);
		border-radius: 3px;
		padding: 0.1em 0.35em;
		line-height: 1;
		background: none;
		transition:
			color 0.12s,
			border-color 0.12s;
	}
	.search-trigger:hover .trigger-kbd {
		color: var(--c-muted);
		border-color: var(--c-muted);
	}
	@media (max-width: 480px) {
		.trigger-label,
		.trigger-kbd {
			display: none;
		}
	}

	/* ── Backdrop ────────────────────────────────────────────────── */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: color-mix(in srgb, var(--c-bg) 85%, transparent);
		z-index: 100;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 5rem;
		padding-inline: 1rem;
	}

	/* ── Panel ───────────────────────────────────────────────────── */
	/* Bare sizing wrapper — Search provides its own visual container.
     No overflow:hidden so the absolute-positioned results dropdown isn't clipped. */
	.modal-panel {
		width: 100%;
		max-width: 620px;
		filter: drop-shadow(0 24px 48px rgba(0, 0, 0, 0.7));
	}
</style>
