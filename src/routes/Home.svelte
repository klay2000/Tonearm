<script>
  import { getAlbumList, coverUrl } from '../lib/api/subsonic.js'

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

  $effect(() => {
    getAlbumList('newest').then(d => recent = d)
    getAlbumList('random').then(d => random = d)
  })
</script>

<div class="home">
  <h1>{greeting}</h1>

  {#if recent.length}
    <section>
      <h2>Recently Added</h2>
      <div class="shelf">
        {#each recent as album}
          <a class="album-card" href="#/album/{album.id}">
            <img src={coverUrl(album.id)} alt={album.name} />
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
            <img src={coverUrl(album.id)} alt={album.name} />
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

  h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 28px;
  }

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

  .album-card img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 6px;
    background: var(--border);
    transition: opacity 0.15s;
  }
  .album-card:hover img { opacity: 0.8; }

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
