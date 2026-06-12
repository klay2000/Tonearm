<script>
  import CoverArt from './CoverArt.svelte'

  // subtitle: 'artist' | 'year' — which field to show under/beside the title
  let { albums, mode = 'shelf', subtitle = 'artist' } = $props()

  function subtitleFor(album) {
    return subtitle === 'year' ? album.year ?? '' : album.artist ?? ''
  }
</script>

{#if mode === 'list'}
  <div class="album-rows">
    {#each albums as album}
      <a class="album-row" href="#/album/{album.id}">
        <CoverArt id={album.id} artist={album.artist} album={album.name} size={48} alt={album.name} />
        <div class="row-text">
          <span class="row-title">{album.name}</span>
          {#if subtitleFor(album)}<span class="row-sub">{subtitleFor(album)}</span>{/if}
        </div>
      </a>
    {/each}
  </div>
{:else}
  <div class="shelf">
    {#each albums as album}
      <a class="album-card" href="#/album/{album.id}">
        <CoverArt id={album.id} artist={album.artist} album={album.name} alt={album.name} />
        <span class="title">{album.name}</span>
        {#if subtitleFor(album)}<span class="subtitle">{subtitleFor(album)}</span>{/if}
      </a>
    {/each}
  </div>
{/if}

<style>
  /* shelf */
  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 18px;
  }
  .album-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .album-card :global(.cover-art) {
    border-radius: 6px;
    transition: opacity 0.15s;
  }
  .album-card:hover :global(.cover-art) { opacity: 0.85; }
  .title {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .subtitle {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* list */
  .album-rows { display: flex; flex-direction: column; gap: 4px; }
  .album-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 12px;
    border-radius: 6px;
  }
  .album-row:hover { background: var(--surface); }
  .album-row :global(.cover-art) { width: 48px; height: 48px; padding-top: 0; border-radius: 4px; }
  .row-text { display: flex; flex-direction: column; }
  .row-title { font-weight: 500; }
  .row-sub { font-size: 12px; color: var(--text-muted); }
</style>
