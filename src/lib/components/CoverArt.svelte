<script>
  import { coverUrl } from '../api/subsonic.js'
  import { mbFetch } from '../api/musicbrainz.js'

  const cache = new Map()

  async function fetchAlbumArt(artist, album) {
    const key = `${artist}::${album}`
    if (cache.has(key)) {
      const v = cache.get(key)
      return v === 'failed' ? null : v
    }

    try {
      const r1 = await fetch(`https://www.theaudiodb.com/api/v1/json/2/searchalbum.php?s=${encodeURIComponent(artist)}&a=${encodeURIComponent(album)}`)
      const d1 = await r1.json()
      const thumb = d1.album?.[0]?.strAlbumThumb
      if (thumb) { cache.set(key, thumb); return thumb }
    } catch {}

    try {
      const d2 = await mbFetch(`release-group/?query=artist:${encodeURIComponent(artist)}+releasegroup:${encodeURIComponent(album)}&limit=1&fmt=json`)
      const mbid = d2['release-groups']?.[0]?.id
      if (!mbid) { cache.set(key, 'failed'); return null }
      const url = `https://coverartarchive.org/release-group/${mbid}/front-250`
      cache.set(key, url)
      return url
    } catch {
      cache.set(key, 'failed')
      return null
    }
  }

  let { id, artist = '', album = '', size = 256, alt = '' } = $props()

  let scrapedSrc = $state(null)
  let failed = $state(false)
  let triggered = false

  async function onServerError() {
    if (triggered || !artist || !album) { failed = true; return }
    triggered = true
    const url = await fetchAlbumArt(artist, album)
    if (url) scrapedSrc = url
    else failed = true
  }

  function onScrapedError() {
    scrapedSrc = null
    failed = true
  }
</script>

{#if failed}
  <div class="cover-art" role="img" aria-label={alt}></div>
{:else}
  <div class="cover-art">
    <img
      src={scrapedSrc ?? coverUrl(id, size)}
      {alt}
      onerror={scrapedSrc ? onScrapedError : onServerError}
    />
  </div>
{/if}

<style>
  .cover-art {
    display: block;
    position: relative;
    width: 100%;
    padding-top: 100%;
    overflow: hidden;
    background: var(--border);
    flex-shrink: 0;
  }
  .cover-art img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
</style>
