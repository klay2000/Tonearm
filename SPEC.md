# Subsonic Client — Specification

**Version**: 0.5
**Date**: 2026-06-08
**Server**: Gonic at `http://10.0.0.10:4747`
**Web host**: `http://192.168.122.79` (dev VM)

---

## Overview

A minimal, modern, self-hosted music client for a Gonic/Subsonic server. Built as a hosted web app first, now also packaged as a Linux AppImage desktop app (Tauri v2); a mobile app is planned.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| UI framework | Svelte 5 + Vite 5 | Minimal runtime, fast HMR, no virtual DOM overhead |
| Styling | CSS custom properties | No framework lock-in; dark/light via `.dark`/`.light` class on `<html>` |
| State management | Svelte stores | Built-in, zero extra dependencies |
| Routing | Hash-based (custom) | No deps, works as static file with no server config |
| API layer | Subsonic REST API (JSON) | Gonic fully supports it |
| Artist images | TheAudioDB → Wikidata/Wikimedia | TheAudioDB by name first (fast, parallel); MusicBrainz+Wikidata fallback |
| Album art | Server → TheAudioDB → Cover Art Archive | Falls back to scraping when server has no art |
| Desktop wrapper | Tauri v2 | Rust-based, wraps the web app as a native Linux AppImage ("Tonearm") |

---

## Project Structure

```
subsonic-client/
├── SPEC.md
├── README.md
├── package.json
├── vite.config.js
├── index.html
├── Dockerfile              # multi-stage build: Vite build → nginx:alpine
├── nginx.conf              # serves dist/ + proxies MusicBrainz
├── src-tauri/              # Tauri v2 desktop wrapper (builds Tonearm AppImage)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
└── src/
    ├── main.js
    ├── App.svelte              # shell, routing, keyboard shortcuts
    ├── lib/
    │   ├── api/
    │   │   ├── subsonic.js     # Subsonic API client
    │   │   └── musicbrainz.js  # MusicBrainz lookups (artist image fallback)
    │   ├── stores/
    │   │   ├── auth.js        # login state + credentials (localStorage)
    │   │   ├── player.js      # queue, playback state, volume
    │   │   ├── router.js      # hash-based router
    │   │   ├── theme.js       # dark/light/auto theme
    │   │   └── sunTimes.js    # pure sunrise/sunset helpers (+ sunTimes.test.js)
    │   └── components/
    │       ├── Header.svelte
    │       ├── Sidebar.svelte
    │       ├── PlayerBar.svelte
    │       ├── ArtistAvatar.svelte
    │       ├── CoverArt.svelte
    │       └── LoadingScreen.svelte
    └── routes/
        ├── Home.svelte        # greeting + recently added + discover shelves
        ├── Artists.svelte     # A–Z indexed list with avatars
        ├── Artist.svelte      # album grid for one artist
        ├── Album.svelte       # track list, play all
        ├── Search.svelte      # grouped results: artists / albums / songs
        ├── Login.svelte       # server URL + credentials
        └── Settings.svelte    # theme preference, shuffle mode, build info
```

---

## nginx Config

The dev VM runs nginx serving `dist/` on port 80 (config at `/etc/nginx/sites-available/subsonic-client`). The same proxy rules ship as `nginx.conf` at the repo root, used by the Docker image:

```nginx
location /api/mb/ {
    proxy_pass https://musicbrainz.org/ws/2/;
    proxy_set_header Host musicbrainz.org;
    proxy_set_header User-Agent "tonearm/0.1 (local)";
    proxy_ssl_server_name on;
    resolver 1.1.1.1;
}
```

This works around MusicBrainz's browser User-Agent block — required for the artist-image fallback pipeline below.

---

## Docker

`Dockerfile` is a multi-stage build: a Node stage runs `npm run build`, then `nginx:alpine` serves `dist/` using `nginx.conf` (which bundles the MusicBrainz proxy above, so the container is self-sufficient — no external reverse proxy needed):

```bash
docker build -t tonearm .
docker run -d -p 8080:80 tonearm
```

---

## Testing

`npm test` runs `src/**/*.test.js` with Node's built-in test runner (`node --test`) — no extra dependency. Tests live alongside the modules they cover (e.g. `src/lib/stores/sunTimes.test.js`); favor extracting pure logic into DOM-free modules so it can be tested this way.

---

## Subsonic API

**Base URL**: `http://10.0.0.10:4747/rest/`

**Auth** (appended to every request):
```
u=aesthetic&p=<password>&v=1.16.0&c=aesthetic-client&f=json
```

**Endpoints used**:

