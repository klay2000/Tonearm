<script>
  import { search, coverUrl } from '../lib/api/subsonic.js'
  import { playQueue } from '../lib/stores/player.js'

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
      <h2>Albums</h2>
      <div class="album-rows">
        {#each results.album as al}
          <a class="album-row" href="#/album/{al.id}">
            <img src={coverUrl(al.id, 48)} alt="" />
            <div>
              <div class="row-title">{al.name}</div>
              <div class="row-sub">{al.artist}</div>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if results.song?.length}
    <section>
      <h2>Songs</h2>
      <div class="rows">
        {#each results.song as song, i}
          <button class="row song-row" onclick={() => playQueue(results.song, i)}>
            <span class="song-title">{song.title}</span>
            <span class="song-sub">{song.artist} · {song.album}</span>
          </button>
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
  .row:hover { background: var(--surface); }

  .album-rows { display: flex; flex-direction: column; gap: 4px; }
  .album-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 12px;
    border-radius: 6px;
  }
  .album-row:hover { background: var(--surface); }
  .album-row img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; background: var(--border); }
  .row-title { font-weight: 500; }
  .row-sub { font-size: 12px; color: var(--text-muted); }

  .song-row {
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }
  .song-title { font-weight: 500; }
  .song-sub { font-size: 12px; color: var(--text-muted); }
</style>
