<script>
  import { getArtist, coverUrl } from '../lib/api/subsonic.js'
  import ArtistAvatar from '../lib/components/ArtistAvatar.svelte'

  let { id } = $props()

  let artist = $state(null)
  let loading = $state(true)
  let error = $state(null)

  $effect(() => {
    loading = true; error = null; artist = null
    getArtist(id)
      .then(data => { artist = data; loading = false })
      .catch(e => { error = e.message; loading = false })
  })
</script>

{#if loading}
  <p class="muted">Loading…</p>
{:else if error}
  <p class="error">Error: {error}</p>
{:else if artist}
  <div class="artist-header">
    <ArtistAvatar id={artist.id} name={artist.name} size={80} />
    <h1 class="artist-name">{artist.name}</h1>
  </div>
  <div class="album-grid">
    {#each artist.album ?? [] as album}
      <a class="album-card" href="#/album/{album.id}">
        <img src={coverUrl(album.id)} alt={album.name} />
        <div class="album-info">
          <span class="album-title">{album.name}</span>
          {#if album.year}<span class="album-year">{album.year}</span>{/if}
        </div>
      </a>
    {/each}
  </div>
{/if}

<style>
  .muted { color: var(--text-muted); }
  .error { color: #e05; }
  .artist-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  .artist-name { font-size: 24px; font-weight: 700; }
  .album-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 20px;
  }
  .album-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .album-card img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 6px;
    background: var(--border);
  }
  .album-card:hover img { opacity: 0.85; }
  .album-info { display: flex; flex-direction: column; gap: 2px; }
  .album-title { font-weight: 500; font-size: 13px; line-height: 1.3; }
  .album-year { font-size: 12px; color: var(--text-muted); }
</style>
