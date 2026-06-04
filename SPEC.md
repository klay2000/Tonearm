# Subsonic Client — Specification

**Version**: 0.2
**Date**: 2026-06-04
**Server**: Gonic at `http://10.0.0.10:4747`
**Web host**: `http://192.168.122.79` (dev VM)

---

## Overview

A minimal, modern, self-hosted music client for a Gonic/Subsonic server. Built as a hosted web app first; intended to be packaged as a Linux AppImage (Tauri v2) and later a mobile app.

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
| Desktop wrapper (planned) | Tauri v2 | Rust-based, AppImage support, official mobile target |

---

## Project Structure

```
subsonic-client/
├── SPEC.md
├── README.md
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.js
    ├── App.svelte              # shell, routing, keyboard shortcuts
    ├── lib/
    │   ├── api/
    │   │   └── subsonic.js    # Subsonic API client
    │   ├── stores/
    │   │   ├── player.js      # queue, playback state, volume
    │   │   └── router.js      # hash-based router
    │   └── components/
    │       ├── Header.svelte
    │       ├── Sidebar.svelte
    │       ├── PlayerBar.svelte
    │       └── ArtistAvatar.svelte
    └── routes/
        ├── Home.svelte        # greeting + recently added + discover shelves
        ├── Artists.svelte     # A–Z indexed list with avatars
        ├── Artist.svelte      # album grid for one artist
        ├── Album.svelte       # track list, play all
        └── Search.svelte      # grouped results: artists / albums / songs
```

---

## nginx Config

The dev VM runs nginx serving `dist/` on port 80. nginx also proxies MusicBrainz to work around their browser User-Agent block:

```nginx
location /api/mb/ {
    proxy_pass https://musicbrainz.org/ws/2/;
    proxy_set_header Host musicbrainz.org;
    proxy_set_header User-Agent "aesthetic-client/0.1 (local)";
    proxy_ssl_server_name on;
    resolver 1.1.1.1;
}
```

Config at `/etc/nginx/sites-available/subsonic-client`.

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
│        │   Artist:  album grid              │
│        │   Album:   track list + play all   │
│        │   Search:  grouped results         │
├────────┴────────────────────────────────────┤
│ [art]  Track · Artist   |◀  ▶  ▐▐  ═══  🔊 │  ← Player bar
└─────────────────────────────────────────────┘
```

**Keyboard shortcuts**: `Space` play/pause · `→` next · `←` prev · `m` mute

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

## Implemented (v1)

- [x] Browse: artists (A–Z + jump bar), artist detail, album detail
- [x] Home page: randomised greeting + recently added + discover shelves
- [x] Search: grouped results with click-through
- [x] Playback: streaming, queue, play/pause/prev/next, seek, volume
- [x] Artist avatars: lazy-loaded with TheAudioDB/Wikidata/initials fallback
- [x] Dark/light mode toggle
- [x] Keyboard shortcuts

## Roadmap

| Feature | Phase |
|---|---|
| Playlists (view/create/edit) | v2 |
| Last.fm scrobbling | v2 |
| Download tracks | v2 |
| Token auth (MD5) instead of plaintext password | v2 |
| Multi-server support | v3 |
| Tauri desktop / AppImage | after web stable |
| Mobile (Tauri v2) | after desktop |
