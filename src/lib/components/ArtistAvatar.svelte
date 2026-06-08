<script>
  import { mbFetch } from '../api/musicbrainz.js'

  const cache = new Map()   // searchName → url | 'failed'

  // Strip feat./& collaborators — no image source has "X feat. Y" as a standalone artist
  function primaryName(name) {
    return name
      .replace(/\s+(feat\.?|ft\.?|featuring)\s+.*/i, '')
      .replace(/\s*[,&]\s+.+$/, '')
      .trim()
  }

  async function fetchArtistImage(name, size) {
    const searchName = primaryName(name)
    if (cache.has(searchName)) {
      const v = cache.get(searchName)
      return v === 'failed' ? null : v
    }

    // Step 1: TheAudioDB direct name search — fast, parallel, no rate limit
    const r1 = await fetch(`https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(searchName)}`)
    const d1 = await r1.json()
    const thumb = d1.artists?.[0]?.strArtistThumb
    if (thumb) { cache.set(searchName, thumb); return thumb }

    // Step 2: MusicBrainz → MBID → Wikidata → Wikimedia (rate-limited fallback)
    const d2 = await mbFetch(`artist/?query=artist:${encodeURIComponent(searchName)}&limit=1&fmt=json`)
    const mbid = d2.artists?.[0]?.id
    if (!mbid) { cache.set(searchName, 'failed'); return null }

    const d3 = await mbFetch(`artist/${mbid}?inc=url-rels&fmt=json`)
    const qid = d3.relations?.find(r => r.url?.resource?.includes('wikidata.org'))?.url?.resource?.split('/wiki/')[1]
    if (!qid) { cache.set(searchName, 'failed'); return null }

    const r4 = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`)
    const d4 = await r4.json()
    const p18 = d4.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
    if (!p18) { cache.set(searchName, 'failed'); return null }

    const filename = `File:${p18.replace(/ /g, '_')}`
    const r5 = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&iiurlwidth=${size * 2}&format=json&origin=*`)
    const d5 = await r5.json()
    const url = Object.values(d5?.query?.pages ?? {})[0]?.imageinfo?.[0]?.thumburl ?? null
    cache.set(searchName, url ?? 'failed')
    return url
  }

  function testImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(url)
      img.onerror = reject
      img.src = url
    })
  }

  // --- Component ---
  let { id, name, size = 40 } = $props()

  const COLORS = ['#e05', '#e8703a', '#3ab8a8', '#5b5bd6', '#9b5de5', '#c77dff', '#06d6a0', '#ef476f']
  function colorFor(str) {
    let h = 0
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
    return COLORS[h % COLORS.length]
  }

  const initials = name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?'
  const color = colorFor(name ?? '')

  let imgSrc = $state(null)
  let el = $state(null)

  $effect(() => {
    if (!el) return
    let cancelled = false

    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()

      try {
        const url = await fetchArtistImage(name, size)
        if (url && !cancelled) {
          await testImage(url)
          if (!cancelled) imgSrc = url
        }
      } catch {}
    }, { rootMargin: `${window.innerHeight * 2}px` })

    observer.observe(el)
    return () => { cancelled = true; observer.disconnect() }
  })
</script>

<div bind:this={el} class="wrapper" style="width:{size}px;height:{size}px">
  {#if imgSrc}
    <img
      src={imgSrc}
      alt={name}
      width={size}
      height={size}
      class="avatar"
    />
  {:else}
    <div
      class="avatar initials"
      style="background:{color};font-size:{Math.round(size * 0.36)}px"
      aria-label={name}
    >
      {initials}
    </div>
  {/if}
</div>

<style>
  .wrapper {
    flex-shrink: 0;
    position: relative;
  }
  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    background: var(--border);
  }
  .initials {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    letter-spacing: -0.5px;
    border-radius: 50%;
    width: 100%;
    height: 100%;
  }
</style>
