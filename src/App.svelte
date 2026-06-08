<script>
  import { router } from './lib/stores/router.js'
  import { togglePlay, playNext, playPrev, volume } from './lib/stores/player.js'
  import { get } from 'svelte/store'
  import { isLoggedIn } from './lib/stores/auth.js'
  import { ping } from './lib/api/subsonic.js'
  import Login from './routes/Login.svelte'
  import LoadingScreen from './lib/components/LoadingScreen.svelte'
  import Header from './lib/components/Header.svelte'
  import Sidebar from './lib/components/Sidebar.svelte'
  import PlayerBar from './lib/components/PlayerBar.svelte'
  import Home from './routes/Home.svelte'
  import Artists from './routes/Artists.svelte'
  import Artist from './routes/Artist.svelte'
  import Album from './routes/Album.svelte'
  import Search from './routes/Search.svelte'
  import Settings from './routes/Settings.svelte'

  // On startup with stored credentials, confirm the server is reachable
  // before rendering the app so it doesn't appear to hang while loading.
  let checkingConnection = $state(get(isLoggedIn))
  if (checkingConnection) {
    ping().catch(() => {}).finally(() => { checkingConnection = false })
  }

  let { path, params } = $derived($router)

  function route(path, params) {
    if (path === '/' || path === '/home') return { component: Home, props: {} }
    if (path === '/artists') return { component: Artists, props: {} }
    if (path.startsWith('/artist/')) return { component: Artist, props: { id: path.split('/')[2] } }
    if (path.startsWith('/album/')) return { component: Album, props: { id: path.split('/')[2] } }
    if (path === '/search') return { component: Search, props: { query: params.q ?? '' } }
    if (path === '/settings') return { component: Settings, props: {} }
    return { component: Home, props: {} }
  }

  let { component: Page, props } = $derived(route(path, params))

  function onKeydown(e) {
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if (e.code === 'Space') {
      e.preventDefault()
      togglePlay()
    } else if (e.code === 'ArrowRight' && !e.shiftKey) {
      e.preventDefault()
      playNext()
    } else if (e.code === 'ArrowLeft' && !e.shiftKey) {
      e.preventDefault()
      playPrev()
    } else if (e.key === 'm') {
      const v = get(volume)
      volume.set(v > 0 ? 0 : 1)
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if checkingConnection}
  <div class="boot-loading">
    <LoadingScreen message="Connecting to your library…" />
  </div>
{:else if $isLoggedIn}
  <div class="app">
    <Header />
    <div class="body">
      <Sidebar />
      <main>
        <Page {...props} />
      </main>
    </div>
    <PlayerBar />
  </div>
{:else}
  <Login />
{/if}

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(:root) {
    --bg:        #f5f5f5;
    --surface:   #ffffff;
    --text:      #111111;
    --text-muted:#666666;
    --accent:    #5b5bd6;
    --border:    #e0e0e0;
    --player-h:  72px;
    --sidebar-w: 180px;
    --header-h:  52px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    color: var(--text);
    background: var(--bg);
  }
  :global(html.dark) {
    --bg:        #1e1e1e;
    --surface:   #2a2a2a;
    --text:      #ffffff;
    --text-muted:#b4b4b4;
    --accent:    #9090fa;
    --border:    #3d3d3d;
  }
  :global(a) { color: inherit; text-decoration: none; }
  :global(button) { cursor: pointer; border: none; background: none; color: inherit; font: inherit; }

  .boot-loading {
    height: 100dvh;
    background: var(--bg);
  }
  .app {
    display: grid;
    grid-template-rows: var(--header-h) 1fr var(--player-h);
    height: 100dvh;
    overflow: hidden;
  }
  .body {
    display: grid;
    grid-template-columns: var(--sidebar-w) 1fr;
    overflow: hidden;
  }
  main {
    overflow-y: auto;
    padding: 24px;
    background: var(--bg);
  }
</style>
