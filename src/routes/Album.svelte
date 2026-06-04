<script>
  import { getAlbum, coverUrl } from '../lib/api/subsonic.js'
  import { playQueue } from '../lib/stores/player.js'

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
</script>

{#if loading}
  <p class="muted">Loading…</p>
{:else if error}
  <p class="error">Error: {error}</p>
{:else if album}
  <div class="album-header">
    <img class="cover" src={coverUrl(album.id, 200)} alt={album.name} />
    <div class="meta">
      <h1>{album.name}</h1>
      <a class="artist-link" href="#/artist/{album.artistId}">{album.artist}</a>
      <span class="sub">{album.year ?? ''}{album.year && album.songCount ? ' · ' : ''}{album.songCount} tracks · {fmt(album.duration)}</span>
      <button class="play-all" onclick={() => playFrom(0)}>▶ Play all</button>
    </div>
  </div>

  <table class="track-list">
    <tbody>
      {#each album.song ?? [] as track, i}
        <tr onclick={() => playFrom(i)}>
          <td class="num">{track.track ?? i + 1}</td>
          <td class="title">{track.title}</td>
          <td class="dur">{fmt(track.duration)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
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
    object-fit: cover;
    border-radius: 8px;
    background: var(--border);
    flex-shrink: 0;
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
  .play-all {
    margin-top: 8px;
    padding: 8px 20px;
    background: var(--accent);
    color: white;
    border-radius: 20px;
    font-weight: 600;
    font-size: 13px;
    width: fit-content;
  }

  .track-list {
    width: 100%;
    border-collapse: collapse;
  }
  tr {
    cursor: pointer;
    border-radius: 6px;
  }
  tr:hover td { background: var(--surface); }
  td {
    padding: 8px 12px;
  }
  td:first-child { border-radius: 6px 0 0 6px; }
  td:last-child { border-radius: 0 6px 6px 0; }
  .num { color: var(--text-muted); width: 32px; text-align: right; font-variant-numeric: tabular-nums; }
  .title { font-weight: 500; }
  .dur { color: var(--text-muted); text-align: right; font-variant-numeric: tabular-nums; font-size: 13px; }
</style>
