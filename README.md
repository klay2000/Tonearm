# aesthetic

A minimal, modern, self-hosted music client for [Gonic](https://github.com/sentriz/gonic) / Subsonic servers.

## Features

- Browse artists, albums, and tracks
- Search across your library
- Streaming playback with queue, seek, and volume control
- Shuffle (random-next or reorder-queue) and repeat (off / all / one)
- Play or shuffle an entire artist's discography in one click
- Queue management: reorder by drag, remove tracks, play next
- Artist avatars sourced from TheAudioDB and Wikimedia
- Auto dark/light theme by sunrise/sunset (or set manually)
- Settings screen: theme preference, shuffle mode
- Keyboard shortcuts: `Space` play/pause · `→` next · `←` prev · `m` mute

## Stack

- [Svelte 5](https://svelte.dev/) + [Vite 5](https://vitejs.dev/)
- No UI framework, no component library — plain CSS with custom properties
- Subsonic REST API (JSON mode)

## Dev

```bash
npm install
npm run dev       # dev server at http://localhost:5173
```

## Build & deploy

```bash
npm run build     # outputs dist/
```

Serve `dist/` as static files. The app talks directly to your Gonic server from the browser — no backend needed.

### nginx

The included nginx config proxies MusicBrainz (required to work around their browser User-Agent restriction):

```nginx
server {
    listen 80 default_server;
    root /path/to/subsonic-client/dist;
    index index.html;

    location /api/mb/ {
        proxy_pass https://musicbrainz.org/ws/2/;
        proxy_set_header Host musicbrainz.org;
        proxy_set_header User-Agent "aesthetic-client/0.1 (local)";
        proxy_ssl_server_name on;
        resolver 1.1.1.1;
    }

    location / { try_files $uri $uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
}
```
