<script>
  import { search } from '../lib/api/subsonic.js'
  import AlbumGrid from '../lib/components/AlbumGrid.svelte'
  import ViewToggle from '../lib/components/ViewToggle.svelte'
  import { playQueue, insertNext, enqueue } from '../lib/stores/player.js'
  import { viewModes } from '../lib/stores/viewMode.js'

  let { query } = $props()

  let results = $state({})
  let loading = $state(false)
  let error = $state(null)

  $effect(() => {
    if (!query) return
    loading = true; error = null; results = {}
    search(query)
      .then(data => { results = data; loading = false })
      .catch(e => { error = e.message; loading = false })
  })
</script>

<h1 class="heading">Results for "{query}"</h1>

{#if loading}
  <p class="muted">Searching…</p>
{:else if error}
  <p class="error">Error: {error}</p>
{:else}
  {#if results.artist?.length}
    <section>
      <h2>Artists</h2>
      <div class="rows">
        {#each results.artist as a}
          <a class="row" href="#/artist/{a.id}">{a.name}</a>
        {/each}
      </div>
    </section>
  {/if}

  {#if results.album?.length}
    <section>
      <div class="section-header">
        <h2>Albums</h2>
        <ViewToggle view="search" />
      </div>
      <AlbumGrid albums={results.album} mode={$viewModes.search} subtitle="artist" />
    </section>
  {/if}

  {#if results.song?.length}
    <section>
      <h2>Songs</h2>
      <div class="rows">
        {#each results.song as song, i}
          <div class="row song-row">
            <button class="song-main" onclick={() => playQueue(results.song, i)}>
              <span class="song-title">{song.title}</span>
              <span class="song-sub">{song.artist} · {song.album}</span>
            </button>
            <div class="song-actions">
              <button title="Play next" onclick={() => insertNext(song)}>↑</button>
              <button title="Add to queue" onclick={() => enqueue(song)}>+</button>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if !results.artist?.length && !results.album?.length && !results.song?.length}
    <p class="muted">No results found.</p>
  {/if}
{/if}

<style>
  .heading { font-size: 20px; font-weight: 600; margin-bottom: 24px; }
  .muted { color: var(--text-muted); }
  .error { color: #e05; }

  section { margin-bottom: 32px; }
  h2 {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 8px;
  }
  .rows { display: flex; flex-direction: column; gap: 1px; }
  .row {
    padding: 8px 12px;
    border-radius: 6px;
    display: block;
  }
  :global(html:not(.no-hover)) .row:hover { background: var(--surface); }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .section-header h2 { margin-bottom: 0; }

  .song-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 !important;
  }
  .song-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 6px;
  }
  :global(html:not(.no-hover)) .song-main:hover { background: var(--surface); }
  .song-title { font-weight: 500; }
  .song-sub { font-size: 12px; color: var(--text-muted); }
  .song-actions {
    display: flex;
    gap: 4px;
    padding-right: 8px;
    opacity: 0;
  }
  :global(html:not(.no-hover)) .song-row:hover .song-actions { opacity: 1; }
  .song-actions button {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--text-muted);
  }
  :global(html:not(.no-hover)) .song-actions button:hover { color: var(--accent); }
</style>
