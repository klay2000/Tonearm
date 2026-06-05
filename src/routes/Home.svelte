<script>
  import { getAlbumList, getAllAlbums, getAlbum } from '../lib/api/subsonic.js'
  import CoverArt from '../lib/components/CoverArt.svelte'
  import { playQueue } from '../lib/stores/player.js'

  const greetings = [
    "Good listening.",
    "Happy listening.",
    "Good choice.",
    "Nice shirt.",
    "You have great taste.",
    "Looking good.",
    "Glad you're here.",
    "Don't skip this one.",
    "You showed up.",
    "Ears ready.",
    "Let's go.",
    "Finally.",
  ]

  const greeting = greetings[Math.floor(Math.random() * greetings.length)]

  let recent = $state([])
  let random = $state([])
  let loadingLibrary = $state(false)

  $effect(() => {
    getAlbumList('newest').then(d => recent = d)
    getAlbumList('random').then(d => random = d)
  })

  async function playLibrary(shuffled) {
    loadingLibrary = true
    try {
      const albums = await getAllAlbums()
      const trackLists = await Promise.all(albums.map(a => getAlbum(a.id).then(al => al.song ?? [])))
      const tracks = trackLists.flat()
      if (shuffled) {
        for (let i = tracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[tracks[i], tracks[j]] = [tracks[j], tracks[i]]
        }
      }
      playQueue(tracks, 0)
    } finally {
      loadingLibrary = false
    }
  }
</script>

<div class="home">
  <div class="home-header">
    <h1>{greeting}</h1>
    <div class="library-actions">
      <button class="play-lib" onclick={() => playLibrary(false)} disabled={loadingLibrary}>
        ▶ Play library
      </button>
      <button class="shuffle-lib" onclick={() => playLibrary(true)} disabled={loadingLibrary}>
        ⇄ Shuffle library
      </button>
    </div>
  </div>

  {#if recent.length}
    <section>
      <h2>Recently Added</h2>
      <div class="shelf">
        {#each recent as album}
          <a class="album-card" href="#/album/{album.id}">
            <CoverArt id={album.id} artist={album.artist} album={album.name} alt={album.name} />
            <span class="title">{album.name}</span>
            <span class="artist">{album.artist}</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if random.length}
    <section>
      <h2>Discover</h2>
      <div class="shelf">
        {#each random as album}
          <a class="album-card" href="#/album/{album.id}">
            <CoverArt id={album.id} artist={album.artist} album={album.name} alt={album.name} />
            <span class="title">{album.name}</span>
            <span class="artist">{album.artist}</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if !recent.length && !random.length}
    <p class="hint">Browse your <a href="#/artists">artists</a> or use the search bar above.</p>
  {/if}
</div>

<style>
  .home { padding-top: 32px; }

  .home-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 16px;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 0;
  }

  .library-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .play-lib, .shuffle-lib {
    padding: 8px 20px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 13px;
  }
  .play-lib { background: var(--accent); color: white; }
  .play-lib:disabled { opacity: 0.6; cursor: default; }
  .shuffle-lib { border: 1px solid var(--border); color: var(--text); }
  .shuffle-lib:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .shuffle-lib:disabled { opacity: 0.6; cursor: default; }

  section { margin-bottom: 36px; }

  h2 {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 14px;
  }

  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 16px;
  }

  .album-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .album-card :global(.cover-art) {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 6px;
    background: var(--border);
    transition: opacity 0.15s;
  }
  .album-card:hover :global(.cover-art) { opacity: 0.8; }

  .title {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .artist {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hint { color: var(--text-muted); }
  .hint a { color: var(--accent); }
  .hint a:hover { text-decoration: underline; }
</style>
