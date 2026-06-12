<script>
  import { getArtist, getAlbum } from '../lib/api/subsonic.js'
  import AlbumGrid from '../lib/components/AlbumGrid.svelte'
  import ViewToggle from '../lib/components/ViewToggle.svelte'
  import { playQueue } from '../lib/stores/player.js'
  import ArtistAvatar from '../lib/components/ArtistAvatar.svelte'
  import { viewModes } from '../lib/stores/viewMode.js'

  let { id } = $props()

  let artist = $state(null)
  let loading = $state(true)
  let error = $state(null)
  let loadingPlay = $state(false)

  $effect(() => {
    loading = true; error = null; artist = null
    getArtist(id)
      .then(data => { artist = data; loading = false })
      .catch(e => { error = e.message; loading = false })
  })

  async function playArtist(shuffled) {
    if (!artist) return
    loadingPlay = true
    try {
      const albums = await Promise.all(
        (artist.album ?? []).map(a => getAlbum(a.id).then(al => al.song ?? []))
      )
      const tracks = albums.flat()
      if (shuffled) {
        for (let i = tracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[tracks[i], tracks[j]] = [tracks[j], tracks[i]]
        }
      }
      playQueue(tracks, 0)
    } finally {
      loadingPlay = false
    }
  }
</script>

{#if loading}
  <p class="muted">Loading…</p>
{:else if error}
  <p class="error">Error: {error}</p>
{:else if artist}
  <div class="artist-header">
    <ArtistAvatar id={artist.id} name={artist.name} size={80} />
    <div class="artist-meta">
      <h1 class="artist-name">{artist.name}</h1>
      <div class="artist-actions">
        <button class="play-all" onclick={() => playArtist(false)} disabled={loadingPlay}>
          ▶ Play artist
        </button>
        <button class="shuffle-all" onclick={() => playArtist(true)} disabled={loadingPlay}>
          ⇄ Shuffle
        </button>
      </div>
    </div>
  </div>
  {#if artist.album?.length}
    <div class="section-header">
      <h2>Albums</h2>
      <ViewToggle view="artist" />
    </div>
    <AlbumGrid albums={artist.album} mode={$viewModes.artist} subtitle="year" />
  {:else}
    <p class="muted">There's nothing here.</p>
  {/if}
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
  .artist-meta {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .artist-name { font-size: 24px; font-weight: 700; }
  .artist-actions { display: flex; gap: 8px; }
  .play-all, .shuffle-all {
    padding: 8px 20px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 13px;
  }
  .play-all { background: var(--accent); color: white; }
  .play-all:disabled { opacity: 0.6; cursor: default; }
  .shuffle-all { border: 1px solid var(--border); color: var(--text); }
  .shuffle-all:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .shuffle-all:disabled { opacity: 0.6; cursor: default; }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .section-header h2 {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
</style>
