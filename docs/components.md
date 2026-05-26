# Components

All Svelte components live in `src/components/`. They use **Svelte 5 runes** — see [architecture.md](architecture.md) for the runes syntax overview.

Every component here is activated with `client:load` in the pages that use it, meaning its JavaScript runs in the browser immediately when the page loads.

---

## `Search.svelte` — Inline Search Bar

Used on the homepage. The nav bar uses `SearchModal.svelte` (a modal wrapper around this same logic).

**What it does:** Fetches `/data/index.json` and `/data/countries.json` once on mount, then filters them locally as you type.

**Search algorithm (three passes):**

1. **Countries** — matches country names against the query. Stores matching country codes in a `Set` for use in pass 2.
2. **Contests** — matches year and city against the query, OR includes the edition if it was hosted by a matched country from pass 1. If a contest matches by title (year/city), the song loop for that edition is skipped — searching "2022" shows the Turin edition page, not all 40 songs from 2022.
3. **Songs** — matches artist and song title, OR includes songs sent by a matched country from pass 1.

Results are grouped: countries first, then contests, then songs, capped at 40. Debounced at 150ms.

**Keyboard navigation:** Arrow keys move the active index; Enter navigates to the selected result; Escape clears the query.

**Accessibility:** The input has `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, and `aria-activedescendant`. Result `<li>` elements have `role="option"` and keyboard handlers (Enter/Space to select).

---

## `SearchModal.svelte` — Nav Search Modal

Used in `Base.astro`'s nav bar. Contains a trigger button (shows keyboard shortcut hint `⌘K` on desktop) that opens a modal overlay with a search input.

**What it does:** Wraps the search experience in a modal with a plain dark overlay. ⌘K / Ctrl+K anywhere on the page opens it. Escape or clicking outside closes it.

**Why no backdrop blur?** `backdrop-filter: blur()` was tried and removed — it amplified gradient banding artifacts from the ambient background spheres (the CSS `body::before`/`body::after` blurred colour circles). A plain dark overlay (`color-mix` at 85% opacity) avoids re-sampling the composited background.

**Accessibility:** The modal panel has `tabindex="-1"` so it can receive focus programmatically. The Escape handler is on the panel element to satisfy Svelte's a11y linter.

---

## `ContestTabs.svelte` — SF / Final Tab Switcher

Used on `contest/[year].astro`. This is the main results display for a contest year.

**What it renders:** A tab bar (Semi-final 1 → Semi-final 2 → Grand Final) with a sortable results table under each tab.

**Props:**
- `semiRounds` — array of semi-final data (label, date, entries with scores)
- `finalists` — the Grand Final entries with all score columns pre-computed
- `countries` — the country code→name map (for displaying names)
- `hasJuryTele` — whether to show Jury/Tele columns (true for 2016+)
- `year` — used to build song page URLs

**Tab state:** `activeIdx` is initialised with `untrack(() => semiRounds.length)` so the Grand Final is selected by default. `untrack` prevents Svelte from treating the initialiser as a reactive dependency of `semiRounds.length` (otherwise changing props would reset the tab).

**Sort state:** `sortKey` and `sortDir` are reset on every tab switch. The `cmp()` helper handles null values — they always sort last, regardless of ascending or descending direction. This ensures entries without a recorded place (1956, cancelled rounds) always appear at the bottom.

**Semi vs Final tables:** The same sort UI is rendered for both, but semi entries have a "Q" column showing a green badge for qualifiers. The "qualified" flag was pre-computed in the Astro page and passed in via the `qualified` field on each entry.

**Score columns:** Jury and Tele columns appear conditionally based on `hasJuryTele` for the Grand Final. Semis check whether any entry in the active semi round actually has jury data (`semiHasJuryTele`) — some early split-voting years may have data for the final but not the semis.

**ScoreBreakdown:** Rendered below each table when score data is present. Wrapped in `{#key activeIdx}` to force a full re-mount when switching tabs, clearing the selected country.

---

## `ScoreBreakdown.svelte` — Voter Detail Panel

Used inside `ContestTabs.svelte` (below each results table).

**What it renders:** A two-panel layout. Left: scrollable list of all contestants (place, flag, country name, total points). Right: when a country is selected, shows who voted for them and how many points.

**Interaction:** Clicking a country row toggles it. Clicking the same country again deselects it (the `onclick` checks `selected === row.country`). The right panel shows a breakdown table sorted by total points descending, with Jury/Tele columns if the year has split voting.

**`voterDetails`:** A `$derived.by()` value (not a function call) that recomputes whenever `selected` changes. Returns an empty array if nothing is selected or if the selected country has no vote data.

**WLD handling:** The "Rest of the World" is a special voter code used in some editions. It appears in the voter list with its own heart flag (`/images/flags/wld.svg`) and the name "Rest of the World".

---

## `VoteTabs.svelte` — Per-Song Voting Breakdown

Used on `contest/[year]/song/[id].astro`. Shows who voted for this specific song, broken down by round.

**What it renders:** A tab bar (one tab per round that has vote data) and a table of voter countries with their points. Jury/Tele columns appear when `hasJuryTele` is true.

**Default tab:** The last tab (Grand Final) is active by default — `$state(rounds.length - 1)`.

**Pill click coordination:** The result pills at the top of the song page fire a `vote-round` CustomEvent on `window` when clicked, carrying the tab index as `event.detail`. This component listens to that event in a `$effect` and updates its `active` state accordingly. This cross-component communication via window events is used instead of props because the pill (in the Astro page HTML) can't directly call a method on a Svelte component instance.

---

## `LyricsTabs.svelte` — Lyrics with Language Tabs

Used on `contest/[year]/song/[id].astro`.

**What it renders:** If a song has more than one lyric entry (original + translations + alternative versions), shows a tab bar. Each tab is labelled with the language(s), and has a colour-coded badge: gold = original, cyan = translation, magenta = alternative version. The tab bar wraps onto multiple lines (`flex-wrap: wrap`) for songs with many versions.

**Single-lyric songs:** The tab bar is hidden — just the lyrics panel is shown.

**HTML stripping:** The API occasionally embeds Font Awesome markup inside lyrics content (e.g. `<span class="fa-icon">...</span>`). The content is stripped of all HTML tags with a regex (`/<[^>]*>/g`) before splitting into stanzas. Without this, raw HTML strings would appear as literal text in the page.

**Stanza rendering:** Stanzas are split on `\n\n`. Each stanza is rendered as a `<p>` with `white-space: pre-line` so single line breaks within a stanza are preserved as visual line breaks.
