<script>
  import { getArtists } from '../lib/api/subsonic.js'
  import ArtistAvatar from '../lib/components/ArtistAvatar.svelte'
  import ViewToggle from '../lib/components/ViewToggle.svelte'
  import { viewModes } from '../lib/stores/viewMode.js'

  let indices = $state([])
  let loading = $state(true)
  let error = $state(null)

  $effect(() => {
    getArtists()
      .then(data => { indices = data; loading = false })
      .catch(e => { error = e.message; loading = false })
  })
</script>

<div class="page-header">
  <h1>Artists</h1>
  <ViewToggle view="artists" />
</div>

{#if loading}
  <p class="muted">Loading artists…</p>
{:else if error}
  <p class="error">Error: {error}</p>
{:else if indices.length}
  <div class="jump-bar">
    {#each indices as idx}
      <a href="#{idx.name}">{idx.name}</a>
    {/each}
  </div>

  {#each indices as idx}
    <section id={idx.name}>
      <h2 class="index-label">{idx.name}</h2>
      {#if $viewModes.artists === 'shelf'}
        <div class="artist-shelf">
          {#each idx.artist as artist}
            <a class="artist-card" href="#/artist/{artist.id}">
              <ArtistAvatar id={artist.id} name={artist.name} size={96} />
              <span class="name">{artist.name}</span>
              <span class="count">{artist.albumCount} albums</span>
            </a>
          {/each}
        </div>
      {:else}
        <div class="artist-list">
          {#each idx.artist as artist}
            <a class="artist-row" href="#/artist/{artist.id}">
              <ArtistAvatar id={artist.id} name={artist.name} size={36} />
              <span class="name">{artist.name}</span>
              <span class="count">{artist.albumCount} albums</span>
            </a>
          {/each}
        </div>
      {/if}
    </section>
  {/each}
{:else}
  <p class="muted">There's nothing here.</p>
{/if}

<style>
  .muted { color: var(--text-muted); }
  .error { color: #e05; }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  h1 { font-size: 20px; font-weight: 600; }

  .jump-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 24px;
  }
  .jump-bar a {
    padding: 2px 7px;
    border-radius: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
  }
  .jump-bar a:hover { color: var(--accent); border-color: var(--accent); }

  section { margin-bottom: 32px; }
  .index-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 8px;
  }
  .artist-list { display: flex; flex-direction: column; gap: 1px; }
  .artist-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-radius: 6px;
  }
  .artist-row:hover { background: var(--surface); }
  .name { font-weight: 500; }
  .count { font-size: 12px; color: var(--text-muted); }

  .artist-shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 18px;
  }
  .artist-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
    padding: 8px;
    border-radius: 8px;
  }
  .artist-card:hover { background: var(--surface); }
  .artist-card .name {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
</style>
