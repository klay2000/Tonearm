# Tonearm

A minimal, modern, self-hosted music client for [Gonic](https://github.com/sentriz/gonic) / Subsonic servers.

## Features

- Browse artists, albums, and tracks
- Search across your library
- Streaming playback with queue, seek, and volume control
- Mute toggle with dynamic volume icon
- Shuffle (random-next or reorder-queue) and repeat (off / all / one)
- Play or shuffle an entire artist's discography in one click
- Queue management: reorder by drag, remove tracks, clear queue, play next
- Album art scraping from TheAudioDB and Cover Art Archive when server has none
- Artist avatars sourced from TheAudioDB and Wikimedia
- Auto dark/light theme by sunrise/sunset (or set manually)
- Player state (queue, volume, shuffle, repeat) persisted across sessions
- Settings screen: theme preference, shuffle mode, build info
- Keyboard shortcuts: `Space` play/pause · `→` next · `←` prev · `m` mute

## Stack

- [Svelte 5](https://svelte.dev/) + [Vite 5](https://vitejs.dev/)
- No UI framework, no component library — plain CSS with custom properties
- Subsonic REST API (JSON mode)
- [Tauri v2](https://tauri.app/) — optional desktop wrapper, builds as a Linux AppImage

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

## Desktop app (Tauri)

The `src-tauri/` directory wraps the web app as a native Linux desktop app ("Tonearm") using Tauri v2, bundled as an AppImage.

Requires a Rust toolchain (1.86+) and the GTK/WebKit system libraries:

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev \
  libayatana-appindicator3-dev libxdo-dev build-essential libssl-dev
```

```bash
npm run tauri dev      # launch in development (hot reload)
npm run tauri build    # build the AppImage
```

On systems without proper GPU passthrough (e.g. VMs), WebKit's compositor may fail to render (a blank window with `GBM`/`DRM_IOCTL_MODE_CREATE_DUMB` errors in the log). Force software rendering with:

```bash
WEBKIT_DISABLE_COMPOSITING_MODE=1 WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1 npm run tauri dev
```

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
        proxy_set_header User-Agent "tonearm/0.1 (local)";
        proxy_ssl_server_name on;
        resolver 1.1.1.1;
    }

    location / { try_files $uri $uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
}
```
