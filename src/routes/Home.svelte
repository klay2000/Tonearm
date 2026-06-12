<script>
  import { getAlbumList, getAllAlbums, getAlbum } from '../lib/api/subsonic.js'
  import AlbumGrid from '../lib/components/AlbumGrid.svelte'
  import ViewToggle from '../lib/components/ViewToggle.svelte'
  import LoadingScreen from '../lib/components/LoadingScreen.svelte'
  import { playQueue } from '../lib/stores/player.js'
  import { greetingMode } from '../lib/stores/greeting.js'
  import { timeOfDayGreeting } from '../lib/stores/greetingLogic.js'
  import { viewModes } from '../lib/stores/viewMode.js'

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
    "Press play.",
    "Turn it up.",
    "Crank it.",
    "Right on time.",
    "Here for the music.",
    "Sounds good already.",
    "Welcome back.",
    "Hello again.",
    "All ears.",
    "Tune in.",
    "What's the mood today?",
    "Let the music do the talking.",
    "Queue it up.",
    "Made it just in time.",
  ]

  const greeting = $derived(
    $greetingMode === 'off' ? '' :
    $greetingMode === 'simple' ? timeOfDayGreeting() :
    greetings[Math.floor(Math.random() * greetings.length)]
  )

  let recent = $state([])
  let random = $state([])
  let loadingShelves = $state(true)
  let loadingLibrary = $state(false)

  $effect(() => {
    Promise.all([
      getAlbumList('newest').then(d => recent = d),
      getAlbumList('random').then(d => random = d),
    ]).finally(() => loadingShelves = false)
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

{#if loadingShelves}
  <div class="home-loading">
    <LoadingScreen message="Loading your library…" />
  </div>
{:else}
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
        <ViewToggle view="home" />
      </div>
    </div>

    {#if recent.length}
      <section>
        <h2>Recently Added</h2>
        <AlbumGrid albums={recent} mode={$viewModes.home} subtitle="artist" />
      </section>
    {/if}

    {#if random.length}
      <section>
        <h2>Discover</h2>
        <AlbumGrid albums={random} mode={$viewModes.home} subtitle="artist" />
      </section>
    {/if}

    {#if !recent.length && !random.length}
      <p class="hint">Browse your <a href="#/artists">artists</a> or use the search bar above.</p>
    {/if}
  </div>
{/if}

<style>
  .home { padding-top: 32px; }

  .home-loading { height: 100%; }

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
    align-items: center;
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

  .hint { color: var(--text-muted); }
  .hint a { color: var(--accent); }
  .hint a:hover { text-decoration: underline; }
</style>
