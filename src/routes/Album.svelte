<script>
  import { getAlbum } from '../lib/api/subsonic.js'
  import CoverArt from '../lib/components/CoverArt.svelte'
  import { playQueue, currentTrack, playing, insertNext, enqueue } from '../lib/stores/player.js'

  let { id } = $props()

  let album = $state(null)
  let loading = $state(true)
  let error = $state(null)

  $effect(() => {
    loading = true; error = null; album = null
    getAlbum(id)
      .then(data => { album = data; loading = false })
      .catch(e => { error = e.message; loading = false })
  })

  function playFrom(index) {
    playQueue(album.song, index)
  }

  function fmt(secs) {
    if (!secs) return ''
    const m = Math.floor(secs / 60)
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  function isCurrentTrack(track) {
    return $currentTrack?.id === track.id
  }
</script>

{#if loading}
  <p class="muted">Loading…</p>
{:else if error}
  <p class="error">Error: {error}</p>
{:else if album}
  <div class="album-header">
    <div class="cover">
      <CoverArt id={album.id} artist={album.artist} album={album.name} size={200} alt={album.name} />
    </div>
    <div class="meta">
      <h1>{album.name}</h1>
      <a class="artist-link" href="#/artist/{album.artistId}">{album.artist}</a>
      <span class="sub">{album.year ?? ''}{album.year && album.songCount ? ' · ' : ''}{album.songCount} tracks · {fmt(album.duration)}</span>
      <div class="header-actions">
        <button class="play-all" onclick={() => playFrom(0)}>▶ Play all</button>
        <button class="enqueue-all" onclick={() => enqueue(album.song)}>+ Add to queue</button>
      </div>
    </div>
  </div>

  {#if album.song?.length}
    <table class="track-list">
      <tbody>
        {#each album.song as track, i}
          {@const active = isCurrentTrack(track)}
          <tr
            onclick={() => playFrom(i)}
            class:active
          >
            <td class="num">
              {#if active && $playing}
                <span class="playing-icon">▶</span>
              {:else}
                {track.track ?? i + 1}
              {/if}
            </td>
            <td class="title" class:accent={active}>{track.title}</td>
            <td class="dur">{fmt(track.duration)}</td>
            <td class="actions" onclick={e => e.stopPropagation()}>
              <button title="Play next" onclick={() => insertNext(track)}>↑</button>
              <button title="Add to queue" onclick={() => enqueue(track)}>+</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="muted">There's nothing here.</p>
  {/if}
{/if}

<style>
  .muted { color: var(--text-muted); }
  .error { color: #e05; }

  .album-header {
    display: flex;
    gap: 24px;
    align-items: flex-end;
    margin-bottom: 32px;
  }
  .cover {
    width: 180px;
    height: 180px;
    border-radius: 8px;
    background: var(--border);
    flex-shrink: 0;
    overflow: hidden;
  }
  .cover :global(.cover-art) {
    padding-top: 0;
    height: 100%;
  }
  .meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  h1 { font-size: 26px; font-weight: 700; }
  .artist-link { color: var(--accent); font-weight: 500; }
  .artist-link:hover { text-decoration: underline; }
  .sub { color: var(--text-muted); font-size: 13px; }
  .header-actions { display: flex; gap: 8px; margin-top: 8px; }
  .play-all, .enqueue-all {
    padding: 8px 20px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 13px;
  }
  .play-all { background: var(--accent); color: white; }
  .enqueue-all { border: 1px solid var(--border); color: var(--text); }
  .enqueue-all:hover { border-color: var(--accent); color: var(--accent); }

  .track-list {
    width: 100%;
    border-collapse: collapse;
  }
  tr { cursor: pointer; }
  tr:hover td { background: var(--surface); }
  tr.active td { background: color-mix(in srgb, var(--accent) 8%, transparent); }
  td { padding: 8px 12px; }
  td:first-child { border-radius: 6px 0 0 6px; }
  td:last-child { border-radius: 0 6px 6px 0; }
  .num {
    color: var(--text-muted);
    width: 32px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .playing-icon { color: var(--accent); font-size: 11px; }
  .title { font-weight: 500; }
  .title.accent { color: var(--accent); }
  .dur { color: var(--text-muted); text-align: right; font-variant-numeric: tabular-nums; font-size: 13px; }
  .actions {
    text-align: right;
    white-space: nowrap;
    opacity: 0;
    width: 60px;
  }
  tr:hover .actions { opacity: 1; }
  .actions button {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--text-muted);
  }
  .actions button:hover { color: var(--accent); }
</style>
