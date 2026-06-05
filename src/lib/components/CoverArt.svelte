<script>
  import { coverUrl } from '../api/subsonic.js'

  const cache = new Map()

  let mbChain = Promise.resolve()
  function mbFetch(path) {
    const result = mbChain.then(async () => {
      await new Promise(r => setTimeout(r, 1200))
      return fetch(`/api/mb/${path}`)
    })
    mbChain = result.then(() => {}, () => {})
    return result
  }

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
      const r2 = await mbFetch(`release-group/?query=artist:${encodeURIComponent(artist)}+releasegroup:${encodeURIComponent(album)}&limit=1&fmt=json`)
      const d2 = await r2.json()
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

  let { id, artist = '', album = '', size = 256, alt = '', class: className = '' } = $props()

  let scrapedSrc = $state(null)
  let failed = $state(false)
  let triggered = false

  async function onServerError() {
    if (triggered || !artist || !album) { failed = !artist || !album; return }
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
  <div class={['cover-art', className].filter(Boolean).join(' ')} style="width:{size}px;height:{size}px" role="img" aria-label={alt}></div>
{:else if scrapedSrc}
  <img class={['cover-art', className].filter(Boolean).join(' ')} src={scrapedSrc} {alt} width={size} height={size} onerror={onScrapedError} />
{:else}
  <img class={['cover-art', className].filter(Boolean).join(' ')} src={coverUrl(id, size)} {alt} width={size} height={size} onerror={onServerError} />
{/if}

<style>
  .cover-art {
    display: block;
    background: var(--border);
    flex-shrink: 0;
  }
</style>