| Endpoint | Purpose |
|---|---|
| `ping` | Connection test |
| `getArtists` | Full indexed artist list |
| `getArtist?id=` | Albums for a specific artist |
| `getAlbum?id=` | Tracks for a specific album |
| `getAlbumList2?type=` | `newest` / `random` for home page shelves |
| `search3?query=` | Unified search |
| `stream?id=` | Audio stream |
| `getCoverArt?id=` | Album/track artwork |

---

## Artist Image Pipeline

Images are fetched lazily via IntersectionObserver (2× viewport lookahead) and cached in memory for the session.

1. **TheAudioDB** — name search (`search.php?s=`), fully parallel, no rate limit
2. **MusicBrainz** (rate-limited queue, 1.2s gap) → MBID → **Wikidata** P18 → **Wikimedia Commons** thumbnail
3. Initials with deterministic colour as final fallback

Collaboration artist names (`feat.`, `ft.`, `&`) are stripped to the primary artist before lookup. Results are cached by stripped name so variants share one entry.

---

## UI

```
┌─────────────────────────────────────────────┐
│  Aesthetic    [ Search…          ]     [☀/🌙]│  ← Header
├────────┬────────────────────────────────────┤
│        │                                    │
│  Home  │   Main content area                │
│Artists │                                    │
│        │   Home:    greeting + album shelves│
│        │   Artists: A–Z list with avatars   │
│        │   Artist:  album grid + play/shuf  │
│        │   Album:   track list + play all   │
│        │   Search:  grouped results         │
│        │   Settings: appearance + playback  │
├────────┴────────────────────────────────────┤
│ [art]  Track · Artist  ⇄ |◀  ▶  ▐▐  ▷  ↺  ═══  🔇  ──  ≡ │
└─────────────────────────────────────────────┘
```

**Keyboard shortcuts**: `Space` play/pause · `→` next · `←` prev · `m` mute

**Player bar controls**: shuffle (⇄) · prev · play/pause · next · repeat (↺, cycles off/all/one) · seek bar · mute toggle · volume slider · queue toggle

---

## Color Tokens

```css
/* Light */
--bg:        #f5f5f5;   --surface: #ffffff;
--text:      #111111;   --text-muted: #666666;
--accent:    #5b5bd6;   --border: #e0e0e0;

/* Dark */
--bg:        #1e1e1e;   --surface: #2a2a2a;
--text:      #ffffff;   --text-muted: #b4b4b4;
--accent:    #9090fa;   --border: #3d3d3d;
```

Theme class (`.dark` / `.light`) toggled on `<html>` element; also respects `prefers-color-scheme`.

---

## Implemented

- [x] Browse: artists (A–Z + jump bar), artist detail, album detail
- [x] Home page: randomised greeting + recently added + discover shelves
- [x] Search: grouped results with click-through
- [x] Playback: streaming, queue, play/pause/prev/next, seek, volume
- [x] Mute toggle with dynamic volume icon (preserves volume level)
- [x] Queue: view, reorder (drag), remove, clear, click-to-play, play next / add to queue
- [x] Shuffle: random-next mode or reorder-queue mode (configurable in Settings)
- [x] Repeat: off / repeat-all / repeat-one
- [x] Play artist / shuffle artist: fetches all albums in parallel and queues tracks
- [x] Play / shuffle entire library
- [x] Album art scraping: TheAudioDB → MusicBrainz → Cover Art Archive fallback
- [x] Artist avatars: lazy-loaded with TheAudioDB/Wikidata/initials fallback
- [x] Dark/light mode toggle + auto theme by sunrise/sunset
- [x] Login screen with server URL + credentials
- [x] Player state (queue, volume, shuffle, repeat) persisted per account in localStorage
- [x] Settings screen: theme preference, shuffle mode, build info (branch + commit)
- [x] Keyboard shortcuts
- [x] App name: Tonearm
- [x] Desktop app: Tauri v2 wrapper, builds as a Linux AppImage
- [x] Docker image (multi-stage build, bundled nginx + MusicBrainz proxy)
- [x] Regression tests for auto theme sunrise/sunset logic (`npm test`)

## Roadmap

| # | Feature | Status |
|---|---|---|
| [#1](https://github.com/klay2000/subsonic-client/issues/1) | ListenBrainz integration | open |
| [#2](https://github.com/klay2000/subsonic-client/issues/2) | Music ingestion + library management | open |
| [#6](https://github.com/klay2000/subsonic-client/issues/6) | Notifications | open |
| [#10](https://github.com/klay2000/subsonic-client/issues/10) | Mobile app | open |
| [#32](https://github.com/klay2000/subsonic-client/issues/32) | Broader test coverage | open |
| [#33](https://github.com/klay2000/subsonic-client/issues/33) | CI/CD | open |
| [#41](https://github.com/klay2000/subsonic-client/issues/41) | Logo | open |
| [#42](https://github.com/klay2000/subsonic-client/issues/42) | Revamp login screen | open |
