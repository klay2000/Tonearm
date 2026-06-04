# Claude Code — project guide

## What this is

A minimal Svelte 5 web music client for a Gonic/Subsonic server.
No backend — the browser talks directly to Gonic. Served as static files via nginx.

- **Gonic server**: `http://10.0.0.10:4747`
- **Dev VM (nginx)**: `http://192.168.122.79`
- **Spec**: `SPEC.md` — read it for full context before starting work

---

## Stack

- Svelte 5 (runes syntax: `$state`, `$derived`, `$effect`, `$props`) — never use legacy options API or Svelte 4 patterns
- Vite 5 — `npm run dev` (port 5173) / `npm run build` (outputs `dist/`)
- Zero runtime dependencies — do not add npm packages
- Plain CSS custom properties for theming — no CSS framework

---

## File map

```
src/
  main.js                     # mounts App
  App.svelte                  # shell, hash router, global keyboard shortcuts
  lib/
    api/subsonic.js           # all Gonic API calls; buildUrl() handles auth
    stores/
      auth.js                 # login state + credentials (localStorage)
      player.js               # queue, playback, shuffle/repeat (all player state lives here)
      router.js               # hash-based router
      theme.js                # dark/light/auto theme + sunrise/sunset logic
    components/
      Header.svelte
      Sidebar.svelte
      PlayerBar.svelte        # audio element, controls, queue panel
      ArtistAvatar.svelte     # lazy image load: TheAudioDB → Wikidata → initials
  routes/
    Home.svelte               # greeting + recently-added + discover shelves
    Artists.svelte            # A–Z indexed list
    Artist.svelte             # album grid + play/shuffle artist
    Album.svelte              # track list + playback actions
    Search.svelte             # grouped results
    Settings.svelte           # theme pref, shuffle mode
    Login.svelte
```

---

## API pattern

`buildUrl(endpoint, params)` in `subsonic.js` reads credentials from the `auth` store and appends them automatically. Never construct Subsonic URLs manually — always use `buildUrl`, `streamUrl`, or `coverUrl`. Auth is stored in localStorage via the `auth` store; check `isLoggedIn` to gate the UI.

---

## Routing

Hash-based (`#/path`). Routes are matched in `App.svelte`'s `route()` function. To add a route: add a match arm there and create the component in `src/routes/`.

---

## Development workflow

**Before coding**
- If the issue spec leaves real design choices open, state your intended approach and wait for confirmation before writing code.
- Otherwise, start directly.

**Branching**
- One branch per issue: `issue-N` or a short descriptive name.
- Work on the branch; do not commit directly to `main`.

**Commits**
- Run `npm run build` successfully before every commit — do not commit a broken build.
- Conventional commit prefixes (`feat:`, `fix:`, `docs:`) are preferred. Include the issue number when relevant, e.g. `feat: shuffle controls (#12)`.

**Pull requests**
- Open a PR when the work is ready to test.
- Send a push notification and ask the user if they'd like to test it.
- Do not merge until the user confirms it's good.

---

## Things to avoid

- Adding npm dependencies
- Svelte 4 / options-API patterns (`export let`, `onMount` without runes, etc.)
- Hardcoding server URLs or credentials outside of `subsonic.js` / the auth store
- Committing without a passing build
